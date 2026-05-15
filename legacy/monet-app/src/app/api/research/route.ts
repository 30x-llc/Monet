import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/prompts/research";
import type { ResearchResult } from "@/lib/slide-types";
import { enrichCompany } from "@/lib/company-enrichment";
import { isExaConfigured } from "@/lib/research/exa";
import { runDeepResearch } from "@/lib/research/deep-research";
import { findLocalPartnerLogo } from "@/lib/research/local-logos";
import { exaLogoSearch } from "@/lib/research/exa-logo-search";

// Opus 4.7 + web_search can take 30-120s; Pro plan allows up to 300s.
export const maxDuration = 300;

// Forcing the model to emit via a tool call with an input_schema is the only
// reliable way to get clean JSON out of a free-form generation — the previous
// "dump text, parse with regex" approach kept breaking on unescaped quotes
// inside string values and leftover <cite> fragments from web_search.
const RESEARCH_TOOL: Anthropic.Messages.Tool = {
    name: "save_research",
    description:
        "Guarda el research de la empresa como datos estructurados. Llama esta herramienta UNA sola vez cuando tengas la investigación completa, incluyendo URLs del logo y de la imagen hero.",
    input_schema: {
        type: "object",
        properties: {
            companyName: { type: "string", description: "Nombre oficial" },
            industry: { type: "string", description: "Industria / sector" },
            size: {
                type: "string",
                description: "Tamaño aproximado (empleados, ingresos)",
            },
            headquarters: { type: "string", description: "Ciudad, país" },
            leadership: {
                type: "array",
                items: { type: "string" },
                description: "Liderazgo visible: cada item 'Nombre - Cargo'",
            },
            painPoints: {
                type: "array",
                items: { type: "string" },
                description: "Desafíos estratégicos o pain points públicos",
            },
            recentNews: {
                type: "array",
                items: { type: "string" },
                description: "Noticias relevantes últimos 6 meses",
            },
            relevantContext: {
                type: "string",
                description:
                    "Párrafo con contexto relevante para la propuesta de 30x",
            },
            positioning: {
                type: "string",
                description:
                    "Una frase flattering que resume por qué es la #1/más premium/líder en su categoría. Ej: 'la aerolínea predilecta de clientes premium en Latinoamérica'.",
            },
            logoUrl: {
                type: "string",
                description:
                    "URL directa al logo oficial (PNG/SVG preferido). Wikipedia, sitio oficial, brandfetch.",
            },
            heroImageUrl: {
                type: "string",
                description:
                    "URL directa a una fotografía que represente el mundo de la empresa (un avión para Aeroméxico, un gimnasio para Action Black).",
            },
        },
        required: [
            "companyName",
            "industry",
            "size",
            "headquarters",
            "leadership",
            "painPoints",
            "recentNews",
            "relevantContext",
        ],
    },
};

const WEB_SEARCH_TOOL = {
    type: "web_search_20250305" as const,
    name: "web_search",
    max_uses: 8,
} as unknown as Anthropic.Messages.Tool;

async function runResearch(
    client: Anthropic,
    userMessage: string,
    useWebSearch: boolean,
): Promise<ResearchResult> {
    const tools = useWebSearch
        ? [WEB_SEARCH_TOOL, RESEARCH_TOOL]
        : [RESEARCH_TOOL];

    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: RESEARCH_SYSTEM_PROMPT,
        tools,
        tool_choice: useWebSearch
            ? { type: "auto" }
            : { type: "tool", name: "save_research" },
        messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find(
        (c) => c.type === "tool_use" && c.name === "save_research",
    ) as Anthropic.Messages.ToolUseBlock | undefined;

    if (!toolUse) {
        const textDump = response.content
            .filter((c) => c.type === "text")
            .map((c) => (c as { type: "text"; text: string }).text)
            .join("\n")
            .slice(0, 500);
        throw new Error(
            `El modelo no llamó save_research. Texto devuelto: ${textDump || "(vacío)"}`,
        );
    }

    return toolUse.input as unknown as ResearchResult;
}

