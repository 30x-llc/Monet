/**
 * 30X Design — Project + Slide types.
 *
 * A "Deck" (kept for backward-compat) is a Project of any format:
 * proposal / carousel-ig / story-ig / doc. Format determines the stage
 * canvas size and the set of slide layouts allowed.
 */

// ============================================================
// FORMAT / CANVAS
// ============================================================

export type ProjectFormat =
    | "prototype" // 1440 × 900 (app/web UI canvas)
    | "proposal" // 1920 × 1080 (16:9)
    | "carousel-ig" // 1080 × 1080 (1:1)
    | "story-ig" // 1080 × 1920 (9:16)
    | "doc" // 794 × 1123 (A4)
    | "other"; // free-form; resolved by Cora

export interface FormatSpec {
    id: ProjectFormat;
    label: string;
    width: number;
    height: number;
    description: string;
}

export const FORMATS: Record<ProjectFormat, FormatSpec> = {
    prototype: { id: "prototype", label: "Prototipo", width: 1440, height: 900, description: "App, landing o componente con el sistema 30X" },
    proposal: { id: "proposal", label: "Propuesta comercial", width: 1920, height: 1080, description: "Presentación 16:9 para propuestas y decks" },
    "carousel-ig": { id: "carousel-ig", label: "Carrusel Instagram", width: 1080, height: 1080, description: "Carrusel 1:1 para Instagram y LinkedIn" },
    "story-ig": { id: "story-ig", label: "Historia Instagram", width: 1080, height: 1920, description: "Story 9:16 para Instagram y WhatsApp" },
    doc: { id: "doc", label: "Documento", width: 794, height: 1123, description: "A4 para contratos, docs y one-pagers" },
    other: { id: "other", label: "Otro", width: 1440, height: 900, description: "Describe lo que quieres — Cora escoge el formato" },
};

// ============================================================
// COVERS
// ============================================================

export interface CoverHeroSlide {
    type: "cover-hero";
    headline: string;
    subtitle?: string;
    backgroundImage: string;
    meta?: { key: string; value: string; icon?: "clock" | "laptop" | "calendar" | "location" | "users" }[];
}

export interface CorporateCoverSlide {
    type: "corporate-cover";
    /** Layout variant.
     *  - "recognition" (THE corporate proposal cover, à la Andrés Bilbao):
     *    full-bleed photo + partner logo big top-left + 30X top-right +
     *    headline with one accent phrase + 2 short body paragraphs.
     *  - "bleed" (cinematic): full-bleed hero with overlay text bottom-left.
     *  - "split" (editorial): 50/50 text + image. */
    variant?: "recognition" | "bleed" | "split";
    eyebrow?: string;
    headline: string;
    /** Substring of `headline` to render in the brand accent color
     *  (e.g., "construir una relación de largo plazo"). Match must be
     *  case-sensitive and exact. Renderer falls back to plain text if
     *  the substring isn't found. Used by the recognition variant. */
    headlineAccent?: string;
    subtitle?: string;
    /** 1–3 short paragraphs (each ~25–55 words) that sit below the
     *  headline in the recognition variant. Reinforces the "alianza
     *  estratégica" framing — this is what makes the cover feel like a
     *  letter, not a slide. */
    bodyParagraphs?: string[];
    date?: string;
    backgroundImage?: string;
}

export interface CoverGlobeSlide {
    type: "cover-globe";
    headline: string;
    subtitle?: string;
}

// ============================================================
// 16:9 PROPOSAL-FOCUSED LAYOUTS
// ============================================================

export interface IntroMentorsSlide {
    type: "intro-mentors";
    /** Layout variant. "split" (default) = text+angles left, mentor cards
     *  right column. "grid" = headline centered top, mentor portraits in
     *  a grid below — better when the names themselves are the pitch and
     *  angles are optional. */
    variant?: "split" | "grid";
    title: string;
    pill?: string;
    description: string;
    angles: { title: string; description: string; icon?: string }[];
    mentors: { name: string; role: string; imageKey: string; company?: string; companyLogo?: string }[];
}

