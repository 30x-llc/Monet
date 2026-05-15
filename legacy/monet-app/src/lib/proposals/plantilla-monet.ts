/**
 * Plantilla Monet — Canva design descriptor.
 *
 * Maps every variable text field and image placeholder in the canonical
 * Aeroméxico-derived proposal template to a stable variable name so the
 * runtime engine can fill it for any client without touching Canva by
 * hand.
 *
 * Source template (Andrés Bilbao's original):
 *   https://canva.link/44dyj1zasgqud4a  →  design id DAHJeGfEHOk
 *
 * The mapping was derived by introspecting the template via the Canva
 * MCP server. Element IDs are stable across duplicates of the same
 * source template (Canva copies element IDs verbatim during duplicate).
 *
 * Pages 3-7 are *constant* across all clients (network stats, Andrés
 * bio, audience demographics, closing lockup) — they're declared here
 * as `readonly` for documentation only; the engine never edits them.
 */

export const PLANTILLA_MONET_SOURCE_DESIGN_ID = "DAHJeGfEHOk";

/**
 * The two pages the engine actually writes to. Page indices are 1-based
 * to match Canva's API conventions.
 */
export const VARIABLE_PAGES = {
    cover: { pageIndex: 1, pageId: "PB7dhv6mFMhpfyjN" },
    partnershipTable: { pageIndex: 2, pageId: "PB0PRhbTws9BYMDf" },
    closingLockup: { pageIndex: 7, pageId: "PB66DprC6P2q92r0" },
} as const;

/**
 * Text element IDs on page 1 (cover). Three variables: headline + two
 * body paragraphs.
 */
export const COVER_TEXT_ELEMENTS = {
    headline: "PB7dhv6mFMhpfyjN-LBS00N6fSPXs5xQf",
    body1: "PB7dhv6mFMhpfyjN-LBCRl8PRgVmBGSrW",
    body2: "PB7dhv6mFMhpfyjN-LBBFcx5kkbcwdBRC",
} as const;

/**
 * Hero background image on page 1 (always editable).
 */
export const COVER_HERO_IMAGE = "PB7dhv6mFMhpfyjN-LBH8h9Lc04lTZDxM";

/**
 * Partner logo placeholders. These are `editable: false` in the source
 * template — the engine deletes + re-inserts via Canva MCP to swap them.
 *
 * Both pages have a slot in the same visual position (top-left on
 * cover, closing lockup on final page).
 */
export const LOCKED_PARTNER_LOGOS = {
    cover: "PB7dhv6mFMhpfyjN-LB5TvJH90wnm0cVk-LBldYRKb3Hgs2svJ",
    closing: "PB66DprC6P2q92r0-LBKs2bfBtKHCfK0H",
} as const;

/**
 * Geometry to use when re-inserting a partner logo via insert_fill +
 * position_element + resize_element. Tuned to match the visual rhythm
 * of the Aeroméxico original.
 */
export const PARTNER_LOGO_GEOMETRY = {
    cover: { top: 95, left: 108, width: 78, height: 70 },
    closing: { top: 500, left: 945, width: 88, height: 80 },
} as const;

/**
 * Page 2 — five-pillar partnership table. Each pillar has four cells:
 * objective (title), description, what 30X contributes, what the
 * partner contributes.
 */
export type PillarSlot =
    | "alianza-corporativa"
    | "promo-portfolio-premium"
    | "experiencia-hvu"
    | "promo-clientes-corporativos"
    | "intercambio-especie";

export interface PillarElements {
    objective: string;
    description: string;
    thirtyXContributes: string;
    partnerContributes: string;
}

