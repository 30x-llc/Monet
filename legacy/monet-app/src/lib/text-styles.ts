/**
 * Monet — typography tokens.
 *
 * The canonical 8-style set Juan Diego defined. Every text element on a
 * canvas slide must snap to one of these. Any ad-hoc deviation from
 * these values is a bug, not a feature.
 *
 * Numbers are in canvas units (matches the 1280×720 design space the
 * canvas slide renders into). lineHeight is a multiplier of fontSize;
 * letterSpacing is in em (so `-0.06` = -6% per Framer's conventions).
 */

export type TextStyleName =
    | "title"
    | "header1"
    | "header2"
    | "header3"
    | "body1"
    | "body2"
    | "body3"
    | "note";

export interface TextStyleToken {
    name: TextStyleName;
    label: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
}

/** Inter-only. Semi Bold = 600, Regular = 400. */
export const TEXT_STYLES: Record<TextStyleName, TextStyleToken> = {
    title: {
        name: "title",
        label: "Title · 96",
        fontSize: 96,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: -0.06,
    },
    header1: {
        name: "header1",
        label: "Header 1 · 60",
        fontSize: 60,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: -0.05,
    },
    header2: {
        name: "header2",
        label: "Header 2 · 48",
        fontSize: 48,
        fontWeight: 600,
        lineHeight: 1.24,
        letterSpacing: -0.05,
    },
    header3: {
        name: "header3",
        label: "Header 3 · 36",
        fontSize: 36,
        fontWeight: 600,
        lineHeight: 1.32,
        letterSpacing: -0.05,
    },
    body1: {
        name: "body1",
        label: "Body 1 · 36",
        fontSize: 36,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: -0.04,
    },
    body2: {
        name: "body2",
        label: "Body 2 · 30",
        fontSize: 30,
        fontWeight: 400,
        lineHeight: 1.36,
        letterSpacing: -0.04,
    },
    body3: {
        name: "body3",
        label: "Body 3 · 24",
        fontSize: 24,
        fontWeight: 400,
        lineHeight: 1.34,
        letterSpacing: -0.04,
    },
    note: {
        name: "note",
        label: "Note · 20",
        fontSize: 20,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: -0.03,
    },
};

export const TEXT_STYLE_NAMES: TextStyleName[] = [
    "title",
    "header1",
    "header2",
    "header3",
    "body1",
    "body2",
    "body3",
    "note",
];

/** Pick the named style, or fall back to body2 for ad-hoc text. */
export function getTextStyle(name: TextStyleName | undefined): TextStyleToken {
    if (name && TEXT_STYLES[name]) return TEXT_STYLES[name];
    return TEXT_STYLES.body2;
}

/**
 * Best-fit a free-form text element to one of the 8 styles by comparing
 * its current fontSize/fontWeight to the canonical values. Used to seed
 * the "Style" picker when an element doesn't have a textStyle yet.
 */
export function inferTextStyle(opts: { fontSize?: number; fontWeight?: number }): TextStyleName {
    const fs = opts.fontSize ?? 24;
    const fw = opts.fontWeight ?? 400;
    let best: { name: TextStyleName; score: number } | null = null;
    for (const name of TEXT_STYLE_NAMES) {
        const t = TEXT_STYLES[name];
        // Squared distance, weighting size more than weight.
        const dSize = (t.fontSize - fs) / 96; // normalize by largest size
        const dWeight = (t.fontWeight - fw) / 600;
        const score = dSize * dSize * 4 + dWeight * dWeight;
        if (!best || score < best.score) best = { name, score };
    }
    return best!.name;
}
