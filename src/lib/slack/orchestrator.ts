/**
 * Slack → Monet generation orchestrator.
 *
 * Takes a parsed intake (from /api/slack/commands or /api/slack/events),
 * runs the research + generate pipeline, saves the deck, and DMs the
 * requester a preview message with [Send] [Edit] [Reject] buttons.
 *
 * Errors are routed to a DM telling the requester to try again — never
 * silently dropped.
 */

import type { Deck, ResearchResult, Slide } from "@/lib/slide-types";
import { upsertDeck } from "@/lib/db/decks";
import { openDM, postMessage, updateMessage } from "@/lib/slack/client";
import { parseSlackIntake, describeIntake } from "@/lib/slack/intake";
import { generatePlantillaMonetVariables, preferResearchAssets } from "@/lib/proposals/generate-variables";
import type { PlantillaMonetVariables } from "@/lib/proposals/plantilla-monet";

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://monet.30x.com";

/**
 * Pre-generated Canva designs for clients we've already demo-edited
 * end-to-end via the MCP path. While Canva Connect OAuth is being set
 * up server-side, these short-circuits let Andrés get a real
 * Bavaria-style proposal back in seconds for the clients we've
 * validated. Keys are lowercased client names.
 *
 * `viewUrl` is a stable Canva design link that doesn't expire (the
 * signed export-download URLs only last 24h, so we can't bake those
 * in). The DM lets the user export-as-PDF from inside Canva.
 */
const KNOWN_PROPOSALS: Record<string, { viewUrl: string; designId: string; title: string }> = {
    bavaria: {
        viewUrl: "https://www.canva.com/design/DAHJeBw5x4A/view",
        designId: "DAHJeBw5x4A",
        title: "Bavaria | 30X | Andrés Bilbao",
    },
};

export interface SlackRequester {
    userId: string; // Slack user id (U…)
    userName?: string;
    /** Display name fallback. */
    realName?: string;
}

export interface OrchestrateInput {
    rawText: string;
    requester: SlackRequester;
    /** Channel where the user originally typed `/monet` or @mentioned us. */
    originChannel: string;
    /** Thread ts if the request came from inside a thread. */
    originThreadTs?: string;
}

export interface OrchestrateResult {
    deckId: string;
    deckUrl: string;
    dmChannel: string;
    dmTs: string;
}

/**
 * Public entrypoint. Designed to be invoked from the route handlers
 * fire-and-forget so the Slack 3s ack deadline is met.
 */
export async function orchestrateProposalFromSlack(
    input: OrchestrateInput,
): Promise<OrchestrateResult | null> {
    let progressTs: string | null = null;
    let progressChannel: string | null = null;
    try {
        // 0. Parse intake.
        const intake = parseSlackIntake(input.rawText);

        // 1. Open a DM and post a progress message immediately so the
        //    user sees activity. We update it as we go.
        const dmChannel = await openDM(input.requester.userId);
        progressChannel = dmChannel;
        const initial = await postMessage({
            channel: dmChannel,
            text: `🎨 Trabajando en tu propuesta…\n\n${describeIntake(intake)}\n\n_Esto toma 1-3 minutos. Te aviso cuando esté lista._`,
        });
        progressTs = initial.ts;

        // 2a. Short-circuit: if this client already has a finished
        //     Canva PDF from a previous demo run, deliver it instantly.
        const cachedClient = intake.clientName?.toLowerCase().trim();
        const known = cachedClient ? KNOWN_PROPOSALS[cachedClient] : null;
        if (known) {
            await updateMessage({
                channel: dmChannel,
                ts: initial.ts,
                text: `✅ ${known.title}`,
                blocks: buildKnownProposalBlocks({
                    intake,
                    known,
                    requester: input.requester,
                    originChannel: input.originChannel,
                    originThreadTs: input.originThreadTs,
                }),
            });
            return {
                deckId: known.designId,
                deckUrl: known.viewUrl,
                dmChannel,
                dmTs: initial.ts,
            };
        }

        // 2b. Research the client (skip if no client name detected).
        let research: ResearchResult | undefined;
        if (intake.clientName) {
            try {
                research = await runResearch(intake.clientName, intake.hints);
            } catch (err) {
                console.error("[slack/orchestrator] research failed", err);
                // Soft failure — generation can still produce a generic deck.
            }
        }

        // 3. Run two generators in parallel:
        //    (a) Monet-native deck via /api/generate — the current fallback
        //        that always works.
        //    (b) Plantilla Monet variables for the Canva runtime — fills
        //        the 24 variable slots in the Aeroméxico-derived template.
        //        Best-effort: if it fails, we still ship the Monet draft.
        const program = intake.programs[0]?.slug;
        const [generatedDeck, plantillaVariables] = await Promise.all([
            runGenerate({
                research,
                program,
                topic: intake.hints || undefined,
                notes: input.rawText,
            }),
            tryGenerateVariables({
                clientName: intake.clientName ?? "",
                programs: intake.programs,
                hints: intake.hints,
                research,
            }),
        ]);
        if (!generatedDeck) {
            throw new Error("La generación devolvió un deck vacío");
        }

        // 4. Save to DB. Identity = synthetic Slack user (matches the
        //    Hub-header contract).
        const deckId = nanoid();
        const userEmail = `slack-${input.requester.userId}@30x.com`;
        const userName =
            input.requester.realName ?? input.requester.userName ?? "Slack User";
        await upsertDeck({
            id: deckId,
            userEmail,
            userName,
            deck: generatedDeck,
        });

        const deckUrl = `${PUBLIC_ORIGIN}/?open=${deckId}`;

        // 5. Replace the progress DM with a preview + approve buttons.
        const previewBlocks = buildPreviewBlocks({
            intake,
            generatedDeck,
            deckId,
            deckUrl,
            plantillaVariables,
            requester: input.requester,
            originChannel: input.originChannel,
            originThreadTs: input.originThreadTs,
        });
        await updateMessage({
            channel: dmChannel,
            ts: initial.ts,
            text: `✅ Propuesta lista — ${generatedDeck.deckTitle ?? "deck"}`,
            blocks: previewBlocks,
        });

        return { deckId, deckUrl, dmChannel, dmTs: initial.ts };
    } catch (err) {
        console.error("[slack/orchestrator] failed", err);
        const message = err instanceof Error ? err.message : String(err);
        try {
            if (progressChannel && progressTs) {
                await updateMessage({
                    channel: progressChannel,
                    ts: progressTs,
                    text: `❌ No pude generar la propuesta: ${message}\n\nIntenta de nuevo o pásame más detalles.`,
                });
            } else {
                const dm = await openDM(input.requester.userId);
                await postMessage({
                    channel: dm,
                    text: `❌ No pude generar la propuesta para "${input.rawText.slice(0, 80)}": ${message}\n\nIntenta de nuevo.`,
                });
            }
        } catch (notifyErr) {
            console.error("[slack/orchestrator] failed to notify user", notifyErr);
        }
        return null;
    }
}

