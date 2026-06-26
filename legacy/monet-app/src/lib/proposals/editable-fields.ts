/**
 * Editable-field descriptors for the "Editar propuesta" field editor.
 *
 * Maps each slide `type` to the fields a salesperson can edit as plain HTML
 * inputs. The editor renders generically from these descriptors, so adding a
 * field is a one-line change here. Fields the model produces that aren't
 * listed simply aren't exposed (safe).
 *
 * Field kinds:
 *   - scalar  → single value: text | textarea | image (URL)
 *   - lines   → string[] edited as a textarea, one item per line
 *   - list    → array of objects, each with its own scalar/lines subfields
 */

export type ScalarType = "text" | "textarea" | "image";

export interface ScalarField {
    kind: "scalar";
    key: string;
    label: string;
    type: ScalarType;
}
export interface LinesField {
    kind: "lines";
    key: string;
    label: string;
}
export interface ListField {
    kind: "list";
    key: string;
    label: string;
    itemFields: (ScalarField | LinesField)[];
    /** subfield used as each item's heading in the form */
    itemTitleKey?: string;
}
export type FieldDef = ScalarField | LinesField | ListField;

const s = (key: string, label: string, type: ScalarType = "text"): ScalarField => ({
    kind: "scalar",
    key,
    label,
    type,
});
const lines = (key: string, label: string): LinesField => ({ kind: "lines", key, label });

/** Deck-level fields, always shown at the top of the editor. */
export const DECK_FIELDS: FieldDef[] = [
    s("deckTitle", "Título de la propuesta"),
    s("companyName", "Empresa / cliente"),
    s("programName", "Programa"),
    s("clientLogoUrl", "Logo del cliente (URL)", "image"),
];

export const SLIDE_FIELDS: Record<string, FieldDef[]> = {
    "corporate-cover": [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("headlineAccent", "Frase acento (parte amarilla)", "text"),
        lines("bodyParagraphs", "Párrafos del cuerpo"),
        s("backgroundImage", "Imagen de fondo / hero (URL)", "image"),
    ],
    "cover-hero": [
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        s("backgroundImage", "Imagen de fondo / hero (URL)", "image"),
    ],
    diagnostic: [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        {
            kind: "list",
            key: "findings",
            label: "Hallazgos",
            itemTitleKey: "title",
            itemFields: [s("title", "Título"), s("description", "Descripción", "textarea")],
        },
    ],
    methodology: [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        {
            kind: "list",
            key: "steps",
            label: "Pasos",
            itemTitleKey: "title",
            itemFields: [s("title", "Título"), s("description", "Descripción", "textarea")],
        },
    ],
    "curriculum-grid": [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        {
            kind: "list",
            key: "modules",
            label: "Módulos",
            itemTitleKey: "name",
            itemFields: [s("name", "Nombre"), s("description", "Descripción", "textarea")],
        },
    ],
    "mentor-grid": [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        {
            kind: "list",
            key: "mentors",
            label: "Mentores",
            itemTitleKey: "name",
            itemFields: [
                s("name", "Nombre"),
                s("role", "Rol"),
                s("bio", "Bio", "textarea"),
                s("imageUrl", "Foto (URL)", "image"),
            ],
        },
    ],
    impact: [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("heroContext", "Contexto", "textarea"),
        {
            kind: "list",
            key: "stats",
            label: "Métricas",
            itemTitleKey: "label",
            itemFields: [s("value", "Valor"), s("label", "Etiqueta")],
        },
    ],
    "pricing-cta": [
        s("eyebrow", "Eyebrow"),
        s("headline", "Titular", "textarea"),
        s("subtitle", "Subtítulo", "textarea"),
        {
            kind: "list",
            key: "packages",
            label: "Paquetes",
            itemTitleKey: "name",
            itemFields: [
                s("name", "Nombre"),
                s("tagline", "Tagline"),
                s("price", "Precio"),
                s("priceNote", "Nota de precio"),
                lines("features", "Features (una por línea)"),
            ],
        },
    ],
};

/** Human label for a slide type, for the slide selector. */
export const SLIDE_TYPE_LABELS: Record<string, string> = {
    "corporate-cover": "Portada",
    "cover-hero": "Portada",
    diagnostic: "Diagnóstico",
    methodology: "Metodología",
    "curriculum-grid": "Currículum",
    "mentor-grid": "Mentores",
    impact: "Impacto",
    "pricing-cta": "Precios / CTA",
};

export function fieldsForSlide(type: string | undefined): FieldDef[] {
    return (type && SLIDE_FIELDS[type]) || [];
}
