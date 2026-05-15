/**
 * Canva OAuth token store.
 *
 * **v1 design decision:** use a minimal in-memory Map as the token store
 * until Vercel KV is installed via the Marketplace. This keeps the
 * entire OAuth flow testable end-to-end on a single serverless instance
 * (which is what we have today — one long-lived region). The store
 * survives between requests inside the same lambda instance; a cold
 * start loses tokens and forces the user to reconnect.
 *
 * When KV lands:
 *   - replace the `Map` with @vercel/kv
 *   - same public API (getTokenRecord / putTokenRecord / getFreshAccessToken)
 *   - add a `SETNX` lock for refresh stampedes
 *
 * **Why not do KV now:** it requires a Marketplace install step from
 * the user's Vercel dashboard. Shipping the OAuth scaffold without
 * blocking on that means the feature can be wired up and tested the
 * moment Canva Partners approval lands — the KV upgrade is a mechanical
 * swap of this one file.
 */

import "server-only";
import {
    CANVA_API_BASE,
    CANVA_CLIENT_ID,
    CANVA_CLIENT_SECRET,
} from "./config";

export interface TokenRecord {
    accessToken: string;
    refreshToken: string;
    // ms since epoch
    expiresAt: number;
    canvaUserId?: string;
}

// Singleton across module reloads in dev. In production the store
// is one Map per serverless instance — good enough for v1.
const g = globalThis as unknown as { __canvaTokens?: Map<string, TokenRecord> };
const tokenStore: Map<string, TokenRecord> =
    g.__canvaTokens ?? new Map<string, TokenRecord>();
g.__canvaTokens = tokenStore;

const pkceStore = new Map<
    string,
    { verifier: string; returnTo: string; expiresAt: number }
>();

// ---- PKCE (short-lived, 5 min) ---------------------------------------------

export function putPkceRecord(
    sessionId: string,
    verifier: string,
    returnTo: string,
): void {
    pkceStore.set(sessionId, {
        verifier,
        returnTo,
        expiresAt: Date.now() + 5 * 60 * 1000,
    });
}

export function takePkceRecord(
    sessionId: string,
): { verifier: string; returnTo: string } | null {
    const rec = pkceStore.get(sessionId);
    if (!rec) return null;
    pkceStore.delete(sessionId);
    if (rec.expiresAt < Date.now()) return null;
    return { verifier: rec.verifier, returnTo: rec.returnTo };
}

// ---- Tokens ---------------------------------------------------------------

export function getTokenRecord(sessionId: string): TokenRecord | null {
    return tokenStore.get(sessionId) ?? null;
}

export function putTokenRecord(sessionId: string, record: TokenRecord): void {
    tokenStore.set(sessionId, record);
}

export function deleteTokenRecord(sessionId: string): void {
    tokenStore.delete(sessionId);
}

/**
 * Returns a valid access token for this session, refreshing if needed.
 * Returns null if the session has no token at all (user never connected,
 * or was disconnected).
 *
 * Refresh window: 60 seconds before expiry. This is generous — Canva
 * access tokens are good for 4 hours.
 */
export async function getFreshAccessToken(
    sessionId: string,
): Promise<string | null> {
    const rec = getTokenRecord(sessionId);
    if (!rec) return null;

    if (rec.expiresAt - Date.now() > 60_000) return rec.accessToken;

    // Token expired or about to expire — refresh.
    const refreshed = await refreshAccessToken(rec.refreshToken);
    if (!refreshed) {
        deleteTokenRecord(sessionId);
        return null;
    }
    putTokenRecord(sessionId, refreshed);
    return refreshed.accessToken;
}

async function refreshAccessToken(
    refreshToken: string,
): Promise<TokenRecord | null> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });
    const basic = Buffer.from(
        `${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch(`${CANVA_API_BASE}/rest/v1/oauth/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
    };
    return {
        accessToken: data.access_token,
        // Canva rotates refresh tokens; fall back to the old one if the
        // response didn't include a new one (shouldn't happen but safe).
        refreshToken: data.refresh_token ?? refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
}
