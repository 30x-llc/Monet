/**
 * 30x Deck Brand Tokens
 *
 * Dark mode palette for presentations.
 * These tokens drive BOTH the HTML preview and the PPTX builder.
 *
 * Source: 30x-design-system.md + Juan Diego's Figma files
 * Slides: 1920x1080 (16:9 widescreen)
 */

export const deckTokens = {
    bg: {
        page: "#0D0D0D",
        surface1: "#141414",
        surface2: "#1A1A1A",
    },
    text: {
        primary: "#F0F0F0",
        secondary: "#777777",
        accent: "#E9FF7B",
    },
    accent: "#E9FF7B",
    border: "#232323",
    font: {
        family: "Inter",
        display: {
            size: 40,
            weight: 500, // Medium
            letterSpacing: -0.05, // -5% em
            lineHeight: 1.0,
        },
        body: {
            size: 24,
            weight: 400, // Regular
            letterSpacing: -0.05,
            lineHeight: 1.4,
        },
        caption: {
            size: 16,
            weight: 400,
            letterSpacing: -0.03,
            lineHeight: 1.5,
        },
        stat: {
            size: 56,
            weight: 700,
            letterSpacing: -0.05,
            lineHeight: 1.0,
        },
    },
    slide: {
        width: 1920,
        height: 1080,
        widthInches: 13.333,
        heightInches: 7.5,
        padding: {
            x: 80,
            y: 80,
        },
    },
} as const;

/** pptxgenjs uses hex WITHOUT the # prefix */
export function pptxHex(hex: string): string {
    return hex.replace("#", "");
}
