import "server-only";

/**
 * Hero image resolver.
 *
 * The model (Gemini) hallucinates plausible-but-dead stock-photo URLs
 * (e.g. images.unsplash.com IDs that 404), so we never trust a generated
 * hero URL blindly. Instead we:
 *   1. Use the candidate URL only if it actually resolves to an image.
 *   2. Otherwise scrape the company's own homepage og:image (real, on-brand,
 *      no API key needed).
 *   3. Otherwise return undefined → the cover renders a clean dark background.
 */

const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export async function isReachableImage(url: string): Promise<boolean> {
    try {
        const r = await fetch(url, {
            headers: { "user-agent": UA, accept: "image/*,*/*;q=0.8" },
            signal: AbortSignal.timeout(3_000),
            redirect: "follow",
        });
        return r.ok && (r.headers.get("content-type") ?? "").toLowerCase().startsWith("image/");
    } catch {
        return false;
    }
}

/** Fetch a company homepage and extract its og:image / twitter:image. */
export async function fetchOgImage(domain: string): Promise<string | null> {
    const base = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    try {
        const res = await fetch(base, {
            headers: { "user-agent": UA, accept: "text/html,*/*;q=0.8" },
            signal: AbortSignal.timeout(5_000),
            redirect: "follow",
        });
        if (!res.ok) return null;
        const html = (await res.text()).slice(0, 300_000);
        const m =
            html.match(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i) ||
            html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
        if (!m) return null;
        let url = m[1].trim();
        if (url.startsWith("//")) url = `https:${url}`;
        else if (url.startsWith("/")) url = new URL(url, base).toString();
        // Many sites set their LOGO as og:image. A logo stretched full-bleed
        // makes a poor hero, so reject obvious logo/icon URLs — the cover then
        // falls back to a clean dark background (better than a watermark logo).
        if (/\b(logo|favicon|icon|isotipo|brandmark)\b/i.test(url)) return null;
        return url;
    } catch {
        return null;
    }
}

/**
 * Look up a person/company on Wikipedia and return their page's lead image
 * (a clean, directly-fetchable Wikimedia Commons URL). Far more reliable for
 * headshots than generic web scraping, since LinkedIn/Crunchbase block direct
 * fetches. Tries Spanish then English Wikipedia.
 */
async function wikipediaImage(lang: string, query: string): Promise<string | null> {
    const url =
        `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
        `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1` +
        `&prop=pageimages&piprop=original&pilicense=any`;
    try {
        const res = await fetch(url, {
            headers: { "user-agent": UA, accept: "application/json" },
            signal: AbortSignal.timeout(4_000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
            query?: { pages?: Record<string, { original?: { source?: string } }> };
        };
        const pages = data.query?.pages;
        if (!pages) return null;
        const first = Object.values(pages)[0];
        return first?.original?.source ?? null;
    } catch {
        return null;
    }
}

export async function fetchWikipediaImage(query: string): Promise<string | null> {
    for (const lang of ["es", "en"]) {
        const url = await wikipediaImage(lang, query);
        if (url) return url;
    }
    return null;
}

/** Fetch a company homepage and extract its apple-touch-icon (a decent logo). */
export async function fetchAppleTouchIcon(domain: string): Promise<string | null> {
    const base = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    try {
        const res = await fetch(base, {
            headers: { "user-agent": UA, accept: "text/html,*/*;q=0.8" },
            signal: AbortSignal.timeout(5_000),
            redirect: "follow",
        });
        if (!res.ok) return null;
        const html = (await res.text()).slice(0, 300_000);
        const m =
            html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
            html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i);
        if (!m) return null;
        let url = m[1].trim();
        if (url.startsWith("//")) url = `https:${url}`;
        else if (url.startsWith("/")) url = new URL(url, base).toString();
        return url;
    } catch {
        return null;
    }
}

/**
 * Resolve a usable hero image: validated candidate → company og:image →
 * undefined (clean dark cover).
 */
export async function resolveHeroImage(
    candidate: string | undefined,
    domain: string | undefined,
): Promise<string | undefined> {
    if (candidate && (await isReachableImage(candidate))) return candidate;
    if (domain) {
        const og = await fetchOgImage(domain);
        if (og && (await isReachableImage(og))) return og;
    }
    return undefined;
}
