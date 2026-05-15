/**
 * Exa-driven logo search for unknown clients.
 *
 * Strategy: query Exa for the company's brand pages (logo / press kit)
 * and pick the cleanest direct image URL we can find. We bias toward:
 *   - SVG / PNG / WebP filenames
 *   - "logo" or "wordmark" in the path
 *   - Hosts that historically serve clean logos (wikipedia uploads,
 *     brandfetch, seeklogo, official domains)
 * and reject:
 *   - Hotlink-protected hosts (linkedin/scribd/twitter)
 *   - Award/event organizer photos
 */

import "server-only";
import { exaSearch } from "./exa";

const GOOD_HOSTS = [
    "upload.wikimedia.org",
    "wikipedia.org",
    "commons.wikimedia.org",
    "brandfetch.com",
    "logo.clearbit.com",
    "seeklogo.com",
    "1000marcas.net",
    "logos-world.net",
    "logos-download.com",
    "supercrazylogos.com",
];

const BAD_HOSTS = new Set([
    "media.licdn.com",
    "imgv2-1-f.scribdassets.com",
    "imgv2-2-f.scribdassets.com",
    "s.yimg.com",
    "pbs.twimg.com",
    "i.ytimg.com",
]);

const IMG_EXT_RE = /\.(svg|png|webp|jpg|jpeg)$/i;

interface LogoCandidate {
    url: string;
    score: number;
    sourceTitle?: string;
}

function scoreCandidate(url: string): number {
    let score = 0;
    try {
        const u = new URL(url);
        const path = u.pathname.toLowerCase();
        const host = u.hostname.toLowerCase();

        if (BAD_HOSTS.has(host)) return -100;

        if (path.endsWith(".svg")) score += 14;
        else if (path.endsWith(".png")) score += 10;
        else if (path.endsWith(".webp")) score += 7;
        else if (IMG_EXT_RE.test(path)) score += 4;
        else return -20;

        if (path.includes("logo")) score += 8;
        if (path.includes("wordmark")) score += 6;
        if (path.includes("brand")) score += 4;
        if (path.includes("favicon")) score -= 6;
        if (path.includes("icon-") || path.endsWith("/icon.png"))
            score -= 4;
        if (path.includes("/award") || path.includes("/event")) score -= 30;

        if (GOOD_HOSTS.some((g) => host.endsWith(g))) score += 8;
        if (host.includes("wikimedia") && path.includes("commons")) score += 4;
        // Tiny sprite sheets / favicons often live in subdirs called sprites.
        if (path.includes("sprite") || path.includes("/icons/")) score -= 6;
    } catch {
        return -50;
    }
    return score;
}

/**
 * Run a Google-Images-style query through Exa. Exa's `instant` type
 * surfaces image results from the open web fast, and `image` field on
 * the result gives us a thumbnail or representative image URL we can
 * inspect alongside the page URL.
 */
export async function exaLogoSearch(
    companyName: string,
): Promise<string | null> {
    const queries = [
        `${companyName} logo png transparent background`,
        `${companyName} brand logo svg`,
        `${companyName} press kit logo download`,
    ];

    const allCandidates: LogoCandidate[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
        try {
            const res = await exaSearch({
                query: q,
                type: "instant",
                numResults: 8,
            });
            for (const r of res.results) {
                // The `image` field is what we want most — Exa surfaces
                // an image-like URL when the result is media-rich. We
                // also try the `url` itself in case it ends in .svg/.png.
                const candidates = [r.image, r.url].filter(
                    (u): u is string => typeof u === "string" && u.startsWith("http"),
                );
                for (const u of candidates) {
                    if (seen.has(u)) continue;
                    seen.add(u);
                    const s = scoreCandidate(u);
                    if (s > 0) {
                        allCandidates.push({ url: u, score: s, sourceTitle: r.title });
                    }
                }
            }
        } catch (err) {
            console.warn("[exa-logo-search] query failed:", q, err);
        }
    }

    if (allCandidates.length === 0) return null;
    allCandidates.sort((a, b) => b.score - a.score);
    return allCandidates[0].url;
}
