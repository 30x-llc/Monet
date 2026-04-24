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
    eyebrow?: string;
    headline: string;
    subtitle?: string;
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
    headline: string;
    subtitle?: string;
    stats: { value: string; label: string }[];
}

export interface PricingCtaSlide {
    type: "pricing-cta";
    headline: string;
    checklist: string[];
    price: string;
    paymentNote?: string;
    sidebar: { label: string; value: string }[];
    contact?: { name: string; role: string; details: string };
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
    // Seed context
    notes?: string;
    audioTranscript?: string;
    emailThread?: string;
}
