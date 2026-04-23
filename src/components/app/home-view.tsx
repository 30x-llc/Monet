"use client";

import { useState, useMemo } from "react";
import type { StoredDeck } from "@/lib/deck-storage";
import { TEMPLATES, type Template } from "@/lib/templates";
import { programs } from "@/lib/programs";
import type { Deck, ProjectFormat } from "@/lib/slide-types";

type Theme = "dark" | "light";
import { FORMATS } from "@/lib/slide-types";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRenderer } from "@/components/slides/deck-slides";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

type MainTab = "recent" | "mine" | "examples" | "systems";

export interface CreateArgs {
    format: ProjectFormat;
    clientName: string;
    programId: string;
    corporateMode: boolean;
    theme: Theme;
    topic?: string;
}

interface HomeViewProps {
    recentDecks: StoredDeck[];
    onOpenDeck: (id: string) => void;
    onDeleteDeck: (id: string) => void;
    onOpenTemplate: (id: string) => void;
    onCreateNew: (args: CreateArgs) => void;
    onOpenIntake: (format: ProjectFormat) => void;
    userEmail?: string;
    userName?: string;
}

// ──────────────────────────────────────────────────────────────
// Format picker config (top tabs + sidebar field sets)
// ──────────────────────────────────────────────────────────────

const TOP_TABS: { id: ProjectFormat; label: string; icon: React.ReactNode }[] = [
    { id: "proposal", label: "Propuesta", icon: <IconSlide /> },
    { id: "carousel-ig", label: "Carrusel IG", icon: <IconCarousel /> },
    { id: "story-ig", label: "Historia IG", icon: <IconStory /> },
    { id: "doc", label: "Documento", icon: <IconDoc /> },
];

