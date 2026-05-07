/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * The gate. Validates everything before calling setIdentity():
 *  1. state matches the cookie we set (CSRF)
 *  2. code → tokens via Google
 *  3. id_token verified by Google's tokeninfo endpoint
 *  4. aud === our client_id (token isn't reused from another app)
 *  5. iss is Google
 *  6. exp is in the future
 *  7. hd === "30x.com" (Workspace member, not a personal Gmail aliased to 30x.com)
 *  8. email_verified === true
 *  9. email ends with @30x.com (defence in depth)
 *
 * Rejections redirect to /login?error=<reason>. Server logs the reason
 * with the email (if known) so admin can debug.
 */

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
    buildRedirectUri,
    exchangeCodeForTokens,
    getClientId,
    getClientSecret,
    validateGoogleSignIn,
    verifyState,
} from "@/lib/auth/google-oauth";
import { setIdentity } from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "30x_oauth_state";

function loginRedirect(request: NextRequest, error: string): NextResponse {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const stateParam = request.nextUrl.searchParams.get("state");
    const oauthError = request.nextUrl.searchParams.get("error");

    if (oauthError) {
        console.warn("[google-oauth] provider error", { oauthError });
        return loginRedirect(request, "google_error");
    }
    if (!code || !stateParam) {
        return loginRedirect(request, "missing_params");
    }

    const jar = await cookies();
    const stateCookie = jar.get(STATE_COOKIE)?.value;
    if (!stateCookie || stateCookie !== stateParam) {
        console.warn("[google-oauth] state mismatch");
        return loginRedirect(request, "state_mismatch");
    }
    // One-shot use — wipe immediately whether we succeed or not.
    jar.delete(STATE_COOKIE);

    const stateInner = verifyState(stateParam);
    if (!stateInner) {
        return loginRedirect(request, "state_invalid");
    }
    const [, encodedNext = "/"] = stateInner.split(":");
    const next = decodeURIComponent(encodedNext);

    let clientId: string;
    let clientSecret: string;
    try {
        clientId = getClientId();
        clientSecret = getClientSecret();
    } catch (err) {
        console.error("[google-oauth] not configured", err);
        return loginRedirect(request, "not_configured");
    }

    const redirectUri = buildRedirectUri(request);
    const tokens = await exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri });
    if (tokens.error || !tokens.id_token) {
        console.warn("[google-oauth] token exchange failed", {
            error: tokens.error,
            description: tokens.error_description,
        });
        return loginRedirect(request, "token_exchange_failed");
    }

    const result = await validateGoogleSignIn(tokens.id_token, clientId);
    if (!result.ok) {
        console.warn("[google-oauth] sign-in rejected", { reason: result.reason });
        return loginRedirect(request, result.reason);
    }

    await setIdentity({ name: result.user.name, email: result.user.email });

    // Only redirect within the same origin — never honour external `next`.
    const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(target, request.url));
}