export const PARTNERSHIP_PILLARS: Record<PillarSlot, PillarElements> = {
    "alianza-corporativa": {
        objective: "PB0PRhbTws9BYMDf-LB4T45rkBBDt2QhJ",
        description: "PB0PRhbTws9BYMDf-LBrmLHv8rtXXnqnh",
        thirtyXContributes: "PB0PRhbTws9BYMDf-LBGTGFjBDw72ZcSV",
        partnerContributes: "PB0PRhbTws9BYMDf-LBGP9j93nps5c7Fn",
    },
    "promo-portfolio-premium": {
        objective: "PB0PRhbTws9BYMDf-LBLQtZRk87pzt8Xy",
        description: "PB0PRhbTws9BYMDf-LBXxd0cCvNJkPdfq",
        thirtyXContributes: "PB0PRhbTws9BYMDf-LBzmgx6q7RRZP9gk",
        partnerContributes: "PB0PRhbTws9BYMDf-LB8Q44khkdbZTK1H",
    },
    "experiencia-hvu": {
        objective: "PB0PRhbTws9BYMDf-LBhCwsZH6rQ94r0D",
        description: "PB0PRhbTws9BYMDf-LBmPfmjzgsNGGW8d",
        thirtyXContributes: "PB0PRhbTws9BYMDf-LBRNNrLnbtrPlymb",
        partnerContributes: "PB0PRhbTws9BYMDf-LBCj6VxkmjD30s6K",
    },
    "promo-clientes-corporativos": {
        objective: "PB0PRhbTws9BYMDf-LBLdb7RkzNNh25QP",
        description: "PB0PRhbTws9BYMDf-LBNkhcgFcTcGpQ5J",
        thirtyXContributes: "PB0PRhbTws9BYMDf-LBpltPSCBWBVJJZ3",
        partnerContributes: "PB0PRhbTws9BYMDf-LB3mM0v01b8PfkNk",
    },
    "intercambio-especie": {
        objective: "PB0PRhbTws9BYMDf-LBbQtbfBRStxT26H",
        description: "PB0PRhbTws9BYMDf-LB5yg93R0jbfMDhK",
        thirtyXContributes: "PB0PRhbTws9BYMDf-LBGprXsbRYGXx9ss",
        partnerContributes: "PB0PRhbTws9BYMDf-LBRh4qxBkYZ1n1GW",
    },
};

/**
 * Header label for the partner column on page 2 (e.g., "Aeroméxico
 * aporta", "Bavaria aporta"). The engine renames this when the partner
 * changes so the column header matches.
 */
export const PARTNER_APORTA_HEADER = "PB0PRhbTws9BYMDf-LBpzC9t9ZBF2b51n";

// ─── Runtime variable schema ────────────────────────────────────────

export interface PillarContent {
    objective: string;
    description: string;
    thirtyXContributes: string;
    partnerContributes: string;
}

/**
 * The fully-populated content for one client's proposal. The engine
 * generates this via Anthropic from intake + research, then converts
 * each entry into a Canva editing operation.
 */
export interface PlantillaMonetVariables {
    /** Top-level title for the duplicated Canva design. */
    designTitle: string;
    /** Cover slide content (page 1). */
    cover: {
        headline: string;
        body1: string;
        body2: string;
    };
    /** Five pillars (page 2). Order matches PARTNERSHIP_PILLARS keys. */
    pillars: Record<PillarSlot, PillarContent>;
    /** "X aporta" column header on page 2. */
    partnerColumnHeader: string;
    /** Partner brand assets — URLs to be uploaded to Canva. */
    assets: {
        /** Logo source URL (will be processed to white-on-transparent). */
        partnerLogoUrl: string;
        /** Hero background source URL (will be processed to duotone). */
        heroImageUrl: string;
    };
}

/**
 * Convert a fully-populated variables object into the list of editing
 * operations to send to `perform-editing-operations` on a duplicated
 * Canva design. Image swaps (logo + hero) are intentionally NOT
 * included here — those need uploaded asset IDs and are handled as a
 * second pass after asset upload completes.
 */
export function variablesToTextOperations(
    vars: PlantillaMonetVariables,
): Array<{ type: "replace_text"; element_id: string; text: string } | { type: "update_title"; title: string }> {
    const ops: Array<
        { type: "replace_text"; element_id: string; text: string } | { type: "update_title"; title: string }
    > = [
        { type: "update_title", title: vars.designTitle },
        { type: "replace_text", element_id: COVER_TEXT_ELEMENTS.headline, text: vars.cover.headline },
        { type: "replace_text", element_id: COVER_TEXT_ELEMENTS.body1, text: vars.cover.body1 },
        { type: "replace_text", element_id: COVER_TEXT_ELEMENTS.body2, text: vars.cover.body2 },
        { type: "replace_text", element_id: PARTNER_APORTA_HEADER, text: vars.partnerColumnHeader },
    ];

    for (const slot of Object.keys(PARTNERSHIP_PILLARS) as PillarSlot[]) {
        const elements = PARTNERSHIP_PILLARS[slot];
        const content = vars.pillars[slot];
        if (!content) continue;
        ops.push({ type: "replace_text", element_id: elements.objective, text: content.objective });
        ops.push({ type: "replace_text", element_id: elements.description, text: content.description });
        ops.push({
            type: "replace_text",
            element_id: elements.thirtyXContributes,
            text: content.thirtyXContributes,
        });
        ops.push({
            type: "replace_text",
            element_id: elements.partnerContributes,
            text: content.partnerContributes,
        });
    }

    return ops;
}
