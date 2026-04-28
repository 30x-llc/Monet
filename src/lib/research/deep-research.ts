/**
 * Deep research orchestrator — Exa + Claude synthesis.
 *
 * Strategy:
 *   1. Fire 6 parallel Exa queries that cover the angles a senior BD
 *      researcher would hit — annual reports, CEO interviews, recent
 *      news, strategic initiatives, leadership, AI/tech posture.
 *   2. Aggregate the full-text content into one corpus.
 *   3. Hand the corpus to Claude Opus with a synthesis prompt that
 *      speaks 30x's language and asks for the structured ResearchResult
 *      shape the deck generator already consumes.
 *
 * Why not just use Claude's web_search?
 *   - It returns 5 shallow snippets, Exa returns 20+ full-text pages.
 *   - Exa's semantic search finds the earnings call and the CEO's
 *     interview on a niche podcast; web_search finds the Wikipedia
 *     summary.
 *   - With Exa we can scope by category ("financial report", "news")
 *     and by date — critical for "last 6 months" style intel.
 *
 * Why keep Claude for synthesis?
 *   - Exa has an outputSchema mode, but its synthesis voice is
 *     generic. Claude through the 30x brand prompt produces the
 *     sycophantic "empresa predilecta en LATAM" positioning phrase
 *     that we actually want on the cover slide.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
    parallelExaSearch,
    type ExaResult,
    type ExaSearchRequest,
} from "./exa";
import type { ResearchResult } from "@/lib/slide-types";

const SYNTH_SYSTEM_PROMPT = `Eres el researcher de BD más afilado de 30x — la red ejecutiva más grande de Latinoamérica. Recibes un corpus de páginas web (artículos, reportes anuales, entrevistas al CEO, noticias recientes) de una empresa objetivo y lo sintetizas en un brief accionable para una propuesta comercial.

TU JOB:
1. Extraer ÚNICAMENTE información verificable del corpus. No inventes cifras, nombres, o hechos.
2. Identificar el ángulo flattering perfecto — ¿qué hace a esta empresa la #1, la más premium, la más reconocida en su categoría? Esto alimenta la portada de la propuesta.
3. Identificar dolores REALES que aparezcan públicamente en el corpus — no los genéricos. Si un CEO dijo "tenemos presión de márgenes por costos de combustible", eso va. Si no se menciona, no lo inventes.
4. Pescar 3-5 noticias recientes con fecha, priorizando las últimas 6 meses.
5. Nombres de liderazgo con cargo exacto, ojalá decision makers (CEO, COO, CHRO, CRO, CTO, VP de talento).
6. Un párrafo "relevantContext" que cierre el "por qué ahora" para un programa de 30x.
7. **clientLanguage** — el lenguaje que la EMPRESA usa sobre sí misma. Frases verbatim que aparecen en su web, slogans, mottos, taglines, autodescripciones del CEO. Ejemplos:
   • Aeroméxico → "premium", "puntualidad", "experiencia única", "conectamos a México con el mundo"
   • Action Black → "We're not a fucking gym", "high-performance training"
   • Bancolombia → "El banco para construir país"
   Estas frases las usaremos LITERALMENTE en el copy del deck para que se sienta hecho por ellos, no por nosotros. Captura 4-8 frases.

REGLAS:
- Español primero.
- Sé preciso. Nunca inventes. Si falta un dato, dilo.
- Foco en información que venda un programa de desarrollo ejecutivo en IA / liderazgo / ventas.
- Llama save_research UNA vez con el resultado estructurado.

IMÁGENES (CRÍTICO — la calidad de la portada depende 100% de esto):
Cada item del corpus trae una línea \`Image: https://...\`. Esos URLs son las imágenes representativas de cada página.

**logoUrl** — el logo oficial de la empresa. Reglas en orden de preferencia:
1. SVG en el dominio oficial de la empresa (\`<empresa>.com/...logo...svg\`, o investor relations \`ir.<empresa>.com\`, o newsroom \`newsroom.<empresa>.com\`).
2. PNG/SVG en upload.wikimedia.org/wikipedia/commons/.../<Logo>.svg|.png
3. PNG/SVG en cdn brandfetch.com / 1000marcas.net / seeklogo.com
4. Como último recurso, una imagen oficial del sitio de la empresa.

**BLACKLIST para logoUrl** (NUNCA uses estos hosts — rompen con hotlink protection):
- media.licdn.com (LinkedIn)
- scribdassets.com / imgv2-*.scribdassets.com
- yimg.com (Yahoo cache)
- pbs.twimg.com (Twitter media)
- Cualquier URL que contenga "company-logo_200_200" (LinkedIn signature)

**heroImageUrl** — UNA FOTOGRAFÍA CINEMATOGRÁFICA DEL MUNDO REAL DE LA EMPRESA. Avión de la aerolínea en pista (con la marca de la empresa visible o sin marca), fachada del banco, gente entrenando en el gimnasio de la marca, productos de la empresa en uso. La foto debe sentirse como un asset de marketing de la EMPRESA, no como una foto periodística desde un evento de tercero.

REGLAS DURAS DE EXCLUSIÓN para heroImageUrl (rechaza la imagen si):
- El filename contiene: "logo", "logotipo", "icon", "favicon", "wordmark", "brand", "share", "thumbnail", "default"
- La URL termina en .svg (los logos son SVG; las fotos no)
- El host es CDN de logo (clearbit.com, brandfetch.com, seeklogo.com)
- **La página de origen es de un AWARD, EVENTO o INDUSTRY ASSOCIATION** donde la foto probablemente tiene branding del tercero (APEX awards, AmCham, Conference XYZ, Premio ABC, etc). Ejemplos a rechazar: apex.aero, premiosABC.com, wgsn.com event photos, glassdoor reviews, brandwatch.com.
- **La página de origen es de PRESS RELEASE de un proveedor o partner de la empresa** (ej: IBM newsroom hablando de "su cliente Aeroméxico" — esa foto va a tener branding de IBM, no de Aeroméxico). Rechaza si el host es de un proveedor distinto al cliente.
- La página title o context menciona "ganó", "received award", "wins", "ceremony", "evento", "conference" — esas fotos casi siempre tienen branding del organizador del evento.

PREFERIR (orden):
1. Fotos del SITIO OFICIAL de la empresa (\`<empresa>.com/.../jpg\`) — assets de marketing oficiales sin branding de terceros
2. Wikipedia commons (\`upload.wikimedia.org\`) — fotos editoriales generalmente limpias
3. Prensa NACIONAL del país de la empresa hablando de OPERACIONES de la empresa, no de premios (eltiempo.com, mexicobusiness.news, valoraanalitik.com cubriendo a Davivienda, etc) — pero verificá que la imagen NO sea del CEO posando con el premio
4. Stock representativo del giro (avión genérico, banco genérico) — última opción, sólo si no hay nada mejor

Si dudás entre dos imágenes, escogé la que MEJOR represente el TRABAJO REAL de la empresa (un avión volando, una sucursal abierta, un producto en uso) sobre la que muestre al CEO posando o un logo grande.

Si encuentras un mejor logoUrl directo en el TEXTO del corpus (ej: "logo oficial: https://upload.wikimedia.org/.../Logo.svg"), úsalo en lugar del Image: URL.`;

const RESEARCH_TOOL: Anthropic.Messages.Tool = {
    name: "save_research",
    description:
        "Guarda el research estructurado. Llama una sola vez con todos los datos.",
    input_schema: {
        type: "object",
        properties: {
            companyName: { type: "string" },
            industry: { type: "string" },
            size: { type: "string" },
            headquarters: { type: "string" },
            leadership: { type: "array", items: { type: "string" } },
            painPoints: { type: "array", items: { type: "string" } },
            recentNews: { type: "array", items: { type: "string" } },
            relevantContext: { type: "string" },
            positioning: { type: "string" },
            clientLanguage: {
                type: "array",
                items: { type: "string" },
                description:
                    "Frases verbatim que la empresa usa para describirse a sí misma. Ej: ['premium', 'puntualidad', 'conectamos a México con el mundo']",
            },
            logoUrl: { type: "string" },
            heroImageUrl: { type: "string" },
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

/**
 * Build the 6 strategic queries we hit in parallel. Each targets a
 * distinct angle; together they cover everything a 30x salesperson
 * needs to walk into a meeting informed.
 *
 * Query types are tuned per angle:
 *  - `auto` (balanced, ~1s): lookups where we just need the top page
 *    (identity, leadership, recent_news).
 *  - `deep` (4-15s, multi-step reasoning + synthesis): angles that
 *    benefit from cross-source analysis (financials, pain points,
 *    tech posture).
 *
 * Using `deep` everywhere would 3x the latency for little gain on
 * lookups; using `auto` everywhere would miss the multi-step synthesis
 * that makes the pain-points and AI-posture angles actually useful.
 */
