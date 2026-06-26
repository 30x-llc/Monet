import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { checkSlackRequest } from "@/lib/slack/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/slack/interactivity
 *
 * Handler for Block Kit button clicks, modal submissions, etc. Used by
 * the approval flow: when Monet DMs a draft with [Send] [Edit] [Reject],
 * a click here triggers the corresponding action.
 *
 * Slack sends the payload as form-encoded with a single `payload` field
 * containing a JSON blob.
 */
export async function POST(request: NextRequest) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
        return new NextResponse("not configured", { status: 503 });
    }

    const raw = await request.text();
    if (!checkSlackRequest(raw, request.headers, signingSecret)) {
        return new NextResponse("invalid signature", { status: 401 });
    }

    const params = new URLSearchParams(raw);
    const payloadJson = params.get("payload");
    if (!payloadJson) return new NextResponse("missing payload", { status: 400 });

    let payload: InteractivityPayload;
    try {
        payload = JSON.parse(payloadJson);
    } catch {
        return new NextResponse("bad json", { status: 400 });
    }

    if (payload.type === "block_actions") {
        const action = payload.actions?.[0];
        if (action) {
            // Use `after()` so Vercel keeps the function alive after we
            // return — the plain Promise + .catch pattern was killing
            // the background work before it could DM the user.
            after(async () => {
                console.log("[slack/interactivity] after() starting", { action_id: action.action_id });
                try {
                    await handleAction(action, payload);
                    console.log("[slack/interactivity] after() completed");
                } catch (err) {
                    console.error("[slack/interactivity] after() failed", err);
                }
            });
        }
        return NextResponse.json({});
    }

    return NextResponse.json({});
}

interface InteractivityPayload {
    type: string;
    user?: { id: string; name?: string };
    channel?: { id: string };
    message?: { ts: string };
    response_url?: string;
    actions?: { action_id: string; value?: string }[];
}

async function handleAction(
    action: { action_id: string; value?: string },
    payload: InteractivityPayload,
): Promise<void> {
    console.log("[slack/interactivity] action", action.action_id);
    let parsed: { action: string; deckId?: string; channel?: string; threadTs?: string } = { action: "" };
    try {
        parsed = JSON.parse(action.value ?? "{}");
    } catch {
        // No payload — best-effort handle by action_id alone.
    }

    const { postMessage, updateMessage } = await import("@/lib/slack/client");
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://monet.30x.com";
    const dmChannel = payload.channel?.id;
    const dmTs = payload.message?.ts;

    if (action.action_id === "monet_send") {
        // Post the deck to the original channel where the user pinged us.
        if (!parsed.deckId || !parsed.channel) return;
        const deckUrl = `${origin}/?open=${parsed.deckId}`;
        try {
            await postMessage({
                channel: parsed.channel,
                thread_ts: parsed.threadTs,
                text: `📎 Propuesta lista: ${deckUrl}`,
            });
            if (dmChannel && dmTs) {
                await updateMessage({
                    channel: dmChannel,
                    ts: dmTs,
                    text: `✅ Enviado al canal · <${deckUrl}|Abrir propuesta>`,
                });
            }
        } catch (err) {
            console.error("[slack/interactivity] send failed", err);
        }
        return;
    }

    if (action.action_id === "monet_edit") {
        // The button itself has a `url` so Slack already opened the editor
        // in the user's browser. We acknowledge by collapsing the DM.
        if (dmChannel && dmTs && parsed.deckId) {
            try {
                await updateMessage({
                    channel: dmChannel,
                    ts: dmTs,
                    text: `✏️ Abriste el editor — <${origin}/?open=${parsed.deckId}|Volver al deck>. Cuando guardes los cambios, vuelve a este DM y dame "/monet send ${parsed.deckId}" si quieres mandarlo al canal.`,
                });
            } catch (err) {
                console.error("[slack/interactivity] edit ack failed", err);
            }
        }
        return;
    }

    // Approval flow — Aprobar / Rechazar from the #propuestas channel.
    // Writes the deck's status to the DB (same source of truth the in-app
    // /ops dashboard uses) and rewrites the channel message with the verdict.
    if (action.action_id === "monet_approve" || action.action_id === "monet_reject_approval") {
        if (!parsed.deckId) return;
        const approved = action.action_id === "monet_approve";
        const who = payload.user?.id ? `<@${payload.user.id}>` : "el equipo";
        try {
            const { ensureSchema } = await import("@/lib/db/schema");
            const { setDeckStatus } = await import("@/lib/db/decks");
            await ensureSchema();
            await setDeckStatus(parsed.deckId, approved ? "approved" : "rejected");
            if (dmChannel && dmTs) {
                await updateMessage({
                    channel: dmChannel,
                    ts: dmTs,
                    text: approved
                        ? `✅ Propuesta *aprobada* por ${who} · <${origin}/?open=${parsed.deckId}|Abrir en Monet>`
                        : `❌ Propuesta *rechazada* por ${who} · <${origin}/?open=${parsed.deckId}|Abrir en Monet>`,
                });
            }
        } catch (err) {
            console.error("[slack/interactivity] approval failed", err);
        }
        return;
    }

    // Hero picker — action_id is `monet_pick_hero_{1..5}`.
    if (action.action_id.startsWith("monet_pick_hero_")) {
        let pick: { deckId?: string; heroUrl?: string; heroSource?: string; index?: number } = {};
        try {
            pick = JSON.parse(action.value ?? "{}");
        } catch {
            /* ignore */
        }
        if (dmChannel && dmTs && pick.heroUrl) {
            try {
                await updateMessage({
                    channel: dmChannel,
                    ts: dmTs,
                    text: `🖼️ Foto de portada #${pick.index ?? "?"} confirmada · ${pick.heroSource ?? ""}\n\nMonet aplicará esta foto al hero cuando el deck se edite en Canva. Por ahora, abre el design en Canva y reemplaza la portada manualmente con: ${pick.heroUrl}`,
                });
            } catch (err) {
                console.error("[slack/interactivity] pick_hero ack failed", err);
            }
        }
        return;
    }

    if (action.action_id === "monet_reject") {
        if (dmChannel && dmTs) {
            try {
                await updateMessage({
                    channel: dmChannel,
                    ts: dmTs,
                    text: `🗑️ Draft rechazado. Pídeme otra propuesta cuando quieras.`,
                });
            } catch (err) {
                console.error("[slack/interactivity] reject ack failed", err);
            }
        }
        return;
    }
}
