/**
 * 30x Asset Registry — Real assets (post Claude Design sync)
 *
 * All images point to files under /public/assets/.
 * Mentor keys ↔ real photo files in /assets/mentors-real/
 * Program ids ↔ program logos in /assets/programs/
 */

// ============================================================
// MENTOR IMAGES — real photos from /Mentores copy/
// ============================================================

export const MENTOR_IMAGES: Record<string, string> = {
    andres: "/assets/mentors-real/andres-bilbao.png",
    andres_2: "/assets/mentors-real/andres-bilbao-2.png",
    andres_3: "/assets/mentors-real/andres-bilbao-3.png",
    daniel: "/assets/mentors-real/daniel-bilbao.png",
    dylan: "/assets/mentors-real/dylan-rosemberg-2.png",
    cinthya: "/assets/mentors-real/cinthya-sanchez.jpg",
    dago: "/assets/mentors-real/dago-borda.jpg",
    jefferson: "/assets/mentors-real/jefferson-arcos.png",
    felipe: "/assets/mentors-real/felipe-restrepo.png",
    nicolas: "/assets/mentors-real/nicolas-rojas-studio.png",
    santiago: "/assets/mentors-real/santiago-aparicio.png",
    natalia_s: "/assets/mentors-real/natalia-salcedo.png",
    estefany: "/assets/mentors-real/estefany-benavides.png",
    ramiro: "/assets/mentors-real/ramiro-castro.png",
    tatiana: "/assets/mentors-real/tatiana-leon.png",
    roman: "/assets/mentors-real/roman-hughes.png",
    mariajose_m: "/assets/mentors-real/maria-jose-munoz.png",
    mariajose_e: "/assets/mentors-real/maria-jose-echeverri.png",
    patricio: "/assets/mentors-real/pablo-benegas.png",
    pablo: "/assets/mentors-real/pablo-benegas.png",
    francisco: "/assets/mentors-real/francisco-ingouville.png",
    danny: "/assets/mentors-real/danny-bravo.png",
    leonardo: "/assets/mentors-real/leonardo-gonzalez.png",
    carlos_a: "/assets/mentors-real/carlos-alarcon.png",
    christian: "/assets/mentors-real/christian-braatz.png",
    alfonso: "/assets/mentors-real/alfonso-de-los-rios.jpeg",
    fabian: "/assets/mentors-real/fabian-sampayo.png",
    francisco_dc: "/assets/mentors-real/francisco-del-campo.png",
    francisco_m: "/assets/mentors-real/francisco-martinez.png",
    gonzalo: "/assets/mentors-real/gonzalo-vasquez.png",
    hussam: "/assets/mentors-real/hussam-sufan.png",
    juanjose: "/assets/mentors-real/juan-jose-guerrero.png",
    salvador: "/assets/mentors-real/salvador-said.png",
};

export function getMentorImage(key: string): string {
    return MENTOR_IMAGES[key] ?? MENTOR_IMAGES.andres;
}

// ============================================================
// PROGRAM LOGOS (light = for dark backgrounds, dark = for light)
// ============================================================

export const PROGRAM_LOGOS: Record<string, { light: string; dark: string }> = {
    "inmersion-ejecutiva": {
        light: "/assets/programs/inmersion-ejecutiva-logo-light.svg",
        dark: "/assets/programs/inmersion-ejecutiva-logo-dark.png",
    },
    achievers: {
        light: "/assets/programs/achievers-logo-light.png",
        dark: "/assets/programs/achievers-logo-dark.png",
    },
    "achievers-presencial": {
        light: "/assets/programs/achievers-logo-light.png",
        dark: "/assets/programs/achievers-logo-dark.png",
    },
    "sales-machine": {
        light: "/assets/programs/sales-machine-logo-light.png",
        dark: "/assets/programs/sales-machine-logo-dark.png",
    },
    "ai-for-executives": {
        light: "/assets/programs/ai-for-executives-logo-light.png",
        dark: "/assets/programs/ai-for-executives-logo-dark.png",
    },
    "hardcore-ai": {
        light: "/assets/programs/hardcore-ai-logo-light.png",
        dark: "/assets/programs/hardcore-ai-logo-dark.png",
    },
    "ai-for-boards": {
        light: "/assets/programs/ai-for-boards-logo-light.png",
        dark: "/assets/programs/ai-for-boards-logo-dark.png",
    },
    "ai-sales": {
        light: "/assets/programs/ai-sales-logo-light.png",
        dark: "/assets/programs/ai-sales-logo-dark.svg",
    },
    "growth-rockstar": {
        light: "/assets/programs/growth-rockstar-logo-light.png",
        dark: "/assets/programs/growth-rockstar-logo-dark.png",
    },
    "gtm-strategy": {
        light: "/assets/programs/gtm-strategy-logo-light.png",
        dark: "/assets/programs/gtm-strategy-logo-dark.png",
    },
    "product-rockstar": {
        light: "/assets/programs/product-rockstar-logo-light.png",
        dark: "/assets/programs/product-rockstar-logo-dark.png",
    },
    "xtreme-growth": {
        light: "/assets/programs/xtreme-growth-logo-light.png",
        dark: "/assets/programs/xtreme-growth-logo-dark.svg",
    },
    negociacion: {
        light: "/assets/programs/negociacion-logo-light.svg",
        dark: "/assets/programs/negociacion-logo-dark.png",
    },
    "advanced-strategy": {
        light: "/assets/programs/advanced-strategy-logo-light.png",
        dark: "/assets/programs/advanced-strategy-logo-dark.png",
    },
    "fundraising-school": {
        light: "/assets/programs/fundraising-school-logo-light.svg",
        dark: "/assets/programs/fundraising-school-logo-dark.png",
    },
    next: {
        light: "/assets/programs/next-blanco-logo.png",
        dark: "/assets/programs/next-logo-horizontal-color.png",
    },
    multipliers: {
        light: "/assets/programs/multipliers-logo-light.png",
        dark: "/assets/programs/multipliers-logo-dark.png",
    },
    operaciones: {
        light: "/assets/programs/operaciones-logo-light.svg",
        dark: "/assets/programs/operaciones-logo-dark.svg",
    },
};

