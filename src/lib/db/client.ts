/**
 * Neon Postgres client.
 *
 * Uses the Neon serverless HTTP driver instead of node-postgres so the
 * connection works equally well in Vercel serverless functions and in
 * Edge runtime (no persistent socket needed). DATABASE_URL is provisioned
 * automatically by the Vercel Marketplace Neon integration.
 */

import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

// Reuse fetch across requests for connection pooling. Vercel functions
// share the underlying socket pool when this is true.
neonConfig.fetchConnectionCache = true;

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
    // Don't throw at import time — that would break local builds where
    // someone clones the repo and hasn't pulled the env yet. Throw at
    // first query instead.
    console.warn("[db] DATABASE_URL not set — database queries will fail");
}

export const sql = neon(url ?? "postgres://invalid:invalid@localhost/invalid");

export function isDbConfigured(): boolean {
    return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
