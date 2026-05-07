import {
    readIdentity,
    clearIdentity,
    isSalesOps,
    getAllowedEmailDomains,
} from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

/**
 * GET /api/identity → { identity, isOps, allowedDomains } | { identity: null, allowedDomains }
 * DELETE /api/identity → { ok }
 *
 * POST is gone: identity now comes from Google OAuth at
 * /api/auth/google/callback. Self-attested name+email is no longer
 * accepted (it allowed `pepito@30x.com` to walk in without being a real
 * Workspace member). See src/lib/auth/google-oauth.ts for the full check.
 */
export async function GET() {
    const identity = await readIdentity();
    const allowedDomains = getAllowedEmailDomains();
    if (!identity) {
        return Response.json({ identity: null, isOps: false, allowedDomains });
    }
    return Response.json({
        identity,
        isOps: isSalesOps(identity.email),
        allowedDomains,
    });
}

export async function POST() {
    return Response.json(
        {
            ok: false,
            error: "Sign in con Google: GET /api/auth/google/start",
        },
        { status: 410 },
    );
}

export async function DELETE() {
    await clearIdentity();
    return Response.json({ ok: true });
}
