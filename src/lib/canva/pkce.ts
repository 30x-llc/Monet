/**
 * PKCE (RFC 7636) primitives for Canva OAuth.
 *
 * Canva Connect requires PKCE for all OAuth authorization flows — even
 * with a client secret. The verifier is stored server-side in KV keyed
 * by the user's session ID until the callback redeems it.
 */

import "server-only";
import { createHash, randomBytes } from "crypto";

function base64UrlEncode(buf: Buffer): string {
    return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

export interface PkcePair {
    verifier: string;
    challenge: string;
}

/**
 * Generate a fresh PKCE verifier + S256-hashed challenge.
 * The verifier is 32 random bytes (base64url-encoded → 43 chars) which
 * satisfies Canva's 43–128 character requirement.
 */
export function createPkcePair(): PkcePair {
    const verifier = base64UrlEncode(randomBytes(32));
    const challenge = base64UrlEncode(
        createHash("sha256").update(verifier).digest(),
    );
    return { verifier, challenge };
}
