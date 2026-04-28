/**
 * Canva integration — central config + feature-flag gate.
 *
 * The OAuth + direct import path is *gated* by Canva Partners approval.
 * While we wait for that (3–10 business days), the app ships with a
 * polished "download PDF + open Canva import" fallback that works for
 * every user without any credentials.
 *
 * Activation:
 *   1. Create a Canva Integration at https://www.canva.com/developers/
 *   2. Add CANVA_CLIENT_ID + CANVA_CLIENT_SECRET via `vercel env add`
 *   3. Set CANVA_OAUTH_ENABLED=true
 *   4. Install Vercel KV (Marketplace) for token storage
 *   5. Deploy — the "Abrir en Canva" button appears automatically
 *
 * Nothing here leaks secrets to the client — this file is server-only.
 */

import "server-only";

export const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID ?? "";
export const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET ?? "";
export const CANVA_AUTH_BASE =
    process.env.CANVA_AUTH_BASE ?? "https://www.canva.com";
export const CANVA_API_BASE =
    process.env.CANVA_API_BASE ?? "https://api.canva.com";
export const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI ?? "";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

// The scopes we ask the user to grant during OAuth. Keep this list
// narrow — only the ones we actually need.
export const CANVA_SCOPES = [
    "design:meta:read",
    "design:content:write",
    "design:content:read",
    "asset:write",
];

/**
 * Is the OAuth path enabled in this environment? Both the secret env
 * var AND the explicit feature flag must be set. This double-gate means
 * a stray CANVA_CLIENT_ID left in preview doesn't accidentally activate
 * a half-working flow.
 */
export function isCanvaOAuthEnabled(): boolean {
    return (
        process.env.CANVA_OAUTH_ENABLED === "true" &&
        !!CANVA_CLIENT_ID &&
        !!CANVA_CLIENT_SECRET &&
        !!CANVA_REDIRECT_URI &&
        !!SESSION_SECRET
    );
}

/**
 * A narrower check used at runtime: "if we tried to start OAuth right
 * now, would it actually reach Canva?" Used to short-circuit server
 * routes with a clear error instead of a broken redirect.
 */
export function requireCanvaConfig(): { ok: true } | { ok: false; error: string } {
    if (!isCanvaOAuthEnabled()) {
        return {
            ok: false,
            error:
                "Canva OAuth no está habilitado. Pide al admin que configure CANVA_CLIENT_ID + CANVA_CLIENT_SECRET y encienda CANVA_OAUTH_ENABLED.",
        };
    }
    return { ok: true };
}
