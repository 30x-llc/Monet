/**
 * Reference decks — multimodal examples for Claude's vision input.
 *
 * Claude generates better slides when it can SEE what a 30x deck looks
 * like instead of reading a description. On every /api/generate call
 * we pick 4–6 images from public/reference-decks/ that match the kinds
 * of slides we're asking Claude to produce, read them as base64, and
 * include them as image blocks alongside the text system prompt.
 *
 * Curation lives in public/reference-decks/manifest.json. Adding a new
 * reference is just: drop the PNG, append an entry, redeploy. No code
 * changes.
 */

import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ReferenceEntry {
    file: string;
    tags: string[];
    note?: string;
}

export interface ReferenceImage {
    mediaType: "image/png" | "image/jpeg" | "image/webp";
    base64: string;
    note?: string;
    tags: string[];
}

// Reference decks live in `private/reference-decks/` so they're
// bundled with the server at build time but never served as public
// static assets. The `private/` convention is a Next.js + Vercel
// tradition — no /public exposure, no bandwidth hit, no SEO footprint.
const ROOT = join(process.cwd(), "private", "reference-decks");

let cachedManifest: ReferenceEntry[] | null = null;

async function loadManifest(): Promise<ReferenceEntry[]> {
    if (cachedManifest) return cachedManifest;
    try {
        const raw = await readFile(join(ROOT, "manifest.json"), "utf-8");
        const parsed = JSON.parse(raw) as { references?: ReferenceEntry[] };
        cachedManifest = parsed.references ?? [];
        return cachedManifest;
    } catch (err) {
        console.warn("[reference-decks] manifest not found", err);
        return [];
    }
}

function mediaTypeFor(file: string): "image/png" | "image/jpeg" | "image/webp" {
    if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
    if (file.endsWith(".webp")) return "image/webp";
    return "image/png";
}

/**
 * Score a manifest entry against a set of slide-type tokens the deck
 * being generated will contain. Higher score → more relevant.
 *
 * Scoring is deliberately simple: +2 for an exact tag match against a
 * slide type ("corporate-cover" in entry tags AND in needed types),
 * +1 for a family match ("cover", "mentors", "content"), 0 otherwise.
 */
function scoreEntry(entry: ReferenceEntry, needed: Set<string>): number {
    let score = 0;
    for (const tag of entry.tags) {
        if (needed.has(tag)) score += 2;
        // Family fallbacks
        const families: Record<string, string[]> = {
            cover: ["corporate-cover", "cover-hero", "cover-globe"],
            mentors: ["intro-mentors", "mentor-grid", "mentor-duo"],
            content: ["diagnostic", "curriculum-grid", "methodology", "impact"],
        };
        for (const [family, members] of Object.entries(families)) {
            if (tag === family && members.some((m) => needed.has(m))) {
                score += 1;
            }
        }
    }
    return score;
}

/**
 * Pick up to `max` relevant reference images for a deck whose slides
 * have the given types. Always includes at least one "cover" reference
 * and one "content" reference so Claude sees a spread of patterns even
 * if the scoring doesn't find perfect matches.
 */
export async function pickReferenceImages(
    slideTypes: string[],
    max = 6,
): Promise<ReferenceImage[]> {
    const manifest = await loadManifest();
    if (manifest.length === 0) return [];

    const needed = new Set(slideTypes);
    const scored = manifest
        .map((entry) => ({ entry, score: scoreEntry(entry, needed) }))
        .sort((a, b) => b.score - a.score);

    // Guarantee at least one cover + one content reference
    const covers = manifest.filter((e) => e.tags.includes("cover") || e.tags.includes("corporate-cover"));
    const contents = manifest.filter((e) => e.tags.includes("content"));
    const forced: ReferenceEntry[] = [];
    if (covers[0]) forced.push(covers[0]);
    if (contents[0]) forced.push(contents[0]);

    const chosen: ReferenceEntry[] = [];
    const seen = new Set<string>();
    for (const e of [...forced, ...scored.map((s) => s.entry)]) {
        if (seen.has(e.file)) continue;
        seen.add(e.file);
        chosen.push(e);
        if (chosen.length >= max) break;
    }

    const images = await Promise.all(
        chosen.map(async (entry): Promise<ReferenceImage | null> => {
            try {
                const buf = await readFile(join(ROOT, entry.file));
                return {
                    mediaType: mediaTypeFor(entry.file),
                    base64: buf.toString("base64"),
                    note: entry.note,
                    tags: entry.tags,
                };
            } catch (err) {
                console.warn(
                    `[reference-decks] could not read ${entry.file}`,
                    err,
                );
                return null;
            }
        }),
    );

    return images.filter((i): i is ReferenceImage => i !== null);
}
