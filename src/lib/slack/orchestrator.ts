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
import { findHeroCandidates, type HeroCandidate } from "@/lib/proposals/hero-candidates";

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
    // Trace-id makes correlating logs across the fire-and-forget
    // background task easy. Echo it on every line.
    const trace = Math.random().toString(36).slice(2, 8);
    const t0 = Date.now();
    const log = (step: string, meta?: Record<string, unknown>) => {
        const ms = Date.now() - t0;
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
        console.log(`[orchestrator ${trace} +${ms}ms] ${step}${metaStr}`);
    };
    const fail = (step: string, err: unknown) => {
        const ms = Date.now() - t0;
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[orchestrator ${trace} +${ms}ms] FAIL ${step}: ${msg}`, stack);
    };
    log("start", {
        userId: input.requester.userId,
        rawText: input.rawText.slice(0, 120),
        origin: PUBLIC_ORIGIN,
        envFlags: {
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            exa: !!process.env.EXA_API_KEY,
            slackBot: !!process.env.SLACK_BOT_TOKEN,
        },
    });

    let progressTs: string | null = null;
    let progressChannel: string | null = null;
    try {
        // 0. Parse intake.
        const intake = parseSlackIntake(input.rawText);
        log("intake parsed", {
            clientName: intake.clientName,
            programs: intake.programs.map((p) => p.slug),
            intent: intake.intent,
            hints: intake.hints.slice(0, 80),
        });

        // 1. Open a DM and post a progress message immediately so the
        //    user sees activity. We update it as we go.
        const dmChannel = await openDM(input.requester.userId);
        log("dm opened", { dmChannel });
        progressChannel = dmChannel;
        const initial = await postMessage({
            channel: dmChannel,
            text: `🎨 Trabajando en tu propuesta…\n\n${describeIntake(intake)}\n\n_Esto toma 1-3 minutos. Te aviso cuando esté lista._`,
        });
        progressTs = initial.ts;
        log("progress posted", { ts: initial.ts });

        // 2a. Short-circuit: if this client already has a finished
        //     Canva PDF from a previous demo run, deliver it instantly.
        const cachedClient = intake.clientName?.toLowerCase().trim();
        const known = cachedClient ? KNOWN_PROPOSALS[cachedClient] : null;
        if (known) {
            log("known proposal hit", { client: cachedClient, designId: known.designId });
            const knownCandidates = await tryFindHeroCandidates(intake.clientName, undefined);
            log("candidates found (known path)", { count: knownCandidates.length });
            await updateMessage({
                channel: dmChannel,
                ts: initial.ts,
                text: `✅ ${known.title}`,
                blocks: buildKnownProposalBlocks({
                    intake,
                    known,
                    heroCandidates: knownCandidates,
                    requester: input.requester,
                    originChannel: input.originChannel,
                    originThreadTs: input.originThreadTs,
                }),
            });
            log("known DM updated — done", { totalMs: Date.now() - t0 });
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
            log("research starting", { clientName: intake.clientName });
            try {
                research = await runResearch(intake.clientName, intake.hints);
                log("research done", {
                    haveResult: !!research,
                    industry: research?.industry,
                    haveHero: !!research?.heroImageUrl,
                    haveLogo: !!research?.logoUrl,
                });
            } catch (err) {
                fail("research", err);
                // Soft failure — generation can still produce a generic deck.
            }
        } else {
            log("research skipped — no client name");
        }

        // 3. Run three generators in parallel. tryGenerate* are
        //    individually wrapped — runGenerate is the only hard
        //    dependency. We unwrap to inspect each future's outcome
        //    instead of failing the whole flow on one throw.
        const program = intake.programs[0]?.slug;
        log("parallel generation starting", { program });
        const [genRes, varsRes, candidatesRes] = await Promise.allSettled([
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
            tryFindHeroCandidates(intake.clientName, research),
        ]);

        if (genRes.status === "rejected") {
            fail("runGenerate", genRes.reason);
            throw genRes.reason instanceof Error
                ? genRes.reason
                : new Error(String(genRes.reason));
        }
        const generatedDeck = genRes.value;
        log("runGenerate done", {
            haveDeck: !!generatedDeck,
            slideCount: generatedDeck?.slides?.length,
            title: generatedDeck?.deckTitle,
        });
        if (!generatedDeck) {
            throw new Error("La generación devolvió un deck vacío");
        }

        const plantillaVariables = varsRes.status === "fulfilled" ? varsRes.value : null;
        if (varsRes.status === "rejected") fail("tryGenerateVariables", varsRes.reason);
        else log("variables done", { have: !!plantillaVariables });

        const heroCandidates = candidatesRes.status === "fulfilled" ? candidatesRes.value : [];
        if (candidatesRes.status === "rejected") fail("tryFindHeroCandidates", candidatesRes.reason);
        else log("candidates done", { count: heroCandidates.length });

        // 4. Save to DB.
        const deckId = nanoid();
        const userEmail = `slack-${input.requester.userId}@30x.com`;
        const userName =
            input.requester.realName ?? input.requester.userName ?? "Slack User";
        log("upserting deck", { deckId, userEmail });
        await upsertDeck({
            id: deckId,
            userEmail,
            userName,
            deck: generatedDeck,
        });
        log("deck saved");

        const deckUrl = `${PUBLIC_ORIGIN}/?open=${deckId}`;

        // 5. Replace the progress DM with a preview + approve buttons.
        log("updating final DM");
        const previewBlocks = buildPreviewBlocks({
            intake,
            generatedDeck,
            deckId,
            deckUrl,
            plantillaVariables,
            heroCandidates,
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
        log("DONE", { totalMs: Date.now() - t0, deckId, dmChannel, dmTs: initial.ts });

        return { deckId, deckUrl, dmChannel, dmTs: initial.ts };
    } catch (err) {
        fail("outer catch", err);
        const message = err instanceof Error ? err.message : String(err);
        try {
            if (progressChannel && progressTs) {
                await updateMessage({
                    channel: progressChannel,
                    ts: progressTs,
                    text: `❌ No pude generar la propuesta: ${message}\n\nIntenta de nuevo o pásame más detalles.`,
                });
                log("error notified via existing DM");
            } else {
                const dm = await openDM(input.requester.userId);
                await postMessage({
                    channel: dm,
                    text: `❌ No pude generar la propuesta para "${input.rawText.slice(0, 80)}": ${message}\n\nIntenta de nuevo.`,
                });
                log("error notified via fresh DM");
            }
        } catch (notifyErr) {
            fail("notify user", notifyErr);
        }
        return null;
    }
}

// ─── Wrappers around the existing /api routes ────────────────────────

async function runResearch(companyName: string, notes: string): Promise<ResearchResult | undefined> {
    const url = `${PUBLIC_ORIGIN}/api/research`;
    console.log(`[orchestrator] POST ${url} companyName="${companyName}"`);
    const t0 = Date.now();
    const res = await fetch(url, {
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
    const ms = Date.now() - t0;
    console.log(`[orchestrator] /api/research ← ${res.status} in ${ms}ms`);
    if (!res.ok) {
        const body = await res.text().catch(() => "(could not read body)");
        throw new Error(`research returned ${res.status}: ${body.slice(0, 200)}`);
    }
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
    const url = `${PUBLIC_ORIGIN}/api/generate`;
    console.log(`[orchestrator] POST ${url} program=${input.program ?? "(none)"} haveResearch=${!!input.research}`);
    const t0 = Date.now();
    const res = await fetch(url, {
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
    const ms = Date.now() - t0;
    console.log(`[orchestrator] /api/generate ← ${res.status} in ${ms}ms`);
    if (!res.ok) {
        const body = await res.text().catch(() => "(could not read body)");
        throw new Error(`generate returned ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { ok?: boolean; deck?: Deck };
    return data.deck ?? null;
}

