import { NextResponse, type NextRequest } from "next/server";
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
            handleAction(action, payload).catch((err) => {
                console.error("[slack/interactivity] handler failed", err);
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
    console.log("[slack/interactivity] action", action.action_id, action.value);
    // Wire up Send / Edit / Reject in the next slice, once the generation
    // pipeline produces decks worth approving.
}
