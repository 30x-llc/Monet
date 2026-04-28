import type { Deck } from "./slide-types";

/**
 * Em-dash and en-dash are banned in every 30x output (brand rule).
 * The model copies the dashes from its training data even when told not
 * to, so we strip them in code as a final guarantee. Replacement rules
 * mirror what a copy-editor would do:
 *  - " — " (parenthetical) → ", "
 *  - "word—word" (compound) → "word, word"
 *  - "—" trailing  → ""
 *  - "–" en-dash same treatment
 */
export function stripDashes(input: string): string {
    if (!input.includes("—") && !input.includes("–")) return input;
    return input
        .replace(/\s*[—–]\s*$/g, "")
        .replace(/\s+[—–]\s+/g, ", ")
        .replace(/[—–]/g, ", ");
}

function walk(node: unknown): unknown {
    if (typeof node === "string") return stripDashes(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            out[k] = walk(v);
        }
        return out;
    }
    return node;
}

export function sanitizeDeck(deck: Deck): Deck {
    return walk(deck) as Deck;
}
