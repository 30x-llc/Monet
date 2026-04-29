"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import type { StoredDeck } from "@/lib/deck-storage";
import { TEMPLATES, type Template } from "@/lib/templates";
import { programs } from "@/lib/programs";
import type { Deck, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";
import { Logo30x } from "@/components/foundations/logo/30x-logo";
import { BriefingDropZone } from "./briefing-drop-zone";
import type { SuperPromptFormat } from "@/lib/super-prompt";

/**
 * Shared handlers hook for the briefing drop zone — used by every
 * format that supports file upload + super-prompt (proposal, doc, ...).
 * Reads files as text, accepts paste from clipboard, copies a
 * format-aware super-prompt to clipboard.
 */
function useBriefingHandlers(args: {
    clientName: string;
    projectName: string;
    format: SuperPromptFormat;
    setBriefing: (s: string) => void;
    setBriefingFile: (s: string | null) => void;
    setParsing?: (b: boolean) => void;
    setParseError?: (s: string | null) => void;
}) {
    const {
        clientName,
        projectName,
        format,
        setBriefing,
        setBriefingFile,
        setParsing,
        setParseError,
    } = args;

    const onFile = useCallback(
        async (file: File) => {
            // Two-step upload — bypasses the 4.5MB serverless body limit:
            //   1. Client uploads file directly to Vercel Blob using a
            //      short-lived token (no function in the middle).
            //   2. Send the resulting URL to /api/parse-briefing which
            //      fetches from Blob, parses, returns text, deletes Blob.
            //
            // Result: drops of 200MB PPTX, 50MB PDF — all work.
            setParseError?.(null);
            setParsing?.(true);
            try {
                const { upload } = await import("@vercel/blob/client");
                const blob = await upload(file.name, file, {
                    access: "public",
                    handleUploadUrl: "/api/parse-briefing/upload",
                });

                const res = await fetch("/api/parse-briefing", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        url: blob.url,
                        fileName: file.name,
                        mimeType: file.type,
                    }),
                });
                const data = await res.json();
                if (!data.ok) {
                    setParseError?.(data.error || "No pude parsear el archivo.");
                    return;
                }
                setBriefing(data.text);
                setBriefingFile(`${data.fileName} · ${data.kind}`);
            } catch (err) {
                setParseError?.(String(err));
            } finally {
                setParsing?.(false);
            }
        },
        [setBriefing, setBriefingFile, setParsing, setParseError],
    );

    const onPaste = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim().length > 50) {
                setBriefing(text);
                setBriefingFile("(pegado del portapapeles)");
            }
        } catch {
            /* user denied clipboard read; ignore */
        }
    }, [setBriefing, setBriefingFile]);

    const onCopySuperPrompt = useCallback(async () => {
        const { buildSuperPrompt } = await import("@/lib/super-prompt");
        const prompt = buildSuperPrompt({
            clientName: clientName || projectName,
            format,
        });
        try {
            await navigator.clipboard.writeText(prompt);
        } catch {
            alert(
                "No pude copiar al portapapeles. Selecciona manualmente:\n\n" +
                    prompt.slice(0, 300) +
                    "...",
            );
        }
    }, [clientName, projectName, format]);

    return { onFile, onPaste, onCopySuperPrompt };
}

type Theme = "dark" | "light";
type PrototypeKind = "app" | "landing" | "component";
type DocKind = "proposal" | "contract" | "one-pager" | "other";

export interface CreateArgs {
    format: ProjectFormat;
    clientName: string;
    programId: string;
    corporateMode: boolean;
    theme: Theme;
    topic?: string;
    prototypeKind?: PrototypeKind;
    docKind?: DocKind;
    freePrompt?: string;
    /** Markdown / plain-text briefing the salesperson generated with
     *  an LLM via the super-prompt and uploaded here. Piped into Exa
     *  research notes + generator prompt. */
    briefing?: string;
    /** Additional notes the salesperson typed in the form — replaces
     *  the older two-box "Contexto inicial" + "Algo más que deba saber"
     *  pattern with a single optional context field. */
    notes?: string;
}

export interface HomeSeed {
    clientName?: string;
    topic?: string;
    programId?: string;
    corporateMode?: boolean;
    prototypeKind?: PrototypeKind;
    docKind?: DocKind;
}