/**
 * Best-effort wrapper around the hero-candidates finder. Returns at
 * most 5 candidates; on failure or empty result returns [].
 */
async function tryFindHeroCandidates(
    clientName: string | null,
    research?: ResearchResult,
): Promise<HeroCandidate[]> {
    if (!clientName) return [];
    try {
        return await findHeroCandidates({
            clientName,
            research,
            limit: 5,
        });
    } catch (err) {
        console.error("[slack/orchestrator] hero candidates failed", err);
        return [];
    }
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
    heroCandidates: HeroCandidate[];
    requester: SlackRequester;
    originChannel: string;
    originThreadTs?: string;
}

/**
 * Build a hero-picker section: thumbnails for each candidate stacked
 * vertically (Slack Block Kit has no horizontal grid), plus an actions
 * row of "Usar 1", "Usar 2", … buttons. Click → interactivity handler
 * `monet_pick_hero` captures the choice.
 */
function buildHeroPickerBlocks(
    candidates: HeroCandidate[],
    deckId: string,
): unknown[] {
    if (candidates.length === 0) return [];
    const blocks: unknown[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text:
                    "*🖼️ Escoge la foto de portada*\n_Monet sugiere estas, ordenadas por mejor match. Click para confirmar._",
            },
        },
    ];
    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        blocks.push({
            type: "image",
            image_url: c.url,
            alt_text: c.caption ?? `Candidato ${i + 1}: ${c.source}`,
            title: { type: "plain_text", text: `${i + 1}. ${c.source}` },
        });
    }
    const buttons = candidates.slice(0, 5).map((c, i) => ({
        type: "button",
        action_id: `monet_pick_hero_${i + 1}`,
        text: { type: "plain_text", text: `Usar ${i + 1}` },
        value: JSON.stringify({
            action: "pick_hero",
            deckId,
            heroUrl: c.url,
            heroSource: c.source,
            index: i + 1,
        }),
    }));
    blocks.push({
        type: "actions",
        block_id: "monet-hero-picker",
        elements: buttons,
    });
    return blocks;
}

/**
 * Block Kit message for a client we've already produced a Canva PDF for.
 * Shorter than the regular preview — just the cover thumbnail link, the
 * PDF link, and Send/Edit/Reject actions.
 */
function buildKnownProposalBlocks(args: {
    intake: ReturnType<typeof parseSlackIntake>;
    known: { viewUrl: string; designId: string; title: string };
    heroCandidates: HeroCandidate[];
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
    const blocks: unknown[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${args.known.title}*\n7 slides — generadas vía Plantilla Monet con identidad de marca completa.\n\n<${args.known.viewUrl}|🖼️ Ver en Canva> · <${editUrl}|✏️ Editar> · _Exporta PDF directo desde Canva con Share → Download → PDF Standard._`,
            },
        },
    ];
    blocks.push(...buildHeroPickerBlocks(args.heroCandidates, args.known.designId));
    blocks.push(
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
    );
    return blocks;
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

    // Hero picker — grid of cover photo candidates for the salesperson
    // to choose from. Empty array → no picker shown.
    blocks.push(...buildHeroPickerBlocks(args.heroCandidates, args.deckId));

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
