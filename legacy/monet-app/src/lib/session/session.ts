/**
 * Tiny signed-cookie session — enough identity for per-browser Canva
 * tokens. Not a user account system. When 30x adopts real SSO, the
 * session ID becomes just another key that maps to userId.
 *
 * Cookie: canva_session (HttpOnly, Secure, SameSite=Lax, 90d rolling)
 * Value format: "<sessionId>.<hmacSha256Base64Url(sessionId)>"
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SESSION_SECRET } from "@/lib/canva/config";

const COOKIE_NAME = "canva_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function base64UrlEncode(buf: Buffer): string {
    return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function signSessionId(id: string): string {
    const mac = createHmac("sha256", SESSION_SECRET).update(id).digest();
    return `${id}.${base64UrlEncode(mac)}`;
}

function verifySignedSessionId(signed: string): string | null {
    const [id, sig] = signed.split(".");
    if (!id || !sig) return null;
    const expected = createHmac("sha256", SESSION_SECRET).update(id).digest();
    const actual = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (expected.length !== actual.length) return null;
    try {
        if (!timingSafeEqual(expected, actual)) return null;
    } catch {
        return null;
    }
    return id;
}

/**
 * Read the current session ID from the cookie, or mint a new one and
 * set the cookie. Returns the session ID — the source of identity for
 * every Canva token lookup.
 *
 * Must be called from a Server Component / Route Handler — it needs
 * access to the mutable cookie store.
 */
export async function getOrCreateSessionId(): Promise<string> {
    const jar = await cookies();
    const existing = jar.get(COOKIE_NAME)?.value;
    if (existing) {
        const verified = verifySignedSessionId(existing);
        if (verified) return verified;
    }

    const fresh = base64UrlEncode(randomBytes(24));
    jar.set(COOKIE_NAME, signSessionId(fresh), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE_SECONDS,
    });
    return fresh;
}

/**
 * Read-only variant — never mints a new session. Returns null if there
 * isn't one yet. Used by /api/canva/status where we don't want the
 * mere act of asking "am I connected?" to create state.
 */
export async function readSessionId(): Promise<string | null> {
    const jar = await cookies();
    const signed = jar.get(COOKIE_NAME)?.value;
    if (!signed) return null;
    return verifySignedSessionId(signed);
}

/** Wipe the session cookie — used on /api/canva/disconnect. */
export async function clearSession(): Promise<void> {
    const jar = await cookies();
    jar.delete(COOKIE_NAME);
}
