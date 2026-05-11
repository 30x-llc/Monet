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

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://monet.30x.com";

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

        // 2. Research the client (skip if no client name detected).
        let research: ResearchResult | undefined;
        if (intake.clientName) {
            try {
                research = await runResearch(intake.clientName, intake.hints);
            } catch (err) {
                console.error("[slack/orchestrator] research failed", err);
                // Soft failure — generation can still produce a generic deck.
            }
        }

        // 3. Generate the deck.
        const program = intake.programs[0]?.slug;
        const generatedDeck = await runGenerate({
            research,
            program,
            topic: intake.hints || undefined,
            notes: input.rawText,
        });
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

// ─── Block Kit preview ──────────────────────────────────────────────

interface PreviewArgs {
    intake: ReturnType<typeof parseSlackIntake>;
    generatedDeck: Deck;
    deckId: string;
    deckUrl: string;
    requester: SlackRequester;
    originChannel: string;
    originThreadTs?: string;
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

    return [
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
    ];
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
