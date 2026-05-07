/**
 * GET /api/auth/google/start
 *
 * Kicks off the Google OAuth flow. Builds the authorization URL with
 * `hd=30x.com` (Workspace hint) and a signed `state` cookie for CSRF.
 *
 * The actual gate is in /api/auth/google/callback — this endpoint just
 * issues the redirect.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
    buildAuthorizationUrl,
    buildRedirectUri,
    getClientId,
    newStateNonce,
    signState,
} from "@/lib/auth/google-oauth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "30x_oauth_state";

export async function GET(request: NextRequest) {
    let clientId: string;
    try {
        clientId = getClientId();
    } catch {
        return NextResponse.redirect(new URL("/login?error=not_configured", request.url));
    }
    const redirectUri = buildRedirectUri(request);
    const nonce = newStateNonce();
    const next = request.nextUrl.searchParams.get("next") ?? "/";
    // Pack the post-login redirect into the state, so the callback can honor it.
    const statePayload = `${nonce}:${encodeURIComponent(next)}`;
    const state = signState(statePayload);

    const authUrl = buildAuthorizationUrl({ clientId, redirectUri, state });

    const jar = await cookies();
    jar.set(STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 minutes — only the OAuth round-trip needs it
    });

    return NextResponse.redirect(authUrl);
}
