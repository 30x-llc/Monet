/**
 * Identity — lightweight name+email cookie auth.
 *
 * 30x Design is internal (70 trusted salespeople). For v1 we don't run
 * full OAuth (Sign in with Vercel / Clerk) — we just ask the user to
 * type their name + email once and persist that in a signed HttpOnly
 * cookie. Anyone could in theory claim to be anyone, but the threat
 * model is low (internal team) and the value of shipping today is high.
 *
 * v2 should swap this for real SSO. The Identity shape stays the same;
 * only the source of truth changes (cookie → OAuth claims).
 *
 * Sales Ops is gated by an email allowlist defined in OPS_EMAILS env var
 * (comma-separated). Never trust the cookie email for ops authorization
 * without checking the allowlist.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "30x_identity";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year — internal tool

const SECRET =
    process.env.IDENTITY_SECRET ||
    process.env.SESSION_SECRET ||
    // Fall back to a deterministic-but-unpredictable value derived from
    // ANTHROPIC_API_KEY so that we have *something* in dev. In prod the
    // user should set IDENTITY_SECRET explicitly.
    `30x-fallback-${(process.env.ANTHROPIC_API_KEY ?? "").slice(0, 20)}`;

export interface Identity {
    name: string;
    email: string;
}

function base64UrlEncode(buf: Buffer): string {
    return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function sign(payload: string): string {
    const mac = createHmac("sha256", SECRET).update(payload).digest();
    return `${payload}.${base64UrlEncode(mac)}`;
}

function verify(signed: string): string | null {
    const idx = signed.lastIndexOf(".");
    if (idx <= 0) return null;
    const payload = signed.slice(0, idx);
    const sig = signed.slice(idx + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest();
    const actual = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (expected.length !== actual.length) return null;
    try {
        if (!timingSafeEqual(expected, actual)) return null;
    } catch {
        return null;
    }
    return payload;
}

function encodeIdentity(id: Identity): string {
    return Buffer.from(JSON.stringify(id), "utf8").toString("base64");
}
function decodeIdentity(payload: string): Identity | null {
    try {
        const json = Buffer.from(payload, "base64").toString("utf8");
        const obj = JSON.parse(json);
        if (
            typeof obj?.name !== "string" ||
            typeof obj?.email !== "string" ||
            !obj.email.includes("@")
        )
            return null;
        return { name: obj.name.trim(), email: obj.email.trim().toLowerCase() };
    } catch {
        return null;
    }
}

export async function readIdentity(): Promise<Identity | null> {
    const jar = await cookies();
    const signed = jar.get(COOKIE_NAME)?.value;
    if (!signed) return null;
    const payload = verify(signed);
    if (!payload) return null;
    return decodeIdentity(payload);
}

export async function setIdentity(id: Identity): Promise<void> {
    const payload = encodeIdentity(id);
    const signed = sign(payload);
    const jar = await cookies();
    jar.set(COOKIE_NAME, signed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE_SECONDS,
    });
}

export async function clearIdentity(): Promise<void> {
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
}

/**
 * Sales Ops allowlist. Comma-separated emails in OPS_EMAILS. Always
 * lowercase compared. If unset, no one is Ops (locks the dashboard).
 */
export function isSalesOps(email: string): boolean {
    const allow = (process.env.OPS_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return allow.includes(email.trim().toLowerCase());
}

/**
 * Email domain allowlist. ALLOWED_EMAIL_DOMAINS is comma-separated
 * (e.g., "30x.com,30x.school"). When set, only emails matching one
 * of these domains can identify themselves. When unset, no restriction.
 *
 * For 30x Design we set it to "30x.com" so only the internal team can
 * sign up and access the tool. Data stays private to the company.
 */
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
