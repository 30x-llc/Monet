/**
 * Logo fallback resolver — Juan Diego curated a folder of partner logos
 * (white-on-dark + black-on-light variants) for the most common 30x
 * member companies. We index the manifest at module load and serve them
 * statically from /assets/logos/30x-members so the renderer can pull
 * a perfect logo for repeat clients without going through Exa or
 * Clearbit. Exa Google Image search remains the primary path for
 * unknown clients (see exa-logo-search.ts); this is the curated
 * shortcut.
 */

const FILES = [
    "Aeromexico Logo 2024 1 [Vectorized].svg",
    "Aeromexico Logo 2024.png",
    "Amazon Logo White.png",
    "Amazon dark.png",
    "Bimbo Logo Light.png",
    "Bimbo Logo.png",
    "Cabify Logo White.png",
    "Cabify dark.png",
    "Chiper Logo White.png",
    "Chiper dark.png",
    "Colombia Tech Logo White [Vectorized].png",
    "Colombia Tech Logo White.png",
    "Colombia Tech dark.png",
    "Colsubsidio Logo Dark.svg",
    "Colsubsidio Logo Light.svg",
    "Despegar Logo White.png",
    "Despegar dark.png",
    "DiDi Logo White.png",
    "DiDi dark.png",
    "Domu Logo 1 [Vectorized].png",
    "Domu Logo.avif",
    "Femsa Logo Light.svg",
    "Google Logo White.png",
    "Google dark.png",
    "Growth Rockstar Logo White.png",
    "Growth Rockstar.webp",
    "Habi Logo White.png",
    "Habi Logo.png",
    "Habi dark.png",
    "Ifood dark.png",
    "Ifood logo White.png",
    "Kueski Logo White.png",
    "Kueski dark.png",
    "Lemon Logo White.png",
    "Lemon dark.png",
    "Lulo Bank Logo White.png",
    "Lulo dark.png",
    "Mercado Libre Logo White.png",
    "Mercado Libre dark.png",
    "Netflix Logo White.png",
    "Netflix dark.png",
    "Nubank Logo White.png",
    "Nubank dark.png",
    "Ontop Logo White.png",
    "Ontop dark.png",
    "PedidosYa Logo White.png",
    "PedidosYa dark.png",
    "Platzi Logo White.png",
    "Platzi dark.png",
    "Pomelo Logo White.png",
    "Pomelo dark.png",
    "Rappi Logo Dark.png",
    "Rappi Logo White [Vectorized].svg",
    "Rappi Logo White.png",
    "Rappi Logo.png",
    "Rappi dark.png",
    "Truora Logo White.png",
    "Truora Logo.png",
    "Truora dark.png",
    "Uber Logo (1).svg",
    "Uber Logo White.png",
    "Uber Logo.svg",
    "Uber dark.png",
] as const;

const BASE = "/assets/logos/30x-members";

function slug(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

interface LogoEntry {
    /** White on transparent — meant for dark backgrounds. */
    white?: string;
    /** Dark/black — meant for light backgrounds. */
    dark?: string;
}

const INDEX: Record<string, LogoEntry> = (() => {
    const out: Record<string, LogoEntry> = {};

    for (const file of FILES) {
        const url = `${BASE}/${encodeURIComponent(file)}`;
        const lower = file.toLowerCase();
        const isWhite =
            lower.includes("white") || lower.includes("light");
        // "dark" appears in companies like "Habi dark" (= dark variant
        // for light bg); also "Logo Dark" as in "Colsubsidio Logo Dark".
        const isDark =
            lower.includes("dark") ||
            (!isWhite &&
                !lower.includes("vectorized") &&
                lower.endsWith("logo.png"));

        // Strip trailing variant qualifiers to get a brand stem.
        // "rappi logo white" → "rappi"; "uber logo (1)" → "uber".
        const brandStem = file
            .replace(/\.(png|svg|jpg|jpeg|webp|avif)$/i, "")
            .replace(/\s*\[.*?\]\s*$/g, "")
            .replace(/\s*\(\d+\)\s*$/g, "")
            .replace(/\s+logo(\s+(white|dark|light))?\s*$/i, "")
            .replace(/\s+(white|dark|light)\s*$/i, "")
            .trim();
        const key = slug(brandStem);
        if (!key) continue;

        const entry = (out[key] ||= {});
        if (isWhite && !entry.white) entry.white = url;
        if (isDark && !entry.dark) entry.dark = url;
        // Generic fallback (e.g. "rappi-logo.png" with no qualifier).
        if (!isWhite && !isDark) {
            entry.dark ||= url;
            entry.white ||= url;
        }
    }
    return out;
})();

/**
 * Look up a curated 30x partner logo by company name.
 * Returns the variant matching the requested theme (so a dark deck
 * gets the white-on-transparent version), or null if no curated logo
 * is found.
 */
export function findLocalPartnerLogo(
    companyName: string,
    theme: "dark" | "light",
): string | null {
    if (!companyName) return null;
    const key = slug(companyName);
    if (!key) return null;

    // Direct match first, then loose contains match for things like
    // "Aeroméxico SA de CV" → matches "aeromexico".
    let entry = INDEX[key];
    if (!entry) {
        const loose = Object.keys(INDEX).find(
            (k) => key.includes(k) || k.includes(key),
        );
        if (loose) entry = INDEX[loose];
    }
    if (!entry) return null;

    // Dark theme deck → use white-on-transparent.
    // Light theme deck → use dark/black.
    return theme === "dark"
        ? (entry.white ?? entry.dark ?? null)
        : (entry.dark ?? entry.white ?? null);
}
