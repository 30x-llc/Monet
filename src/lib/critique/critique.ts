/**
 * Vision-critique loop — post-generation polish.
 *
 * Flow:
 *   1. Render each slide of a generated deck to a JPG via puppeteer.
 *   2. Feed the screenshots + the deck JSON + 3–4 reference images of
 *      real 30x decks to Claude Opus with vision.
 *   3. Claude compares what was generated to the reference decks and
 *      emits structured edits (change headline, swap variant, tighten
 *      subtitle, remove filler slide, reorder).
 *   4. Apply the edits to the deck JSON and return the polished deck.
 *
 * This is the move that turns "AI-generated deck" into "deck that
 * feels designed by Juan Diego." Without the critique pass the model
 * is guessing at quality from specs; with it, the model sees whether
 * the headline is actually tight, whether the bento grid feels right,
 * whether any slide is weaker than the reference decks.
 *
 * Cost: ~$0.30 extra per deck (vision input tokens + another Opus
 * pass). Latency: ~45–90s (rendering + vision call). Worth it.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Deck } from "@/lib/slide-types";
import {
    renderDeckToSlideScreenshots,
} from "@/lib/export/render-pdf";
import { pickReferenceImages } from "@/lib/reference-decks";

const CRITIQUE_SYSTEM_PROMPT = `Eres Juan Diego — Head of Design de 30x. Tu trabajo es revisar una propuesta comercial recién generada por IA y dejarla IMPECABLE antes de que el vendedor la mande al cliente.

Recibirás:
1. El JSON completo del deck actual.
2. Screenshots del render de cada slide (en orden).
3. Referencias visuales: screenshots de decks reales de 30x que TÚ ya diseñaste en el pasado — esto es lo que "bueno" se ve.

Tu job:
- Comparar cada slide renderizada contra las referencias. Identificar qué se siente genérico, flojo, o fuera de estándar 30x.
- Emitir edits CONCRETOS, específicos por slide. No "mejora el copy" — sino "headline slide 3: cambia 'Diagnóstico' por 'El momento de X exige criterio'".
- No reescribir todo — sólo lo que claramente mejora. Si un slide ya está bien, déjalo. Acción por omisión = no tocar.
- Máximo 8 edits. Prioriza: portada (headline, subtitle), diagnostic (findings titles), closing (headline), y cualquier slide donde el contenido se ve vacío o mal balanceado.

REGLAS DE VOZ 30x (refréscalas contra las referencias):
- Headlines cortos, densos, con wordplay cuando aplica (ej: "México despega. 30x forma a quienes pilotean.")
- Nada de "transformar", "disruptivo", "ecosistema", "premium" como adjetivo vacío, "10x", "unicornio"
- Nunca texto genérico tipo "Mentores" o "Inversión" solo — siempre con un qualifier
- Body text: 12-24 palabras máximo. Si hay más, córtalo.
- Datos concretos sobre adjetivos: "$786B COP en tech" mejor que "fuerte inversión tecnológica"

TIPOS DE EDIT que puedes emitir (usa el tool call edit_deck):

- { "kind": "set_field", "slideIndex": N, "path": "headline", "value": "..." }
  Cambia un campo string de una slide. Paths comunes: "headline", "subtitle", "eyebrow", "title", "pill", "date".

- { "kind": "set_field", "slideIndex": N, "path": "variant", "value": "split" }
  Cambia la variante de layout. Values permitidos por tipo:
  - corporate-cover: "bleed" | "split"
  - impact: "stats-row" | "hero-number"
  - intro-mentors: "split" | "grid"
  - pricing-cta: "split" | "package"

- { "kind": "set_list_item", "slideIndex": N, "path": "findings[2].title", "value": "..." }
  Cambia un campo dentro de un array. Funciona para findings, modules, mentors, stats, etc.

- { "kind": "remove_slide", "slideIndex": N }
  Elimina un slide entero (úsalo con cuidado — sólo cuando claramente sobra).

- { "kind": "swap_slides", "a": N, "b": M }
  Intercambia dos slides (úsalo cuando el orden narrativo está mal).

OUTPUT: llama edit_deck UNA sola vez con el array de edits + una "summary" breve (1 línea) explicando qué pasó. Sin los edits vacíos. Si el deck está perfecto devuelve edits: [] + summary: "Deck OK, sin cambios."`;

const EDIT_TOOL: Anthropic.Messages.Tool = {
    name: "edit_deck",
    description:
        "Aplica edits puntuales al deck. Llama UNA sola vez con todo el array de edits.",
    input_schema: {
        type: "object",
        properties: {
            summary: {
                type: "string",
                description:
                    "1 línea breve explicando el alcance de los cambios.",
            },
            edits: {
                type: "array",
                description: "Array de edits a aplicar al deck.",
                items: {
                    type: "object",
                    properties: {
                        kind: {
                            type: "string",
                            enum: [
                                "set_field",
                                "set_list_item",
                                "remove_slide",
                                "swap_slides",
                            ],
                        },
                        slideIndex: { type: "number" },
                        path: { type: "string" },
                        value: {},
                        a: { type: "number" },
                        b: { type: "number" },
                        reason: { type: "string" },
                    },
                    required: ["kind"],
                    additionalProperties: true,
                },
            },
        },
        required: ["summary", "edits"],
    },
};

export interface CritiqueEdit {
    kind: "set_field" | "set_list_item" | "remove_slide" | "swap_slides";
    slideIndex?: number;
    path?: string;
    value?: unknown;
    a?: number;
    b?: number;
    reason?: string;
}

export interface CritiqueResult {
    polishedDeck: Deck;
    summary: string;
    edits: CritiqueEdit[];
}

/**
 * Parse "a.b[2].c" into a list of accessors. Returns null if the
 * path looks malformed — the edit gets skipped rather than corrupting
 * the deck.
 */
