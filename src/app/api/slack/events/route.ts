import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { checkSlackRequest } from "@/lib/slack/verify";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    // 2. Event callbacks. We MUST respond 200 within 3s or Slack
    //    retries the event up to 3 times. Use `after()` to schedule
    //    the actual work AFTER the response is flushed — the previous
    //    `handleEvent(event).catch(...)` pattern is unreliable on
    //    Vercel because the function instance can be terminated as
    //    soon as the response is returned, killing the background
    //    promise before openDM/postMessage complete.
    if (payload.type === "event_callback" && payload.event) {
        const event = payload.event;
        after(async () => {
            console.log("[slack/events] after() handler starting", { type: event.type });
            try {
                await handleEvent(event);
                console.log("[slack/events] after() handler completed");
            } catch (err) {
                console.error("[slack/events] after() handler failed", err);
            }
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
    console.log("[slack/events] app_mention", event);
    if (!event.user || !event.channel) return;
    // Strip the @Monet token from the text. Slack sends "<@U…> propuesta…".
    const text = (event.text ?? "").replace(/^\s*<@[A-Z0-9]+>\s*/i, "").trim();
    if (!text) {
        const { postMessage } = await import("@/lib/slack/client");
        await postMessage({
            channel: event.channel,
            thread_ts: event.thread_ts ?? event.ts,
            text:
                "👋 Pídeme una propuesta: `@Monet propuesta para Mastercard, Sales Machine`.",
        });
        return;
    }
    const { orchestrateProposalFromSlack } = await import("@/lib/slack/orchestrator");
    await orchestrateProposalFromSlack({
        rawText: text,
        requester: { userId: event.user },
        originChannel: event.channel,
        originThreadTs: event.thread_ts ?? event.ts,
    });
}

async function handleDirectMessage(event: SlackEvent): Promise<void> {
    console.log("[slack/events] message.im", event);
    if (!event.user || !event.channel || !event.text) return;
    const text = event.text.trim();
    // Short greetings get a quick welcome.
    if (/^(hola|hi|hey|hello|holi|que tal|qué tal)[!.?]*$/i.test(text)) {
        const { postMessage } = await import("@/lib/slack/client");
        await postMessage({
            channel: event.channel,
            text:
                "Hola 👋 Soy Monet, el AI designer de 30X. Pídeme una propuesta con `/monet propuesta para Mastercard, Sales Machine` o menciona @Monet en cualquier canal.",
        });
        return;
    }
    // Anything else: treat as an intake request.
    const { orchestrateProposalFromSlack } = await import("@/lib/slack/orchestrator");
    await orchestrateProposalFromSlack({
        rawText: text,
        requester: { userId: event.user },
        originChannel: event.channel,
    });
}
