/**
 * Google OAuth helpers — server-only.
 *
 * Threat model: a personal Gmail account can claim email "pepito@30x.com"
 * by listing it as a recovery alias. The naive check `email.endsWith("@30x.com")`
 * accepts that. The real fix is verifying that the OAuth account is a Google
 * Workspace member of the 30x.com organization.
 *
 * Google encodes Workspace membership in the id_token's `hd` (hosted domain)
 * claim. Personal Gmail accounts NEVER have `hd`. So requiring `hd === "30x.com"`
 * closes the hole.
 *
 * We verify the id_token by hitting Google's tokeninfo endpoint, which
 * checks the signature and returns the canonical claims. Equivalent to JWKS
 * verification with `jose`, but no extra dependency.
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const REQUIRED_HD = "30x.com";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

const SECRET =
    process.env.IDENTITY_SECRET ||
    process.env.SESSION_SECRET ||
    `30x-fallback-${(process.env.ANTHROPIC_API_KEY ?? "").slice(0, 20)}`;

export function getClientId(): string {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) throw new Error("GOOGLE_CLIENT_ID not configured");
    return id;
}

export function getClientSecret(): string {
    const secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!secret) throw new Error("GOOGLE_CLIENT_SECRET not configured");
    return secret;
}

/**
 * Derive the OAuth redirect URI from the incoming request. Lets preview
 * deployments work without per-environment env vars — Google must have
 * the URI registered in the OAuth client (see README in this folder).
 */
export function buildRedirectUri(request: Request): string {
    const url = new URL(request.url);
    const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
    return `${protocol}://${host}/api/auth/google/callback`;
}

/** Build a signed `state` value to defend the OAuth flow against CSRF. */
export function signState(payload: string): string {
    const mac = createHmac("sha256", SECRET).update(payload).digest("base64url");
    return `${payload}.${mac}`;
}

export function verifyState(signed: string): string | null {
    const idx = signed.lastIndexOf(".");
    if (idx <= 0) return null;
    const payload = signed.slice(0, idx);
    const sig = signed.slice(idx + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return null;
    try {
        if (!timingSafeEqual(a, b)) return null;
    } catch {
        return null;
    }
    return payload;
}

export function newStateNonce(): string {
    return randomBytes(16).toString("base64url");
}

/**
 * Build the URL to start the Google OAuth dance. `hd: "30x.com"` tells
 * Google's account picker to only show 30x Workspace accounts. (Defence
 * in depth — we still verify the claim server-side after the callback.)
 */
export function buildAuthorizationUrl({
    clientId,
    redirectUri,
    state,
    next,
}: {
    clientId: string;
    redirectUri: string;
    state: string;
    next?: string;
}): string {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        prompt: "select_account",
        hd: REQUIRED_HD,
        state,
        // include_granted_scopes is harmless and helps users with multiple sessions
        include_granted_scopes: "true",
        ...(next ? { login_hint: "" } : {}),
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    error_description?: string;
}

/** Exchange the OAuth code for tokens. */
export async function exchangeCodeForTokens({
    code,
    clientId,
    clientSecret,
    redirectUri,
}: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}): Promise<TokenResponse> {
    const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
    });
    const res = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
    });
    return (await res.json()) as TokenResponse;
}

export interface VerifiedIdToken {
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    hd?: string;
    aud: string;
    iss: string;
    exp: number;
    sub: string;
}

/**
 * Verify an id_token by asking Google's tokeninfo endpoint. Google validates
 * the signature against its public JWKS and returns the canonical claims.
 *
 * Returns null if the token is invalid for any reason.
 */
export async function verifyIdToken(idToken: string): Promise<VerifiedIdToken | null> {
    const res = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, {
        cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (typeof data.email !== "string" || typeof data.aud !== "string") return null;
    return {
        email: String(data.email).toLowerCase(),
        email_verified: data.email_verified === true || data.email_verified === "true",
        name: typeof data.name === "string" ? data.name : (data.email as string),
        picture: typeof data.picture === "string" ? data.picture : undefined,
        hd: typeof data.hd === "string" ? data.hd : undefined,
        aud: String(data.aud),
        iss: typeof data.iss === "string" ? data.iss : "",
        exp: Number(data.exp ?? 0),
        sub: typeof data.sub === "string" ? data.sub : "",
    };
}

/**
 * The full validation: returns the verified user only if every gate passes.
 * Reasons for rejection are stringly-typed so the route handler can log /
 * surface them without exposing internals to the user.
 */
export async function validateGoogleSignIn(
    idToken: string,
    expectedClientId: string,
): Promise<
    | { ok: true; user: { email: string; name: string; picture?: string } }
    | { ok: false; reason: string }
> {
    const claims = await verifyIdToken(idToken);
    if (!claims) return { ok: false, reason: "invalid_token" };
    if (claims.aud !== expectedClientId) return { ok: false, reason: "aud_mismatch" };
    const validIssuers = new Set(["https://accounts.google.com", "accounts.google.com"]);
    if (!validIssuers.has(claims.iss)) return { ok: false, reason: "iss_mismatch" };
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) return { ok: false, reason: "expired" };
    // The critical Workspace check.
    if (claims.hd !== REQUIRED_HD) return { ok: false, reason: "not_workspace_member" };
    if (!claims.email_verified) return { ok: false, reason: "email_not_verified" };
    // Defence in depth: even if Google ever changed `hd` semantics, the email
    // domain must also match. (A Workspace account's primary email always does.)
    if (!claims.email.endsWith(`@${REQUIRED_HD}`)) return { ok: false, reason: "email_domain_mismatch" };
    return {
        ok: true,
        user: { email: claims.email, name: claims.name, picture: claims.picture },
    };
}
