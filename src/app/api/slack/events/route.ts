import { NextResponse, type NextRequest } from "next/server";
import { checkSlackRequest } from "@/lib/slack/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/slack/events
 *
 * Single endpoint for all Slack Events API traffic. Handles:
 *   - url_verification challenge (called once when you register the URL)
 *   - app_mention (someone @Monet'd the bot in a channel)
 *   - message.im (someone DM'd the bot)
 *
 * Slack requires <3s response time. Any non-trivial work is fire-and
 * -forget on the server side — we respond 200 immediately and process
 * in the background.
 */
export async function POST(request: NextRequest) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
        console.error("[slack/events] SLACK_SIGNING_SECRET not set");
        return new NextResponse("not configured", { status: 503 });
    }

    const raw = await request.text();
    if (!checkSlackRequest(raw, request.headers, signingSecret)) {
        return new NextResponse("invalid signature", { status: 401 });
    }

    let payload: { type?: string; challenge?: string; event?: { type?: string } & Record<string, unknown> };
    try {
        payload = JSON.parse(raw);
    } catch {
        return new NextResponse("bad json", { status: 400 });
    }

    // 1. URL verification — called once when Slack registers the endpoint.
    if (payload.type === "url_verification") {
        return new NextResponse(payload.challenge ?? "", {
            status: 200,
            headers: { "Content-Type": "text/plain" },
        });
    }

    // 2. Event callbacks.
    if (payload.type === "event_callback" && payload.event) {
        const event = payload.event;
        // Fire-and-forget — process in background, return 200 fast.
        handleEvent(event).catch((err) => {
            console.error("[slack/events] background handler failed", err);
        });
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
}

interface SlackEvent {
    type?: string;
    user?: string;
    channel?: string;
    channel_type?: string;
    text?: string;
    ts?: string;
    thread_ts?: string;
    bot_id?: string;
    subtype?: string;
}

async function handleEvent(event: SlackEvent): Promise<void> {
    // Ignore bot messages so we don't loop on our own posts.
    if (event.bot_id) return;
    if (event.subtype) return;

    if (event.type === "app_mention") {
        await handleAppMention(event);
        return;
    }
    if (event.type === "message" && event.channel_type === "im") {
        await handleDirectMessage(event);
        return;
    }
}

async function handleAppMention(event: SlackEvent): Promise<void> {
    // For now, log + acknowledge. Generation pipeline lands in the next pass.
    console.log("[slack/events] app_mention", {
        user: event.user,
        channel: event.channel,
        text: event.text,
    });
    const { postMessage } = await import("@/lib/slack/client");
    await postMessage({
        channel: event.channel!,
        thread_ts: event.thread_ts ?? event.ts,
        text:
            "👋 Monet recibido. Estoy en modo de configuración inicial — la generación de propuestas se activa cuando el equipo termine de cablear los prompts. Mientras tanto, escribe `/monet` para más info.",
    });
}

async function handleDirectMessage(event: SlackEvent): Promise<void> {
    console.log("[slack/events] message.im", {
        user: event.user,
        channel: event.channel,
        text: event.text,
    });
    const { postMessage } = await import("@/lib/slack/client");
    await postMessage({
        channel: event.channel!,
        text:
            "Hola 👋 Soy Monet, el AI designer de 30X. Pídeme una propuesta con `/monet propuesta para Bavaria, 4 sedes, AI Sales` o menciona @Monet en cualquier canal.",
    });
}
