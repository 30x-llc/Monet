import { NextRequest } from "next/server";
import {
    CANVA_AUTH_BASE,
    CANVA_CLIENT_ID,
    CANVA_REDIRECT_URI,
    CANVA_SCOPES,
    isCanvaOAuthEnabled,
} from "@/lib/canva/config";
import { createPkcePair } from "@/lib/canva/pkce";
import { getOrCreateSessionId } from "@/lib/session/session";
import { putPkceRecord } from "@/lib/canva/token-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/canva/connect?returnTo=/
 *
 * Kicks off OAuth. Generates a PKCE pair, stashes the verifier against
 * the user's session, and redirects to Canva's authorize page.
 */
export async function GET(req: NextRequest) {
    if (!isCanvaOAuthEnabled()) {
        return Response.json(
            {
                ok: false,
                error: "Canva OAuth no habilitado en este entorno.",
            },
            { status: 503 },
        );
    }

    const url = new URL(req.url);
    const returnTo = url.searchParams.get("returnTo") || "/";

    const sessionId = await getOrCreateSessionId();
    const { verifier, challenge } = createPkcePair();
    putPkceRecord(sessionId, verifier, returnTo);

    const authorize = new URL(`${CANVA_AUTH_BASE}/api/oauth/authorize`);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", CANVA_CLIENT_ID);
    authorize.searchParams.set("redirect_uri", CANVA_REDIRECT_URI);
    authorize.searchParams.set("scope", CANVA_SCOPES.join(" "));
    authorize.searchParams.set("state", sessionId);
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");

    return Response.redirect(authorize.toString(), 302);
}
