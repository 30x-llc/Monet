/**
 * Identity — Hub-provided headers, no auth gate.
 *
 * 30x Design lives inside the 30x Hub, which authenticates the user
 * upstream and forwards identity via request headers:
 *
 *   x-30x-user-email
 *   x-30x-user-name
 *
 * When the headers are absent (direct access during transition, dev,
 * preview deployments), we fall back to a shared "anonymous" bucket so
 * the app stays functional. Sales Ops gating still uses OPS_EMAILS — the
 * fallback identity simply isn't on that allowlist.
 */

import "server-only";
import { headers } from "next/headers";

const HEADER_EMAIL = "x-30x-user-email";
const HEADER_NAME = "x-30x-user-name";

const ANON_EMAIL = "anonymous@30x.com";
const ANON_NAME = "Invitado";

export interface Identity {
    name: string;
    email: string;
}

export async function readIdentity(): Promise<Identity | null> {
    const h = await headers();
    const email = h.get(HEADER_EMAIL)?.trim().toLowerCase();
    const name = h.get(HEADER_NAME)?.trim();
    if (email && email.includes("@")) {
        return { email, name: name || email };
    }
    return { email: ANON_EMAIL, name: ANON_NAME };
}

export function isSalesOps(email: string): boolean {
    const allow = (process.env.OPS_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return allow.includes(email.trim().toLowerCase());
}

export function getAllowedEmailDomains(): string[] {
    return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
    const allowed = getAllowedEmailDomains();
    if (allowed.length === 0) return true;
    const domain = email.split("@")[1]?.trim().toLowerCase();
    if (!domain) return false;
    return allowed.includes(domain);
}