function buildQueries(
    companyName: string,
    notes?: string,
): Array<{ label: string; request: ExaSearchRequest }> {
    const baseContents = {
        text: { maxCharacters: 3000, verbosity: "compact" as const },
    };

    return [
        {
            label: "identity",
            request: {
                query: `${companyName} company overview strategy mission about`,
                type: "auto",
                category: "company",
                numResults: 3,
                contents: baseContents,
            },
        },
        {
            label: "brand_voice",
            request: {
                // Surface the COMPANY'S OWN LANGUAGE — slogans, taglines,
                // values pages, founder interviews where they describe
                // themselves. This is what makes the cover headline
                // sound like the client wrote it ("premium" for Aero,
                // "We're not a fucking gym" for Action Black).
                query: `${companyName} slogan tagline brand values "we are" "we're" mission statement`,
                type: "auto",
                numResults: 4,
                contents: baseContents,
            },
        },
        {
            label: "financials",
            request: {
                query: `${companyName} annual report earnings revenue latest year`,
                type: "deep",
                category: "financial report",
                numResults: 3,
                contents: baseContents,
            },
        },
        {
            label: "leadership",
            request: {
                query: `${companyName} CEO executive leadership team interview strategy`,
                type: "auto",
                numResults: 4,
                contents: baseContents,
            },
        },
        {
            label: "recent_news",
            request: {
                query: `${companyName} news announcement 2026`,
                type: "auto",
                category: "news",
                numResults: 5,
                // Last ~8 months of news
                startPublishedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240)
                    .toISOString()
                    .slice(0, 10),
                contents: baseContents,
            },
        },
        {
            label: "pain_points",
            request: {
                query: `${companyName} challenges digital transformation AI executive development${notes ? " " + notes : ""}`,
                type: "deep",
                numResults: 4,
                contents: baseContents,
            },
        },
        {
            label: "tech_posture",
            request: {
                query: `${companyName} AI artificial intelligence technology initiative investment`,
                type: "deep",
                numResults: 3,
                contents: baseContents,
            },
        },
    ];
}

