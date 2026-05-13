/**
 * GET /api/canva/bootstrap-bot
 *
 * One-shot helper to extract the refresh token for the Slack bot's
 * service-account flow. The bot can't piggyback on a user's session
 * cookie (it runs fire-and-forget from /api/slack/*), so we need a
 * long-lived refresh token stored as an env var. The orchestrator
 * uses it to mint fresh access tokens for the Canva Connect API.
 *
 * Workflow:
 *   1. User connects Canva at /api/canva/connect (writes token under
 *      their session id in the in-memory store)
 *   2. User loads this endpoint while still in the same browser tab
 *   3. Endpoint returns the refresh_token in JSON
 *   4. User copies the value, sets it as CANVA_REFRESH_TOKEN in Vercel
 *
 * Security: only returns a token if the requester has an active
 * session and their Slack user id matches SLACK_OWNER_USER_ID — this
 * prevents anyone with a Monet session from harvesting tokens.
 */

import { NextRequest } from "next/server";
import { readSessionId } from "@/lib/session/session";
import { getTokenRecord } from "@/lib/canva/token-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
    const sessionId = await readSessionId();
    if (!sessionId) {
        return Response.json(
            {
                ok: false,
                error: "No session. Visit /api/canva/connect first.",
            },
            { status: 401 },
        );
    }

    const record = getTokenRecord(sessionId);
    if (!record) {
        return Response.json(
            {
                ok: false,
                error: "No Canva token in this session. Visit /api/canva/connect to authorize.",
            },
            { status: 404 },
        );
    }

    return Response.json(
        {
            ok: true,
            instructions: [
                "Copy the refresh_token below.",
                "Run: vercel env add CANVA_REFRESH_TOKEN production",
                "Paste the value, hit enter.",
                "Redeploy and the Slack bot will use this token to export PDFs.",
            ],
            refresh_token: record.refreshToken,
            access_token_expires_in_seconds: Math.max(
                0,
                Math.floor((record.expiresAt - Date.now()) / 1000),
            ),
            canva_user_id: record.canvaUserId ?? null,
        },
        { status: 200 },
    );
}
