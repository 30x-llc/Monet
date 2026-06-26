import "server-only";
import { createClaudeClient } from "@/lib/llm/vertex-client";
import {
    isReachableImage,
    fetchOgImage,
    fetchAppleTouchIcon,
    fetchWikipediaImage,
} from "@/lib/proposals/og-image";
import { googleFaviconUrl } from "@/lib/company-enrichment";

/**
 * Company imagery via Gemini + Google Search grounding.
 *
 * The user wants the proposal's LOGO and BANNER/hero scraped from the web
 * based on the company name. Gemini (with Google Search grounding, through our
 * Vertex shim) searches for the company's real logo and a representative
 * banner photo and returns direct image URLs. Because LLMs can return dead or
 * page (non-image) URLs, EVERY candidate is validated (must resolve to an
 * actual image) before use, with deterministic fallbacks:
 *
 *   logo   → Gemini-found → site apple-touch-icon → Google favicon (256px)
 *   banner → Gemini-found → site og:image (logos filtered out)
 *
 * Returns only URLs confirmed to be reachable images.
 */

const IMAGERY_TOOL = {
    name: "save_imagery",
    description:
        "Guarda las URLs de imagen reales encontradas para la empresa (logo + banner).",
    input_schema: {
        type: "object",
        properties: {
            logoUrl: {
                type: "string",
                description: "URL DIRECTA al archivo del logo oficial (.png/.svg/.jpg/.webp).",
            },
            bannerUrl: {
                type: "string",
                description:
                    "URL DIRECTA a una foto/banner representativa del mundo de la empresa (oficinas, producto, equipo) — NO el logo.",
            },
            logoCandidates: { type: "array", items: { type: "string" } },
            bannerCandidates: { type: "array", items: { type: "string" } },
        },
        required: [],
    },
};

const MENTOR_TOOL = {
    name: "save_mentor_photos",
    description: "Guarda una URL de foto (headshot) profesional real para cada persona.",
    input_schema: {
        type: "object",
        properties: {
            photos: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        photoUrl: { type: "string", description: "URL DIRECTA a la foto (.jpg/.png/.webp)" },
                        candidates: { type: "array", items: { type: "string" } },
                    },
                    required: ["name"],
                },
            },
        },
        required: ["photos"],
    },
};

const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search" };

// Watermarked stock-photo previews are unusable in a client-facing proposal
// (they're stamped "alamy"/"shutterstock"/etc). Reject these hosts and prefer
// clean sources (company site, Wikimedia, press, Unsplash/Pexels).
const WATERMARKED_STOCK =
    /(alamy\.|shutterstock\.|gettyimages\.|istockphoto\.|\bistock\b|dreamstime\.|123rf\.|depositphotos\.|stock\.adobe\.|agefotostock\.|fotosearch\.|picfair\.|canstockphoto\.|bigstockphoto\.)/i;

function isWatermarked(url: string): boolean {
    return WATERMARKED_STOCK.test(url);
}

/** The company's second-level label, e.g. "rappi.com" → "rappi". */
function domainLabel(domain?: string): string | null {
    if (!domain) return null;
    const d = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    const label = d.split(".")[0];
    return label && label.length >= 3 ? label.toLowerCase() : null;
}

/** Put images hosted on the company's own domain/CDN first — they're the most
 *  relevant and reliably clean (vs. random press/third-party photos). */
function rankByOwnDomain(
    urls: Array<string | null | undefined>,
    domain?: string,
): Array<string | null | undefined> {
    const label = domainLabel(domain);
    if (!label) return urls;
    const own: typeof urls = [];
    const rest: typeof urls = [];
    for (const u of urls) {
        if (u && u.toLowerCase().includes(label)) own.push(u);
        else rest.push(u);
    }
    return [...own, ...rest];
}

async function firstUsable(
    urls: Array<string | null | undefined>,
    opts: { rejectWatermark?: boolean } = {},
): Promise<string | undefined> {
    const candidates = urls.filter(
        (u): u is string => !!u && !(opts.rejectWatermark && isWatermarked(u)),
    );
    // Validate all candidates concurrently, then return the first that's a
    // real image in original priority order.
    const results = await Promise.all(
        candidates.map((u) =>
            isReachableImage(u)
                .then((ok) => (ok ? u : null))
                .catch(() => null),
        ),
    );
    return results.find((u): u is string => !!u) ?? undefined;
}

export interface ImageryResult {
    logoUrl?: string;
    bannerUrl?: string;
}

