import { NextRequest } from "next/server";
import { isCanvaOAuthEnabled } from "@/lib/canva/config";
import { exchangeCode, getUser } from "@/lib/canva/client";
import { readSessionId } from "@/lib/session/session";
import {
    putTokenRecord,
    takePkceRecord,
} from "@/lib/canva/token-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/canva/callback?code=...&state=<sessionId>
 *
 * Canva redirects back here after the user approves. Validate that the
 * state matches our session, redeem the code with our stored PKCE
 * verifier, store the token record, and bounce the user back to the
 * original `returnTo`.
 */
export async function GET(req: NextRequest) {
    if (!isCanvaOAuthEnabled()) {
        return Response.json(
            { ok: false, error: "Canva OAuth no habilitado." },
            { status: 503 },
        );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
        return Response.redirect(
            new URL(`/?canva=error&reason=${encodeURIComponent(errorParam)}`, req.url),
            302,
        );
    }
    if (!code || !state) {
        return Response.json(
            { ok: false, error: "Faltan parámetros code/state." },
            { status: 400 },
        );
    }

    const sessionId = await readSessionId();
    if (!sessionId || sessionId !== state) {
        return Response.json(
            { ok: false, error: "State no coincide — posible CSRF." },
            { status: 400 },
        );
    }

    const pkce = takePkceRecord(sessionId);
    if (!pkce) {
        return Response.json(
            { ok: false, error: "PKCE expirado — reintenta conectar." },
            { status: 400 },
        );
    }

    try {
        const token = await exchangeCode(code, pkce.verifier);
        const user = await getUser(token.accessToken);
        putTokenRecord(sessionId, { ...token, canvaUserId: user?.id });

        const to = new URL(pkce.returnTo || "/", req.url);
        to.searchParams.set("canva", "connected");
        return Response.redirect(to.toString(), 302);
    } catch (err) {
        console.error("[canva.callback]", err);
        return Response.redirect(
            new URL(`/?canva=error&reason=${encodeURIComponent(String(err))}`, req.url),
            302,
        );
    }
}