export interface ProblemCardsSlide {
    type: "problem-cards";
    headline: string;
    subtitle?: string;
    cards: { title: string; body: string }[];
}

export interface DiagnosticSlide {
    type: "diagnostic";
    eyebrow?: string;
    headline: string;
    subtitle?: string;
    findings: { title: string; description: string }[];
}

export interface CurriculumGridSlide {
    type: "curriculum-grid";
    headline: string;
    subtitle?: string;
    modules: { number: number | string; name: string; description: string }[];
}

export interface MentorGridSlide {
    type: "mentor-grid";
    headline: string;
    subtitle?: string;
    mentors: { name: string; role: string; imageKey: string; bio?: string }[];
}

export interface MentorDuoSlide {
    type: "mentor-duo";
    headline: string;
    mentors: { name: string; role: string; imageKey: string; bio?: string }[];
}

export interface MethodologySlide {
    type: "methodology";
    headline: string;
    subtitle?: string;
    steps: { number: number; title: string; description: string }[];
}

export interface ImpactSlide {
    type: "impact";
    /** Layout variant. "stats-row" (default) = row of equal-weight stat
     *  cards. "hero-number" = one giant stat centered + 2–3 supporting
     *  stats below, when ONE number is the hero (e.g., "$1.8M ROI"). */
    variant?: "stats-row" | "hero-number";
    headline: string;
    subtitle?: string;
    stats: { value: string; label: string }[];
    /** Optional context line that sits below the hero number in
     *  hero-number variant. Ignored by stats-row. */
    heroContext?: string;
}

export interface PricingCtaSlide {
    type: "pricing-cta";
    /** Layout variant. "split" (default) = headline + checklist + price
     *  on left, data sidebar + contact on right. "package" = two package
     *  cards side-by-side for comparing offers (basic vs premium,
     *  cohorte abierta vs edición privada). */
    variant?: "split" | "package";
    headline: string;
    checklist: string[];
    price: string;
    paymentNote?: string;
    sidebar: { label: string; value: string }[];
    contact?: { name: string; role: string; details: string };
    /** Only used by `package` variant. When present, overrides single
     *  checklist/price/sidebar with two independent packages. */
    packages?: {
        name: string;
        tagline?: string;
        price: string;
        priceNote?: string;
        features: string[];
        highlighted?: boolean;
    }[];
}

// ============================================================
// INSTAGRAM CAROUSEL (1:1)
// ============================================================

export interface IgCoverSlide {
    type: "ig-cover";
    eyebrow?: string;
    headline: string;
    subtitle?: string;
    backgroundImage?: string;
}

export interface IgTextSlide {
    type: "ig-text";
    number?: string; // "01" etc
    headline: string;
    body?: string;
}

export interface IgStatSlide {
    type: "ig-stat";
    value: string;
    label: string;
    footnote?: string;
}

export interface IgQuoteSlide {
    type: "ig-quote";
    quote: string;
    attribution?: string;
    imageKey?: string; // mentor key
}

export interface IgCtaSlide {
    type: "ig-cta";
    headline: string;
    subtitle?: string;
    ctaLabel: string;
}

// ============================================================
// INSTAGRAM STORY (9:16)
// ============================================================

export interface StoryCoverSlide {
    type: "story-cover";
    backgroundImage?: string;
    eyebrow?: string;
    headline: string;
    subtitle?: string;
    ctaLabel?: string;
}

export interface StoryTextSlide {
    type: "story-text";
    headline: string;
    body?: string;
    footer?: string;
}

// ============================================================
// DOCUMENT (A4 portrait)
// ============================================================

export interface DocCoverSlide {
    type: "doc-cover";
    eyebrow?: string;
    headline: string;
    subtitle?: string;
    date?: string;
    forClient?: string;
}

export interface DocSectionSlide {
    type: "doc-section";
    sectionNumber?: string;
    heading: string;
    paragraphs: string[];
    bullets?: string[];
}

