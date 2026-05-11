/**
 * Monet — Proposal patterns.
 *
 * Codifies the structural patterns Juan Diego uses for 30X partnership
 * proposals, extracted from 4 reference PDFs in /Propuestas Comerciales.
 *
 * The insight: ~80% of each proposal is templated. Only the cover
 * positioning phrase and the partnership table pillars vary by client.
 * Everything else (network stats, Andrés bio, audience demographics,
 * closing lockup) is stable across proposals.
 *
 * Two pattern families:
 *   - "andres-partnership" — 7 slides, corporate B2B alliance pattern
 *     (Aeroméxico, Avianca, Mastercard). Andrés as the face.
 *   - "multipliers-hnw" — 5 slides, HNW patrimonial audience pattern
 *     (Seguros Bolívar Multipliers). Focus on patrimonial audience
 *     access, not partnership corporativo.
 */

export type ProposalPattern = "andres-partnership" | "multipliers-hnw";

export interface PatternStableBlocks {
    /** Body paragraphs under the cover headline. Identical across pattern
     *  instances — Juan Diego's own template copy that he wants reused. */
    coverBody: string[];
    /** Network credibility stats. Stable across all 30X proposals. */
    networkStats: { value: string; label: string }[];
    /** 30X reach stats. Stable. */
    reachStats: { value: string; label: string }[];
    /** Country footprint string for the positioning slide. */
    countryFootprint: string;
    /** 30X positioning paragraph. Stable. */
    positioningParagraph: string;
}

export interface PatternBlueprint {
    pattern: ProposalPattern;
    label: string;
    description: string;
    /** Sequence of slide types in this pattern (in render order). */
    slideTypes: string[];
    /** Stable copy blocks that get injected verbatim into the deck. */
    blocks: PatternStableBlocks;
}

// ─── Stable blocks (Juan Diego's own template copy) ──────────────────

const ANDRES_PARTNERSHIP_BODY = [
    "Buscamos una alianza estratégica de largo aliento que contribuya al posicionamiento de {CLIENT} en los distintos países donde opera 30X.",
    "En el marco de la alianza queremos trabajar juntos rápidamente con proyectos pequeños que construyan confianza, hasta el punto donde 30X sea el aliado preferido global de {CLIENT} para llegar a sus clientes de mayor valor.",
];

const MULTIPLIERS_HNW_BODY = [
    "Esta propuesta abre acceso curado a la audiencia de mayor capacidad patrimonial de la red ejecutiva más grande de Latinoamérica, con un modelo de alianza diseñado para crecer en confianza desde el primer trimestre.",
    "Proponemos arrancar con un proyecto pequeño que construya confianza en el primer trimestre, y escalar a una alianza global donde 30X sea el canal preferente de {CLIENT} para llegar a sus clientes de mayor patrimonio en la región.",
];

const NETWORK_STATS: { value: string; label: string }[] = [
    { value: "5M USD", label: "Promedio de facturación de las empresas del Inmersivo" },
    { value: "25%", label: "Facturan más de 10M USD anuales" },
    { value: "80%", label: "Recuperan la inversión el día 1 del Inmersivo" },
    { value: "100%", label: "Líderes de empresa y altos ejecutivos tomadores de decisión" },
    { value: "6K USD", label: "USD de capacidad de inversión personal por programa ejecutivo" },
    { value: "70%", label: "Fundadores que facturan +2M USD/mes fuera del canal corporativo" },
];

const REACH_STATS: { value: string; label: string }[] = [
    { value: "4,800+", label: "líderes entrenados en Colombia y México" },
    { value: "3,000", label: "líderes capacitados este año" },
    { value: "1M+", label: "seguidores hoy — 3M proyectados 2026" },
];

const COUNTRY_FOOTPRINT = "MÉXICO · COLOMBIA · PERÚ · PRÓXIMAMENTE ESPAÑA Y ESTADOS UNIDOS";

const POSITIONING_PARAGRAPH =
    "30X es la red ejecutiva más grande de América Latina. Entrenamos a los líderes que mueven las empresas más relevantes de la región: fundadores, CEOs y operadores que necesitan crecer más rápido de lo que el mercado les exige.";

// ─── Blueprints ──────────────────────────────────────────────────────