// Hosts known to break in the browser via hotlink protection. If
// Claude picks one of these for logoUrl, we override with Clearbit so
// the slide doesn't render a broken icon.
const LOGO_BLACKLIST_HOSTS = new Set([
    "media.licdn.com",
    "imgv2-1-f.scribdassets.com",
    "imgv2-2-f.scribdassets.com",
    "s.yimg.com",
    "pbs.twimg.com",
]);

// Filename hints that mean "this is a logo, not a photo" — used to
// reject hero candidates that are accidentally logos.
const LOGO_FILENAME_HINTS = [
    "logo",
    "logotipo",
    "wordmark",
    "favicon",
    "icon",
    "brand",
];

// Hosts known to host award/event/industry-association photos that
// almost always have third-party branding plastered behind the subject
// (e.g., apex.aero photos of an Aeroméxico CEO at an APEX awards
// ceremony come back with "APEX+" repeated across the wall). We block
// these from hero usage — same image MAY appear elsewhere clean.
const HERO_BLACKLIST_HOSTS = new Set([
    "apex.aero",
    "amcham.com",
    "amcham.org",
    "scribd.com",
    "imgv2-1-f.scribdassets.com",
    "imgv2-2-f.scribdassets.com",
    "media.licdn.com",
    "pbs.twimg.com",
    "s.yimg.com",
    "i.ytimg.com",
]);

// Substring hints in URL pathname that strongly correlate with
// award/event content. Rejected as hero — these are usually CEO
// posing with a trophy in front of an organizer's logo wall.
const HERO_PATH_HINTS = [
    "/award",
    "/awards",
    "/premio",
    "/premios",
    "/ceremony",
    "/event",
    "/conference",
    "/winners",
    "/recibe",
    "/recibió",
    "/recognized",
];

function isBlacklistedLogo(url: string): boolean {
    try {
        const u = new URL(url);
        return LOGO_BLACKLIST_HOSTS.has(u.hostname);
    } catch {
        return false;
    }
}

function looksLikeLogoFilename(url: string): boolean {
    try {
        const path = new URL(url).pathname.toLowerCase();
        if (path.endsWith(".svg")) return true;
        return LOGO_FILENAME_HINTS.some((hint) => path.includes(hint));
    } catch {
        return false;
    }
}

/**
 * Reject heroes that are likely shot at award ceremonies / industry
 * events / partner press (e.g., apex.aero photos of an Aeroméxico CEO
 * with "APEX+" plastered across the wall behind). The image is real
 * but unusable as a brand cover because the visible branding is the
 * organizer, not the partner.
 */
function looksLikeAwardOrEventPhoto(url: string): boolean {
    try {
        const u = new URL(url);
        if (HERO_BLACKLIST_HOSTS.has(u.hostname)) return true;
        const path = u.pathname.toLowerCase();
        return HERO_PATH_HINTS.some((hint) => path.includes(hint));
    } catch {
        return false;
    }
}

/**
 * Make sure research has usable logo / hero URLs even when Claude
 * picked badly. Resolution chain for the partner logo:
 *   1. Curated /assets/logos/30x-members folder (Juan Diego's master
 *      set of white + dark variants for the most common 30x partners).
 *   2. Whatever Claude / Exa already returned, if it's not on a
 *      hotlink-protected host.
 *   3. Exa Google-Images-style search targeting "<company> logo png".
 *   4. Clearbit fallback against the guessed domain.
 *
 * Hero photos: drop anything that's actually a logo (svg / "logo" in
 * filename) so the renderer falls back to the 30x portada instead of
 * showing a tiny logo stretched as a hero.
 */
