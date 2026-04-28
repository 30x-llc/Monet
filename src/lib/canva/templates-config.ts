/**
 * Canva Brand Template registry — single source of truth for which
 * Canva template each 30x slide type maps to + which `data fields`
 * each template expects.
 *
 * Workflow when adding a new template:
 *   1. Juan Diego designs the template in Canva, marks each fillable
 *      element with a `data field name` matching one of the keys in
 *      this config's `fields` map for that slide type.
 *   2. He grabs the template ID from the Canva URL
 *      (`canva.com/design/<TEMPLATE_ID>/edit`) and sends it.
 *   3. We set the corresponding env var (e.g. CANVA_TPL_RECOGNITION_COVER).
 *   4. Redeploy. The orchestrator picks it up automatically.
 *
 * Until a template is configured, that slide type falls back to the
 * React renderer for the export (so missing templates don't block the
 * pipeline; we get partial Canva output for the slides that are wired).
 */

import "server-only";

export type TemplateKey =
    | "recognition-cover"
    | "intro-mentors"
    | "curriculum-grid"
    | "mentor-grid"
    | "impact"
    | "pricing-cta";

export type FieldType = "text" | "image";

export interface FieldSpec {
    name: string; // data field name in the Canva template (snake_case)
    type: FieldType;
    /** Whether 30x Design's slide JSON is expected to provide this. If
     *  optional, autofill skips it cleanly when the slide doesn't have
     *  the data (Canva uses the template default). */
    optional?: boolean;
}

export interface TemplateConfig {
    /** Maps the 30x slide type union to a Canva Brand Template ID. */
    canvaTemplateId: string;
    /** Friendly name (for the "Abrir en Canva" UI + setup doc). */
    displayName: string;
    /** Field schema. The orchestrator validates the slide JSON against
     *  this and fills only what it has. */
    fields: FieldSpec[];
    /** Which 30x slide type triggers this template. Used by the
     *  orchestrator to look up by slide.type. */
    slideTypes: string[];
}