export function getProgramLogo(programId: string, variant: "light" | "dark" = "light"): string {
    return PROGRAM_LOGOS[programId]?.[variant] ?? "/assets/logos/30x-logo-light.svg";
}

// ============================================================
// IMMERSIVE EVENT PHOTOS — ONLY for Inmersion Ejecutiva decks
// ============================================================

export const IMMERSIVE_PHOTOS = [
    "/assets/immersive/cubrimiento-dscf3083.jpg",
    "/assets/immersive/cubrimiento-dscf3298.jpg",
    "/assets/immersive/cubrimiento-dscf3418.jpg",
    "/assets/immersive/cubrimiento-dscf3555.jpg",
    "/assets/immersive/cubrimiento-dscf3717.jpg",
    "/assets/immersive/cubrimiento-dscf4047.jpg",
    "/assets/immersive/cubrimiento-dscf5201.jpg",
    "/assets/immersive/dscf0801.jpg",
    "/assets/immersive/dscf0891.jpg",
    "/assets/immersive/dscf9000.jpg",
    "/assets/immersive/dscf9005.jpg",
    "/assets/immersive/dscf9165.jpg",
    "/assets/immersive/dia-2.jpg",
    "/assets/immersive/dia-3.jpg",
    "/assets/immersive/cubrimiento-dscf1670.jpg",
    "/assets/immersive/cubrimiento-dscf1862.jpg",
    "/assets/immersive/cubrimiento-dscf2101.jpg",
    "/assets/immersive/cubrimiento-dscf2356.jpg",
    "/assets/immersive/cubrimiento-dscf2477.jpg",
];

export function getImmersivePhoto(seed: string, offset = 0): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const idx = (Math.abs(hash) + offset) % IMMERSIVE_PHOTOS.length;
    return IMMERSIVE_PHOTOS[idx];
}

// ============================================================
// BRAND ASSETS
// ============================================================

export const BRAND_ASSETS = {
    logoLight: "/assets/logos/30x-logo-light.svg",
    logoDark: "/assets/logos/30x-logo-dark.svg",
    logoAccent: "/assets/logos/30x-logo-accent.svg",
    globe: "/assets/brand/globe-americas.png",
    globeHero: "/assets/brand/globe.png",
    worldMap: "/assets/brand/world-map.svg",
    portada: "/assets/brand/portada-oficial.png",
} as const;

// ============================================================
// COMPANY LOGOS (for mentor cards — bottom-right style)
// ============================================================

export const COMPANY_LOGOS: Record<string, string> = {
    rappi: "/assets/companies/rappi.png",
    truora: "/assets/companies/truora.png",
    habi: "/assets/companies/habi.png",
    ontop: "/assets/companies/ontop.png",
    nubank: "/assets/companies/nubank.png",
    mercadolibre: "/assets/companies/mercadolibre.png",
    cabify: "/assets/companies/cabify.png",
    chiper: "/assets/companies/chiper.png",
    despegar: "/assets/companies/despegar.png",
    didi: "/assets/companies/didi.png",
    uber: "/assets/companies/uber.png",
    ifood: "/assets/companies/ifood.png",
    lemon: "/assets/companies/lemon.png",
    lulo: "/assets/companies/lulo.png",
    pomelo: "/assets/companies/pomelo.png",
    pedidosya: "/assets/companies/pedidosya.png",
    kueski: "/assets/companies/kueski.png",
    platzi: "/assets/companies/platzi.png",
    growthrockstar: "/assets/companies/growthrockstar.png",
};

export function getCompanyLogo(key?: string): string | null {
    if (!key) return null;
    const k = key.toLowerCase().replace(/\s+/g, "");
    return COMPANY_LOGOS[k] ?? null;
}

// ============================================================
// BACKGROUND IMAGES — legacy (victorian) fallback
// ============================================================

export const VICTORIAN_BACKGROUNDS = Array.from({ length: 34 }, (_, i) =>
    `/assets/backgrounds/victorian-${i}.png`,
);

export function getBackgroundForSeed(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % IMMERSIVE_PHOTOS.length;
    return IMMERSIVE_PHOTOS[idx];
}
