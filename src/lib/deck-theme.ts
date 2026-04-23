/**
 * 30x Deck Theme — Dark & Light mode tokens
 *
 * Dark mode: current presentation style (yellow accent on black).
 * Light mode: Apple/Linear-inspired (per Juan Diego's design system rules).
 *
 * Yellow Rule: #E9FF7B ONLY on dark backgrounds.
 * In light mode, accent switches to Apple blue #0071E3 for CTAs,
 * and black/dark for structural emphasis.
 */

export type DeckTheme = "dark" | "light";

export interface ThemeColors {
    bg: string;
    surface: string;
    surfaceSubtle: string;
    border: string;
    borderSubtle: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    accentText: string; // text color on accent backgrounds
    overlayFrom: string;
    overlayTo: string;
}

export const DARK_COLORS: ThemeColors = {
    bg: "#0D0D0D",
    surface: "#0a0a0a",
    surfaceSubtle: "#141414",
    border: "#222222",
    borderSubtle: "#1a1a1a",
    text: "#F0F0F0",
    textSecondary: "#999999",
    textTertiary: "#777777",
    accent: "#E9FF7B",
    accentText: "#0a0a0a",
    overlayFrom: "rgba(0,0,0,0.3)",
    overlayTo: "rgba(0,0,0,0.8)",
};

export const LIGHT_COLORS: ThemeColors = {
    bg: "#f5f5f7",
    surface: "#fafafa",
    surfaceSubtle: "#ffffff",
    border: "#ffffff", // whisper border from user's spec
    borderSubtle: "rgba(0,0,0,0.06)",
    text: "#1A1A1A",
    textSecondary: "#525252",
    textTertiary: "#737373",
    accent: "#0071E3", // Apple blue
    accentText: "#ffffff",
    overlayFrom: "rgba(0,0,0,0.15)",
    overlayTo: "rgba(0,0,0,0.55)",
};

export function getThemeColors(theme: DeckTheme = "dark"): ThemeColors {
    return theme === "light" ? LIGHT_COLORS : DARK_COLORS;
}