/**
 * A flexible A4 page that flows like a Word document — multiple
 * sub-sections per page, dense paragraphs, optional tables/lists. This
 * is the WORKHORSE doc type. A page packs 2-4 blocks vertically so
 * sections don't each get their own near-empty page.
 */
export type DocBlock =
    | { kind: "heading"; text: string; level?: 1 | 2 }
    | { kind: "paragraph"; text: string }
    | { kind: "bullets"; items: string[] }
    | { kind: "numbered"; items: string[] }
    | { kind: "kv"; rows: { label: string; value: string }[] } // definition list — useful for terms / metadata
    | { kind: "table"; columns: string[]; rows: string[][] } // sober inline table
    | { kind: "callout"; text: string } // short emphasized note
    | { kind: "divider" };

export interface DocPageSlide {
    type: "doc-page";
    /** Optional small label that appears above the first heading
     *  (e.g., "Sección 02" or "Cláusula 3"). */
    pageLabel?: string;
    /** Vertical stack of content blocks. Pack 3-5 per page so the
     *  document feels dense, like a contract or report — not slide-y. */
    blocks: DocBlock[];
}

/**
 * Multi-column comparison table — the "Lo que cada uno pone sobre la mesa"
 * pattern from Andrés's Aeroméxico ref. Use for partnership/program/scope
 * comparisons. 3-6 columns × 4-8 rows. Each row is a structured
 * commitment side-by-side.
 */
export interface DocComparisonTableSlide {
    type: "doc-comparison-table";
    sectionNumber?: string;
    heading: string;
    subheading?: string;
    columns: string[]; // header row labels (3-6)
    rows: Array<{
        program?: string; // optional first-column label
        cells: string[]; // bullet-points per cell, separated by " · "
    }>;
}

/**
 * Hero stats panel with descriptive footer — the "Llegamos a una
 * audiencia que no llega nadie" pattern: 3 huge numbers + 5 mentor
 * headshots + caption. The numbers are the protagonists.
 */
export interface DocStatsHeroSlide {
    type: "doc-stats-hero";
    sectionNumber?: string;
    heading: string;
    subheading?: string; // typically used as the lime-accented qualifier
    stats: { value: string; label: string }[]; // 3 stats
    mentors?: { imageKey: string; name: string; role: string }[]; // up to 5
}

/**
 * Mentor wall + brand logos — "30X es la mejor educación..." pattern.
 * 3 stats top-left, mentor portrait grid right (10-15 mentors), brand
 * logos strip below the stats. Country list as eyebrow.
 */
export interface DocMentorWallSlide {
    type: "doc-mentor-wall";
    sectionNumber?: string;
    heading: string;
    stats: { value: string; label: string }[]; // 3 stats
    countries?: string[]; // ["MÉXICO", "COLOMBIA", ...]
    context?: string; // short paragraph of context
    mentors: { imageKey: string; name?: string }[]; // up to 15 portraits
    brandLogos?: string[]; // company keys: ["femsa", "google", "netflix", ...]
}

/**
 * Single mentor spotlight — the Andrés Bilbao bio page. Mentor portrait
 * full-bleed left, structured bio + sections + brand badges + credentials
 * right. For partnership pitches that lead with a known operator.
 */
export interface DocMentorSpotlightSlide {
    type: "doc-mentor-spotlight";
    sectionNumber?: string;
    mentor: { imageKey: string; name: string; role: string };
    badges?: string[]; // ["Rappi Co-founder", "30X CEO", ...]
    sections: { title: string; body: string }[]; // 3-5 short bio sections
    credentials?: string; // education / extras footer line
}

// ============================================================
// PROTOTYPE FRAME (app/web UI mockup with 30X design system)
// ============================================================

export interface PrototypeFrameSlide {
    type: "prototype-frame";
    appName: string;
    subtitle?: string;
    kind?: "app" | "landing" | "component";
    nav?: string[]; // top nav labels
    sidebar?: { label: string; active?: boolean }[]; // optional left nav
    headline: string;
    description?: string;
    primaryCta?: string;
    stats?: { value: string; label: string }[]; // up to 3
    listRows?: { title: string; meta?: string; badge?: string }[]; // rows in a table/list card
}

