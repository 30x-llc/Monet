import type { NextRequest } from "next/server";
import { readIdentity } from "@/lib/auth/identity";
import { upsertDeck, listDecksByUser } from "@/lib/db/decks";
import type { Deck } from "@/lib/slide-types";
import { isDbConfigured } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/decks { id, deck } → upsert the deck under the current
 * user's identity. Used by deck-storage.saveDeck() to mirror local
 * changes to the server-side store.
 *
 * GET /api/decks → list decks owned by the current user.
 */

export async function POST(request: NextRequest) {
    if (!isDbConfigured()) {
        return Response.json(
            { ok: false, error: "DB no configurada" },
            { status: 503 },
        );
    }
    const identity = await readIdentity();
    if (!identity) {
        return Response.json(
            { ok: false, error: "Identifícate primero" },
            { status: 401 },
        );
    }
    const body = (await request.json().catch(() => ({}))) as {
        id?: string;
        deck?: Deck;
    };
    if (!body.id || !body.deck) {
        return Response.json(
            { ok: false, error: "Faltan id o deck" },
            { status: 400 },
        );
    }
    try {
        const row = await upsertDeck({
            id: body.id,
            userEmail: identity.email,
            userName: identity.name,
            deck: body.deck,
        });
        return Response.json({ ok: true, id: row.id, updatedAt: row.updatedAt });
    } catch (err) {
        console.error("[decks.POST]", err);
        return Response.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}

export async function GET() {
    if (!isDbConfigured()) {
        return Response.json({ ok: true, decks: [] });
    }
    const identity = await readIdentity();
    if (!identity) {
        return Response.json({ ok: false, error: "Sin identidad" }, { status: 401 });
    }
    try {
        const rows = await listDecksByUser(identity.email);
        return Response.json({ ok: true, decks: rows });
    } catch (err) {
        console.error("[decks.GET]", err);
        return Response.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
