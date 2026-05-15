/**
 * 30x Brand Colors
 *
 * This file defines the official 30x brand color palette.
 * These colors MUST be used consistently across all 30x branded components.
 *
 * ============================================================================
 * IMPORTANT: ACCENT COLOR RULES
 * ============================================================================
 *
 * The ONLY accent yellow allowed is #E9FF7B
 *
 * You may ONLY adjust this color using:
 * - Brightness (e.g., brightness-90, brightness-110)
 * - Opacity/Transparency (e.g., #E9FF7B with 50% opacity, or E9FF7B/50)
 *
 * You must NEVER:
 * - Change the hue or saturation
 * - Use alternative yellow/green shades like #B0C259, #D4F542, #DEFF5C, etc.
 * - Create a "palette" of different yellow tones
 *
 * The accent color should always trace back to #E9FF7B as its base.
 *
 * ============================================================================
 */

export const brand30xColors = {
    /**
     * Accent Yellow-Green
     * The signature 30x brand color.
     * ONLY use this exact hex code. Adjust with brightness/opacity only.
     */
    accent: "#E9FF7B",

    /**
     * Near Black
     * Primary dark color for text, backgrounds, and dark UI elements.
     */
    dark: "#262626",

    /**
     * True Black
     * Used for text and logo on light backgrounds.
     */
    black: "#0A0A0A",

    /**
     * Logo Black
     * Specifically for the 30x logo.
     */
    logoBlack: "#010101",

    /**
     * Light Gray
     * Used for light logo variant on dark backgrounds.
     */
    lightGray: "#F2F2F2",

    /**
     * White
     * For light button backgrounds and cards.
     */
    white: "#FFFFFF",
} as const;

/**
 * Accent color usage examples:
 *
 * ✅ CORRECT:
 * - bg-[#E9FF7B]                    → Base accent color
 * - bg-[#E9FF7B]/50                 → 50% opacity
 * - bg-[#E9FF7B] hover:brightness-90 → Darker on hover via brightness
 * - ring-[#E9FF7B]/30               → 30% opacity for ring
 *
 * ❌ WRONG:
 * - bg-[#B0C259]                    → Different shade (NOT ALLOWED)
 * - bg-[#D4F542]                    → Different shade (NOT ALLOWED)
 * - bg-[#DEFF5C]                    → Different shade (NOT ALLOWED)
 * - bg-yellow-400                   → Tailwind yellow (NOT ALLOWED)
 */

export type Brand30xColor = keyof typeof brand30xColors;
