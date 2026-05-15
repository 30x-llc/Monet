import type { NextRequest } from "next/server";
import { readIdentity, isSalesOps } from "@/lib/auth/identity";
import {
    getDeck,
    setDeckStatus,
    deleteDeck as dbDeleteDeck,
} from "@/lib/db/decks";
import { DECK_STATUSES, type DeckStatus } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Ctx {
    params: Promise<{ id: string }>;
}

/**
 * GET    /api/decks/[id]            → fetch one (owner OR Sales Ops)
 * PATCH  /api/decks/[id] { status } → update status (owner OR Sales Ops)
 * DELETE /api/decks/[id]            → delete (owner OR Sales Ops)
 */
export async function GET(_request: NextRequest, ctx: Ctx) {
    const identity = await readIdentity();
    if (!identity) {
        return Response.json({ ok: false, error: "Sin identidad" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const row = await getDeck(id);
    if (!row) {
        return Response.json({ ok: false, error: "Deck no encontrado" }, { status: 404 });
    }
    if (row.userEmail !== identity.email && !isSalesOps(identity.email)) {
        return Response.json(
            { ok: false, error: "Acceso denegado" },
            { status: 403 },
        );
    }
    return Response.json({ ok: true, deck: row });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
    const identity = await readIdentity();
    if (!identity) {
        return Response.json({ ok: false, error: "Sin identidad" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const row = await getDeck(id);
    if (!row) {
        return Response.json({ ok: false, error: "Deck no encontrado" }, { status: 404 });
    }
    if (row.userEmail !== identity.email && !isSalesOps(identity.email)) {
        return Response.json(
            { ok: false, error: "Acceso denegado" },
            { status: 403 },
        );
    }
    const body = (await request.json().catch(() => ({}))) as {
        status?: DeckStatus;
    };
    if (!body.status || !DECK_STATUSES.includes(body.status)) {
        return Response.json(
            {
                ok: false,
                error: `status debe ser uno de: ${DECK_STATUSES.join(", ")}`,
            },
            { status: 400 },
        );
    }
    await setDeckStatus(id, body.status);
    return Response.json({ ok: true, status: body.status });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
    const identity = await readIdentity();
    if (!identity) {
        return Response.json({ ok: false, error: "Sin identidad" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const row = await getDeck(id);
    if (!row) {
        return Response.json({ ok: false, error: "Deck no encontrado" }, { status: 404 });
    }
    if (row.userEmail !== identity.email && !isSalesOps(identity.email)) {
        return Response.json(
            { ok: false, error: "Acceso denegado" },
            { status: 403 },
        );
    }
    await dbDeleteDeck(id);
    return Response.json({ ok: true });
}
