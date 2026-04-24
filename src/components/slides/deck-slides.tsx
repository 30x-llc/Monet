"use client";

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
    PrototypeFrameSlide,
    Slide,
} from "@/lib/slide-types";
import { getMentorImage, BRAND_ASSETS, getCompanyLogo } from "@/lib/assets";

const LOGO_LIGHT = BRAND_ASSETS.logoLight;
const LOGO_ACCENT = BRAND_ASSETS.logoAccent;
const GLOBE = BRAND_ASSETS.globe;
const PORTADA = BRAND_ASSETS.portada;

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

// -------- Shared client logo (top-right when deck.clientLogoUrl is set) --------

function LogoMarks({ clientLogoUrl }: { clientLogoUrl?: string }) {
    return (
        <>
            <img className="logo-mark" src={LOGO_LIGHT} alt="30X" />
            {clientLogoUrl ? <img className="client-logo" src={clientLogoUrl} alt="Cliente" /> : null}
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
    const bg = slide.backgroundImage || PORTADA;
    return (
        <section className="deck-slide s-corp-cover">
            <div className="bg-img">
                <img src={bg} alt="" />
            </div>
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="title-wrap">
                {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
                <h1 className="h-cover">{slide.headline}</h1>
                {slide.subtitle ? <div className="sub">{slide.subtitle}</div> : null}
            </div>
            {slide.date ? <div className="date">{slide.date}</div> : null}
        </section>
    );
}

export function IntroMentors({ slide, clientLogoUrl }: { slide: IntroMentorsSlide; clientLogoUrl?: string }) {
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
                        <div key={i} className="angle">
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
                        <div key={i} className="m-card">
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

export function ProblemCards({ slide, clientLogoUrl }: { slide: ProblemCardsSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-problem">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead p-lead">{slide.subtitle}</p> : null}
            <div className="grid">
                {(Array.isArray(slide.cards) ? slide.cards : []).slice(0, 6).map((c, i) => (
                    <div key={i}>
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
        <section className="deck-slide s-diagnostic">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            {slide.eyebrow ? <div className="eyebrow">{slide.eyebrow}</div> : null}
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead">{slide.subtitle}</p> : null}
            <div className="findings">
                {(Array.isArray(slide.findings) ? slide.findings : []).slice(0, 3).map((f, i) => (
                    <div key={i} className="finding">
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
        <section className={`deck-slide s-curric${twoRows ? " rows-2" : ""}`}>
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead p-lead">{slide.subtitle}</p> : null}
            <div className="weeks">
                {modules.slice(0, 8).map((m, i) => (
                    <div key={i} className="week">
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
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead">{slide.subtitle}</p> : null}
            <div className="people">
                {(Array.isArray(slide.mentors) ? slide.mentors : []).slice(0, 4).map((m, i) => (
                    <div key={i} className="person">
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
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            <div className="people" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 1280, margin: "auto auto 0" }}>
                {(Array.isArray(slide.mentors) ? slide.mentors : []).slice(0, 2).map((m, i) => (
                    <div key={i} className="person">
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
        <section className="deck-slide s-methodology">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead">{slide.subtitle}</p> : null}
            <div className="steps">
                {(Array.isArray(slide.steps) ? slide.steps : []).slice(0, 4).map((s, i) => (
                    <div key={i} className="step">
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
    return (
        <section className="deck-slide s-impact">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="head">
                <h2 className="h-title">{slide.headline}</h2>
            </div>
            {slide.subtitle ? <p className="lead">{slide.subtitle}</p> : null}
            <div className="stats">
                {(Array.isArray(slide.stats) ? slide.stats : []).slice(0, 4).map((s, i) => (
                    <div key={i} className="stat">
                        <div className="v">{s.value}</div>
                        <p className="k">{s.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function PricingCta({ slide, clientLogoUrl }: { slide: PricingCtaSlide; clientLogoUrl?: string }) {
    return (
        <section className="deck-slide s-invest">
            <LogoMarks clientLogoUrl={clientLogoUrl} />
            <div className="left">
                <h2 className="h-title">{slide.headline}</h2>
                <div className="get-label">Lo que recibirás:</div>
                <ul className="gets">
                    {(Array.isArray(slide.checklist) ? slide.checklist : []).slice(0, 6).map((item, i) => (
                        <li key={i}>{item}</li>
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
                        <div key={i} className="row">
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

export function CoverGlobe({ slide, clientLogoUrl }: { slide: CoverGlobeSlide; clientLogoUrl?: string }) {
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

// ============================================================
// PROTOTYPE FRAME (1440x900 mock app UI)
// ============================================================

export function PrototypeFrame({ slide }: { slide: PrototypeFrameSlide }) {
    const appName = slide.appName ?? "30X App";
    const headline = slide.headline ?? "Nuevo prototipo";
    const nav = slide.nav?.length
        ? slide.nav
        : ["Overview", "Pipeline", "Insights", "Team"];
    const sidebar = slide.sidebar;

    return (
        <section
            className="deck-slide"
            style={{
                position: "absolute",
                inset: 0,
                background: "#0a0a0a",
                color: "#F0F0F0",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                letterSpacing: "-0.01em",
            }}
        >
            {/* Browser chrome */}
            <div
                style={{
                    position: "absolute",
                    top: 24,
                    left: 48,
                    right: 48,
                    bottom: 24,
                    background: "#111111",
                    borderRadius: 16,
                    border: "1px solid #232323",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Window bar */}
                <div
                    style={{
                        height: 40,
                        background: "#0D0D0D",
                        borderBottom: "1px solid #1A1A1A",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        gap: 6,
                    }}
                >
                    <span style={dotStyle("#FF5F57")} />
                    <span style={dotStyle("#FEBC2E")} />
                    <span style={dotStyle("#28C840")} />
                    <div
                        style={{
                            marginLeft: 24,
                            height: 22,
                            padding: "0 12px",
                            background: "#1A1A1A",
                            borderRadius: 6,
                            color: "#999",
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        30x.design / {appName.toLowerCase().replace(/\s+/g, "-")}
                    </div>
                </div>

                {/* App top nav */}
                <div
                    style={{
                        height: 56,
                        borderBottom: "1px solid #1A1A1A",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 32px",
                        gap: 32,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontWeight: 700,
                            fontSize: 15,
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: "#E9FF7B",
                                display: "grid",
                                placeItems: "center",
                                color: "#0a0a0a",
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: "-0.04em",
                            }}
                        >
                            30X
                        </div>
                        <span>{appName}</span>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                        {nav.map((n, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: 13,
                                    color: i === 0 ? "#F0F0F0" : "#777",
                                    fontWeight: i === 0 ? 600 : 500,
                                    borderBottom: i === 0 ? "2px solid #E9FF7B" : "none",
                                    paddingBottom: 18,
                                    marginBottom: -18,
                                }}
                            >
                                {n}
                            </span>
                        ))}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                height: 28,
                                padding: "0 10px",
                                background: "#1A1A1A",
                                borderRadius: 6,
                                color: "#999",
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            ⌘ K
                        </div>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#0a0a0a",
                                border: "1px solid #232323",
                                color: "#F0F0F0",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            JD
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                    {sidebar && sidebar.length > 0 ? (
                        <aside
                            style={{
                                width: 220,
                                borderRight: "1px solid #1A1A1A",
                                padding: "20px 12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            {sidebar.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: 34,
                                        padding: "0 12px",
                                        borderRadius: 8,
                                        background: s.active ? "#1A1A1A" : "transparent",
                                        color: s.active ? "#F0F0F0" : "#999",
                                        fontSize: 13,
                                        fontWeight: s.active ? 600 : 500,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 2,
                                            background: s.active ? "#E9FF7B" : "#333",
                                        }}
                                    />
                                    {s.label}
                                </div>
                            ))}
                        </aside>
                    ) : null}

                    <div style={{ flex: 1, padding: "40px 48px", overflow: "hidden" }}>
                        {/* Headline */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "4px 10px",
                                background: "rgba(233,255,123,0.1)",
                                border: "1px solid rgba(233,255,123,0.3)",
                                borderRadius: 999,
                                color: "#E9FF7B",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                                textTransform: "uppercase",
                                marginBottom: 18,
                            }}
                        >
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E9FF7B" }} />
                            {slide.kind === "landing" ? "Landing" : slide.kind === "component" ? "Componente" : "Prototipo"}
                        </div>
                        <h1
                            style={{
                                fontSize: 44,
                                fontWeight: 600,
                                lineHeight: 1.05,
                                letterSpacing: "-0.035em",
                                color: "#F0F0F0",
                                margin: 0,
                                marginBottom: 12,
                                maxWidth: 820,
                            }}
                        >
                            {headline}
                        </h1>
                        {slide.description ? (
                            <p
                                style={{
                                    fontSize: 16,
                                    lineHeight: 1.55,
                                    color: "#999",
                                    margin: 0,
                                    marginBottom: 28,
                                    maxWidth: 640,
                                    letterSpacing: "-0.005em",
                                }}
                            >
                                {slide.description}
                            </p>
                        ) : null}

                        {slide.primaryCta ? (
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    height: 40,
                                    padding: "0 18px",
                                    background: "#E9FF7B",
                                    color: "#0a0a0a",
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: "-0.01em",
                                    marginBottom: 32,
                                }}
                            >
                                {slide.primaryCta}
                                <span style={{ fontSize: 15 }}>→</span>
                            </div>
                        ) : null}

                        {/* Stats row */}
                        {slide.stats && slide.stats.length > 0 ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${Math.min(slide.stats.length, 3)}, 1fr)`,
                                    gap: 12,
                                    marginBottom: 24,
                                }}
                            >
                                {slide.stats.slice(0, 3).map((s, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background: "#141414",
                                            border: "1px solid #232323",
                                            borderRadius: 14,
                                            padding: "18px 20px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: "#F0F0F0",
                                                letterSpacing: "-0.03em",
                                                lineHeight: 1,
                                                marginBottom: 6,
                                            }}
                                        >
                                            {s.value}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#777", letterSpacing: "-0.005em" }}>
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {/* List / table card */}
                        {slide.listRows && slide.listRows.length > 0 ? (
                            <div
                                style={{
                                    background: "#141414",
                                    border: "1px solid #232323",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                }}
                            >
                                {slide.listRows.map((row, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            height: 48,
                                            padding: "0 18px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            borderTop: i === 0 ? "none" : "1px solid #1A1A1A",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: "#E9FF7B",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "#F0F0F0",
                                                fontWeight: 500,
                                                letterSpacing: "-0.005em",
                                                flex: 1,
                                            }}
                                        >
                                            {row.title}
                                        </span>
                                        {row.meta ? (
                                            <span style={{ fontSize: 12, color: "#777" }}>{row.meta}</span>
                                        ) : null}
                                        {row.badge ? (
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    letterSpacing: "0.06em",
                                                    textTransform: "uppercase",
                                                    padding: "3px 8px",
                                                    background: "rgba(233,255,123,0.1)",
                                                    border: "1px solid rgba(233,255,123,0.3)",
                                                    color: "#E9FF7B",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                {row.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Footer caption */}
            {slide.subtitle ? (
                <div
                    style={{
                        position: "absolute",
                        bottom: 4,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        color: "#555",
                        fontSize: 11,
                        letterSpacing: "-0.005em",
                    }}
                >
                    {slide.subtitle}
                </div>
            ) : null}
        </section>
    );
}

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

import { SlideErrorBoundary } from "./slide-error-boundary";

function renderSlide(
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

export function SlideRenderer({
    slide,
    clientLogoUrl,
    pageIndex,
}: {
    slide: Slide;
    clientLogoUrl?: string;
    pageIndex?: number;
}) {
    return (
        <SlideErrorBoundary slideType={slide?.type}>
            {renderSlide(slide, clientLogoUrl, pageIndex)}
        </SlideErrorBoundary>
    );
}
