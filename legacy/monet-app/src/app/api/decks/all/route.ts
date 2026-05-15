import type { NextRequest } from "next/server";
import { readIdentity, isSalesOps } from "@/lib/auth/identity";
import { listAllDecks, deckStats } from "@/lib/db/decks";
import type { DeckStatus } from "@/lib/db/schema";
import { isDbConfigured } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/decks/all?user=&company=&status=&stats=1
 *
 * Sales Ops dashboard data — guarded by OPS_EMAILS allowlist. Returns:
 *   { ok, decks, stats? }
 *
 * The `stats` query param triggers an extra aggregate query for the
 * dashboard header (total counts + by user + by status).
 */
export async function GET(request: NextRequest) {
    if (!isDbConfigured()) {
        return Response.json(
            { ok: false, error: "DB no configurada" },
            { status: 503 },
        );
    }
    const identity = await readIdentity();
    if (!identity) {
        return Response.json(
            { ok: false, error: "Sin identidad" },
            { status: 401 },
        );
    }
    if (!isSalesOps(identity.email)) {
        return Response.json(
            {
                ok: false,
                error: `${identity.email} no está en la lista de Sales Ops`,
            },
            { status: 403 },
        );
    }

    const url = new URL(request.url);
    const user = url.searchParams.get("user") || undefined;
    const company = url.searchParams.get("company") || undefined;
    const status = (url.searchParams.get("status") || undefined) as
        | DeckStatus
        | undefined;
    const wantStats = url.searchParams.get("stats") === "1";

    try {
        const decks = await listAllDecks({
            userEmail: user,
            companyName: company,
            status,
        });
        const stats = wantStats ? await deckStats() : undefined;
        return Response.json({ ok: true, decks, stats });
    } catch (err) {
        console.error("[decks.all]", err);
        return Response.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