function parsePath(path: string): Array<string | number> | null {
    const parts: Array<string | number> = [];
    const re = /([^.[\]]+)|\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(path)) !== null) {
        if (m[1] !== undefined) parts.push(m[1]);
        else if (m[2] !== undefined) parts.push(parseInt(m[2], 10));
    }
    return parts.length > 0 ? parts : null;
}

function setAtPath(
    obj: unknown,
    path: Array<string | number>,
    value: unknown,
): boolean {
    if (path.length === 0) return false;
    let cursor: Record<string | number, unknown> = obj as Record<string | number, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const next = cursor[key];
        if (next === undefined || next === null) return false;
        cursor = next as Record<string | number, unknown>;
    }
    cursor[path[path.length - 1]] = value;
    return true;
}

/**
 * Apply a single edit to the deck. Returns true if applied, false if
 * the edit was malformed and was skipped (e.g., bad slideIndex).
 */
function applyEdit(deck: Deck, edit: CritiqueEdit): boolean {
    switch (edit.kind) {
        case "set_field": {
            if (
                typeof edit.slideIndex !== "number" ||
                !edit.path ||
                edit.slideIndex < 0 ||
                edit.slideIndex >= deck.slides.length
            )
                return false;
            const slide = deck.slides[edit.slideIndex] as unknown as Record<
                string,
                unknown
            >;
            slide[edit.path] = edit.value;
            return true;
        }
        case "set_list_item": {
            if (
                typeof edit.slideIndex !== "number" ||
                !edit.path ||
                edit.slideIndex < 0 ||
                edit.slideIndex >= deck.slides.length
            )
                return false;
            const parsed = parsePath(edit.path);
            if (!parsed) return false;
            return setAtPath(deck.slides[edit.slideIndex], parsed, edit.value);
        }
        case "remove_slide": {
            if (
                typeof edit.slideIndex !== "number" ||
                edit.slideIndex < 0 ||
                edit.slideIndex >= deck.slides.length ||
                deck.slides.length <= 3 // keep at least 3 slides
            )
                return false;
            deck.slides.splice(edit.slideIndex, 1);
            return true;
        }
        case "swap_slides": {
            if (
                typeof edit.a !== "number" ||
                typeof edit.b !== "number" ||
                edit.a < 0 ||
                edit.b < 0 ||
                edit.a >= deck.slides.length ||
                edit.b >= deck.slides.length ||
                edit.a === edit.b
            )
                return false;
            [deck.slides[edit.a], deck.slides[edit.b]] = [
                deck.slides[edit.b],
                deck.slides[edit.a],
            ];
            return true;
        }
        default:
            return false;
    }
}