interface HomeViewProps {
    recentDecks: StoredDeck[];
    onOpenDeck: (id: string) => void;
    onDeleteDeck: (id: string) => void;
    onOpenTemplate: (id: string) => void;
    onCreateNew: (args: CreateArgs) => void;
    onOpenIntake: (format: ProjectFormat, home?: HomeSeed) => void;
    userEmail?: string;
    userName?: string;
}

// ──────────────────────────────────────────────────────────────
// Tabs (order + icons)
// ──────────────────────────────────────────────────────────────

type TabId = "prototype" | "proposal" | "carousel-ig" | "story-ig" | "doc" | "template" | "other";

interface TabDef {
    id: TabId;
    label: string;
    icon: ReactNode;
    /** When true, the tab is visible to build expectation but not
     *  selectable. Hover shows "Pronto" badge. Click is a no-op. */
    comingSoon?: boolean;
}

const TAB_DEFS: TabDef[] = [
    { id: "proposal", label: "Propuesta", icon: <IconSlide /> },
    { id: "doc", label: "Documento", icon: <IconDoc /> },
    { id: "template", label: "Plantilla", icon: <IconTemplate /> },
    { id: "prototype", label: "App", icon: <IconPrototype /> },
    { id: "carousel-ig", label: "Carrusel", icon: <IconCarousel />, comingSoon: true },
    { id: "story-ig", label: "Historia", icon: <IconStory />, comingSoon: true },
    { id: "other", label: "Otro", icon: <IconSpark />, comingSoon: true },
];

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

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
    const [tab, setTab] = useState<TabId>("proposal");
    const [query, setQuery] = useState("");

    const filteredDecks = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return recentDecks;
        return recentDecks.filter(
            (d) =>
                d.deck.deckTitle.toLowerCase().includes(q) ||
                d.deck.companyName.toLowerCase().includes(q) ||
                d.deck.programName.toLowerCase().includes(q),
        );
    }, [recentDecks, query]);

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-[#fafafa]/80 backdrop-blur-md border-b border-black/[0.04]">
                <div className="h-12 flex items-center px-5">
                    <div className="flex items-center gap-2">
                        <Logo30x variant="dark" className="h-3.5" />
                        <span className="text-[11px] font-medium text-[#737373]">Design</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <SearchInput value={query} onChange={setQuery} />
                        <UserChip name={userName} email={userEmail} />
                    </div>
                </div>
            </header>

            {/* Hero + card */}
            <section className="pt-14 pb-16 px-6">
                <div className="max-w-[960px] mx-auto">
                    <div className="text-center mb-9">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.02)] mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />
                            <span className="text-[11px] font-medium tracking-[-0.005em] text-[#525252]">
                                Diseñando con Claude Opus 4.7
                            </span>
                        </div>
                        <h1 className="text-[44px] font-semibold tracking-[-0.035em] leading-[1.02] text-[#0a0a0a]">
                            ¿Qué vamos a diseñar hoy?
                        </h1>
                        <p className="mt-3 text-[15px] text-[#525252] tracking-[-0.005em] leading-[1.5] max-w-[520px] mx-auto">
                            Apps, propuestas, carruseles, historias o documentos — todo con el sistema 30X.
                        </p>
                    </div>

                    <TabCard
                        tab={tab}
                        onTabChange={setTab}
                        onCreate={(args) => onCreateNew(args)}
                        onOpenIntake={onOpenIntake}
                        onOpenTemplate={onOpenTemplate}
                    />

                    <p className="mt-3 text-center text-[11px] text-[#a3a3a3] tracking-[-0.005em]">
                        Solo tú puedes ver tus diseños por defecto.
                    </p>
                </div>
            </section>

            {/* Recent designs */}
            <section className="px-6 pb-24">
                <div className="max-w-[1120px] mx-auto">
                    <div className="flex items-baseline justify-between mb-5">
                        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0a0a0a]">
                            Tus diseños
                        </h2>
                        <span className="text-[12px] text-[#a3a3a3]">
                            {filteredDecks.length} {filteredDecks.length === 1 ? "diseño" : "diseños"}
                        </span>
                    </div>
                    {filteredDecks.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <DesignsGrid
                            decks={filteredDecks}
                            onOpen={onOpenDeck}
                            onDelete={onDeleteDeck}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Tab card (Claude Design style — tabs above a floating card)
// ──────────────────────────────────────────────────────────────

interface TabCardProps {
    tab: TabId;
    onTabChange: (t: TabId) => void;
    onCreate: (args: CreateArgs) => void;
    onOpenIntake: (format: ProjectFormat, home?: HomeSeed) => void;
    onOpenTemplate: (id: string) => void;
}

function TabCard({ tab, onTabChange, onCreate, onOpenIntake, onOpenTemplate }: TabCardProps) {
    return (
        <div className="max-w-[720px] mx-auto">
            {/* Tab strip */}
            <div className="flex items-end px-1 gap-0.5 overflow-x-auto scrollbar-hide">
                {TAB_DEFS.map((t) => (
                    <TabButton
                        key={t.id}
                        active={tab === t.id}
                        onClick={() => {
                            if (!t.comingSoon) onTabChange(t.id);
                        }}
                        label={t.label}
                        icon={t.icon}
                        comingSoon={t.comingSoon}
                    />
                ))}
            </div>

            {/* Card surface */}
            <div
                className="relative bg-white rounded-2xl rounded-tl-none border border-black/[0.06] shadow-[0_2px_4px_rgba(0,0,0,0.02),0_12px_32px_-12px_rgba(0,0,0,0.08)]"
                style={{
                    // Hide the top border segment under the active tab
                    boxShadow:
                        "0 2px 4px rgba(0,0,0,0.02), 0 12px 32px -12px rgba(0,0,0,0.08)",
                }}
            >
                <div className="p-6">
                    {tab === "prototype" ? (
                        <PrototypeForm />
                    ) : tab === "proposal" ? (
                        <ProposalForm onCreate={onCreate} />
                    ) : tab === "carousel-ig" ? (
                        <ContentForm
                            format="carousel-ig"
                            onOpenIntake={onOpenIntake}
                            topicPlaceholder="Ej: 5 lecciones escalando ventas B2B"
                        />
                    ) : tab === "story-ig" ? (
                        <ContentForm
                            format="story-ig"
                            onOpenIntake={onOpenIntake}
                            topicPlaceholder="Ej: Apertura cohort Sales Machine"
                        />
                    ) : tab === "doc" ? (
                        <DocForm onCreate={onCreate} />
                    ) : tab === "template" ? (
                        <TemplateGrid onOpenTemplate={onOpenTemplate} />
                    ) : (
                        <OtherForm onOpenIntake={onOpenIntake} />
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    label,
    icon,
    comingSoon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: ReactNode;
    comingSoon?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={comingSoon}
            title={comingSoon ? "Pronto" : undefined}
            className={`relative h-9 px-3 flex items-center gap-1.5 text-[12.5px] tracking-[-0.005em] transition-[color,background-color,opacity] duration-150 rounded-t-lg whitespace-nowrap ${
                comingSoon
                    ? "text-[#a3a3a3] cursor-not-allowed opacity-60 font-medium"
                    : active
                      ? "bg-white text-[#0a0a0a] font-semibold border border-black/[0.06] border-b-transparent"
                      : "text-[#737373] hover:text-[#0a0a0a] font-medium"
            }`}
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-current">{icon}</span>
            {label}
            {comingSoon ? (
                <span className="ml-0.5 px-1 py-0.5 rounded text-[8.5px] font-bold tracking-[0.06em] uppercase text-[#0a0a0a] bg-[#E9FF7B] leading-none">
                    Pronto
                </span>
            ) : null}
            {active ? (
                // Hide the 1px border line where the active tab meets the card
                <span
                    className="absolute left-0 right-0 -bottom-px h-px bg-white"
                    aria-hidden="true"
                />
            ) : null}
        </button>
    );
}

// ──────────────────────────────────────────────────────────────
// Per-format forms
// ──────────────────────────────────────────────────────────────

const PROTOTYPE_REPO_SLUG = "juandelaossa-30x/juan-diego-30x-design";
const PROTOTYPE_REPO_URL = `https://github.com/${PROTOTYPE_REPO_SLUG}`;
const PROTOTYPE_WEB_IDE_URL = `https://github.dev/${PROTOTYPE_REPO_SLUG}`;
const PROTOTYPE_COMMAND = `git clone ${PROTOTYPE_REPO_URL}.git && cd juan-diego-30x-design && claude --dangerously-skip-permissions`;

type LaunchState = "idle" | "launching" | "done";

function PrototypeForm() {
    const [state, setState] = useState<LaunchState>("idle");
    const [copyTick, setCopyTick] = useState(false);

    const onLaunch = useCallback(async () => {
        if (state !== "idle") return;
        setState("launching");
        try {
            await navigator.clipboard.writeText(PROTOTYPE_COMMAND);
        } catch {
            /* clipboard denied — keep going, the user can still copy manually */
        }
        // Small choreography delay so the press is felt before the new tab opens.
        setTimeout(() => {
            window.open(PROTOTYPE_WEB_IDE_URL, "_blank", "noopener,noreferrer");
            setState("done");
            setTimeout(() => setState("idle"), 2600);
        }, 320);
    }, [state]);

    const onCopyOnly = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(PROTOTYPE_COMMAND);
            setCopyTick(true);
            setTimeout(() => setCopyTick(false), 1800);
        } catch {
            /* ignore */
        }
    }, []);

    return (
        <FormSurface
            title="Diseña tu app"
            subtitle="Claude Code con tu sistema 30X — animaciones, responsive, deploy a Vercel sin salir del flow."
        >
            <Field label="Studio">
                <a
                    href={PROTOTYPE_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 h-12 px-3 rounded-lg border border-black/[0.09] bg-white hover:border-black/25 transition-[border-color] duration-150"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <img
                        src="/30x-logo-square.svg"
                        alt="30X"
                        className="w-8 h-8 rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#0a0a0a] tracking-[-0.005em] leading-[1.2]">
                            juan-diego-30x-design
                        </div>
                        <div className="text-[10.5px] text-[#a3a3a3] leading-[1.2] mt-0.5 truncate">
                            Untitled UI · shadcn · Emil Kowalski · impeccable · 27 skills
                        </div>
                    </div>
                    <span
                        aria-hidden="true"
                        className="text-[#a3a3a3] group-hover:text-[#525252] transition-colors duration-150"
                    >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M5 11L11 5M11 5H6.5M11 5V9.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </a>
            </Field>

            <Field label="Comando — para Claude Code local">
                <div className="relative rounded-lg border border-black/[0.09] bg-[#0a0a0a] overflow-hidden">
                    <pre className="px-3.5 py-3 pr-[88px] text-[12px] text-[#e5e5e5] font-mono leading-[1.55] whitespace-pre-wrap break-all tracking-tight">
                        <span className="text-[#737373] select-none">$ </span>
                        {PROTOTYPE_COMMAND}
                    </pre>
                    <button
                        type="button"
                        onClick={onCopyOnly}
                        className="absolute top-2 right-2 h-7 px-2.5 rounded-md text-[11px] font-medium bg-white/[0.08] text-white hover:bg-white/[0.14] active:bg-white/[0.18] transition-colors duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        {copyTick ? "Copiado" : "Copiar"}
                    </button>
                </div>
            </Field>

            <LaunchButton state={state} onClick={onLaunch} />

            <ol className="pt-1 space-y-1.5">
                {[
                    "El repo abre en VS Code Web — code, animaciones, todo cargado.",
                    "Para Claude Code local, el comando ya está en tu portapapeles.",
                    "pnpm dev → deploya a Vercel sin salir del flow.",
                ].map((step, i) => (
                    <li
                        key={i}
                        className="flex gap-2.5 text-[12px] text-[#737373] tracking-[-0.005em]"
                    >
                        <span className="w-4 h-4 rounded-full bg-black/[0.04] text-[#525252] text-[10px] font-semibold flex items-center justify-center shrink-0 mt-px">
                            {i + 1}
                        </span>
                        <span className="leading-[1.4]">{step}</span>
                    </li>
                ))}
            </ol>

            <p className="text-[11px] text-[#a3a3a3] tracking-[-0.005em]">
                ¿No tienes Claude Code?{" "}
                <a
                    href="https://claude.com/claude-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[#525252] transition-colors"
                >
                    Instalarlo
                </a>
                .
            </p>
        </FormSurface>
    );
}

function LaunchButton({
    state,
    onClick,
}: {
    state: LaunchState;
    onClick: () => void;
}) {
    const isDone = state === "done";
    const isLaunching = state === "launching";
    return (
        <div className="pt-2">
            <button
                type="button"
                onClick={onClick}
                disabled={state !== "idle"}
                className="group relative w-full h-11 rounded-lg bg-[#E9FF7B] text-[#0a0a0a] text-[13.5px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-2 overflow-hidden transition-[filter,transform,box-shadow] duration-200 ease-out hover:brightness-[0.97] active:brightness-[0.92] active:scale-[0.99] shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_-2px_0_rgba(0,0,0,0.05)] disabled:cursor-default disabled:hover:brightness-100 disabled:active:scale-100"
            >
                {/* Shine sweep on idle hover */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[280%] transition-[transform,opacity] duration-700 ease-out"
                />
                <span
                    className={`flex items-center gap-2 transition-[opacity,transform] duration-200 ease-out ${
                        isDone ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                    }`}
                >
                    <span>{isLaunching ? "Abriendo studio…" : "Empezar"}</span>
                    {!isLaunching && (
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                        >
                            <path
                                d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </span>
                <span
                    className={`absolute inset-0 flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 ease-out ${
                        isDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    }`}
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M3.5 8.5L6.5 11.5L12.5 5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>Studio abierto · comando copiado</span>
                </span>
            </button>
        </div>
    );
}

function ProposalForm({
    onCreate,
}: {
    onCreate: (args: CreateArgs) => void;
}) {
    const [projectName, setProjectName] = useState("");
    const [clientName, setClientName] = useState("");
    const [briefing, setBriefing] = useState<string>("");
    const [briefingFile, setBriefingFile] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const canStart =
        projectName.trim().length > 1 &&
        clientName.trim().length > 1 &&
        !parsing;

    const { onFile, onPaste, onCopySuperPrompt } = useBriefingHandlers({
        clientName,
        projectName,
        format: "proposal",
        setBriefing,
        setBriefingFile,
        setParsing,
        setParseError,
    });

    return (
        <FormSurface
            title="Nueva propuesta"
            subtitle="Deck 16:9 — comercial, speaker, marca, partnership o estratégica."
        >
            <Field label="Nombre del proyecto">
                <TextInput
                    value={projectName}
                    onChange={setProjectName}
                    placeholder="Ej: Propuesta Aeroméxico Q2 · Speaker Dylan · Partnership Bavaria…"
                    autoFocus
                />
            </Field>

            <Field label="Cliente / empresa">
                <TextInput
                    value={clientName}
                    onChange={setClientName}
                    placeholder="Ej: Aeroméxico · Bancolombia · Action Black"
                />
            </Field>

            <BriefingDropZone
                briefing={briefing}
                briefingFile={briefingFile}
                clientName={clientName}
                format="proposal"
                parsing={parsing}
                parseError={parseError}
                onFile={onFile}
                onPaste={onPaste}
                onClear={() => {
                    setBriefing("");
                    setBriefingFile(null);
                    setParseError(null);
                }}
                onCopySuperPrompt={onCopySuperPrompt}
            />

            <Field label="Notas adicionales — opcional">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Algo del call que el brief no cubre, restricciones, frase del cliente, deadline..."
                    className="w-full px-3 py-2 rounded-lg border border-black/[0.09] bg-white text-[13px] tracking-[-0.005em] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-2 focus:ring-black/[0.04] resize-none"
                />
            </Field>

            <DesignSystemField />

            <CreateRow
                primary={{
                    label: "Empezar",
                    accent: true,
                    disabled: !canStart,
                    onClick: () =>
                        onCreate({
                            format: "proposal",
                            clientName: clientName.trim(),
                            programId: "",
                            corporateMode: true,
                            theme: "light",
                            topic: projectName.trim(),
                            briefing: briefing.trim() || undefined,
                            notes: notes.trim() || undefined,
                        }),
                }}
            />
        </FormSurface>
    );
}

// BriefingDropZone moved to ./briefing-drop-zone.tsx — reused across
// Propuesta, Documento, etc.

function ContentForm({
    format,
    onOpenIntake,
    topicPlaceholder,
}: {
    format: ProjectFormat;
    onOpenIntake: (format: ProjectFormat, home?: HomeSeed) => void;
    topicPlaceholder: string;
}) {
    const [name, setName] = useState("");
    const canStart = name.trim().length > 1;
    const label = FORMATS[format].label;

    return (
        <FormSurface title={`Nuevo ${label.toLowerCase()}`} subtitle={FORMATS[format].description}>
            <Field label="Nombre del proyecto">
                <TextInput value={name} onChange={setName} placeholder={topicPlaceholder} autoFocus />
            </Field>

            <DesignSystemField />

            <CreateRow
                primary={{
                    label: "Empezar",
                    accent: true,
                    disabled: !canStart,
                    onClick: () =>
                        onOpenIntake(format, { clientName: name.trim() }),
                }}
            />
        </FormSurface>
    );
}

function DocForm({
    onCreate,
}: {
    onCreate: (args: CreateArgs) => void;
}) {
    const [projectName, setProjectName] = useState("");
    const [clientName, setClientName] = useState("");
    const [briefing, setBriefing] = useState<string>("");
    const [briefingFile, setBriefingFile] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const canStart =
        projectName.trim().length > 1 &&
        clientName.trim().length > 1 &&
        !parsing;

    const { onFile, onPaste, onCopySuperPrompt } = useBriefingHandlers({
        clientName,
        projectName,
        format: "doc",
        setBriefing,
        setBriefingFile,
        setParsing,
        setParseError,
    });

    return (
        <FormSurface
            title="Nuevo documento"
            subtitle="A4 para contratos, briefs, one-pagers y propuestas cortas."
        >
            <Field label="Nombre del proyecto">
                <TextInput
                    value={projectName}
                    onChange={setProjectName}
                    placeholder="Ej: Contrato 30X — Aeroméxico · Brief Davivienda"
                    autoFocus
                />
            </Field>

            <Field label="Cliente / contraparte">
                <TextInput
                    value={clientName}
                    onChange={setClientName}
                    placeholder="Ej: Aeroméxico · Bancolombia · Action Black"
                />
            </Field>

            <BriefingDropZone
                briefing={briefing}
                briefingFile={briefingFile}
                clientName={clientName}
                format="doc"
                parsing={parsing}
                parseError={parseError}
                onFile={onFile}
                onPaste={onPaste}
                onClear={() => {
                    setBriefing("");
                    setBriefingFile(null);
                    setParseError(null);
                }}
                onCopySuperPrompt={onCopySuperPrompt}
            />

            <Field label="Notas adicionales — opcional">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Plazo, condiciones especiales, frase del cliente, restricciones legales..."
                    className="w-full px-3 py-2 rounded-lg border border-black/[0.09] bg-white text-[13px] tracking-[-0.005em] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-2 focus:ring-black/[0.04] resize-none"
                />
            </Field>

            <DesignSystemField />

            <CreateRow
                primary={{
                    label: "Empezar",
                    accent: true,
                    disabled: !canStart,
                    onClick: () =>
                        onCreate({
                            format: "doc",
                            clientName: clientName.trim(),
                            programId: "",
                            corporateMode: false,
                            theme: "light",
                            topic: projectName.trim(),
                            briefing: briefing.trim() || undefined,
                            notes: notes.trim() || undefined,
                        }),
                }}
            />
        </FormSurface>
    );
}

function TemplateGrid({ onOpenTemplate }: { onOpenTemplate: (id: string) => void }) {
    return (
        <FormSurface
            title="Empezar desde plantilla"
            subtitle="Elige un punto de partida curado del catálogo 30X."
        >
            <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                    <TemplateMiniCard key={t.id} template={t} onClick={() => onOpenTemplate(t.id)} />
                ))}
            </div>
        </FormSurface>
    );
}

function OtherForm({
    onOpenIntake,
}: {
    onOpenIntake: (format: ProjectFormat, home?: HomeSeed) => void;
}) {
    const [prompt, setPrompt] = useState("");

    return (
        <FormSurface
            title="Describe lo que quieres diseñar"
            subtitle="El asistente escoge el formato — deck, carrusel, doc, prototipo — y lo lleva a ejecución."
        >
            <Field label="¿Qué necesitas?">
                <Textarea
                    value={prompt}
                    onChange={setPrompt}
                    placeholder="Ej: un one-pager para Bancolombia explicando Sales Machine, con diagnóstico y precio"
                    rows={4}
                    autoFocus
                />
            </Field>

            <CreateRow
                primary={{
                    label: "Empezar",
                    accent: true,
                    onClick: () =>
                        onOpenIntake("other", { topic: prompt.trim() || undefined }),
                }}
            />
        </FormSurface>
    );
}

// ──────────────────────────────────────────────────────────────
// Shared form primitives
// ──────────────────────────────────────────────────────────────

function FormSurface({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-[#0a0a0a]">
                    {title}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[#737373] tracking-[-0.005em] leading-[1.45]">
                    {subtitle}
                </p>
            </div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-1.5">
                {label}
            </div>
            {children}
        </div>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    autoFocus,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-10 px-3.5 rounded-lg border border-black/[0.09] bg-white text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] tracking-[-0.005em] transition-[border-color,box-shadow] duration-150"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        />
    );
}

function Textarea({
    value,
    onChange,
    placeholder,
    rows = 3,
    autoFocus,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    autoFocus?: boolean;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            className="w-full resize-none bg-white border border-black/[0.09] rounded-lg px-3.5 py-2.5 text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] tracking-[-0.005em] leading-[1.5] transition-[border-color,box-shadow] duration-150"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        />
    );
}

function Select<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className="w-full h-10 pl-3.5 pr-9 rounded-lg border border-black/[0.09] bg-white text-[14px] text-[#0a0a0a] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] appearance-none tracking-[-0.005em] transition-[border-color,box-shadow] duration-150"
                style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none"
            >
                <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

function Segmented<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
}) {
    return (
        <div
            className="grid gap-1 p-1 rounded-lg bg-black/[0.04]"
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={`h-8 rounded-md text-[12.5px] tracking-[-0.005em] transition-[background-color,color,box-shadow] duration-150 ${
                            active
                                ? "bg-white text-[#0a0a0a] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_1px_rgba(0,0,0,0.04)]"
                                : "text-[#525252] hover:text-[#0a0a0a] font-medium"
                        }`}
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function DesignSystemField() {
    return (
        <Field label="Sistema de diseño">
            <div className="flex items-center gap-2.5 h-12 px-3 rounded-lg border border-black/[0.09] bg-white">
                <img
                    src="/30x-logo-square.svg"
                    alt="30X Design System"
                    className="w-8 h-8 rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#0a0a0a] tracking-[-0.005em] leading-[1.2]">
                        30X Design System
                    </div>
                    <div className="text-[10.5px] text-[#a3a3a3] leading-[1.2] mt-0.5">Default</div>
                </div>
                <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-black/[0.04] text-[#737373] font-medium">
                    Locked
                </span>
            </div>
        </Field>
    );
}

interface CreateButton {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    accent?: boolean;
}

function CreateRow({
    primary,
    secondary,
}: {
    primary: CreateButton;
    secondary?: CreateButton;
}) {
    return (
        <div className="pt-2 flex flex-col gap-2">
            <button
                type="button"
                onClick={primary.onClick}
                disabled={primary.disabled}
                className={`w-full h-11 rounded-lg text-[13.5px] font-semibold tracking-[-0.01em] transition-[background-color,border-color,color,filter] duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    primary.accent
                        ? "bg-[#E9FF7B] text-[#0a0a0a] hover:brightness-95 active:brightness-90"
                        : "bg-[#0a0a0a] text-white hover:bg-[#262626] active:bg-[#0a0a0a]"
                }`}
                style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
                {primary.label}
            </button>
            {secondary ? (
                <button
                    type="button"
                    onClick={secondary.onClick}
                    disabled={secondary.disabled}
                    className={`w-full h-10 rounded-lg text-[13px] font-semibold tracking-[-0.01em] transition-[background-color,filter] duration-150 flex items-center justify-center gap-1.5 ${
                        secondary.accent
                            ? "bg-[#E9FF7B]/30 text-[#0a0a0a] hover:bg-[#E9FF7B]/50"
                            : "bg-transparent text-[#0a0a0a] border border-black/[0.09] hover:bg-black/[0.03]"
                    }`}
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <SparkIcon />
                    {secondary.label}
                    <ArrowRightIcon />
                </button>
            ) : null}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Recent designs grid
// ──────────────────────────────────────────────────────────────

function DesignsGrid({
    decks,
    onOpen,
    onDelete,
}: {
    decks: StoredDeck[];
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {decks.map((d) => (
                <DesignCard
                    key={d.id}
                    stored={d}
                    onClick={() => onOpen(d.id)}
                    onDelete={() => onDelete(d.id)}
                />
            ))}
        </div>
    );
}

function DesignCard({
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
                type="button"
                onClick={onClick}
                className="w-full rounded-xl overflow-hidden bg-[#f0f0f0] border border-black/[0.06] hover:border-black/[0.14] transition-colors duration-150"
                style={{
                    aspectRatio: thumbAspectFor(format),
                    transitionTimingFunction: "var(--ease-out)",
                }}
            >
                <div className="w-full h-full">
                    <SlideStage format={format}>
                        <SlideRenderer slide={deck.slides[0]} clientLogoUrl={deck.clientLogoUrl} />
                    </SlideStage>
                </div>
            </button>
            <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold tracking-[-0.015em] text-[#0a0a0a] leading-[1.35] truncate">
                        {deck.deckTitle}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-[#a3a3a3] tracking-[-0.005em] truncate">
                        {FORMATS[format].label} · {dateLabel}
                    </p>
                </div>
            </div>
            <button
                type="button"
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

function TemplateMiniCard({ template, onClick }: { template: Template; onClick: () => void }) {
    const format = template.deck.format ?? "proposal";
    return (
        <button
            type="button"
            onClick={onClick}
            className="group text-left rounded-lg border border-black/[0.06] hover:border-black/[0.18] overflow-hidden transition-colors duration-150"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
            <div
                className="w-full bg-[#f0f0f0] overflow-hidden"
                style={{ aspectRatio: thumbAspectFor(format) }}
            >
                <SlideStage format={format}>
                    <SlideRenderer
                        slide={template.deck.slides[0]}
                        clientLogoUrl={(template.deck as Deck).clientLogoUrl}
                    />
                </SlideStage>
            </div>
            <div className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                    <h4 className="text-[12.5px] font-semibold tracking-[-0.01em] text-[#0a0a0a] truncate">
                        {template.name}
                    </h4>
                    {template.badge ? (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-[0.04em] uppercase text-[#525252] bg-black/[0.04]">
                            {template.badge}
                        </span>
                    ) : null}
                </div>
                <p className="mt-0.5 text-[11.5px] text-[#737373] truncate">{template.description}</p>
            </div>
        </button>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed border-black/[0.09] bg-white px-6 py-14 text-center">
            <div className="w-9 h-9 mx-auto rounded-lg bg-black/[0.04] flex items-center justify-center mb-3">
                <IconSpark />
            </div>
            <p className="text-[13.5px] text-[#525252] mb-1">Aún no has creado diseños.</p>
            <p className="text-[12px] text-[#a3a3a3]">
                Elige un formato arriba y dale a Crear.
            </p>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Top bar pieces
// ──────────────────────────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative hidden sm:block">
            <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3]"
            >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Buscar diseños…"
                className="h-8 w-[220px] pl-7 pr-3 rounded-md border border-black/[0.06] bg-white text-[12px] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/30 focus:ring-2 focus:ring-black/[0.04]"
            />
        </div>
    );
}

function UserChip({ name, email }: { name: string; email: string }) {
    const initials = name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
        <button
            type="button"
            className="flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-full border border-black/[0.06] bg-white hover:bg-black/[0.02] transition-colors"
            title={email}
        >
            <span className="w-6 h-6 rounded-full bg-[#0a0a0a] text-white text-[10.5px] font-semibold flex items-center justify-center">
                {initials || "JD"}
            </span>
            <span className="text-[12px] font-medium text-[#0a0a0a] tracking-[-0.005em]">{name}</span>
        </button>
    );
}

// ──────────────────────────────────────────────────────────────
// Utils + Icons
// ──────────────────────────────────────────────────────────────

function thumbAspectFor(f: ProjectFormat | undefined): string {
    switch (f) {
        case "carousel-ig":
            return "1 / 1";
        case "story-ig":
            return "9 / 16";
        case "doc":
            return "794 / 1123";
        case "prototype":
            return "16 / 10";
        default:
            return "4 / 3";
    }
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

function PlusIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}
function ArrowRightIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
                d="M4 8h8m0 0l-3-3m3 3l-3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SparkIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
                d="M8 2l1.2 3.2L12.5 6.5 9.2 7.8 8 11 6.8 7.8 3.5 6.5 6.8 5.2 8 2z"
                fill="currentColor"
            />
        </svg>
    );
}
function IconPrototype() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M8 20h8M9 18v2M15 18v2" strokeLinecap="round" />
        </svg>
    );
}
function IconSlide() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <path d="M3 9h18" strokeLinecap="round" />
        </svg>
    );
}
function IconCarousel() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="6" y="4" width="12" height="16" rx="1.5" />
            <path d="M3 7v10M21 7v10" strokeLinecap="round" />
        </svg>
    );
}
function IconStory() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="6" y="3" width="12" height="18" rx="2" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
    );
}
function IconDoc() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
            <path d="M14 3v5h5" strokeLinejoin="round" />
        </svg>
    );
}
function IconTemplate() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="5" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
            <rect x="13" y="10" width="8" height="11" rx="1.5" />
        </svg>
    );
}
function IconSpark() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path
                d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
                strokeLinecap="round"
            />
        </svg>
    );
}