export async function resolveCompanyImagery(
    companyName: string,
    domain?: string,
): Promise<ImageryResult> {
    let found: {
        logoUrl?: string;
        bannerUrl?: string;
        logoCandidates?: string[];
        bannerCandidates?: string[];
    } = {};

    try {
        const client = createClaudeClient();
        const resp = await client.messages.create({
            // model is ignored by the Vertex/Gemini shim (uses VERTEX_GEMINI_MODEL)
            model: "gemini",
            max_tokens: 1024,
            system:
                "Encuentras imágenes públicas reales de empresas. Devuelve ÚNICAMENTE URLs que apunten directamente a un archivo de imagen (terminan en .png/.jpg/.jpeg/.svg/.webp o son un CDN de imágenes), nunca páginas web. El logo debe ser el logotipo oficial de la marca. El banner debe ser una fotografía representativa del mundo de la empresa (sede, producto, equipo, operación), NUNCA el logo. PROHIBIDO devolver imágenes con marca de agua de bancos de stock (Alamy, Shutterstock, Getty Images, iStock, Dreamstime, 123RF, Depositphotos, Adobe Stock). Prefiere: el sitio oficial de la empresa, Wikimedia Commons, salas de prensa/medios, Unsplash o Pexels.",
            tools: [WEB_SEARCH_TOOL, IMAGERY_TOOL] as never,
            tool_choice: { type: "auto" } as never,
            messages: [
                {
                    role: "user",
                    content: `Empresa: "${companyName}"${domain ? ` (sitio oficial: ${domain})` : ""}. Busca en internet su logo oficial y una imagen banner/hero representativa. Devuelve varias candidatas por si alguna no carga. Llama save_imagery con URLs directas de imagen.`,
                },
            ],
        });
        const toolUse = resp.content.find(
            (c) => (c as { type?: string }).type === "tool_use",
        ) as { input?: typeof found } | undefined;
        found = toolUse?.input ?? {};
    } catch (err) {
        console.error("[company-imagery] Gemini search failed", err);
    }

    const apple = domain ? await fetchAppleTouchIcon(domain) : null;
    const fav = domain ? googleFaviconUrl(domain, 256) : null;
    const og = domain ? await fetchOgImage(domain) : null;

    const logoUrl = await firstUsable(
        rankByOwnDomain(
            [found.logoUrl, ...(found.logoCandidates ?? []), apple, fav],
            domain,
        ),
        { rejectWatermark: true },
    );
    // Banner: prefer the company's own og:image and any candidate hosted on
    // the company domain (relevant + clean) over third-party press photos.
    const bannerUrl = await firstUsable(
        rankByOwnDomain(
            [og, found.bannerUrl, ...(found.bannerCandidates ?? [])],
            domain,
        ),
        { rejectWatermark: true },
    );

    return { logoUrl, bannerUrl };
}

/**
 * Scrape a real professional headshot for each mentor by name (one batched
 * Gemini + Google Search call). Returns a map of name → validated image URL;
 * names without a usable photo are omitted (caller keeps the initials avatar).
 */
export async function resolveMentorPhotos(
    people: Array<{ name: string; role?: string }>,
): Promise<Record<string, string>> {
    if (people.length === 0) return {};

    let photos: Array<{ name?: string; photoUrl?: string; candidates?: string[] }> = [];
    try {
        const client = createClaudeClient();
        const list = people
            .map((p) => `- ${p.name}${p.role ? ` (${p.role})` : ""}`)
            .join("\n");
        const resp = await client.messages.create({
            model: "gemini",
            max_tokens: 2048,
            system:
                "Encuentras fotos profesionales reales (headshots) de personas. Devuelve ÚNICAMENTE URLs que apunten directamente a un archivo de imagen, nunca páginas web. PROHIBIDO devolver imágenes con marca de agua de bancos de stock (Alamy, Shutterstock, Getty Images, iStock, Dreamstime, 123RF, Depositphotos). Prefiere fotos de prensa, Crunchbase, Wikipedia, LinkedIn público o el sitio oficial de su empresa.",
            tools: [WEB_SEARCH_TOOL, MENTOR_TOOL] as never,
            tool_choice: { type: "auto" } as never,
            messages: [
                {
                    role: "user",
                    content: `Busca una foto profesional de cada una de estas personas y llama save_mentor_photos con varias candidatas por persona:\n${list}`,
                },
            ],
        });
        const toolUse = resp.content.find(
            (c) => (c as { type?: string }).type === "tool_use",
        ) as { input?: { photos?: typeof photos } } | undefined;
        photos = toolUse?.input?.photos ?? [];
    } catch (err) {
        console.error("[company-imagery] mentor photos failed", err);
    }

    const norm = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[^\p{L} ]/gu, "")
            .replace(/\s+/g, " ")
            .trim();

    // Key results by the INPUT name (deck names may carry trailing periods or
    // accents that Gemini drops), matching Gemini's returned name fuzzily.
    // Resolve all mentors concurrently.
    const out: Record<string, string> = {};
    await Promise.all(
        people.map(async (person) => {
            const np = norm(person.name);
            const match = photos.find((ph) => {
                if (!ph.name) return false;
                const ng = norm(ph.name);
                return ng === np || ng.includes(np) || np.includes(ng);
            });
            // Wikipedia (clean Commons image) is tried first, then Gemini's
            // web-scraped candidates. Name only — extra terms hurt the search.
            const wiki = await fetchWikipediaImage(person.name.replace(/\.+$/, "").trim());
            const url = await firstUsable(
                [wiki, match?.photoUrl, ...(match?.candidates ?? [])],
                { rejectWatermark: true },
            );
            if (url) out[person.name] = url;
        }),
    );
    return out;
}
