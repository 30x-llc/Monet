/**
 * Canva service-account token resolver for the Slack bot.
 *
 * The Slack orchestrator runs fire-and-forget background work that
 * can't access user-bound session cookies, so it can't read the
 * Canva access token out of the per-session in-memory store. To
 * sidestep that we mint fresh access tokens at every request using
 * a long-lived refresh token stored as the `CANVA_REFRESH_TOKEN`
 * environment variable.
 *
 * Workflow:
 *   1. Juan Diego (or an admin) connects Canva once at /api/canva/connect
 *   2. Visits /api/canva/bootstrap-bot to read the refresh token
 *   3. Sets CANVA_REFRESH_TOKEN in Vercel env
 *   4. The orchestrator calls getServiceCanvaAccessToken() before any
 *      Canva Connect API call to get a fresh access token (4h TTL).
 *
 * In-memory caching prevents minting a fresh token on every single
 * request — keeps the access token for ~3.5h before refreshing again.
 */

import "server-only";
import { CANVA_API_BASE, CANVA_CLIENT_ID, CANVA_CLIENT_SECRET } from "./config";

const g = globalThis as unknown as {
    __canvaServiceToken?: { accessToken: string; expiresAt: number } | null;
};

const REFRESH_WINDOW_MS = 60_000; // refresh 1 min before actual expiry

/**
 * Returns a valid access token for the bot's Canva service account.
 * Refreshes from CANVA_REFRESH_TOKEN if the cached one is missing or
 * about to expire. Returns null if no refresh token is configured.
 */
export async function getServiceCanvaAccessToken(): Promise<string | null> {
    const refreshToken = process.env.CANVA_REFRESH_TOKEN;
    if (!refreshToken) {
        console.warn(
            "[canva/service-token] CANVA_REFRESH_TOKEN not set — bot cannot export PDFs.",
        );
        return null;
    }

    const cached = g.__canvaServiceToken;
    if (cached && cached.expiresAt - Date.now() > REFRESH_WINDOW_MS) {
        return cached.accessToken;
    }

    const fresh = await refreshAccessToken(refreshToken);
    if (!fresh) {
        console.error(
            "[canva/service-token] refresh failed — check CANVA_REFRESH_TOKEN validity.",
        );
        return null;
    }
    g.__canvaServiceToken = fresh;
    return fresh.accessToken;
}

async function refreshAccessToken(
    refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number } | null> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });
    const basic = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString(
        "base64",
    );
    const res = await fetch(`${CANVA_API_BASE}/rest/v1/oauth/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "(no body)");
        console.error(
            `[canva/service-token] refresh HTTP ${res.status}: ${errText.slice(0, 200)}`,
        );
        return null;
    }
    const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
    };
    return {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
}
