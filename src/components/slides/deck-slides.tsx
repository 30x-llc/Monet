import type { ReactNode } from "react";
import type {
    CoverHeroSlide,
    CorporateCoverSlide,
    CoverGlobeSlide,
    IntroMentorsSlide,
    ProblemCardsSlide,
    DiagnosticSlide,
    CurriculumGridSlide,
    MentorGridSlide,
    MentorDuoSlide,
    MethodologySlide,
    ImpactSlide,
    PricingCtaSlide,
    ContentSlide,
    IgCoverSlide,
    IgTextSlide,
    IgStatSlide,
    IgQuoteSlide,
    IgCtaSlide,
    StoryCoverSlide,
    StoryTextSlide,
    DocCoverSlide,
    DocSectionSlide,
    DocPageSlide,
    DocBlock,
    DocComparisonTableSlide,
    DocStatsHeroSlide,
    DocMentorWallSlide,
    DocMentorSpotlightSlide,
    PrototypeFrameSlide,
    SidebarIconKey,
    Slide,
} from "@/lib/slide-types";
import { getMentorImage, BRAND_ASSETS, getCompanyLogo, getImmersivePhoto } from "@/lib/assets";

const LOGO_LIGHT = BRAND_ASSETS.logoLight;
const LOGO_ACCENT = BRAND_ASSETS.logoAccent;
const GLOBE = BRAND_ASSETS.globe;
const PORTADA = BRAND_ASSETS.portada;

/**
 * Route external image URLs through our same-origin /api/logo-proxy
 * so Chrome's Opaque Response Blocking does not drop the image. Local
 * paths (starting with `/`) and data URIs pass through unchanged.
 */
function proxyExternal(url: string): string {
    if (!url) return url;
    if (url.startsWith("/") || url.startsWith("data:")) return url;
    return `/api/logo-proxy?url=${encodeURIComponent(url)}`;
}

// -------- Icons (Heroicons-ish strokes matching the reference) --------

function IconClock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}
function IconLaptop() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="12" rx="1.5" />
            <path d="M2 19h20" />
        </svg>
    );
}
function IconCalendar() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="1.5" />
            <path d="M3 9h18" />
            <path d="M8 3v4M16 3v4" />
        </svg>
    );
}
function IconLocation() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
            <circle cx="12" cy="9" r="2.5" />
        </svg>
    );
}
function IconUsers() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M16 14.5c3 .3 5.5 2.2 5.5 5.5" />
        </svg>
    );
}
function IconTarget() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        </svg>
    );
}
function IconRefresh() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v4h-4" />
        </svg>
    );
}
function IconChart() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-6" />
            <path d="M22 20v-10" />
        </svg>
    );
}

function pickMetaIcon(key?: string) {
    switch (key) {
        case "clock":
            return <IconClock />;
        case "laptop":
            return <IconLaptop />;
        case "calendar":
            return <IconCalendar />;
        case "location":
            return <IconLocation />;
        case "users":
            return <IconUsers />;
        default:
            return <IconClock />;
    }
}

function pickAngleIcon(key?: string) {
    switch (key) {
        case "target":
            return <IconTarget />;
        case "refresh":
            return <IconRefresh />;
        case "chart":
            return <IconChart />;
        case "users":
            return <IconUsers />;
        default:
            return <IconTarget />;
    }
}

// -------- Shared optional editorial background for interior slides --------
// Light, sober wash so text stays the focus. Theme-aware via CSS vars
// inherited from .deck-stage. The overlay is heavier in light mode so
// the photo doesn't fight the slide copy.
function SoftBackground({ url }: { url?: string }) {
    if (!url) return null;
    return <div className="soft-bg" data-element-path='["backgroundImage"]'>
        <img src={proxyExternal(url)} alt="" />
        <div className="soft-bg-veil" />
    </div>;
}

// -------- Shared client logo (top-right when deck.clientLogoUrl is set) --------

