/**
 * Exa.ai client — deep semantic search for company research.
 *
 * Exa is the "father of deep research" (Juan Diego's words). Where
 * Claude's web_search tool returns 5 shallow snippets, Exa can hit 20+
 * targeted pages with full text. For a sales deck we want the real
 * intel: annual reports, earnings calls, CEO interviews, pain points
 * the company has actually talked about publicly. That's Exa's zone.
 *
 * Cost shape per /search call: ~$0.005 search + ~$0.01 per page text.
 * 6 parallel searches × 5 results each = ~$0.33 per deep research. A
 * deck already costs ~$0.30 in Claude tokens — this doubles that to
 * ~$0.60, still cheap compared to the salesperson's hour saved.
 *
 * Docs: https://exa.ai/docs/reference/search
 */

import "server-only";

const EXA_API_BASE = "https://api.exa.ai";

export type ExaCategory =
    | "company"
    | "research paper"
    | "news"
    | "personal site"
    | "financial report"
    | "people";

export type ExaSearchType =
    | "neural"
    | "fast"
    | "auto"
    | "deep-lite"
    | "deep"
    | "deep-reasoning"
    | "instant";

export interface ExaSearchRequest {
    query: string;
    numResults?: number;
    type?: ExaSearchType;
    category?: ExaCategory;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string; // ISO 8601
    endPublishedDate?: string; // ISO 8601
    contents?: {
        text?:
            | boolean
            | {
                  maxCharacters?: number;
                  includeHtmlTags?: boolean;
                  verbosity?: "compact" | "balanced" | "detailed";
              };
        summary?: boolean | { query?: string };
        highlights?:
            | boolean
            | {
                  numSentences?: number;
                  highlightsPerUrl?: number;
                  query?: string;
              };
    };
}

export interface ExaResult {
    id: string;
    title: string;
    url: string;
    publishedDate?: string | null;
    author?: string | null;
    image?: string;
    favicon?: string;
    text?: string;
    highlights?: string[];
    summary?: string;
}

export interface ExaSearchResponse {
    requestId: string;
    results: ExaResult[];
    costDollars?: { total: number };
}

export function isExaConfigured(): boolean {
    return !!process.env.EXA_API_KEY;
}

export class ExaError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = "ExaError";
    }
}

export async function exaSearch(
    req: ExaSearchRequest,
): Promise<ExaSearchResponse> {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
        throw new ExaError(0, "EXA_API_KEY no está configurado.");
    }

    const res = await fetch(`${EXA_API_BASE}/search`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify(req),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ExaError(res.status, `Exa /search falló: ${res.status} ${body.slice(0, 200)}`);
    }

    return (await res.json()) as ExaSearchResponse;
}

/**
 * Run multiple Exa searches in parallel and return a flattened corpus.
 * De-dupes by URL so two queries that hit the same page don't double-
 * count. The label gets appended to each result so Claude can see
 * which query surfaced which content — that context helps synthesis.
 */
export async function parallelExaSearch(
    queries: Array<{ label: string; request: ExaSearchRequest }>,
): Promise<Array<ExaResult & { queryLabel: string }>> {
    const settled = await Promise.allSettled(
        queries.map(async ({ label, request }) => {
            const res = await exaSearch(request);
            return res.results.map((r) => ({ ...r, queryLabel: label }));
        }),
    );

    const seen = new Set<string>();
    const flat: Array<ExaResult & { queryLabel: string }> = [];
    for (const s of settled) {
        if (s.status !== "fulfilled") {
            console.warn("[exa] query failed:", s.reason);
            continue;
        }
        for (const r of s.value) {
            if (seen.has(r.url)) continue;
            seen.add(r.url);
            flat.push(r);
        }
    }
    return flat;
}