export function HomeView({
    recentDecks,
    onOpenDeck,
    onDeleteDeck,
    onOpenTemplate,
    onCreateNew,
    onOpenIntake,
    userEmail = "jdelaossa1800@gmail.com",
    userName = "Juan Diego",
}: HomeViewProps) {
    const [format, setFormat] = useState<ProjectFormat>("proposal");
    const [mainTab, setMainTab] = useState<MainTab>("recent");
    const [query, setQuery] = useState("");

    // Proposal-specific fields
    const [clientName, setClientName] = useState("");
    const [programId, setProgramId] = useState("sales-machine");
    const [corporateMode, setCorporateMode] = useState(true);
    // Carousel / story / doc fields
    const [topic, setTopic] = useState("");
    // Theme (shared across formats; doc defaults to light, others to dark)
    const [theme, setTheme] = useState<Theme>("dark");

    const filteredDecks = useMemo(() => {
        const q = query.trim().toLowerCase();
        const byFormat = mainTab === "mine"
            ? recentDecks.filter((d) => (d.deck.format ?? "proposal") === format)
            : recentDecks;
        if (!q) return byFormat;
        return byFormat.filter(
            (d) =>
                d.deck.deckTitle.toLowerCase().includes(q) ||
                d.deck.companyName.toLowerCase().includes(q) ||
                d.deck.programName.toLowerCase().includes(q),
        );
    }, [recentDecks, query, mainTab, format]);

    const isProposal = format === "proposal";
    const isContentFormat = format === "carousel-ig" || format === "story-ig" || format === "doc";

    const canCreate = isProposal ? clientName.trim().length > 1 : topic.trim().length > 2;

    const handleCreate = () => {
        if (!canCreate) return;
        onCreateNew({
            format,
            clientName: clientName.trim() || (topic ? topic.trim() : "30X"),
            programId,
            corporateMode,
            theme,
            topic: topic || undefined,
        });
    };

    return (
        <div className="flex flex-col h-screen bg-white text-[#0a0a0a]">
            {/* ── Top bar ── */}
            <div className="h-10 shrink-0 border-b border-black/[0.06] flex items-center">
                <div className="w-[240px] shrink-0 px-5 flex items-center gap-2">
                    <Logo30x variant="dark" className="h-3.5" />
                    <span className="text-[11px] font-medium text-[#737373]">Design</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-[0.06em] uppercase text-[#525252] bg-black/[0.04]">
                        Research Preview
                    </span>
                </div>
                <div className="flex-1 flex items-center gap-0.5 px-2 border-l border-black/[0.06] h-full">
                    {TOP_TABS.map((t) => (
                        <TopTabButton
                            key={t.id}
                            active={format === t.id}
                            onClick={() => setFormat(t.id)}
                            label={t.label}
                            icon={t.icon}
                        />
                    ))}
                </div>
                <div className="px-5">
                    <SearchInput value={query} onChange={setQuery} />
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* ── Sidebar ── */}
                <aside className="w-[240px] shrink-0 border-r border-black/[0.06] flex flex-col">
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                        <h2 className="text-[13px] font-semibold tracking-[-0.015em] mb-1">
                            Nuevo {FORMATS[format].label.toLowerCase()}
                        </h2>
                        <p className="text-[11px] text-[#737373] tracking-[-0.005em] mb-4 leading-[1.4]">
                            {FORMATS[format].description}
                        </p>

                        <div className="space-y-4">
                            {isProposal ? (
                                <>
                                    <Field label="Cliente">
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="Nombre del cliente"
                                            className="w-full h-9 px-3 rounded-md border border-black/[0.1] bg-white text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] tracking-[-0.005em]"
                                        />
                                    </Field>

                                    <Field label="Programa">
                                        <select
                                            value={programId}
                                            onChange={(e) => setProgramId(e.target.value)}
                                            className="w-full h-9 px-3 rounded-md border border-black/[0.1] bg-white text-[13px] text-[#0a0a0a] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] appearance-none bg-no-repeat bg-right tracking-[-0.005em]"
                                            style={{
                                                backgroundImage:
                                                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'><path d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>\")",
                                                backgroundPosition: "right 10px center",
                                                paddingRight: "28px",
                                            }}
                                        >
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Tipo">
                                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-md bg-black/[0.04]">
                                            <SmallToggle
                                                active={corporateMode}
                                                onClick={() => setCorporateMode(true)}
                                                label="Corporativa"
                                            />
                                            <SmallToggle
                                                active={!corporateMode}
                                                onClick={() => setCorporateMode(false)}
                                                label="Abierta"
                                            />
                                        </div>
                                    </Field>
                                    <ThemeField theme={theme} onChange={setTheme} />
                                </>
                            ) : null}

                            {isContentFormat ? (
                                <>
                                    <Field label="Tema">
                                        <textarea
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder={
                                                format === "carousel-ig"
                                                    ? "Ej: 5 lecciones que aprendimos escalando ventas B2B"
                                                    : format === "story-ig"
                                                      ? "Ej: Nueva cohort de Sales Machine arranca en abril"
                                                      : "Ej: Contrato de formación ejecutiva"
                                            }
                                            rows={3}
                                            className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] tracking-[-0.005em] leading-[1.45]"
                                        />
                                    </Field>
                                    <Field label="Programa (contexto)">
                                        <select
                                            value={programId}
                                            onChange={(e) => setProgramId(e.target.value)}
                                            className="w-full h-9 px-3 rounded-md border border-black/[0.1] bg-white text-[13px] text-[#0a0a0a] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] appearance-none bg-no-repeat bg-right tracking-[-0.005em]"
                                            style={{
                                                backgroundImage:
                                                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'><path d='M4 6L8 10L12 6' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>\")",
                                                backgroundPosition: "right 10px center",
                                                paddingRight: "28px",
                                            }}
                                        >
                                            <option value="">Sin programa específico</option>
                                            {programs.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <ThemeField theme={theme} onChange={setTheme} />
                                </>
                            ) : null}

                            <button
                                onClick={handleCreate}
                                disabled={!canCreate}
                                className="w-full h-10 rounded-md border border-dashed border-black/15 bg-white text-[13px] font-semibold tracking-[-0.01em] text-[#0a0a0a] hover:bg-black/[0.03] hover:border-black/30 disabled:opacity-40 disabled:cursor-not-allowed transition-[background,border-color] duration-150 flex items-center justify-center gap-2"
                                style={{ transitionTimingFunction: "var(--ease-out)" }}
                            >
                                <PlusIcon />
                                Crear
                            </button>

                            {isProposal ? (
                                <button
                                    onClick={() => onOpenIntake(format)}
                                    className="w-full h-10 rounded-md bg-[#E9FF7B] text-[13px] font-semibold tracking-[-0.01em] text-[#0a0a0a] hover:brightness-95 active:brightness-90 transition-[filter] duration-150"
                                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                                >
                                    Empezar guiado →
                                </button>
                            ) : null}
                        </div>

                        <p className="mt-4 text-[11px] text-[#737373] leading-[1.5]">
                            Solo tú puedes ver tus diseños. Cada diseño usa el sistema 30X: Inter Display, acento #E9FF7B, fotos reales.
                        </p>
                    </div>

                    <div className="border-t border-black/[0.06] px-4 py-3 space-y-0.5">
                        <FooterChip icon={<DocsIcon />} label="Docs" />
                        <FooterChip icon={<OrgIcon />} label={userEmail} subtle />
                        <FooterChip icon={<UserIcon />} label={userName} />
                    </div>
                </aside>

                {/* ── Main area ── */}
                <main className="flex-1 overflow-y-auto">
                    <div className="px-8 pt-6">
                        <div className="flex items-center gap-1 border-b border-black/[0.06]">
                            <MainTabButton active={mainTab === "recent"} onClick={() => setMainTab("recent")} label="Recientes" />
                            <MainTabButton active={mainTab === "mine"} onClick={() => setMainTab("mine")} label={`Mis ${FORMATS[format].label.toLowerCase()}s`} />
                            <MainTabButton active={mainTab === "examples"} onClick={() => setMainTab("examples")} label="Ejemplos" />
                            <MainTabButton active={mainTab === "systems"} onClick={() => setMainTab("systems")} label="Plantillas" />
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {mainTab === "systems" || mainTab === "examples" ? (
                            <Grid>
                                {TEMPLATES.map((t) => (
                                    <TemplateCard key={t.id} template={t} onClick={() => onOpenTemplate(t.id)} />
                                ))}
                            </Grid>
                        ) : filteredDecks.length === 0 ? (
                            <Empty label={FORMATS[format].label.toLowerCase()} />
                        ) : (
                            <Grid>
                                {filteredDecks.map((d) => (
                                    <DeckCard key={d.id} stored={d} onClick={() => onOpenDeck(d.id)} onDelete={() => onDeleteDeck(d.id)} />
                                ))}
                            </Grid>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Cards (thumbnails adapt aspect ratio per format)
// ──────────────────────────────────────────────────────────────

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">{children}</div>;
}

function thumbAspectFor(f: ProjectFormat | undefined): string {
    switch (f) {
        case "carousel-ig":
            return "1 / 1";
        case "story-ig":
            return "9 / 16";
        case "doc":
            return "794 / 1123";
        default:
            return "4 / 3";
    }
}

function DeckCard({
    stored,
    onClick,
    onDelete,
}: {
    stored: StoredDeck;
    onClick: () => void;
    onDelete: () => void;
}) {
    const deck = stored.deck;
    const date = new Date(stored.updatedAt);
    const dateLabel = formatRelativeDate(date);
    const format = deck.format ?? "proposal";

    return (
        <div className="group relative">
            <button
                onClick={onClick}
                className="w-full rounded-lg overflow-hidden bg-[#f5f5f5] border border-black/[0.06] hover:border-black/[0.14] transition-colors duration-150"
                style={{ aspectRatio: thumbAspectFor(format), transitionTimingFunction: "var(--ease-out)" }}
            >
                <div className="w-full h-full">
                    <SlideStage format={format}>
                        <SlideRenderer slide={deck.slides[0]} clientLogoUrl={deck.clientLogoUrl} />
                    </SlideStage>
                </div>
            </button>
            <div className="mt-3">
                <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-[#0a0a0a] leading-[1.35] truncate">
                    {deck.deckTitle}
                </h3>
                <p className="mt-0.5 text-[12px] text-[#737373] tracking-[-0.005em] truncate">
                    {FORMATS[format].label} · {dateLabel}
                </p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                aria-label="Eliminar"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white border border-black/[0.08] text-[#525252] hover:text-[#0a0a0a] hover:border-black/25 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
    const format = template.deck.format ?? "proposal";
    return (
        <button onClick={onClick} className="group relative text-left">
            <div
                className="w-full rounded-lg overflow-hidden bg-[#f5f5f5] border border-black/[0.06] group-hover:border-black/[0.14] transition-colors duration-150"
                style={{ aspectRatio: thumbAspectFor(format) }}
            >
                <div className="w-full h-full">
                    <SlideStage format={format}>
                        <SlideRenderer
                            slide={template.deck.slides[0]}
                            clientLogoUrl={(template.deck as Deck).clientLogoUrl}
                        />
                    </SlideStage>
                </div>
            </div>
            <div className="mt-3">
                <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-[#0a0a0a] leading-[1.35] truncate">
                    {template.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-[#737373] tracking-[-0.005em] truncate">
                    {template.description}
                </p>
            </div>
        </button>
    );
}

function Empty({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[14px] text-[#525252] mb-2">Aún no tienes {label}s.</p>
            <p className="text-[12px] text-[#737373]">Rellena el formulario de la izquierda y dale a Crear.</p>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Small pieces
// ──────────────────────────────────────────────────────────────

function TopTabButton({
    active,
    onClick,
    label,
    icon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative h-10 px-3 flex items-center gap-1.5 text-[13px] tracking-[-0.01em] transition-colors ${
                active ? "text-[#0a0a0a] font-semibold" : "text-[#737373] hover:text-[#0a0a0a]"
            }`}
        >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-current">{icon}</span>
            {label}
            {active ? <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#0a0a0a]" /> : null}
        </button>
    );
}

function MainTabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`relative h-9 px-3 text-[13px] tracking-[-0.01em] transition-colors ${
                active ? "text-[#0a0a0a] font-semibold" : "text-[#737373] hover:text-[#0a0a0a]"
            }`}
        >
            {label}
            {active ? <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#0a0a0a]" /> : null}
        </button>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-1.5">{label}</div>
            {children}
        </div>
    );
}

function ThemeField({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
    return (
        <Field label="Apariencia">
            <div className="grid grid-cols-2 gap-2">
                <ThemeCard
                    active={theme === "dark"}
                    onClick={() => onChange("dark")}
                    label="Oscuro"
                    preview={
                        <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden">
                            <div className="absolute top-2 left-2 right-2 h-[2px] bg-white/40 rounded" />
                            <div className="absolute top-5 left-2 w-[40%] h-[2px] bg-white/25 rounded" />
                            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#E9FF7B]" />
                        </div>
                    }
                />
                <ThemeCard
                    active={theme === "light"}
                    onClick={() => onChange("light")}
                    label="Claro"
                    preview={
                        <div className="w-full h-full bg-white relative overflow-hidden">
                            <div className="absolute top-2 left-2 right-2 h-[2px] bg-black/50 rounded" />
                            <div className="absolute top-5 left-2 w-[40%] h-[2px] bg-black/30 rounded" />
                            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />
                        </div>
                    }
                />
            </div>
        </Field>
    );
}

function ThemeCard({
    active,
    onClick,
    label,
    preview,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    preview: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-md overflow-hidden border transition-colors text-left ${
                active ? "border-[#0a0a0a]" : "border-black/[0.1] hover:border-black/25"
            }`}
        >
            <div className="w-full aspect-[4/3] border-b border-inherit">{preview}</div>
            <div className="px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[-0.005em] text-[#0a0a0a]">
                    {label}
                </span>
                {active ? (
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L7 12L13 4" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : null}
            </div>
        </button>
    );
}

function SmallToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`h-7 rounded text-[11px] font-semibold tracking-[-0.005em] transition-[background,color] duration-150 ${
                active ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#525252] hover:text-[#0a0a0a]"
            }`}
        >
            {label}
        </button>
    );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Buscar…"
                className="h-7 w-[200px] pl-7 pr-3 rounded-md border border-black/[0.08] bg-white text-[12px] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/30 focus:ring-2 focus:ring-black/[0.04]"
            />
        </div>
    );
}

function FooterChip({ icon, label, subtle }: { icon: React.ReactNode; label: string; subtle?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-2 px-2 h-7 rounded text-[12px] tracking-[-0.005em] hover:bg-black/[0.04] transition-colors text-left ${subtle ? "text-[#737373]" : "text-[#0a0a0a]"}`}>
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[#737373]">{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
}

function formatRelativeDate(d: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 1000 / 60 / 60);
    if (diffH < 1) return "Hace un momento";
    if (diffH < 24) return "Hoy";
    if (diffH < 48) return "Ayer";
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Hace ${diffD} días`;
    return d.toLocaleDateString("es", { month: "short", day: "numeric" });
}

// ──────────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────────

function PlusIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
function IconSlide() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <path d="M3 9h18" strokeLinecap="round" />
        </svg>
    );
}
function IconCarousel() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="6" y="4" width="12" height="16" rx="1.5" />
            <path d="M3 7v10M21 7v10" strokeLinecap="round" />
        </svg>
    );
}
function IconStory() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="6" y="3" width="12" height="18" rx="2" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
    );
}
function IconDoc() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
            <path d="M14 3v5h5" strokeLinejoin="round" />
        </svg>
    );
}
function DocsIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" strokeLinejoin="round" />
            <path d="M10 2v3h3" strokeLinejoin="round" />
        </svg>
    );
}
function OrgIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <path d="M6 7h4M6 10h4M6 4v9M10 4v9" strokeLinecap="round" />
        </svg>
    );
}
function UserIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="5.5" r="2.5" />
            <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" />
        </svg>
    );
}
