import { NextRequest } from "next/server";
import { readSessionId, clearSession } from "@/lib/session/session";
import { deleteTokenRecord } from "@/lib/canva/token-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/canva/disconnect
 * Clears the user's Canva token record and session cookie.
 */
export async function POST(_req: NextRequest) {
    const sessionId = await readSessionId();
    if (sessionId) deleteTokenRecord(sessionId);
    await clearSession();
    return Response.json({ ok: true });
}
