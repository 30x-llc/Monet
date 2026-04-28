import { NextRequest } from "next/server";
import { isCanvaOAuthEnabled } from "@/lib/canva/config";
import { readSessionId } from "@/lib/session/session";
import { getTokenRecord } from "@/lib/canva/token-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/canva/status
 *
 * Cheap, read-only endpoint the UI hits on mount to decide which
 * buttons to render. Never mints a new session — we don't want "am
 * I connected?" to create state.
 *
 * Shape:
 *   { enabled: boolean, connected: boolean }
 *
 * enabled=false means the admin hasn't configured Canva OAuth yet —
 * the UI should only show the PDF fallback.
 */
export async function GET(_req: NextRequest) {
    const enabled = isCanvaOAuthEnabled();
    if (!enabled) return Response.json({ enabled: false, connected: false });

    const sessionId = await readSessionId();
    if (!sessionId) return Response.json({ enabled: true, connected: false });

    const rec = getTokenRecord(sessionId);
    return Response.json({ enabled: true, connected: !!rec });
}