export const PATTERNS: Record<ProposalPattern, PatternBlueprint> = {
    "andres-partnership": {
        pattern: "andres-partnership",
        label: "Andrés-partnership (7 slides)",
        description:
            "Corporate B2B alliance proposal where the client becomes a preferred partner of 30X. Andrés Bilbao is the face. Pillars cover partnership corporativo, brand co-presence, HVU access, corporate sales, and in-kind exchange.",
        slideTypes: [
            "corporate-cover", // 1: recognition headline + 2 body paragraphs
            "doc-comparison-table", // 2: 4-col partnership table — 5 pillars
            "impact", // 3: 6 network credibility stats (stats-row variant)
            "impact", // 4: 30X reach (hero-number variant) with country footprint
            "doc-mentor-spotlight", // 5: Andrés Bilbao bio
            "doc-stats-hero", // 6: audience demographics
            "cover-globe", // 7: closing 30X | partner lockup
        ],
        blocks: {
            coverBody: ANDRES_PARTNERSHIP_BODY,
            networkStats: NETWORK_STATS,
            reachStats: REACH_STATS,
            countryFootprint: COUNTRY_FOOTPRINT,
            positioningParagraph: POSITIONING_PARAGRAPH,
        },
    },
    "multipliers-hnw": {
        pattern: "multipliers-hnw",
        label: "Multipliers HNW (5 slides)",
        description:
            "Audience-as-product proposal where the client gets curated access to 30X's HNW Multipliers community. Focus on patrimonial profiles, not corporate partnership. 3 carriles instead of 5 pillars.",
        slideTypes: [
            "corporate-cover", // 1: recognition headline + body
            "impact", // 2: HNW audience stats (500-600 nuevos miembros, USD 24K, 100% C-level, etc.)
            "doc-mentor-wall", // 3: 12-profile audience grid
            "doc-comparison-table", // 4: 3-carril table (cliente HNW preferente, co-branding, equipo 30X)
            "cover-globe", // 5: closing lockup
        ],
        blocks: {
            coverBody: MULTIPLIERS_HNW_BODY,
            networkStats: NETWORK_STATS,
            reachStats: REACH_STATS,
            countryFootprint: COUNTRY_FOOTPRINT,
            positioningParagraph: POSITIONING_PARAGRAPH,
        },
    },
};

/** Helper: inject the client name into all {CLIENT} placeholders. */
export function fillTemplate(template: string, clientName: string): string {
    return template.replace(/\{CLIENT\}/g, clientName);
}

/**
 * Industry → table-pillar templating. The partnership table varies its
 * "30X aporta / Client aporta" rows by industry. These templates seed
 * the LLM with industry-aware patterns (status tier names, contract
 * structures, success fees).
 *
 * For unknown industries the LLM falls back to a generic structure.
 */
export interface IndustryHint {
    industry: string;
    /** Status tier name 30X members receive (e.g. "Titanium", "Diamond", "Black"). */
    statusTier?: string;
    /** Typical in-kind exchange. */
    inKindExchange?: string;
    /** Typical success fee structure. */
    successFee?: string;
    /** Recommended pillar count. */
    pillarCount?: number;
}

export const INDUSTRY_HINTS: Record<string, IndustryHint> = {
    airline: {
        industry: "airline",
        statusTier: "top-tier frequent flyer (Titanium / Diamond / Premier)",
        inKindExchange: "USD 80K-100K annual travel credit for the 30X team",
        successFee: "5-10% of first-year contract value per corporate account closed by 30X intro",
        pillarCount: 5,
    },
    payments: {
        industry: "payments",
        statusTier: "top-tier card (e.g. Black) for 10 key 30X employees",
        inKindExchange: "exclusive payment-network access in the 30X ecosystem",
        successFee: "5-10% of first-year revenue per new corporate account",
        pillarCount: 5,
    },
    insurance: {
        industry: "insurance",
        statusTier: "preferred insurer for the 30X member community",
        inKindExchange: "corporate coverage + premium health for 30X team",
        successFee: "5-10% of first-year premium per HNW client closed via 30X",
        pillarCount: 3,
    },
    hospitality: {
        industry: "hospitality",
        statusTier: "elite status for 30X team",
        inKindExchange: "discounted stays / event venues for 30X programs",
        successFee: "5-10% of first-year corporate spend",
        pillarCount: 5,
    },
    generic: {
        industry: "generic",
        statusTier: "preferred-vendor access for the 30X team",
        inKindExchange: "in-kind product or service exchange",
        successFee: "5-10% of first-year contract value",
        pillarCount: 5,
    },
};

/** Returns the closest known industry hint. Falls back to generic. */
export function pickIndustryHint(industryGuess: string): IndustryHint {
    const k = industryGuess.toLowerCase().trim();
    if (INDUSTRY_HINTS[k]) return INDUSTRY_HINTS[k];
    // Substring match.
    for (const key of Object.keys(INDUSTRY_HINTS)) {
        if (k.includes(key)) return INDUSTRY_HINTS[key];
    }
    return INDUSTRY_HINTS.generic;
}
