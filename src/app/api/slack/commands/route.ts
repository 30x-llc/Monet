import { NextResponse, type NextRequest } from "next/server";
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
            text: "Usa `/monet propuesta para {cliente}, {detalles}`. Ejemplo: `/monet propuesta Bavaria, 4 sedes, AI Sales`.",
        });
    }

    // Fire-and-forget processing.
    handleSlashCommand({ text, userId, channelId, responseUrl }).catch((err) => {
        console.error("[slack/commands] background handler failed", err);
    });

    // Acknowledge fast.
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
