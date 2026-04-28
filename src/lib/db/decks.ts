/**
 * Decks repository — CRUD for the central deck store.
 *
 * Every saveDeck call from the editor hits upsertDeck() which:
 *   • Inserts if new (UUID from the client)
 *   • Updates deck_json + updated_at if it already exists
 *
 * Sales Ops (/ops dashboard) reads with listAllDecks(); regular
 * salespeople read with listDecksByUser().
 */

import "server-only";
import { sql } from "./client";
import { ensureSchema, type DeckStatus } from "./schema";
import type { Deck } from "@/lib/slide-types";

export interface DeckRow {
    id: string;
    userEmail: string;
    userName: string;
    deckTitle: string;
    companyName: string;
    programName: string | null;
    programId: string | null;
    format: string;
    status: DeckStatus;
    deckJson: Deck;
    createdAt: string;
    updatedAt: string;
}

interface RawDeckRow {
    id: string;
    user_email: string;
    user_name: string;
    deck_title: string;
    company_name: string;
    program_name: string | null;
    program_id: string | null;
    format: string;
    status: DeckStatus;
    deck_json: Deck;
    created_at: string;
    updated_at: string;
}

function rowToDeck(r: RawDeckRow): DeckRow {
    return {
        id: r.id,
        userEmail: r.user_email,
        userName: r.user_name,
        deckTitle: r.deck_title,
        companyName: r.company_name,
        programName: r.program_name,
        programId: r.program_id,
        format: r.format,
        status: r.status,
        deckJson: r.deck_json,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export interface UpsertDeckArgs {
    id: string;
    userEmail: string;
    userName: string;
    deck: Deck;
}

export async function upsertDeck(args: UpsertDeckArgs): Promise<DeckRow> {
    await ensureSchema();
    const { id, userEmail, userName, deck } = args;
    const rows = (await sql`
        INSERT INTO decks (
            id, user_email, user_name, deck_title, company_name,
            program_name, program_id, format, deck_json
        )
        VALUES (
            ${id},
            ${userEmail},
            ${userName},
            ${deck.deckTitle ?? "Sin título"},
            ${deck.companyName ?? ""},
            ${deck.programName ?? null},
            ${deck.programId ?? null},
            ${deck.format ?? "proposal"},
            ${JSON.stringify(deck)}
        )
        ON CONFLICT (id) DO UPDATE SET
            deck_title    = EXCLUDED.deck_title,
            company_name  = EXCLUDED.company_name,
            program_name  = EXCLUDED.program_name,
            program_id    = EXCLUDED.program_id,
            format        = EXCLUDED.format,
            deck_json     = EXCLUDED.deck_json,
            updated_at    = NOW()
        RETURNING *
    `) as RawDeckRow[];
    return rowToDeck(rows[0]);
}

export async function getDeck(id: string): Promise<DeckRow | null> {
    await ensureSchema();
    const rows = (await sql`SELECT * FROM decks WHERE id = ${id} LIMIT 1`) as RawDeckRow[];
    return rows[0] ? rowToDeck(rows[0]) : null;
}

export async function listDecksByUser(
    userEmail: string,
    limit = 100,
): Promise<DeckRow[]> {
    await ensureSchema();
    const rows = (await sql`
        SELECT * FROM decks
        WHERE user_email = ${userEmail}
        ORDER BY updated_at DESC
        LIMIT ${limit}
    `) as RawDeckRow[];
    return rows.map(rowToDeck);
}

export interface ListAllArgs {
    userEmail?: string; // filter by salesperson
    companyName?: string; // filter by client (case-insensitive substring)
    status?: DeckStatus; // filter by status
    limit?: number;
}

export async function listAllDecks(args: ListAllArgs = {}): Promise<DeckRow[]> {
    await ensureSchema();
    const limit = args.limit ?? 200;

    // Neon's tagged-template SQL doesn't compose dynamic WHERE clauses
    // cleanly, so we run a couple of variants. Branch on which filters
    // are present and call the right version.
    if (args.userEmail && args.companyName && args.status) {
        const rows = (await sql`
            SELECT * FROM decks
            WHERE user_email = ${args.userEmail}
              AND company_name ILIKE ${"%" + args.companyName + "%"}
              AND status = ${args.status}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.userEmail && args.companyName) {
        const rows = (await sql`
            SELECT * FROM decks
            WHERE user_email = ${args.userEmail}
              AND company_name ILIKE ${"%" + args.companyName + "%"}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.userEmail && args.status) {
        const rows = (await sql`
            SELECT * FROM decks
            WHERE user_email = ${args.userEmail}
              AND status = ${args.status}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.companyName && args.status) {
        const rows = (await sql`
            SELECT * FROM decks
            WHERE company_name ILIKE ${"%" + args.companyName + "%"}
              AND status = ${args.status}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.userEmail) {
        const rows = (await sql`
            SELECT * FROM decks WHERE user_email = ${args.userEmail}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.companyName) {
        const rows = (await sql`
            SELECT * FROM decks WHERE company_name ILIKE ${"%" + args.companyName + "%"}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    if (args.status) {
        const rows = (await sql`
            SELECT * FROM decks WHERE status = ${args.status}
            ORDER BY updated_at DESC LIMIT ${limit}
        `) as RawDeckRow[];
        return rows.map(rowToDeck);
    }
    const rows = (await sql`
        SELECT * FROM decks ORDER BY updated_at DESC LIMIT ${limit}
    `) as RawDeckRow[];
    return rows.map(rowToDeck);
}

export async function setDeckStatus(
    id: string,
    status: DeckStatus,
): Promise<void> {
    await ensureSchema();
    await sql`UPDATE decks SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteDeck(id: string): Promise<void> {
    await ensureSchema();
    await sql`DELETE FROM decks WHERE id = ${id}`;
}

/** Aggregate stats for the /ops dashboard header. */
export async function deckStats(): Promise<{
    total: number;
    byStatus: Record<DeckStatus, number>;
    byUser: Array<{ userEmail: string; userName: string; count: number }>;
}> {
    await ensureSchema();
    const totalRows = (await sql`SELECT COUNT(*)::int AS n FROM decks`) as Array<{ n: number }>;
    const statusRows = (await sql`
        SELECT status, COUNT(*)::int AS n FROM decks GROUP BY status
    `) as Array<{ status: DeckStatus; n: number }>;
    const userRows = (await sql`
        SELECT user_email, user_name, COUNT(*)::int AS n FROM decks
        GROUP BY user_email, user_name
        ORDER BY n DESC
        LIMIT 20
    `) as Array<{ user_email: string; user_name: string; n: number }>;

    const byStatus: Record<DeckStatus, number> = {
        draft: 0,
        sent: 0,
        won: 0,
        lost: 0,
        archived: 0,
    };
    for (const r of statusRows) byStatus[r.status] = r.n;

    return {
        total: totalRows[0]?.n ?? 0,
        byStatus,
        byUser: userRows.map((r) => ({
            userEmail: r.user_email,
            userName: r.user_name,
            count: r.n,
        })),
    };
}