// ============================================================
// GENERIC FALLBACK
// ============================================================

export interface ContentSlide {
    type: "content";
    headline: string;
    body?: string;
    bullets?: string[];
}

// ============================================================
// UNION
// ============================================================

export type Slide =
    | CoverHeroSlide
    | CorporateCoverSlide
    | CoverGlobeSlide
    | IntroMentorsSlide
    | ProblemCardsSlide
    | DiagnosticSlide
    | CurriculumGridSlide
    | MentorGridSlide
    | MentorDuoSlide
    | MethodologySlide
    | ImpactSlide
    | PricingCtaSlide
    | IgCoverSlide
    | IgTextSlide
    | IgStatSlide
    | IgQuoteSlide
    | IgCtaSlide
    | StoryCoverSlide
    | StoryTextSlide
    | DocCoverSlide
    | DocSectionSlide
    | DocPageSlide
    | DocComparisonTableSlide
    | DocStatsHeroSlide
    | DocMentorWallSlide
    | DocMentorSpotlightSlide
    | PrototypeFrameSlide
    | ContentSlide;

export interface Deck {
    deckTitle: string;
    companyName: string;
    programName: string;
    programId?: string;
    clientLogoUrl?: string;
    format?: ProjectFormat; // defaults to "proposal"
    slides: Slide[];
    generatedAt: string;
    theme?: "dark" | "light";
}

// Backward-compat alias
export type Project = Deck;

export interface ResearchResult {
    companyName: string;
    industry: string;
    size: string;
    headquarters: string;
    leadership: string[];
    painPoints: string[];
    recentNews: string[];
    relevantContext: string;
    /** One-line positioning used in the flattering cover copy
     *  (e.g. "aerolínea predilecta de clientes premium en LATAM"). */
    positioning?: string;
    /** Direct URL to the company logo (prefer PNG/SVG). */
    logoUrl?: string;
    /** Direct URL to a cinematic photo of the company's world
     *  (airplane for Aeroméxico, gym for Action Black, …). */
    heroImageUrl?: string;
    /** Notes the salesperson added after reviewing the auto-research —
     *  call notes, intel the model can't find publicly, specific asks
     *  from the client. Piped into the generator prompt verbatim. */
    callNotes?: string;
    /** Signature phrases the company uses about itself. Aeroméxico
     *  says "premium" everywhere, Action Black has "We're not a fucking
     *  gym". Pull verbatim from the corpus — this is the language the
     *  cover headline and body should mirror to make the client blush. */
    clientLanguage?: string[];
    /** Candidate logo URLs scraped from Exa results (page hero images
     *  from official + Wikipedia pages). Synth picks the best, but we
     *  surface the rest in the review screen so the salesperson can swap
     *  if the picked one is wrong. */
    logoCandidates?: string[];
    /** Same idea for the cover hero image (cinematic photo of the
     *  company's world). */
    heroCandidates?: string[];
    decisionMaker?: string;
    objective?: string;
    budget?: string;
}

export interface IntakeAnswers {
    clientName: string;
    // Proposal-specific
    decisionMaker?: string;
    sector?: string;
    companySize?: string;
    objective?: string;
    format?: "presencial" | "virtual" | "hybrid";
    budget?: string;
    // Generic (used by prototype, carousel, story, doc, other)
    topic?: string;
    audience?: string;
    hook?: string;
    ctaLabel?: string;
    tone?: string;
    keyScreens?: string;
    suggestedFormat?: ProjectFormat;
    theme?: "dark" | "light";
    // Propuesta: tipo (Comercial, Speaker, Marca, Partnership, Estratégica, Otra)
    proposalType?: string;
    // Project title as typed in the home (deck title / file name, separate from clientName)
    projectName?: string;
    // Free-form context the user adds at the END of the intake
    finalNotes?: string;
    // Seed context
    notes?: string;
    audioTranscript?: string;
    emailThread?: string;
}
