/**
 * Database schema — idempotent. Run on first request via ensureSchema()
 * so we don't need a separate migration step. For something this small
 * (one table) it's the right call; if the schema grows beyond ~3 tables
 * we should swap in a real migration tool (drizzle-kit, etc).
 *
 * Pure types + constants (DeckStatus, labels) live in ./types so
 * client components can import them without dragging server-only code.
 */

import "server-only";
import { sql } from "./client";

export type { DeckStatus } from "./types";
export { DECK_STATUSES, DECK_STATUS_LABELS } from "./types";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
    if (initialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        await sql`
            CREATE TABLE IF NOT EXISTS decks (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                user_name TEXT NOT NULL,
                deck_title TEXT NOT NULL,
                company_name TEXT NOT NULL,
                program_name TEXT,
                program_id TEXT,
                format TEXT NOT NULL DEFAULT 'proposal',
                status TEXT NOT NULL DEFAULT 'draft',
                deck_json JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_decks_user_email ON decks(user_email)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_decks_company ON decks(company_name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_decks_status ON decks(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_decks_updated_at ON decks(updated_at DESC)`;

        initialized = true;
    })();

    return initPromise;
}
