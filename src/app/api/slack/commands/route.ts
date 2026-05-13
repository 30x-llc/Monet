import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { checkSlackRequest } from "@/lib/slack/verify";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/slack/commands
 *
 * Handler for the `/monet` slash command. Slack sends the payload as
 * x-www-form-urlencoded; we acknowledge within 3s and process the
 * actual generation in the background.
 */
export async function POST(request: NextRequest) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
        return NextResponse.json(
            { response_type: "ephemeral", text: "Monet aún no está configurado." },
            { status: 200 },
        );
    }

    const raw = await request.text();
    if (!checkSlackRequest(raw, request.headers, signingSecret)) {
        return new NextResponse("invalid signature", { status: 401 });
    }

    const params = new URLSearchParams(raw);
    const text = params.get("text") ?? "";
    const userId = params.get("user_id") ?? "";
    const channelId = params.get("channel_id") ?? "";
    const responseUrl = params.get("response_url") ?? "";

    if (!text.trim()) {
        return NextResponse.json({
            response_type: "ephemeral",
            text: "Usa `/monet propuesta para {cliente}, {detalles}`. Ejemplo: `/monet propuesta Mastercard, Sales Machine`.",
        });
    }

    // Slack needs a response within 3s — we return the ephemeral ack
    // immediately and use `after()` to run the orchestrator AFTER the
    // response is flushed. This is the Vercel-idiomatic way to schedule
    // post-response work; the plain `handleSlashCommand(...).catch(...)`
    // pattern is NOT reliable on Vercel — the function instance can be
    // terminated as soon as the response is sent, killing the background
    // promise before it completes. That's exactly why the ephemeral ack
    // arrived but the follow-up DM never did.
    after(async () => {
        console.log("[slack/commands] after() handler starting", { text: text.slice(0, 80), userId });
        try {
            await handleSlashCommand({ text, userId, channelId, responseUrl });
            console.log("[slack/commands] after() handler completed");
        } catch (err) {
            console.error("[slack/commands] after() handler failed", err);
        }
    });

    return NextResponse.json({
        response_type: "ephemeral",
        text: `🎨 Recibí: "${text.slice(0, 80)}". Trabajando en la propuesta — vas a recibir un DM cuando esté lista.`,
    });
}

interface SlashCommandPayload {
    text: string;
    userId: string;
    channelId: string;
    responseUrl: string;
}

async function handleSlashCommand(p: SlashCommandPayload): Promise<void> {
    console.log("[slack/commands] dispatching", p);
    const { orchestrateProposalFromSlack } = await import("@/lib/slack/orchestrator");
    await orchestrateProposalFromSlack({
        rawText: p.text,
        requester: { userId: p.userId },
        originChannel: p.channelId,
    });
}