// ─── Wrappers around the existing /api routes ────────────────────────

async function runResearch(companyName: string, notes: string): Promise<ResearchResult | undefined> {
    const res = await fetch(`${PUBLIC_ORIGIN}/api/research`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Hub-style synthetic identity — bypasses the anonymous fallback
            // and gives the API a real-looking user.
            "x-30x-user-email": "slack-bot@30x.com",
            "x-30x-user-name": "Monet Slack Bot",
        },
        body: JSON.stringify({ companyName, notes }),
    });
    if (!res.ok) throw new Error(`research returned ${res.status}`);
    const data = (await res.json()) as { ok?: boolean; research?: ResearchResult };
    if (!data.ok || !data.research) return undefined;
    return data.research;
}

interface GenerateInput {
    research?: ResearchResult;
    program?: string;
    topic?: string;
    notes?: string;
}

async function runGenerate(input: GenerateInput): Promise<Deck | null> {
    const slideCount = 7;
    const res = await fetch(`${PUBLIC_ORIGIN}/api/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-30x-user-email": "slack-bot@30x.com",
            "x-30x-user-name": "Monet Slack Bot",
        },
        body: JSON.stringify({
            research: input.research,
            program: input.program,
            slideCount,
            format: "proposal",
            topic: input.topic,
            notes: input.notes,
            corporateMode: true,
        }),
    });
    if (!res.ok) throw new Error(`generate returned ${res.status}`);
    const data = (await res.json()) as { ok?: boolean; deck?: Deck };
    return data.deck ?? null;
}

/**
 * Best-effort wrapper around the Plantilla Monet variable generator.
 * Swallows errors and missing client name so the parent Promise.all
 * never short-circuits the deck generation path.
 */
async function tryGenerateVariables(input: {
    clientName: string;
    programs: ReturnType<typeof parseSlackIntake>["programs"];
    hints: string;
    research?: ResearchResult;
}): Promise<PlantillaMonetVariables | null> {
    if (!input.clientName) return null;
    try {
        const vars = await generatePlantillaMonetVariables({
            clientName: input.clientName,
            programs: input.programs,
            hints: input.hints || undefined,
            research: input.research,
        });
        // Research pipeline already finds the company's own logo +
        // hero URL — prefer those over whatever Anthropic guessed.
        return preferResearchAssets(vars, input.research);
    } catch (err) {
        console.error("[slack/orchestrator] plantilla variables failed", err);
        return null;
    }
}

// ─── Block Kit preview ──────────────────────────────────────────────

interface PreviewArgs {
    intake: ReturnType<typeof parseSlackIntake>;
    generatedDeck: Deck;
    deckId: string;
    deckUrl: string;
    plantillaVariables: PlantillaMonetVariables | null;
    requester: SlackRequester;
    originChannel: string;
    originThreadTs?: string;
}

/**
 * Block Kit message for a client we've already produced a Canva PDF for.
 * Shorter than the regular preview — just the cover thumbnail link, the
 * PDF link, and Send/Edit/Reject actions.
 */
function buildKnownProposalBlocks(args: {
    intake: ReturnType<typeof parseSlackIntake>;
    known: { viewUrl: string; designId: string; title: string };
    requester: SlackRequester;
    originChannel: string;
    originThreadTs?: string;
}): unknown[] {
    const editUrl = `https://www.canva.com/design/${args.known.designId}/edit`;
    const sendValue = JSON.stringify({
        action: "send",
        deckId: args.known.designId,
        deckUrl: args.known.viewUrl,
        channel: args.originChannel,
        threadTs: args.originThreadTs,
    });
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${args.known.title}*\n7 slides — generadas vía Plantilla Monet con identidad de marca completa.\n\n<${args.known.viewUrl}|🖼️ Ver en Canva> · <${editUrl}|✏️ Editar> · _Exporta PDF directo desde Canva con Share → Download → PDF Standard._`,
            },
        },
        {
            type: "actions",
            block_id: "monet-known-approve",
            elements: [
                {
                    type: "button",
                    action_id: "monet_send",
                    style: "primary",
                    text: { type: "plain_text", text: "Enviar al canal" },
                    value: sendValue,
                },
                {
                    type: "button",
                    action_id: "monet_edit",
                    text: { type: "plain_text", text: "Editar en Canva" },
                    url: editUrl,
                    value: JSON.stringify({ action: "edit", deckId: args.known.designId }),
                },
            ],
        },
    ];
}

function buildPreviewBlocks(args: PreviewArgs): unknown[] {
    const deckTitle = args.generatedDeck.deckTitle ?? args.intake.clientName ?? "Propuesta";
    const slides = (args.generatedDeck.slides ?? []) as Slide[];
    const slideSummary = slides
        .slice(0, 8)
        .map((s, i) => `${i + 1}. ${describeSlide(s)}`)
        .join("\n");

    // We encode the routing context (origin channel + thread + deck id)
    // into the action_id so the interactivity handler knows where to post.
    const sendValue = JSON.stringify({
        action: "send",
        deckId: args.deckId,
        channel: args.originChannel,
        threadTs: args.originThreadTs,
    });
    const editValue = JSON.stringify({ action: "edit", deckId: args.deckId });
    const rejectValue = JSON.stringify({ action: "reject", deckId: args.deckId });

    const blocks: unknown[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${deckTitle}*\n${slides.length} slides · <${args.deckUrl}|Abrir en Monet>`,
            },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: "```\n" + slideSummary + "\n```" },
        },
    ];

    // If Plantilla Monet variables were generated successfully, append
    // a section describing what the Canva-bound proposal would look
    // like. Once Canva Connect OAuth is configured server-side, this
    // same JSON will drive perform-editing-operations automatically.
    if (args.plantillaVariables) {
        const v = args.plantillaVariables;
        const pillarLines = (Object.entries(v.pillars) as Array<[string, { objective: string }]>)
            .map(([slot, p], i) => `${i + 1}. *${p.objective}* _(${slot})_`)
            .join("\n");
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text:
                    "*📐 Plantilla Monet — variables listas para Canva*\n" +
                    `_Portada:_ ${v.cover.headline}\n\n` +
                    `_Pilares:_\n${pillarLines}`,
            },
        });
        if (v.assets.partnerLogoUrl || v.assets.heroImageUrl) {
            blocks.push({
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text:
                            `🎨 Activos detectados — logo: ${v.assets.partnerLogoUrl || "_pendiente_"} · hero: ${v.assets.heroImageUrl || "_pendiente_"}`,
                    },
                ],
            });
        }
    }

    blocks.push(...[
        {
            type: "actions",
            block_id: "monet-approve",
            elements: [
                {
                    type: "button",
                    action_id: "monet_send",
                    style: "primary",
                    text: { type: "plain_text", text: "Enviar al canal" },
                    value: sendValue,
                },
                {
                    type: "button",
                    action_id: "monet_edit",
                    text: { type: "plain_text", text: "Editar primero" },
                    url: args.deckUrl,
                    value: editValue,
                },
                {
                    type: "button",
                    action_id: "monet_reject",
                    style: "danger",
                    text: { type: "plain_text", text: "Rechazar" },
                    value: rejectValue,
                    confirm: {
                        title: { type: "plain_text", text: "¿Rechazar este draft?" },
                        text: {
                            type: "plain_text",
                            text: "El deck se va a archivar. Podés generarlo de nuevo después.",
                        },
                        confirm: { type: "plain_text", text: "Rechazar" },
                        deny: { type: "plain_text", text: "Cancelar" },
                    },
                },
            ],
        },
    ]);

    return blocks;
}

function describeSlide(s: Slide): string {
    const r = s as unknown as { headline?: string; title?: string; heading?: string; type: string };
    const t = r.headline ?? r.title ?? r.heading;
    return t ? `${r.type} — ${String(t).slice(0, 70)}` : r.type;
}

function nanoid(): string {
    return (
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 6)
    );
}
