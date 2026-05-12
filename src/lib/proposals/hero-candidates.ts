/**
 * Hero image candidate finder.
 *
 * Given a client name (and optionally what the research pipeline already
 * found), produces a short ranked list of candidate cover photos the
 * salesperson can pick from in the Slack DM. The Aeroméxico-style cover
 * lives or dies by this image — a random Unsplash brewery shot loses
 * the lambón effect, an official editorial photo of the client's own
 * world wins the meeting.
 *
 * Strategy (in priority order):
 *   1. research.heroImageUrl — Exa+Claude already picked one.
 *   2. research.logoCandidates filtered to non-logo-like URLs — these
 *      are the other images Exa surfaced; a fraction are actually hero
 *      shots that got misclassified as logos.
 *   3. exa search with editorial-photo queries scoped to the company's
 *      own domain when known, then to news/press sources.
 *   4. wikipedia commons for major LATAM brands.
 *
 * Returns at most `limit` candidates (default 5), de-duped by URL.
 */

import "server-only";
import { exaSearch, isExaConfigured } from "@/lib/research/exa";
import type { ResearchResult } from "@/lib/slide-types";

export interface HeroCandidate {
    /** Direct URL to the image. */
    url: string;
    /** Where Monet found it — shown as caption in the picker. */
    source: string;
    /** Original page that hosted the image, for "Where did this come
     *  from?" hover text. */
    pageUrl?: string;
    /** Short human-readable label (e.g., "Bavaria — Cervecería
     *  Tocancipá"). Used as alt text + accessibility caption. */
    caption?: string;
    /** Score used for ranking (higher = better). */
    score: number;
}

const HERO_QUERIES = (clientName: string): string[] => [
    `${clientName} editorial photography press kit`,
    `${clientName} headquarters facility hero photo`,
    `${clientName} brand campaign cinematic`,
    `${clientName} corporate building photography`,
];

/**
 * URL pattern hints. We want HORIZONTAL editorial shots, not square
 * logos or low-res thumbnails. The scoring favors:
 *   - large image extensions (.jpg, .webp)
 *   - hosted on the company's own domain
 *   - paths containing "hero", "banner", "facility", "campaign"
 */
function scoreHeroUrl(url: string, companyDomain?: string): number {
    let score = 1;
    const lower = url.toLowerCase();

    // Penalize logos / icons
    if (/logo|icon|favicon|sprite/.test(lower)) score -= 5;
    // Penalize tiny preview thumbnails
    if (/thumbnail|thumb|\d+x\d+/.test(lower)) score -= 1;

    // Favor large image formats
    if (/\.(jpg|jpeg|webp)$/i.test(lower)) score += 2;
    if (/\.png$/i.test(lower)) score += 1;
    if (/\.svg$/i.test(lower)) score -= 4; // SVG is usually a logo, not a photo

    // Favor company-owned hosting
    if (companyDomain) {
        const dom = companyDomain.replace(/^www\./, "");
        if (lower.includes(dom)) score += 5;
    }

    // Editorial-keyword bonus
    if (/hero|banner|facility|campaign|press|media|brand/.test(lower)) score += 2;

    // Penalize stock-photo sites (we want client-owned imagery)
    if (/unsplash|pexels|shutterstock|gettyimages|alamy|istockphoto/.test(lower)) score -= 3;

    // Penalize known logo CDNs
    if (/seeklogo|logo-?(world|wise|s)|brandfetch|logosvector|wikimedia\.org/.test(lower)) score -= 2;

    return score;
}

export interface FindHeroOptions {
    clientName: string;
    research?: Pick<ResearchResult, "heroImageUrl" | "logoCandidates" | "logoUrl">;
    /** Best guess at the company's primary domain (e.g., "bavaria.co").
     *  When set, candidates from that domain rank higher. */
    companyDomain?: string;
    limit?: number;
}

export async function findHeroCandidates(opts: FindHeroOptions): Promise<HeroCandidate[]> {
    const limit = opts.limit ?? 5;
    const seen = new Set<string>();
    const candidates: HeroCandidate[] = [];

    function addCandidate(url: string, source: string, pageUrl?: string, caption?: string) {
        if (!url || !url.startsWith("http")) return;
        if (seen.has(url)) return;
        seen.add(url);
        const score = scoreHeroUrl(url, opts.companyDomain);
        candidates.push({ url, source, pageUrl, caption, score });
    }

    // 1. Research's primary pick — highest a priori weight.
    if (opts.research?.heroImageUrl) {
        addCandidate(
            opts.research.heroImageUrl,
            "Research primary",
            undefined,
            `${opts.clientName} — research`,
        );
        // Boost it explicitly so it tends to stay #1 even if URL scoring
        // is conservative.
        const last = candidates[candidates.length - 1];
        if (last) last.score += 10;
    }

    // 2. Other URLs that Exa surfaced during logo search. Some are
    //    misclassified hero shots — let scoring filter the obvious
    //    logo ones out.
    for (const url of opts.research?.logoCandidates ?? []) {
        if (url === opts.research?.logoUrl) continue; // skip the picked logo
        addCandidate(url, "Research alt", undefined, `${opts.clientName} — alt`);
    }

    // 3. Exa search with hero-shaped queries.
    if (isExaConfigured()) {
        for (const query of HERO_QUERIES(opts.clientName)) {
            try {
                const res = await exaSearch({
                    query,
                    type: "instant",
                    numResults: 6,
                });
                for (const r of res.results ?? []) {
                    const url = r.image;
                    if (!url) continue;
                    addCandidate(
                        url,
                        truncate(r.title ?? "Exa result", 60),
                        r.url,
                        r.title,
                    );
                }
            } catch (err) {
                console.warn("[hero-candidates] exa query failed:", query, err);
            }
        }
    }

    // 4. Final ranking — descending score, capped at `limit`.
    candidates.sort((a, b) => b.score - a.score);
    return candidates.filter((c) => c.score > -2).slice(0, limit);
}

function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