export async function runVisionCritique(
    deck: Deck,
    absoluteBase: string,
): Promise<CritiqueResult> {
    // 1. Render screenshots of the current deck.
    const screenshots = await renderDeckToSlideScreenshots(deck, absoluteBase, {
        outputWidth: 1024,
        quality: 82,
    });
    if (screenshots.length === 0) {
        throw new Error("No se pudieron renderizar las slides para el critique.");
    }

    // 2. Pick 3–4 reference images of real 30x decks for the vision input.
    const slideTypes = deck.slides.map((s) => s.type);
    const references = await pickReferenceImages(slideTypes, 3);

    // 3. Build the user message: references first, then current deck
    //    screenshots, then deck JSON.
    const userContent: Anthropic.Messages.ContentBlockParam[] = [];

    if (references.length > 0) {
        userContent.push({
            type: "text",
            text: "REFERENCIAS — decks reales de 30x que diseñó Juan Diego. Este es el estándar:",
        });
        for (const img of references) {
            userContent.push({
                type: "image",
                source: {
                    type: "base64",
                    media_type: img.mediaType,
                    data: img.base64,
                },
            });
        }
    }

    userContent.push({
        type: "text",
        text: `\nDECK ACTUAL — screenshots en orden (slide 0, slide 1, …):`,
    });
    for (let i = 0; i < screenshots.length; i++) {
        userContent.push({
            type: "image",
            source: {
                type: "base64",
                media_type: "image/jpeg",
                data: screenshots[i].toString("base64"),
            },
        });
        userContent.push({
            type: "text",
            text: `↑ slide ${i} (type: ${deck.slides[i].type})`,
        });
    }

    userContent.push({
        type: "text",
        text: `\nDECK JSON (es lo que vas a editar con el tool call):\n\`\`\`json\n${JSON.stringify(deck, null, 2)}\n\`\`\``,
    });

    userContent.push({
        type: "text",
        text: `\nCompara contra las referencias y emite edits puntuales para dejar este deck al nivel de 30x. Llama edit_deck una vez.`,
    });

    const client = new Anthropic();
    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: CRITIQUE_SYSTEM_PROMPT,
        tools: [EDIT_TOOL],
        tool_choice: { type: "tool", name: "edit_deck" },
        messages: [{ role: "user", content: userContent }],
    });

    const toolUse = response.content.find(
        (c) => c.type === "tool_use" && c.name === "edit_deck",
    ) as Anthropic.Messages.ToolUseBlock | undefined;

    if (!toolUse) {
        throw new Error("Claude no llamó edit_deck en la respuesta de critique.");
    }

    const { summary, edits } = toolUse.input as {
        summary: string;
        edits: CritiqueEdit[];
    };

    // 4. Apply edits, skipping malformed ones. Mutate a deep clone so
    //    we don't corrupt the original if something goes wrong halfway.
    const polished: Deck = JSON.parse(JSON.stringify(deck));
    const applied: CritiqueEdit[] = [];
    // Sort remove_slide edits to run from highest index to lowest so
    // indices don't shift underneath other edits.
    const sorted = [...edits].sort((a, b) => {
        if (a.kind === "remove_slide" && b.kind === "remove_slide") {
            return (b.slideIndex ?? 0) - (a.slideIndex ?? 0);
        }
        if (a.kind === "remove_slide") return 1;
        if (b.kind === "remove_slide") return -1;
        return 0;
    });
    for (const edit of sorted) {
        if (applyEdit(polished, edit)) applied.push(edit);
    }

    return {
        polishedDeck: polished,
        summary,
        edits: applied,
    };
}