export const TEMPLATE_CONFIGS: Record<TemplateKey, TemplateConfig> = {
    "recognition-cover": {
        canvaTemplateId: process.env.CANVA_TPL_RECOGNITION_COVER ?? "",
        displayName: "Portada de Reconocimiento (estilo Andrés Bilbao)",
        slideTypes: ["corporate-cover"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "hero_background", type: "image", optional: true },
            { name: "headline_main", type: "text" },
            { name: "headline_accent", type: "text", optional: true },
            { name: "body_paragraph_1", type: "text", optional: true },
            { name: "body_paragraph_2", type: "text", optional: true },
        ],
    },
    "intro-mentors": {
        canvaTemplateId: process.env.CANVA_TPL_INTRO_MENTORS ?? "",
        displayName: "Quién enseña — intro de mentores",
        slideTypes: ["intro-mentors"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "section_title", type: "text" },
            { name: "section_description", type: "text", optional: true },
            { name: "angle_1_title", type: "text", optional: true },
            { name: "angle_1_desc", type: "text", optional: true },
            { name: "angle_2_title", type: "text", optional: true },
            { name: "angle_2_desc", type: "text", optional: true },
            { name: "angle_3_title", type: "text", optional: true },
            { name: "angle_3_desc", type: "text", optional: true },
            { name: "mentor_1_photo", type: "image", optional: true },
            { name: "mentor_1_name", type: "text", optional: true },
            { name: "mentor_1_role", type: "text", optional: true },
            { name: "mentor_2_photo", type: "image", optional: true },
            { name: "mentor_2_name", type: "text", optional: true },
            { name: "mentor_2_role", type: "text", optional: true },
            { name: "mentor_3_photo", type: "image", optional: true },
            { name: "mentor_3_name", type: "text", optional: true },
            { name: "mentor_3_role", type: "text", optional: true },
        ],
    },
    "curriculum-grid": {
        canvaTemplateId: process.env.CANVA_TPL_CURRICULUM_GRID ?? "",
        displayName: "Currículum del programa",
        slideTypes: ["curriculum-grid"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "headline", type: "text" },
            { name: "subtitle", type: "text", optional: true },
            ...Array.from({ length: 8 }, (_, i) => i + 1).flatMap((n) => [
                { name: `module_${n}_number`, type: "text" as const, optional: true },
                { name: `module_${n}_name`, type: "text" as const, optional: true },
                { name: `module_${n}_desc`, type: "text" as const, optional: true },
            ]),
        ],
    },
    "mentor-grid": {
        canvaTemplateId: process.env.CANVA_TPL_MENTOR_GRID ?? "",
        displayName: "Grid de mentores destacados",
        slideTypes: ["mentor-grid", "mentor-duo"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "headline", type: "text" },
            { name: "subtitle", type: "text", optional: true },
            ...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((n) => [
                { name: `mentor_${n}_photo`, type: "image" as const, optional: true },
                { name: `mentor_${n}_name`, type: "text" as const, optional: true },
                { name: `mentor_${n}_role`, type: "text" as const, optional: true },
                { name: `mentor_${n}_company`, type: "text" as const, optional: true },
            ]),
        ],
    },
    impact: {
        canvaTemplateId: process.env.CANVA_TPL_IMPACT ?? "",
        displayName: "Impacto / métricas",
        slideTypes: ["impact"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "eyebrow", type: "text", optional: true },
            { name: "headline", type: "text" },
            { name: "hero_value", type: "text", optional: true },
            { name: "hero_label", type: "text", optional: true },
            { name: "hero_context", type: "text", optional: true },
            { name: "stat_1_value", type: "text", optional: true },
            { name: "stat_1_label", type: "text", optional: true },
            { name: "stat_2_value", type: "text", optional: true },
            { name: "stat_2_label", type: "text", optional: true },
            { name: "stat_3_value", type: "text", optional: true },
            { name: "stat_3_label", type: "text", optional: true },
        ],
    },
    "pricing-cta": {
        canvaTemplateId: process.env.CANVA_TPL_PRICING_CTA ?? "",
        displayName: "Inversión + CTA",
        slideTypes: ["pricing-cta"],
        fields: [
            { name: "partner_logo", type: "image", optional: true },
            { name: "headline", type: "text" },
            { name: "package_1_name", type: "text", optional: true },
            { name: "package_1_tagline", type: "text", optional: true },
            { name: "package_1_price", type: "text", optional: true },
            { name: "package_1_price_note", type: "text", optional: true },
            { name: "package_1_feature_1", type: "text", optional: true },
            { name: "package_1_feature_2", type: "text", optional: true },
            { name: "package_1_feature_3", type: "text", optional: true },
            { name: "package_1_feature_4", type: "text", optional: true },
            { name: "package_1_feature_5", type: "text", optional: true },
            { name: "package_2_name", type: "text", optional: true },
            { name: "package_2_tagline", type: "text", optional: true },
            { name: "package_2_price", type: "text", optional: true },
            { name: "package_2_price_note", type: "text", optional: true },
            { name: "package_2_feature_1", type: "text", optional: true },
            { name: "package_2_feature_2", type: "text", optional: true },
            { name: "package_2_feature_3", type: "text", optional: true },
            { name: "package_2_feature_4", type: "text", optional: true },
            { name: "package_2_feature_5", type: "text", optional: true },
            { name: "contact_name", type: "text", optional: true },
            { name: "contact_role", type: "text", optional: true },
            { name: "contact_details", type: "text", optional: true },
        ],
    },
};

/**
 * Resolve a slide type to its template config. Returns null if no
 * template matches that slide type — orchestrator skips those slides.
 */
export function templateFor(slideType: string): {
    key: TemplateKey;
    config: TemplateConfig;
} | null {
    for (const [key, config] of Object.entries(TEMPLATE_CONFIGS)) {
        if (config.slideTypes.includes(slideType) && config.canvaTemplateId) {
            return { key: key as TemplateKey, config };
        }
    }
    return null;
}

export function configuredTemplateCount(): number {
    return Object.values(TEMPLATE_CONFIGS).filter((c) => !!c.canvaTemplateId).length;
}

export function listConfiguredTemplates(): Array<{
    key: TemplateKey;
    config: TemplateConfig;
}> {
    return Object.entries(TEMPLATE_CONFIGS)
        .filter(([, c]) => !!c.canvaTemplateId)
        .map(([key, config]) => ({ key: key as TemplateKey, config }));
}
