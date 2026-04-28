import type { NextRequest } from "next/server";
import {
    readIdentity,
    setIdentity,
    clearIdentity,
    isSalesOps,
    isAllowedEmail,
    getAllowedEmailDomains,
} from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

/**
 * GET /api/identity → { identity, isOps, allowedDomains } | { identity: null, allowedDomains }
 * POST /api/identity { name, email } → { ok, identity, isOps }
 *   403 if email domain not in ALLOWED_EMAIL_DOMAINS
 * DELETE /api/identity → { ok }
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

export async function POST(request: NextRequest) {
    const body = (await request.json().catch(() => ({}))) as Partial<{
        name: string;
        email: string;
    }>;
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    if (name.length < 2 || !email.includes("@")) {
        return Response.json(
            { ok: false, error: "Nombre y email requeridos" },
            { status: 400 },
        );
    }
    if (!isAllowedEmail(email)) {
        const domains = getAllowedEmailDomains();
        const list = domains.map((d) => `@${d}`).join(", ");
        return Response.json(
            {
                ok: false,
                error: `Solo correos ${list} pueden acceder a 30x Design.`,
            },
            { status: 403 },
        );
    }
    await setIdentity({ name, email });
    return Response.json({ ok: true, identity: { name, email }, isOps: isSalesOps(email) });
}

export async function DELETE() {
    await clearIdentity();
    return Response.json({ ok: true });
}