function LogoMarks({ clientLogoUrl }: { clientLogoUrl?: string }) {
    return (
        <>
            <img className="logo-mark" src={LOGO_LIGHT} alt="30X" />
            {clientLogoUrl ? (
                <img
                    className="client-logo"
                    src={clientLogoUrl}
                    alt="Cliente"
                    onError={(e) => {
                        // Hide a broken partner logo rather than showing
                        // the default "broken image" icon in the top-right.
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : null}
        </>
    );
}

// ============================================================
// SLIDE COMPONENTS
// ============================================================

export function CoverHero({ slide, clientLogoUrl }: { slide: CoverHeroSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-cover">
            <div className="bg-img">
                <img src={slide.backgroundImage} alt="" />
            </div>
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="title-wrap">
                <h1 className="h-cover">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
            </div>
            {slide.meta && slide.meta.length > 0 ? (
                <div className="meta">
                    {slide.meta.map((m, i) => (
                        <div key={i} className="item">
                            <div className="icon">{pickMetaIcon(m.icon)}</div>
                            <div>
                                <div className="k">{m.key}</div>
                                <div className="v">{m.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

export function CorporateCover({ slide, clientLogoUrl }: { slide: CorporateCoverSlide; clientLogoUrl?: string }) {
    const variant = slide.variant ?? "recognition";
    if (variant === "split") return <CorporateCoverSplit slide={slide} clientLogoUrl={clientLogoUrl} />;
    if (variant === "bleed") return <CorporateCoverBleed slide={slide} clientLogoUrl={clientLogoUrl} />;
    return <CorporateCoverRecognition slide={slide} clientLogoUrl={clientLogoUrl} />;
}

/**
 * Recognition cover — the canonical Andrés Bilbao corporate proposal
 * pattern. "30X reconoce a [X] como [POSITIONING] y quiere [PROPOSITION]."
 *
 * Layout: full-bleed dark photo + partner logo big top-left + 30X
 * top-right + headline center-left with one accent phrase + 1–3 body
 * paragraphs below. The whole slide reads like an opening letter.
 */
function CorporateCoverRecognition({
    slide,
    clientLogoUrl,
}: {
    slide: CorporateCoverSlide;
    clientLogoUrl?: string;
}) {
    const bg = slide.backgroundImage || PORTADA;
    const accent = slide.headlineAccent?.trim();
    const paragraphs = (slide.bodyParagraphs ?? []).filter(Boolean);

    // Split the headline so we can wrap the accent substring in a
    // styled span while preserving the rest of the text. If the accent
    // isn't found in the headline we just render the headline as-is.
    let headlineNodes: ReactNode = slide.headline;
    if (accent && slide.headline.includes(accent)) {
        const idx = slide.headline.indexOf(accent);
        const before = slide.headline.slice(0, idx);
        const after = slide.headline.slice(idx + accent.length);
        headlineNodes = (
            <>
                {before}
                <span className="accent">{accent}</span>
                {after}
            </>
        );
    }

    return (
        <section className="deck-slide s-corp-recognition">
            <div className="bg-img">
                <img
                    src={bg}
                    alt=""
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src !== PORTADA) img.src = PORTADA;
                    }}
                />
            </div>
            {/* Custom corner marks instead of the shared LogoMarks so we
                can size the partner logo big like Andrés's reference. */}
            {clientLogoUrl ? (
                <img
                    className="partner-mark"
                    src={clientLogoUrl}
                    alt="Partner"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : null}
            <img className="brand-mark" src={LOGO_LIGHT} alt="30X" />
            <div className="content">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="headline">{headlineNodes}</h1>
                {paragraphs.length > 0 ? (
                    <div className="body">
                        {paragraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                ) : slide.subtitle ? (
                    <div className="body">
                        <p>{slide.subtitle}</p>
                    </div>
                ) : null}
            </div>
            {slide.date ? <div className="date">{slide.date}</div> : null}
        </section>
    );
}

function CorporateCoverBleed({ slide, clientLogoUrl }: { slide: CorporateCoverSlide; clientLogoUrl?: string }) {
    const bg = slide.backgroundImage || PORTADA;
    return (
        <section className="deck-slide s-corp-cover">
            <div className="bg-img">
                <img
                    src={bg}
                    alt=""
                    onError={(e) => {
                        // Hero URLs from web_search sometimes expire or 404.
                        // Fall back to the 30x portada so the cover never
                        // renders as a broken image icon.
                        const img = e.currentTarget;
                        if (img.src !== PORTADA) img.src = PORTADA;
                    }}
                />
            </div>
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            {clientLogoUrl ? (
                <img
                    className="hero-client-logo"
                    src={clientLogoUrl}
                    alt="Partner"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
            ) : null}
            <div className="title-wrap">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="h-cover">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
            </div>
            {slide.date ? <div className="date">{slide.date}</div> : null}
        </section>
    );
}

function CorporateCoverSplit({ slide, clientLogoUrl }: { slide: CorporateCoverSlide; clientLogoUrl?: string }) {
    const bg = slide.backgroundImage || PORTADA;
    return (
        <section className="deck-slide s-corp-cover-split">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="left">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="h-cover">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
                {slide.date ? <div className="date">{slide.date}</div> : null}
                {clientLogoUrl ? (
                    <div className="partner-strip">
                        <span className="partner-label">Para</span>
                        <img
                            src={clientLogoUrl}
                            alt="Partner"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                ) : null}
            </div>
            <div className="right">
                <img
                    src={bg}
                    alt=""
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src !== PORTADA) img.src = PORTADA;
                    }}
                />
            </div>
        </section>
    );
}

export function IntroMentors({ slide, clientLogoUrl }: { slide: IntroMentorsSlide; clientLogoUrl?: string }) {
    const variant = slide.variant ?? "split";
    if (variant === "grid") return <IntroMentorsGrid slide={slide} clientLogoUrl={clientLogoUrl} />;
    return <IntroMentorsSplit slide={slide} clientLogoUrl={clientLogoUrl} />;
}

function IntroMentorsSplit({ slide, clientLogoUrl }: { slide: IntroMentorsSlide; clientLogoUrl?: string }) {
    const mentors = Array.isArray(slide.mentors) ? slide.mentors : [];
    const angles = Array.isArray(slide.angles) ? slide.angles : [];
    const singleCol = mentors.length <= 2;
    return (
        <section className="deck-slide s-intro">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="left">
                <h2 className="title-big">{slide.title}</h2>
                {slide.pill ? <span className="pill">{slide.pill}</span> : null}
                <p className="desc">{slide.description}</p>
                <div className="angles">
                    {angles.map((a, i) => (
                        <div key={i} className="angle" data-element-path={JSON.stringify(["angles", i])}>
                            <div className="ic">{pickAngleIcon(a.icon)}</div>
                            <div>
                                <h3 className="t">{a.title}</h3>
                                <p className="d">{a.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`mentors-col${singleCol ? " single" : ""}`}>
                {mentors.map((m, i) => {
                    const companyLogo = m.companyLogo || getCompanyLogo(m.company);
                    return (
                        <div key={i} className="m-card" data-element-path={JSON.stringify(["mentors", i])}>
                            <div className="portrait">
                                <img src={getMentorImage(m.imageKey)} alt={m.name} />
                            </div>
                            <div className="meta">
                                {m.company ? (
                                    <div className="company">
                                        {companyLogo ? <img src={companyLogo} alt="" /> : null}
                                        {m.company}
                                    </div>
                                ) : null}
                                <h3 className="name">{m.name}</h3>
                                <p className="role">{m.role}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function IntroMentorsGrid({ slide, clientLogoUrl }: { slide: IntroMentorsSlide; clientLogoUrl?: string }) {
    const mentors = Array.isArray(slide.mentors) ? slide.mentors : [];
    // 6 max in a 3x2 grid; fall back to 4 in 2x2 if fewer provided.
    const visible = mentors.slice(0, 6);
    const cols = visible.length <= 4 ? 2 : 3;
    return (
        <section className="deck-slide s-intro-grid">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                {slide.pill ? <div className="eyebrow">{slide.pill}</div> : null}
                <h2 className="h-title">{slide.title}</h2>
                {slide.description ? <p className="lead p-lead">{slide.description}</p> : null}
            </div>
            <div className="m-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {visible.map((m, i) => {
                    const companyLogo = m.companyLogo || getCompanyLogo(m.company);
                    return (
                        <div key={i} className="m-tile" data-element-path={JSON.stringify(["mentors", i])}>
                            <div className="portrait">
                                <img src={getMentorImage(m.imageKey)} alt={m.name} />
                            </div>
                            <div className="meta">
                                <h3 className="name">{m.name}</h3>
                                <p className="role">{m.role}</p>
                                {m.company ? (
                                    <div className="company">
                                        {companyLogo ? <img src={companyLogo} alt="" /> : null}
                                        <span>{m.company}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function ProblemCards({ slide, clientLogoUrl }: { slide: ProblemCardsSlide; clientLogoUrl?: string }) {
    return (
        <section className={`deck-slide s-problem${slide.backgroundImage ? " has-bg" : ""}`}>
            <SoftBackground url={slide.backgroundImage} />
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? (
                <p className="lead p-lead" data-element-path='["subtitle"]'>{slide.subtitle}</p>
            ) : null}
            <div className="grid">
                {(Array.isArray(slide.cards) ? slide.cards : []).slice(0, 6).map((c, i) => (
                    <div key={i} data-element-path={JSON.stringify(["cards", i])}>
                        <h3 className="card-title">{c.title}</h3>
                        <p className="card-body">{c.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function Diagnostic({ slide, clientLogoUrl }: { slide: DiagnosticSlide; clientLogoUrl?: string }) {
    return (
        <section className={`deck-slide s-diagnostic${slide.backgroundImage ? " has-bg" : ""}`}>
            <SoftBackground url={slide.backgroundImage} />
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead" data-element-path='["subtitle"]'>{slide.subtitle}</p> : null}
            <div className="findings">
                {(Array.isArray(slide.findings) ? slide.findings : []).slice(0, 3).map((f, i) => (
                    <div key={i} className="finding" data-element-path={JSON.stringify(["findings", i])}>
                        <div className="n">Hallazgo {String(i + 1).padStart(2, "0")}</div>
                        <h3 className="t">{f.title}</h3>
                        <p className="d">{f.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function CurriculumGrid({ slide, clientLogoUrl }: { slide: CurriculumGridSlide; clientLogoUrl?: string }) {
    const modules = Array.isArray(slide.modules) ? slide.modules : [];
    const twoRows = modules.length > 4;
    return (
        <section className={`deck-slide s-curric${twoRows ? " rows-2" : ""}${slide.backgroundImage ? " has-bg" : ""}`}>
            <SoftBackground url={slide.backgroundImage} />
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead p-lead" data-element-path='["subtitle"]'>{slide.subtitle}</p> : null}
            <div className="weeks">
                {modules.slice(0, 8).map((m, i) => (
                    <div key={i} className="week" data-element-path={JSON.stringify(["modules", i])}>
                        <div className="n">{typeof m.number === "number" ? `Módulo ${m.number}` : m.number}</div>
                        <div className="t">{m.name}</div>
                        <div className="d">{m.description}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function MentorGrid({ slide, clientLogoUrl }: { slide: MentorGridSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-mentors">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead" data-element-path='["subtitle"]'>{slide.subtitle}</p> : null}
            <div className="people">
                {(Array.isArray(slide.mentors) ? slide.mentors : []).slice(0, 4).map((m, i) => (
                    <div key={i} className="person" data-element-path={JSON.stringify(["mentors", i])}>
                        <div className="portrait">
                            <img src={getMentorImage(m.imageKey)} alt={m.name} />
                        </div>
                        <div className="person-text">
                            <h3 className="name">{m.name}</h3>
                            <p className="role">{m.role}</p>
                            {m.bio ? <p className="bio">{m.bio}</p> : null}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function MentorDuo({ slide, clientLogoUrl }: { slide: MentorDuoSlide; clientLogoUrl?: string }) {
    // Reuse the same grid layout with 2 cards
    return (
        <section className="deck-slide s-mentors">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            <div className="people" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 1280, margin: "auto auto 0" }}>
                {(Array.isArray(slide.mentors) ? slide.mentors : []).slice(0, 2).map((m, i) => (
                    <div key={i} className="person" data-element-path={JSON.stringify(["mentors", i])}>
                        <div className="portrait">
                            <img src={getMentorImage(m.imageKey)} alt={m.name} />
                        </div>
                        <div className="person-text">
                            <h3 className="name">{m.name}</h3>
                            <p className="role">{m.role}</p>
                            {m.bio ? <p className="bio">{m.bio}</p> : null}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function Methodology({ slide, clientLogoUrl }: { slide: MethodologySlide; clientLogoUrl?: string }) {
    return (
        <section className={`deck-slide s-methodology${slide.backgroundImage ? " has-bg" : ""}`}>
            <SoftBackground url={slide.backgroundImage} />
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead" data-element-path='["subtitle"]'>{slide.subtitle}</p> : null}
            <div className="steps">
                {(Array.isArray(slide.steps) ? slide.steps : []).slice(0, 4).map((s, i) => (
                    <div key={i} className="step" data-element-path={JSON.stringify(["steps", i])}>
                        <div className="n">{String(s.number).padStart(2, "0")}</div>
                        <h3 className="t">{s.title}</h3>
                        <p className="d">{s.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function Impact({ slide, clientLogoUrl }: { slide: ImpactSlide; clientLogoUrl?: string }) {
    const variant = slide.variant ?? "stats-row";
    if (variant === "hero-number") return <ImpactHeroNumber slide={slide} clientLogoUrl={clientLogoUrl} />;
    return <ImpactStatsRow slide={slide} clientLogoUrl={clientLogoUrl} />;
}

function ImpactStatsRow({ slide, clientLogoUrl }: { slide: ImpactSlide; clientLogoUrl?: string }) {
    return (
        <section className={`deck-slide s-impact${slide.backgroundImage ? " has-bg" : ""}`}>
            <SoftBackground url={slide.backgroundImage} />
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead" data-element-path='["subtitle"]'>{slide.subtitle}</p> : null}
            <div className="stats">
                {(Array.isArray(slide.stats) ? slide.stats : []).slice(0, 4).map((s, i) => (
                    <div key={i} className="stat" data-element-path={JSON.stringify(["stats", i])}>
                        <div className="v">{s.value}</div>
                        <p className="k">{s.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ImpactHeroNumber({ slide, clientLogoUrl }: { slide: ImpactSlide; clientLogoUrl?: string }) {
    const stats = Array.isArray(slide.stats) ? slide.stats : [];
    const [hero, ...supporting] = stats;
    return (
        <section className="deck-slide s-impact-hero">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            {slide.subtitle ? <div className="eyebrow">{slide.subtitle}</div> : null}
            <h2 className="h-title">{slide.headline}</h2>
            {hero ? (
                <div className="hero-stat">
                    <div className="v">{hero.value}</div>
                    <p className="k">{hero.label}</p>
                </div>
            ) : null}
            {slide.heroContext ? <p className="context">{slide.heroContext}</p> : null}
            {supporting.length > 0 ? (
                <div className="supporting">
                    {supporting.slice(0, 3).map((s, i) => (
                        <div key={i} className="stat">
                            <div className="v">{s.value}</div>
                            <p className="k">{s.label}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

export function PricingCta({ slide, clientLogoUrl }: { slide: PricingCtaSlide; clientLogoUrl?: string }) {
    const variant = slide.variant ?? "split";
    if (variant === "package" && slide.packages && slide.packages.length > 0) {
        return <PricingCtaPackage slide={slide} clientLogoUrl={clientLogoUrl} />;
    }
    return <PricingCtaSplit slide={slide} clientLogoUrl={clientLogoUrl} />;
}

function PricingCtaSplit({ slide, clientLogoUrl }: { slide: PricingCtaSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-invest">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="left">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
                <div className="get-label">Lo que recibirás:</div>
                <ul className="gets">
                    {(Array.isArray(slide.checklist) ? slide.checklist : []).slice(0, 6).map((item, i) => (
                        <li key={i} data-element-path={JSON.stringify(["checklist", i])}>{item}</li>
                    ))}
                </ul>
                <div className="price-block">
                    <div className="lab">Inversión</div>
                    <div className="amt">
                        <span className="big">{slide.price}</span>
                    </div>
                    {slide.paymentNote ? <div className="pay">{slide.paymentNote}</div> : null}
                </div>
            </div>
            <div className="right">
                <div className="facts">
                    {(Array.isArray(slide.sidebar) ? slide.sidebar : []).map((row, i) => (
                        <div key={i} className="row" data-element-path={JSON.stringify(["sidebar", i])}>
                            <div className="k">{row.label}</div>
                            <div className="v">{row.value}</div>
                        </div>
                    ))}
                </div>
                {slide.contact ? (
                    <div className="contact">
                        <div className="cn">{slide.contact.name}</div>
                        <div className="cr">{slide.contact.role}</div>
                        <div className="cm" style={{ whiteSpace: "pre-line" }}>{slide.contact.details}</div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

function PricingCtaPackage({ slide, clientLogoUrl }: { slide: PricingCtaSlide; clientLogoUrl?: string }) {
    const packages = (slide.packages ?? []).slice(0, 2);
    return (
        <section className="deck-slide s-invest-pkg">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title" data-element-path='["headline"]'>{slide.headline}</h2>
            </div>
            <div className="pkg-grid">
                {packages.map((pkg, i) => (
                    <div
                        key={i}
                        className={`pkg${pkg.highlighted ? " is-hero" : ""}`}
                        data-element-path={JSON.stringify(["packages", i])}
                    >
                        {pkg.highlighted ? <div className="ribbon">Recomendado</div> : null}
                        <div className="pkg-name">{pkg.name}</div>
                        {pkg.tagline ? <div className="pkg-tag">{pkg.tagline}</div> : null}
                        <div className="pkg-price">
                            <span className="big">{pkg.price}</span>
                            {pkg.priceNote ? <span className="pay">{pkg.priceNote}</span> : null}
                        </div>
                        <ul className="pkg-features">
                            {pkg.features.slice(0, 6).map((f, fi) => (
                                <li key={fi}>{f}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            {slide.contact ? (
                <div className="pkg-contact">
                    <span className="cn">{slide.contact.name}</span>
                    <span className="cr">· {slide.contact.role}</span>
                    <span className="cm">· {slide.contact.details}</span>
                </div>
            ) : null}
        </section>
    );
}

export function CoverGlobe({ slide, clientLogoUrl }: { slide: CoverGlobeSlide; clientLogoUrl?: string }) {
    // Closing slide for proposals: full-bleed Portada Oficial 30x background
    // with a centered "30X | <partner-logo>" lockup. Falls back to the legacy
    // globe + headline layout when there is no partner logo.
    if (clientLogoUrl) {
        // Closing slide is logo-only by design. No headline, no subtitle,
        // no caption — just the 30X | partner lockup centered on the
        // Portada Oficial background. Per Juan Diego: "centrado, centrado,
        // centrado", small logos, tight gap between the three elements.
        return (
            <section className="deck-slide s-end-portada">
                <div className="bg">
                    <img src={PORTADA} alt="" />
                    <div className="overlay" />
                </div>
                <div className="lockup">
                    <img className="lockup-30x" src={LOGO_LIGHT} alt="30X" />
                    <span className="lockup-divider" aria-hidden />
                    {/*
                       Use <img> with a fixed height so wide wordmarks
                       (Aeroméxico is 6:1) render at the same visual
                       height as 30X. width:auto lets aspect drive the
                       width. SVGs missing intrinsic dimensions get
                       overridden by the curated /assets/logos/30x-members
                       set upstream, so all logos that reach this point
                       carry width/height. Cross-origin URLs go through
                       /api/logo-proxy to sidestep Chrome's ORB.
                    */}
                    <img
                        className="lockup-partner"
                        src={proxyExternal(clientLogoUrl)}
                        alt="Logo del aliado"
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="deck-slide s-end">
            <div className="globe">
                <img src={GLOBE} alt="" />
            </div>
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="content">
                <img className="logo30" src={LOGO_ACCENT} alt="30X" />
                <div className="line">{slide.headline || "La mejor educación ejecutiva de Latinoamérica."}</div>
                {slide.subtitle ? (
                    <div className="line" style={{ fontSize: 28, color: "rgba(255,255,255,.6)", marginTop: 18 }}>
                        {slide.subtitle}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export function Content({ slide, clientLogoUrl }: { slide: ContentSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-problem">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.body ? <p className="lead p-lead">{slide.body}</p> : null}
            {slide.bullets && slide.bullets.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: "auto 0 0 0", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                    {slide.bullets.map((b, i) => (
                        <li
                            key={i}
                            style={{
                                background: "#0a0a0a",
                                border: "1px solid #222",
                                padding: "32px 28px",
                                font: "400 24px/1.3 'Inter Display'",
                                letterSpacing: "-0.015em",
                                color: "rgba(255,255,255,0.85)",
                            }}
                        >
                            {b}
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}

// ============================================================
// IG CAROUSEL (1080 × 1080)
// ============================================================

export function IgCover({ slide }: { slide: IgCoverSlide }) {
    return (
        <section className="deck-slide s-ig-cover">
            {slide.backgroundImage ? (
                <div className="bg">
                    <img src={slide.backgroundImage} alt="" />
                </div>
            ) : null}
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <div className="body">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="h">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
            </div>
        </section>
    );
}

export function IgText({ slide }: { slide: IgTextSlide }) {
    return (
        <section className="deck-slide s-ig-text">
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            {slide.number ? <div className="num">{slide.number}</div> : null}
            <h2 className="h">{slide.headline}</h2>
            {slide.body ? <p className="body">{slide.body}</p> : null}
            <div className="footer">30X</div>
        </section>
    );
}

export function IgStat({ slide }: { slide: IgStatSlide }) {
    return (
        <section className="deck-slide s-ig-stat">
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <div className="v">{slide.value}</div>
            <div className="k">{slide.label}</div>
            {slide.footnote ? <div className="foot">{slide.footnote}</div> : null}
        </section>
    );
}

export function IgQuote({ slide }: { slide: IgQuoteSlide }) {
    const hasImage = !!slide.imageKey;
    return (
        <section className={`deck-slide s-ig-quote${hasImage ? " has-image" : ""}`}>
            {hasImage ? (
                <div className="portrait">
                    <img src={getMentorImage(slide.imageKey!)} alt="" />
                </div>
            ) : null}
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <div className="body">
                <div className="mark">&ldquo;</div>
                <p className="q">{slide.quote}</p>
                {slide.attribution ? <div className="attr">— {slide.attribution}</div> : null}
            </div>
        </section>
    );
}

export function IgCta({ slide }: { slide: IgCtaSlide }) {
    return (
        <section className="deck-slide s-ig-cta">
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <h2 className="h">{slide.headline}</h2>
            {slide.subtitle ? <p className="sub">{slide.subtitle}</p> : null}
            <div className="cta">{slide.ctaLabel}</div>
        </section>
    );
}

// ============================================================
// IG STORY (1080 × 1920)
// ============================================================

export function StoryCover({ slide }: { slide: StoryCoverSlide }) {
    return (
        <section className="deck-slide s-story-cover">
            {slide.backgroundImage ? (
                <div className="bg">
                    <img src={slide.backgroundImage} alt="" />
                </div>
            ) : null}
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <div className="body">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="h">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
            </div>
            {slide.ctaLabel ? <div className="cta">{slide.ctaLabel}</div> : null}
        </section>
    );
}

export function StoryText({ slide }: { slide: StoryTextSlide }) {
    return (
        <section className="deck-slide s-story-text">
            <img className="brand" src={LOGO_LIGHT} alt="30X" />
            <h1 className="h">{slide.headline}</h1>
            {slide.body ? <p className="body">{slide.body}</p> : null}
            {slide.footer ? <div className="footer">{slide.footer}</div> : null}
        </section>
    );
}

// ============================================================
// DOCUMENT (A4 794 × 1123)
// ============================================================

function DocHeader({ pageLabel }: { pageLabel?: string }) {
    return (
        <div className="hdr">
            <img className="mark" src={BRAND_ASSETS.logoDark} alt="30X" />
            {pageLabel ? <div className="pg">{pageLabel}</div> : null}
        </div>
    );
}

export function DocCover({ slide }: { slide: DocCoverSlide }) {
    return (
        <section className="deck-slide s-doc s-doc-cover">
            <DocHeader pageLabel={slide.eyebrow} />
            <div>
                <div className="eyebrow">{slide.eyebrow}</div>
                <h1 className="h">{slide.headline}</h1>
                {slide.subtitle ? <p className="sub">{slide.subtitle}</p> : null}
            </div>
            <div className="meta">
                {slide.forClient ? (
                    <div>
                        <div className="k">Preparado para</div>
                        <div className="v">{slide.forClient}</div>
                    </div>
                ) : null}
                {slide.date ? (
                    <div>
                        <div className="k">Fecha</div>
                        <div className="v">{slide.date}</div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export function DocSection({ slide, pageNumber }: { slide: DocSectionSlide; pageNumber?: number }) {
    return (
        <section className="deck-slide s-doc s-doc-section">
            <DocHeader pageLabel={pageNumber ? `Página ${pageNumber}` : undefined} />
            {slide.sectionNumber ? <div className="secnum">Sección {slide.sectionNumber}</div> : null}
            <h2 className="secheading">{slide.heading}</h2>
            {(Array.isArray(slide.paragraphs) ? slide.paragraphs : []).map((p, i) => (
                <p key={i} className="p">
                    {p}
                </p>
            ))}
            {slide.bullets && slide.bullets.length > 0 ? (
                <ul className="bullets">
                    {slide.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}

/**
 * DocPage — flexible A4 page with hero band on top + dense flowing
 * content below. Word-doc / contract feel for the body, magazine-cover
 * feel for the header. Each page has:
 *   - Hero band (top ~30%): immersive photo bg + dark gradient + lockup
 *     "30X | <partner-logo>" + section label + section heading + page #
 *   - Body: vertical stack of blocks (paragraphs, lists, tables, etc).
 *
 * The first block in `blocks` is expected to be a `heading` and is
 * surfaced into the hero band. Remaining blocks render in the body.
 */
export function DocPage({
    slide,
    pageNumber,
    clientLogoUrl,
}: {
    slide: DocPageSlide;
    pageNumber?: number;
    clientLogoUrl?: string;
}) {
    const blocks = Array.isArray(slide.blocks) ? slide.blocks : [];
    // Pull the first heading block into the hero — that's the section title.
    const firstHeadingIdx = blocks.findIndex((b) => b.kind === "heading");
    const heroHeading =
        firstHeadingIdx >= 0
            ? (blocks[firstHeadingIdx] as Extract<DocBlock, { kind: "heading" }>).text
            : slide.pageLabel ?? "";
    const bodyBlocks = blocks.filter((_, i) => i !== firstHeadingIdx);

    // Pick a deterministic immersive photo so re-renders stay stable.
    const heroBg = getImmersivePhoto(heroHeading || `page-${pageNumber}`);

    return (
        <section className="deck-slide s-doc s-doc-page">
            <div className="hero">
                <div className="hero-bg">
                    <img src={heroBg} alt="" />
                </div>
                <div className="hero-content">
                    <div className="hero-top">
                        <div className="lockup">
                            <img className="lockup-30x" src={BRAND_ASSETS.logoLight} alt="30X" />
                            {clientLogoUrl ? (
                                <>
                                    <span className="lockup-divider" aria-hidden="true">|</span>
                                    <img
                                        className="lockup-partner"
                                        src={clientLogoUrl}
                                        alt="Partner"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                </>
                            ) : null}
                        </div>
                        {pageNumber ? (
                            <div className="page-num">PÁGINA {pageNumber}</div>
                        ) : null}
                    </div>
                    <div className="hero-bottom">
                        {slide.pageLabel ? (
                            <div className="hero-label">{slide.pageLabel}</div>
                        ) : null}
                        {heroHeading ? (
                            <h2 className="hero-heading">{heroHeading}</h2>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="body">
                <div className="blocks">
                    {bodyBlocks.map((b, i) => (
                        <DocBlockRenderer key={i} block={b} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function DocBlockRenderer({ block }: { block: DocBlock }) {
    switch (block.kind) {
        case "heading":
            return block.level === 2 ? (
                <h3 className="b-h2">{block.text}</h3>
            ) : (
                <h2 className="b-h1">{block.text}</h2>
            );
        case "paragraph":
            return <p className="b-p">{block.text}</p>;
        case "bullets":
            return (
                <ul className="b-ul">
                    {(block.items ?? []).map((it, i) => (
                        <li key={i}>{it}</li>
                    ))}
                </ul>
            );
        case "numbered":
            return (
                <ol className="b-ol">
                    {(block.items ?? []).map((it, i) => (
                        <li key={i}>{it}</li>
                    ))}
                </ol>
            );
        case "kv":
            return (
                <dl className="b-kv">
                    {(block.rows ?? []).map((r, i) => (
                        <div key={i} className="kv-row">
                            <dt>{r.label}</dt>
                            <dd>{r.value}</dd>
                        </div>
                    ))}
                </dl>
            );
        case "table": {
            const cols = block.columns ?? [];
            const rows = block.rows ?? [];
            return (
                <table className="b-table">
                    <thead>
                        <tr>
                            {cols.map((c, i) => (
                                <th key={i}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                {(r ?? []).map((cell, j) => (
                                    <td key={j}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        case "callout":
            return <div className="b-callout">{block.text}</div>;
        case "divider":
            return <hr className="b-hr" />;
        default:
            return null;
    }
}

// ============================================================
// DOC — McKinsey-grade dense layouts (Andrés Bilbao reference)
// ============================================================

export function DocComparisonTable({
    slide,
    pageNumber,
}: {
    slide: DocComparisonTableSlide;
    pageNumber?: number;
}) {
    const cols = slide.columns ?? [];
    const rows = slide.rows ?? [];
    return (
        <section className="deck-slide s-doc s-doc-table">
            <DocHeader pageLabel={pageNumber ? `Página ${pageNumber}` : undefined} />
            {slide.sectionNumber ? (
                <div className="secnum">Sección {slide.sectionNumber}</div>
            ) : null}
            <h2 className="secheading">{slide.heading}</h2>
            {slide.subheading ? <p className="p">{slide.subheading}</p> : null}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            {cols.map((c, i) => (
                                <th key={i}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                {r.program ? <th scope="row">{r.program}</th> : null}
                                {(r.cells ?? []).map((cell, j) => (
                                    <td key={j}>
                                        {cell.split(" · ").map((line, k) => (
                                            <div key={k} className="cell-line">
                                                <span className="dash">—</span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export function DocStatsHero({
    slide,
    pageNumber,
}: {
    slide: DocStatsHeroSlide;
    pageNumber?: number;
}) {
    const stats = slide.stats ?? [];
    const mentors = slide.mentors ?? [];
    return (
        <section className="deck-slide s-doc s-doc-stats-hero">
            <DocHeader pageLabel={pageNumber ? `Página ${pageNumber}` : undefined} />
            <h2 className="secheading">
                {slide.heading}
                {slide.subheading ? (
                    <>
                        {" "}
                        <span className="accent">{slide.subheading}</span>
                    </>
                ) : null}
            </h2>
            <div className="hero-stats">
                {stats.slice(0, 3).map((s, i) => (
                    <div key={i} className="hero-stat">
                        <div className="v">{s.value}</div>
                        <p className="k">{s.label}</p>
                    </div>
                ))}
            </div>
            {mentors.length > 0 ? (
                <div className="mentor-row">
                    {mentors.slice(0, 5).map((m, i) => (
                        <div key={i} className="mentor-tile">
                            <div className="portrait">
                                <img src={getMentorImage(m.imageKey)} alt={m.name} />
                            </div>
                            <div className="nm">{m.name}</div>
                            <div className="rl">{m.role}</div>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

export function DocMentorWall({
    slide,
    pageNumber,
}: {
    slide: DocMentorWallSlide;
    pageNumber?: number;
}) {
    const stats = slide.stats ?? [];
    const mentors = slide.mentors ?? [];
    const brandLogos = slide.brandLogos ?? [];
    const countries = slide.countries ?? [];
    return (
        <section className="deck-slide s-doc s-doc-wall">
            <DocHeader pageLabel={pageNumber ? `Página ${pageNumber}` : undefined} />
            <div className="wall-grid">
                <div className="left">
                    <h2 className="secheading">
                        <span className="accent">30X</span> {slide.heading}
                    </h2>
                    <div className="wall-stats">
                        {stats.slice(0, 3).map((s, i) => (
                            <div key={i} className="stat">
                                <div className="v">{s.value}</div>
                                <p className="k">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    {countries.length > 0 ? (
                        <div className="countries">
                            {countries.join(" · ")}
                        </div>
                    ) : null}
                    {slide.context ? <p className="ctx">{slide.context}</p> : null}
                    {brandLogos.length > 0 ? (
                        <div className="brand-strip">
                            {brandLogos.map((b, i) => {
                                const url = getCompanyLogo(b);
                                return url ? (
                                    <img key={i} src={url} alt={b} />
                                ) : (
                                    <span key={i} className="brand-fallback">
                                        {b}
                                    </span>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
                <div className="right">
                    <div className="mentor-grid">
                        {mentors.slice(0, 15).map((m, i) => (
                            <div key={i} className="m-tile">
                                <img
                                    src={getMentorImage(m.imageKey)}
                                    alt={m.name ?? ""}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function DocMentorSpotlight({
    slide,
    pageNumber,
}: {
    slide: DocMentorSpotlightSlide;
    pageNumber?: number;
}) {
    const sections = slide.sections ?? [];
    const badges = slide.badges ?? [];
    return (
        <section className="deck-slide s-doc s-doc-spotlight">
            <DocHeader pageLabel={pageNumber ? `Página ${pageNumber}` : undefined} />
            <div className="spotlight-grid">
                <div className="portrait">
                    <img
                        src={getMentorImage(slide.mentor.imageKey)}
                        alt={slide.mentor.name}
                    />
                </div>
                <div className="bio">
                    <h2 className="secheading">{slide.mentor.name}</h2>
                    <div className="role">{slide.mentor.role}</div>
                    {badges.length > 0 ? (
                        <div className="badges">
                            {badges.map((b, i) => (
                                <span key={i} className="badge">
                                    {b}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    <div className="sections">
                        {sections.map((s, i) => (
                            <div key={i} className="bio-section">
                                <h3 className="t">{s.title}</h3>
                                <p className="d">{s.body}</p>
                            </div>
                        ))}
                    </div>
                    {slide.credentials ? (
                        <div className="credentials">{slide.credentials}</div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

// Untitled UI dashboard mock for the prototype-frame slide.
// Renders a faithful approximation of the Untitled UI sidebar app pattern:
// 280px white sidebar with icons + nav items + account card, top header,
// 3 KPI cards with delta % + sparkline, and a data table with avatars +
// status badges. All visual tokens (#FAFAFA bg, #EAECF0 borders, lime
// accent #E9FF7B, Inter Display) match the 30X design system.
export function PrototypeFrame({ slide }: { slide: PrototypeFrameSlide }) {
    const appName = slide.appName ?? "30X App";
    const headline = slide.headline ?? "Nuevo prototipo";
    const sidebar = slide.sidebar?.length
        ? slide.sidebar
        : [
              { label: "Overview", icon: "home" as const, active: true },
              { label: "Pipeline", icon: "pipeline" as const },
              { label: "Empresas", icon: "team" as const },
              { label: "Reportes", icon: "reports" as const },
              { label: "Settings", icon: "settings" as const },
          ];
    const stats = slide.stats?.slice(0, 3) ?? [];
    const rows = slide.listRows?.slice(0, 6) ?? [];
    const filters = slide.filters?.length ? slide.filters : ["Todos", "Activos", "Cerrados", "Q2 2026"];
    const account = slide.account ?? {
        name: "Sales Ops 30X",
        email: "ops@30x.com",
        initials: "30",
    };

    return (
        <section className="deck-slide s-proto-ui">
            {/* App chrome — light, Untitled UI style */}
            <div className="proto-chrome">
                {/* Sidebar */}
                <aside className="proto-sidebar">
                    <div className="proto-sidebar-top">
                        <div className="proto-workspace">
                            <div className="proto-workspace-logo">30X</div>
                            <div className="proto-workspace-text">
                                <div className="proto-workspace-name">{appName}</div>
                                <div className="proto-workspace-plan">30X Workspace</div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="proto-workspace-chevron">
                                <path d="M4 6l4 4 4-4" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="proto-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="7" stroke="#667085" strokeWidth="1.7" />
                                <path d="M20 20l-3.5-3.5" stroke="#667085" strokeWidth="1.7" strokeLinecap="round" />
                            </svg>
                            <input className="proto-search-input" placeholder="Buscar" readOnly />
                            <span className="proto-search-key">⌘K</span>
                        </div>
                    </div>

                    <nav className="proto-nav">
                        {sidebar.map((item, i) => (
                            <a key={i} className={`proto-nav-item${item.active ? " is-active" : ""}`}>
                                <SidebarIcon name={item.icon ?? "dashboard"} />
                                <span className="proto-nav-label">{item.label}</span>
                                {item.badge ? <span className="proto-nav-badge">{item.badge}</span> : null}
                            </a>
                        ))}
                    </nav>

                    <div className="proto-account">
                        <div className="proto-avatar">{account.initials}</div>
                        <div className="proto-account-text">
                            <div className="proto-account-name">{account.name}</div>
                            <div className="proto-account-email">{account.email}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="3" r="1" fill="#667085" />
                            <circle cx="8" cy="8" r="1" fill="#667085" />
                            <circle cx="8" cy="13" r="1" fill="#667085" />
                        </svg>
                    </div>
                </aside>

                {/* Main */}
                <main className="proto-main">
                    {/* Header */}
                    <header className="proto-header">
                        <div className="proto-header-left">
                            <div className="proto-breadcrumb">
                                <span>Dashboard</span>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4l4 4-4 4" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="proto-breadcrumb-current">{appName}</span>
                            </div>
                            <h1 className="proto-page-title">{headline}</h1>
                            {slide.description ? (
                                <p className="proto-page-sub">{slide.description}</p>
                            ) : null}
                        </div>
                        <div className="proto-header-actions">
                            {slide.secondaryCta ? (
                                <button className="proto-btn proto-btn-secondary">{slide.secondaryCta}</button>
                            ) : (
                                <button className="proto-btn proto-btn-secondary">Filtrar</button>
                            )}
                            {slide.primaryCta ? (
                                <button className="proto-btn proto-btn-primary">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    {slide.primaryCta}
                                </button>
                            ) : null}
                        </div>
                    </header>

                    {/* KPI cards */}
                    {stats.length > 0 ? (
                        <div className="proto-kpis">
                            {stats.map((s, i) => (
                                <KpiCard key={i} stat={s} />
                            ))}
                        </div>
                    ) : null}

                    {/* Filters + table card */}
                    <div className="proto-card">
                        <div className="proto-card-head">
                            <div>
                                <div className="proto-card-title">Pipeline activo</div>
                                <div className="proto-card-sub">{rows.length} oportunidades</div>
                            </div>
                            <div className="proto-filters">
                                {filters.map((f, i) => (
                                    <button key={f} className={`proto-chip${i === 0 ? " is-active" : ""}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="proto-table">
                            <div className="proto-table-head">
                                <div>Empresa</div>
                                <div>Monto</div>
                                <div>Estado</div>
                                <div>Notas</div>
                            </div>
                            {rows.length > 0 ? (
                                rows.map((row, i) => (
                                    <div key={i} className="proto-table-row">
                                        <div className="proto-cell-company">
                                            <div
                                                className="proto-row-avatar"
                                                style={{ background: avatarBg(row.title) }}
                                            >
                                                {(row.avatarLabel ?? initialsOf(row.title))}
                                            </div>
                                            <div>
                                                <div className="proto-cell-title">{row.title}</div>
                                                {row.subtitle ? (
                                                    <div className="proto-cell-sub">{row.subtitle}</div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="proto-cell-prog">{row.meta ?? ""}</div>
                                        <div>
                                            <Badge tone={row.badgeTone ?? toneFromLabel(row.badge)}>
                                                {row.badge ?? "Activo"}
                                            </Badge>
                                        </div>
                                        <div className="proto-cell-notes">{rowNotes(i)}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="proto-table-empty">No hay oportunidades cargadas todavía.</div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {slide.subtitle ? <div className="proto-footnote">{slide.subtitle}</div> : null}
        </section>
    );
}

function KpiCard({
    stat,
}: {
    stat: NonNullable<PrototypeFrameSlide["stats"]>[number];
}) {
    const trend = stat.trend ?? (stat.delta?.startsWith("-") ? "down" : stat.delta ? "up" : "flat");
    const trendColor = trend === "up" ? "#067647" : trend === "down" ? "#B42318" : "#475467";
    const sparkline = stat.sparkline ?? [12, 18, 15, 22, 20, 26, 28];
    return (
        <div className="proto-kpi">
            <div className="proto-kpi-label">{stat.label}</div>
            <div className="proto-kpi-row">
                <div className="proto-kpi-value">{stat.value}</div>
                <Sparkline values={sparkline} stroke={trendColor} />
            </div>
            {stat.delta ? (
                <div className="proto-kpi-delta" style={{ color: trendColor }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        {trend === "down" ? (
                            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                    <span>{stat.delta}</span>
                    <span className="proto-kpi-delta-meta">vs mes anterior</span>
                </div>
            ) : null}
        </div>
    );
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
    const w = 96;
    const h = 32;
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = w / (values.length - 1);
    const points = values
        .map((v, i) => `${i * step},${h - ((v - min) / span) * (h - 4) - 2}`)
        .join(" ");
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="proto-spark">
            <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Badge({
    children,
    tone,
}: {
    children: React.ReactNode;
    tone: "success" | "warning" | "error" | "neutral" | "info";
}) {
    return <span className={`proto-badge proto-badge-${tone}`}>
        <span className="proto-badge-dot" />
        {children}
    </span>;
}

function toneFromLabel(label?: string): "success" | "warning" | "error" | "neutral" | "info" {
    if (!label) return "neutral";
    const l = label.toLowerCase();
    if (l.includes("activo") || l.includes("active") || l.includes("ganado") || l.includes("ok")) return "success";
    if (l.includes("pausa") || l.includes("pending") || l.includes("revisión") || l.includes("revision")) return "warning";
    if (l.includes("cerrado") || l.includes("perdido") || l.includes("closed") || l.includes("error")) return "error";
    if (l.includes("nuevo") || l.includes("info") || l.includes("borrador")) return "info";
    return "neutral";
}

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function avatarBg(seed: string): string {
    const palette = ["#7F56D9", "#0BA5EC", "#0E9384", "#DC6803", "#B42318", "#7A5AF8", "#175CD3", "#5925DC"];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
}

function rowNotes(i: number): string {
    const samples = [
        "Cohorte mayo 2026, 24 ejecutivos",
        "Propuesta enviada, decisión 18 abril",
        "Discovery agendado con CTO",
        "Sesión presencial Bogotá, 8 horas",
        "Negociación de pricing en curso",
        "12 cupos confirmados, abril 30",
        "Propuesta en revisión legal",
    ];
    return samples[i % samples.length];
}

function SidebarIcon({ name }: { name: SidebarIconKey }) {
    const path = SIDEBAR_ICON_PATHS[name] ?? SIDEBAR_ICON_PATHS.dashboard;
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="proto-nav-icon">
            <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const SIDEBAR_ICON_PATHS: Record<SidebarIconKey, string> = {
    home: "M4 10l8-7 8 7v9a2 2 0 01-2 2h-3v-6h-6v6H6a2 2 0 01-2-2v-9z",
    dashboard: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
    pipeline: "M3 6h12M3 12h18M3 18h9",
    team: "M16 11a4 4 0 100-8 4 4 0 000 8zM6 21a6 6 0 1112 0",
    reports: "M3 21h18M5 21V8l5-3 5 3 5-3v16",
    settings: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    billing: "M3 7h18v4H3zM3 11v8a2 2 0 002 2h14a2 2 0 002-2v-8M7 16h4",
    messages: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
    documents: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6",
    integrations: "M9 3h6v6H9zM3 15h6v6H3zM15 15h6v6h-6zM12 9v6M9 18h6",
};


function dotStyle(color: string): React.CSSProperties {
    return {
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
    };
}

// ============================================================
// MASTER SWITCH
// ============================================================

export function renderSlide(
    slide: Slide,
    clientLogoUrl?: string,
    pageIndex?: number,
): ReactNode {
    switch (slide.type) {
        case "cover-hero":
            return <CoverHero slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "corporate-cover":
            return <CorporateCover slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "cover-globe":
            return <CoverGlobe slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "intro-mentors":
            return <IntroMentors slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "problem-cards":
            return <ProblemCards slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "diagnostic":
            return <Diagnostic slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "curriculum-grid":
            return <CurriculumGrid slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "mentor-grid":
            return <MentorGrid slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "mentor-duo":
            return <MentorDuo slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "methodology":
            return <Methodology slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "impact":
            return <Impact slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "pricing-cta":
            return <PricingCta slide={slide} clientLogoUrl={clientLogoUrl} />;
        case "ig-cover":
            return <IgCover slide={slide} />;
        case "ig-text":
            return <IgText slide={slide} />;
        case "ig-stat":
            return <IgStat slide={slide} />;
        case "ig-quote":
            return <IgQuote slide={slide} />;
        case "ig-cta":
            return <IgCta slide={slide} />;
        case "story-cover":
            return <StoryCover slide={slide} />;
        case "story-text":
            return <StoryText slide={slide} />;
        case "doc-cover":
            return <DocCover slide={slide} />;
        case "doc-section":
            return <DocSection slide={slide} pageNumber={pageIndex} />;
        case "doc-page":
            return <DocPage slide={slide} pageNumber={pageIndex} clientLogoUrl={clientLogoUrl} />;
        case "doc-comparison-table":
            return <DocComparisonTable slide={slide} pageNumber={pageIndex} />;
        case "doc-stats-hero":
            return <DocStatsHero slide={slide} pageNumber={pageIndex} />;
        case "doc-mentor-wall":
            return <DocMentorWall slide={slide} pageNumber={pageIndex} />;
        case "doc-mentor-spotlight":
            return <DocMentorSpotlight slide={slide} pageNumber={pageIndex} />;
        case "prototype-frame":
            return <PrototypeFrame slide={slide} />;
        case "content":
            return <Content slide={slide} clientLogoUrl={clientLogoUrl} />;
        default:
            return (
                <section className="deck-slide">
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#555" }}>
                        Slide no soportado
                    </div>
                </section>
            );
    }
}

/**
 * Pure server-safe renderer — no error boundary. Used directly by the
 * SSR PDF export path and indirectly by SlideRendererClient (editor).
 */
export function SlideRenderer({
    slide,
    clientLogoUrl,
    pageIndex,
}: {
    slide: Slide;
    clientLogoUrl?: string;
    pageIndex?: number;
}) {
    return <>{renderSlide(slide, clientLogoUrl, pageIndex)}</>;
}
