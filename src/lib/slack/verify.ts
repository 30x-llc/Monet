import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify a Slack request signature.
 *
 * Slack signs every webhook with HMAC-SHA256(timestamp + ":" + raw body)
 * using the app's signing secret. We must validate before trusting any
 * data in the request body.
 *
 * Returns true if signature is valid AND the timestamp is recent
 * (within 5 minutes — protects against replay).
 */
export function verifySlackSignature(
    rawBody: string,
    timestamp: string,
    signature: string,
    signingSecret: string,
): boolean {
    if (!rawBody || !timestamp || !signature || !signingSecret) return false;
    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return false;
    const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (ageSec > 60 * 5) return false; // Replay window: 5 minutes.

    const base = `v0:${timestamp}:${rawBody}`;
    const computed =
        "v0=" + createHmac("sha256", signingSecret).update(base).digest("hex");

    const a = Buffer.from(computed);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    try {
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

/**
 * Convenience: extract the headers we care about and run verify.
 * Returns null when verification fails (caller should respond 401).
 */
export function checkSlackRequest(
    rawBody: string,
    headers: Headers,
    signingSecret: string,
): boolean {
    const timestamp = headers.get("x-slack-request-timestamp") ?? "";
    const signature = headers.get("x-slack-signature") ?? "";
    return verifySlackSignature(rawBody, timestamp, signature, signingSecret);
}