async function applyEnrichmentFallback(r: ResearchResult): Promise<ResearchResult> {
    const enrichment = enrichCompany(r.companyName, r.industry);

    // 1. Curated local fallback wins. Returns null if not in folder.
    //    Theme isn't known here yet — pick the white variant since the
    //    deck closing slide always renders on a dark hero. The renderer
    //    flips it via CSS filter for light covers anyway.
    let logoUrl: string | undefined =
        findLocalPartnerLogo(r.companyName, "dark") ?? undefined;

    // 2. Use Claude/Exa pick if it's clean.
    if (!logoUrl) {
        if (
            r.logoUrl &&
            r.logoUrl.startsWith("http") &&
            !isBlacklistedLogo(r.logoUrl)
        ) {
            logoUrl = r.logoUrl;
        }
    }

    // 3. Exa Google-Image-style search for unknown clients.
    if (!logoUrl && isExaConfigured()) {
        try {
            const exaPick = await exaLogoSearch(r.companyName);
            if (exaPick) logoUrl = exaPick;
        } catch (err) {
            console.warn("[research] exaLogoSearch failed:", err);
        }
    }

    // 4. Clearbit on the guessed domain as last resort.
    if (!logoUrl) logoUrl = enrichment.logoUrl;

    let heroImageUrl: string | undefined = r.heroImageUrl;
    const isBadHero = (u: string | undefined): boolean =>
        !u ||
        !u.startsWith("http") ||
        looksLikeLogoFilename(u) ||
        looksLikeAwardOrEventPhoto(u) ||
        isBlacklistedLogo(u);

    if (isBadHero(heroImageUrl)) {
        const candidates = (r.heroCandidates ?? []).filter(
            (u) => !isBadHero(u),
        );
        heroImageUrl = candidates[0];
    }

    return { ...r, logoUrl, heroImageUrl };
}

export async function POST(request: NextRequest) {
    try {
        const { companyName, notes } = await request.json();

        if (!companyName) {
            return Response.json(
                { ok: false, error: "Nombre de empresa requerido" },
                { status: 400 },
            );
        }

        // Deep research path — Exa + Claude synthesis. Preferred when
        // EXA_API_KEY is configured. Falls back to the Claude web_search
        // path if Exa fails mid-flight (rate limit, timeout, no results).
        if (isExaConfigured()) {
            try {
                const deep = await runDeepResearch(companyName, notes);
                const enriched = await applyEnrichmentFallback(deep);
                return Response.json({
                    ok: true,
                    research: enriched,
                    researchMode: "exa-deep",
                    sourceCount: deep.sourceCount,
                    sourceUrls: deep.sourceUrls,
                });
            } catch (err) {
                console.warn(
                    "[research] Exa deep research failed, falling back to Claude web_search:",
                    err,
                );
                // fall through to Claude path
            }
        }

        const client = new Anthropic();
        const userMessage = notes
            ? `Investiga la empresa "${companyName}" para preparar una presentación comercial de 30x. Usa web_search para información Y para encontrar un logoUrl directo (PNG/SVG) y un heroImageUrl (foto representativa del mundo de la empresa). Luego llama save_research con todos los datos.\n\nNotas del vendedor:\n${notes}`
            : `Investiga la empresa "${companyName}" para preparar una presentación comercial de 30x. Usa web_search para información Y para encontrar un logoUrl directo (PNG/SVG) y un heroImageUrl (foto representativa del mundo de la empresa). Luego llama save_research con todos los datos.`;

        let research: ResearchResult;
        try {
            research = await runResearch(client, userMessage, true);
        } catch (err) {
            const errStr = String(err);
            if (errStr.includes("overloaded") || errStr.includes("529")) {
                research = await runResearch(client, userMessage, false);
            } else {
                throw err;
            }
        }

        research = await applyEnrichmentFallback(research);
        return Response.json({
            ok: true,
            research,
            researchMode: "claude-web-search",
        });
    } catch (error) {
        console.error("[research]", error);
        return Response.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