/**
 * Render the Exa corpus as a single text block for Claude's synthesis
 * input. Each result gets: label, title, url, publishedDate, image, text.
 * Truncate total corpus to stay under Claude's context + cost sanity.
 *
 * The `Image:` line is critical — Exa returns one representative image
 * URL per page, and Wikipedia/official-site results expose the company
 * logo or hero photo through it. Claude picks the best as logoUrl /
 * heroImageUrl, and we surface the rest as candidates.
 */
function renderCorpus(
    results: Array<ExaResult & { queryLabel: string }>,
    maxTotalChars = 60_000,
): string {
    const parts: string[] = [];
    let used = 0;
    for (const r of results) {
        const imgLine = r.image ? `Image: ${r.image}\n` : "";
        const header = `\n\n--- [${r.queryLabel}] ${r.title}\nURL: ${r.url}\n${imgLine}Fecha: ${r.publishedDate ?? "s/f"}\n---\n`;
        const body = (r.text ?? r.summary ?? r.highlights?.join(" · ") ?? "").trim();
        const budget = maxTotalChars - used;
        if (budget <= 500) break;
        const take = body.slice(0, Math.min(body.length, budget - header.length));
        parts.push(header + take);
        used += header.length + take.length;
    }
    return parts.join("\n");
}

/**
 * Extract image candidate URLs from Exa results — one per result that
 * has an `image` field. These get surfaced to the salesperson in the
 * research review screen so they can swap if Claude picks a bad one.
 */
function extractImageCandidates(
    results: Array<ExaResult & { queryLabel: string }>,
): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of results) {
        if (r.image && !seen.has(r.image)) {
            seen.add(r.image);
            out.push(r.image);
        }
    }
    return out;
}

export interface DeepResearchResult extends ResearchResult {
    /** How many Exa pages were used in the synthesis — a confidence
     *  signal for the UI. */
    sourceCount: number;
    /** URLs of the pages Exa returned, so the user can audit the
     *  research if something looks off. */
    sourceUrls: string[];
}

export async function runDeepResearch(
    companyName: string,
    notes?: string,
): Promise<DeepResearchResult> {
    // 1. Fire all Exa queries in parallel — this is the expensive step.
    const queries = buildQueries(companyName, notes);
    const results = await parallelExaSearch(queries);

    if (results.length === 0) {
        throw new Error(
            "Exa no devolvió resultados — revisa la query o EXA_API_KEY.",
        );
    }

    const corpus = renderCorpus(results);

    // 2. Hand corpus to Claude for synthesis with 30x voice.
    const client = new Anthropic();
    const userMessage = `EMPRESA OBJETIVO: ${companyName}
${notes ? `\nNOTAS DEL VENDEDOR:\n${notes}\n` : ""}

CORPUS DE INVESTIGACIÓN (${results.length} páginas vía Exa):
${corpus}

Sintetiza el brief y llama save_research.`;

    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: SYNTH_SYSTEM_PROMPT,
        tools: [RESEARCH_TOOL],
        tool_choice: { type: "tool", name: "save_research" },
        messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find(
        (c) => c.type === "tool_use" && c.name === "save_research",
    ) as Anthropic.Messages.ToolUseBlock | undefined;

    if (!toolUse) {
        throw new Error("Claude no llamó save_research después del corpus Exa.");
    }

    const research = toolUse.input as unknown as ResearchResult;
    const imageCandidates = extractImageCandidates(results);
    return {
        ...research,
        // Surface ALL image candidates Claude saw — the salesperson can
        // override the picked logo/hero from the review screen if Claude
        // chose poorly. logoCandidates and heroCandidates are the same
        // pool for v1; ranking by suitability would be a v2 nicety.
        logoCandidates: imageCandidates,
        heroCandidates: imageCandidates,
        sourceCount: results.length,
        sourceUrls: results.map((r) => r.url),
    };
}
