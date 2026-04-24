"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { programs } from "@/lib/programs";
import type { IntakeAnswers, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface SeedData {
    notes?: string;
    audioTranscript?: string;
    emailThread?: string;
}

interface HomeSeed {
    clientName?: string;
    topic?: string;
    programId?: string;
    corporateMode?: boolean;
    prototypeKind?: "app" | "landing" | "component";
    docKind?: "proposal" | "contract" | "one-pager" | "other";
}

export interface IntakeResult {
    intake: IntakeAnswers;
    programId: string;
    seed: SeedData;
    corporateMode: boolean;
    format: ProjectFormat;
}

interface GuidedIntakeProps {
    onComplete: (result: IntakeResult) => void;
    onCancel: () => void;
    format?: ProjectFormat;
    home?: HomeSeed;
}

type AnswerKey =
    | "clientName"
    | "topic"
    | "sector"
    | "companySize"
    | "objective"
    | "format"
    | "budget"
    | "seats"
    | "audience"
    | "hook"
    | "ctaLabel"
    | "tone"
    | "keyScreens"
    | "prototypeKind"
    | "docKind"
    | "suggestedFormat"
    | "theme";

type QuestionType = "text" | "textarea" | "pills";

interface Question {
    id: AnswerKey;
    type: QuestionType;
    label: string;
    helper?: string;
    placeholder?: string;
    options?: string[];
    /** Show "Decidir por mí" pill (default true for pills) */
    allowDecide?: boolean;
    /** Show "Otra…" escape hatch (default true for pills) */
    allowOther?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Question sets per format
// ──────────────────────────────────────────────────────────────

const DECIDE = "__decide__";

const Q_PROPOSAL: Question[] = [
    {
        id: "clientName",
        type: "text",
        label: "¿Para qué cliente es la propuesta?",
        helper: "Usaremos este nombre en la portada. Con la empresa alcanza.",
        placeholder: "Ej: Colsubsidio, Corficolombiana, Grupo Éxito…",
    },
    {
        id: "sector",
        type: "pills",
        label: "¿En qué sector opera?",
        options: [
            "Financiero",
            "Retail / consumo",
            "Tecnología",
            "Salud",
            "Educación",
            "Industrial / manufactura",
            "Servicios profesionales",
            "Energía",
        ],
    },
    {
        id: "companySize",
        type: "pills",
        label: "¿Qué tamaño tiene la empresa?",
        options: ["1–50 empleados", "50–200", "200–1,000", "1,000–5,000", "5,000+"],
    },
    {
        id: "seats",
        type: "pills",
        label: "¿Cuántos cupos necesitan?",
        options: ["10–20", "20–40", "40–80", "80–150", "150+"],
    },
    {
        id: "format",
        type: "pills",
        label: "¿Qué formato prefieren?",
        options: ["Presencial", "Virtual", "Híbrido"],
    },
    {
        id: "budget",
        type: "pills",
        label: "¿Presupuesto aproximado?",
        helper: "USD para el programa completo.",
        options: ["< $20K", "$20K – $50K", "$50K – $100K", "$100K – $250K", "$250K+"],
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia del deck?",
        options: ["Oscuro", "Claro"],
    },
];

const Q_PROTOTYPE: Question[] = [
    {
        id: "clientName",
        type: "text",
        label: "¿Cómo se llama el prototipo?",
        placeholder: "Ej: Sales Machine Dashboard",
    },
    {
        id: "prototypeKind",
        type: "pills",
        label: "¿Qué tipo de prototipo es?",
        options: ["App", "Landing", "Componente"],
    },
    {
        id: "audience",
        type: "pills",
        label: "¿Para qué usuario es?",
        options: ["Founder", "Vendedor B2B", "C-level", "Analista", "Diseñador"],
    },
    {
        id: "objective",
        type: "text",
        label: "¿Qué acción principal tiene que lograr el usuario?",
        placeholder: "Ej: cerrar más deals sin abrir hojas de cálculo",
    },
    {
        id: "keyScreens",
        type: "textarea",
        label: "¿Qué pantallas o componentes son críticos?",
        placeholder: "Ej: login, dashboard, detalle de deal, outbound queue",
    },
    {
        id: "tone",
        type: "pills",
        label: "¿Referencia estética?",
        options: [
            "Linear-like",
            "Raycast-like",
            "Notion-like",
            "Apple-like",
            "Figma-like",
            "Vercel-like",
        ],
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia?",
        options: ["Oscuro", "Claro"],
    },
];

const Q_CAROUSEL: Question[] = [
    {
        id: "topic",
        type: "textarea",
        label: "¿De qué trata el carrusel?",
        placeholder: "Ej: 5 lecciones que aprendimos escalando ventas B2B",
    },
    {
        id: "audience",
        type: "pills",
        label: "¿A quién le habla?",
        options: [
            "Founders",
            "Vendedores B2B",
            "C-level",
            "VPs de Growth",
            "Product managers",
            "Creators",
        ],
    },
    {
        id: "hook",
        type: "pills",
        label: "¿Qué tipo de hook?",
        helper: "El ángulo del primer slide.",
        options: [
            "Lista numerada",
            "Historia personal",
            "Dato contraintuitivo",
            "Error común",
            "Pregunta directa",
        ],
    },
    {
        id: "ctaLabel",
        type: "pills",
        label: "¿CTA del último slide?",
        options: [
            "Aplica al programa",
            "Comenta PLAY",
            "Link en bio",
            "Manda DM",
            "Guarda y comparte",
        ],
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia?",
        options: ["Oscuro", "Claro"],
    },
];

const Q_STORY: Question[] = [
    {
        id: "topic",
        type: "text",
        label: "¿Qué anuncia o comunica la historia?",
        placeholder: "Ej: Nueva cohort de Sales Machine arranca en abril",
    },
    {
        id: "ctaLabel",
        type: "pills",
        label: "¿Qué acción pides?",
        options: ["Link en bio", "Swipe up", "Manda DM", "Aplica ya", "Comparte"],
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia?",
        options: ["Oscuro", "Claro"],
    },
];

const Q_DOC: Question[] = [
    {
        id: "clientName",
        type: "text",
        label: "¿Título del documento?",
        placeholder: "Ej: Contrato de formación ejecutiva — Grupo Éxito",
    },
    {
        id: "docKind",
        type: "pills",
        label: "¿Qué tipo de documento?",
        options: ["Propuesta corta", "Contrato", "One-pager", "Brief"],
    },
    {
        id: "audience",
        type: "text",
        label: "¿Para quién es?",
        placeholder: "Ej: VP de Talento de Bancolombia",
    },
    {
        id: "tone",
        type: "pills",
        label: "¿Tono del documento?",
        options: ["Formal", "Directo", "Ejecutivo", "Consultivo"],
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia?",
        options: ["Claro", "Oscuro"],
    },
];

const Q_OTHER: Question[] = [
    {
        id: "topic",
        type: "textarea",
        label: "Describe lo que necesitas",
        placeholder: "Ej: un one-pager para Bancolombia con Sales Machine, diagnóstico y precio",
    },
    {
        id: "suggestedFormat",
        type: "pills",
        label: "¿Qué formato crees que encaja?",
        helper: "Si no sabes, déjalo en Decide tú.",
        options: ["Propuesta", "Carrusel IG", "Historia IG", "Documento", "Prototipo"],
        allowOther: false,
    },
    {
        id: "audience",
        type: "text",
        label: "¿Quién lo va a ver?",
        placeholder: "Ej: CEO de una empresa mid-market en Colombia",
    },
    {
        id: "theme",
        type: "pills",
        label: "¿Apariencia?",
        options: ["Oscuro", "Claro"],
    },
];

const QUESTIONS_BY_FORMAT: Record<ProjectFormat, Question[]> = {
    proposal: Q_PROPOSAL,
    prototype: Q_PROTOTYPE,
    "carousel-ig": Q_CAROUSEL,
    "story-ig": Q_STORY,
    doc: Q_DOC,
    other: Q_OTHER,
};

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function GuidedIntake({
    onComplete,
    onCancel,
    format = "proposal",
    home,
}: GuidedIntakeProps) {
    // Skip questions already answered by the home seed. Each entry in this
    // set is a question id that we won't render — its value is pulled from
    // the home seed at submit time.
    const seededIds = useMemo(() => {
        const s = new Set<AnswerKey>();
        if (home?.clientName) s.add("clientName");
        if (home?.topic) s.add("topic");
        if (home?.prototypeKind) s.add("prototypeKind");
        if (home?.docKind) s.add("docKind");
        return s;
    }, [home]);

    const visibleQuestions = useMemo(
        () => QUESTIONS_BY_FORMAT[format].filter((q) => !seededIds.has(q.id)),
        [format, seededIds],
    );

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [contextOpen, setContextOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [emailThread, setEmailThread] = useState("");
    const [audioFileName, setAudioFileName] = useState<string | null>(null);
    const [audioTranscript, setAudioTranscript] = useState("");

    const setAnswer = useCallback((id: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    }, []);

    const answeredCount = visibleQuestions.filter((q) => {
        const v = answers[q.id];
        return !!v && v.trim().length > 0;
    }).length;

    const handleAudioUpload = useCallback((file: File) => {
        setAudioFileName(file.name);
    }, []);

    const handleSubmit = useCallback(() => {
        const clean = (v?: string): string | undefined =>
            !v || v === DECIDE ? undefined : v.trim() || undefined;

        const formatRaw = clean(answers.format)?.toLowerCase();
        const mappedFormat: IntakeAnswers["format"] =
            formatRaw === "presencial" ? "presencial" :
            formatRaw === "virtual" ? "virtual" :
            formatRaw === "híbrido" || formatRaw === "hibrido" ? "hybrid" :
            undefined;

        const themeRaw = clean(answers.theme)?.toLowerCase();
        const theme: IntakeAnswers["theme"] =
            themeRaw === "claro" ? "light" : themeRaw === "oscuro" ? "dark" : undefined;

        const suggestedFormatRaw = clean(answers.suggestedFormat)?.toLowerCase();
        const mappedSuggested: ProjectFormat | undefined =
            suggestedFormatRaw === "propuesta" ? "proposal" :
            suggestedFormatRaw === "carrusel ig" ? "carousel-ig" :
            suggestedFormatRaw === "historia ig" ? "story-ig" :
            suggestedFormatRaw === "documento" ? "doc" :
            suggestedFormatRaw === "prototipo" ? "prototype" :
            undefined;

        const seatsBlock = clean(answers.seats) ? `Cupos: ${answers.seats}` : undefined;
        const mergedNotes = [seatsBlock, clean(answers.notes)].filter(Boolean).join("\n");

        const intake: IntakeAnswers = {
            clientName: clean(answers.clientName) || home?.clientName || "30X",
            sector: clean(answers.sector),
            companySize: clean(answers.companySize),
            objective: clean(answers.objective),
            format: mappedFormat,
            budget: clean(answers.budget),
            topic: clean(answers.topic) || home?.topic,
            audience: clean(answers.audience),
            hook: clean(answers.hook),
            ctaLabel: clean(answers.ctaLabel),
            tone: clean(answers.tone),
            keyScreens: clean(answers.keyScreens),
            suggestedFormat: mappedSuggested,
            theme,
            notes: mergedNotes || undefined,
            audioTranscript: audioTranscript || undefined,
            emailThread: emailThread || undefined,
        };

        const seed: SeedData = {
            notes: notes || undefined,
            audioTranscript: audioTranscript || undefined,
            emailThread: emailThread || undefined,
        };

        const resolvedProgramId = home?.programId || "sales-machine";
        const resolvedFormat = mappedSuggested ?? format;

        onComplete({
            intake,
            programId: resolvedProgramId,
            seed,
            corporateMode: home?.corporateMode ?? true,
            format: resolvedFormat,
        });
    }, [answers, audioTranscript, emailThread, notes, format, home, onComplete]);

    // The only truly required field is the client/project name (unless home seeded it)
    const canSubmit = seededIds.has("clientName")
        ? true
        : format === "proposal" || format === "prototype" || format === "doc"
          ? (answers.clientName ?? "").trim().length > 1
          : (answers.topic ?? "").trim().length > 2;

    const formatLabel = FORMATS[format].label.toLowerCase();
    const heroTitle =
        format === "proposal" ? "Propuesta nueva." :
        format === "prototype" ? "Prototipo nuevo." :
        format === "carousel-ig" ? "Carrusel nuevo." :
        format === "story-ig" ? "Historia nueva." :
        format === "doc" ? "Documento nuevo." :
        "Nuevo diseño.";

    return (
        <div className="flex flex-col h-screen bg-[#fafafa] text-[#0a0a0a]">
            {/* Header */}
            <header className="h-12 shrink-0 border-b border-black/[0.06] bg-[#fafafa]/80 backdrop-blur-md flex items-center px-5">
                <button
                    onClick={onCancel}
                    aria-label="Volver al home"
                    className="flex items-center gap-2 -mx-1 px-1 py-1 rounded hover:bg-black/[0.04] transition-colors"
                >
                    <Logo30x variant="dark" className="h-3.5" />
                    <span className="text-[11px] font-medium text-[#737373]">Design</span>
                </button>
                <div className="flex items-center gap-2 ml-3">
                    <span className="w-px h-3 bg-black/10" />
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#525252] tracking-[-0.005em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />
                        Diseñando tu {formatLabel}
                    </span>
                    <span className="text-[11px] text-[#a3a3a3] ml-1">
                        · {answeredCount}/{visibleQuestions.length} respondidas
                    </span>
                </div>
                <button
                    onClick={onCancel}
                    className="ml-auto text-[12px] text-[#737373] hover:text-[#0a0a0a] tracking-[-0.005em] transition-colors"
                >
                    Cancelar
                </button>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[720px] mx-auto px-8 py-14">
                    <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] mb-3">
                        {heroTitle}
                    </h1>
                    <p className="text-[16px] text-[#525252] leading-[1.5] mb-10 max-w-[560px] tracking-[-0.005em]">
                        Escoge lo que aplica. Si no sabes, pon Decidir por mí y lo infiero.
                    </p>

                    {/* What we already know from the home */}
                    {seededIds.size > 0 || home?.programId ? (
                        <SeedStrip home={home} seededIds={seededIds} />
                    ) : null}

                    {/* Optional context */}
                    <section className="mb-12 rounded-md border border-black/[0.08] overflow-hidden bg-white">
                        <button
                            onClick={() => setContextOpen((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold tracking-[-0.005em]">
                                    Contexto inicial
                                </span>
                                <span className="text-[11px] text-[#737373]">
                                    Audio · Emails · Notas — opcional
                                </span>
                            </div>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                className={`text-[#737373] transition-transform duration-200 ${contextOpen ? "rotate-180" : ""}`}
                            >
                                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {contextOpen ? (
                            <div className="border-t border-black/[0.06] p-4 space-y-4">
                                <SeedField label="Audio">
                                    <label className="flex items-center gap-3 border border-black/[0.1] hover:border-black/[0.25] transition-colors bg-white rounded-md px-4 py-3 cursor-pointer">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[#525252]">
                                            <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19 11a7 7 0 01-14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="text-[13px] text-[#0a0a0a] flex-1 tracking-[-0.005em]">
                                            {audioFileName ?? "Subir nota de voz"}
                                        </span>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                e.target.files?.[0] && handleAudioUpload(e.target.files[0])
                                            }
                                        />
                                    </label>
                                    {audioFileName ? (
                                        <textarea
                                            value={audioTranscript}
                                            onChange={(e) => setAudioTranscript(e.target.value)}
                                            placeholder="Pega la transcripción del audio…"
                                            rows={3}
                                            className="mt-2.5 w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                        />
                                    ) : null}
                                </SeedField>

                                <SeedField label="Emails del cliente">
                                    <textarea
                                        value={emailThread}
                                        onChange={(e) => setEmailThread(e.target.value)}
                                        placeholder="Pega el hilo de emails…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </SeedField>

                                <SeedField label="Notas del vendedor">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Todo lo que sepas del cliente…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </SeedField>
                            </div>
                        ) : null}
                    </section>

                    {/* Questions */}
                    <div className="space-y-12">
                        {visibleQuestions.map((q) =>
                            q.type === "text" ? (
                                <TextQuestion
                                    key={q.id}
                                    q={q}
                                    value={answers[q.id] ?? ""}
                                    onChange={(v) => setAnswer(q.id, v)}
                                />
                            ) : q.type === "textarea" ? (
                                <TextareaQuestion
                                    key={q.id}
                                    q={q}
                                    value={answers[q.id] ?? ""}
                                    onChange={(v) => setAnswer(q.id, v)}
                                />
                            ) : (
                                <PillQuestion
                                    key={q.id}
                                    q={q}
                                    value={answers[q.id] ?? ""}
                                    onChange={(v) => setAnswer(q.id, v)}
                                />
                            ),
                        )}
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                        <p className="text-[12px] text-[#737373] tracking-[-0.005em]">
                            {canSubmit
                                ? "Listo para generar."
                                : "Escribe al menos el nombre del proyecto para empezar."}
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="h-11 px-6 rounded-lg font-semibold text-[13.5px] tracking-[-0.01em] transition-[filter,transform] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: "#E9FF7B",
                                color: "#0a0a0a",
                                transitionTimingFunction: "var(--ease-out)",
                            }}
                        >
                            Crear {formatLabel} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Seeded-from-home strip
// ──────────────────────────────────────────────────────────────

function SeedStrip({ home, seededIds }: { home: HomeSeed | undefined; seededIds: Set<AnswerKey> }) {
    if (!home) return null;
    const chips: { label: string; value: string }[] = [];
    if (seededIds.has("clientName") && home.clientName)
        chips.push({ label: "Cliente", value: home.clientName });
    if (seededIds.has("topic") && home.topic)
        chips.push({ label: "Tema", value: home.topic.slice(0, 80) });
    if (home.programId) {
        const prog = programs.find((p) => p.id === home.programId);
        if (prog) chips.push({ label: "Programa", value: prog.name });
    }
    if (seededIds.has("prototypeKind") && home.prototypeKind)
        chips.push({ label: "Tipo", value: home.prototypeKind });
    if (seededIds.has("docKind") && home.docKind)
        chips.push({ label: "Tipo", value: home.docKind });
    if (chips.length === 0) return null;

    return (
        <div className="mb-8 flex flex-wrap gap-2">
            {chips.map((c, i) => (
                <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] text-[11.5px] tracking-[-0.005em]"
                >
                    <span className="text-[#737373]">{c.label}:</span>
                    <span className="text-[#0a0a0a] font-medium">{c.value}</span>
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Question renderers
// ──────────────────────────────────────────────────────────────

function TextQuestion({
    q,
    value,
    onChange,
}: {
    q: Question;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <section>
            <h3 className="text-[17px] font-semibold tracking-[-0.015em] mb-2">{q.label}</h3>
            {q.helper ? (
                <p className="text-[13px] text-[#737373] tracking-[-0.005em] mb-3">{q.helper}</p>
            ) : null}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={q.placeholder}
                className="w-full h-10 px-3.5 rounded-md border border-black/[0.1] bg-white text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] tracking-[-0.005em]"
            />
        </section>
    );
}

function TextareaQuestion({
    q,
    value,
    onChange,
}: {
    q: Question;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <section>
            <h3 className="text-[17px] font-semibold tracking-[-0.015em] mb-2">{q.label}</h3>
            {q.helper ? (
                <p className="text-[13px] text-[#737373] tracking-[-0.005em] mb-3">{q.helper}</p>
            ) : null}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3.5 py-2.5 text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
            />
        </section>
    );
}

function PillQuestion({
    q,
    value,
    onChange,
}: {
    q: Question;
    value: string;
    onChange: (v: string) => void;
}) {
    const allowDecide = q.allowDecide ?? true;
    const allowOther = q.allowOther ?? true;
    const isCustom = Boolean(
        value && value !== DECIDE && !q.options?.includes(value),
    );
    const [showOther, setShowOther] = useState<boolean>(isCustom);
    const [otherText, setOtherText] = useState<string>(isCustom ? value : "");

    return (
        <section>
            <h3 className="text-[17px] font-semibold tracking-[-0.015em] mb-2">{q.label}</h3>
            {q.helper ? (
                <p className="text-[13px] text-[#737373] tracking-[-0.005em] mb-3">{q.helper}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
                {q.options?.map((o) => (
                    <Pill
                        key={o}
                        active={value === o}
                        onClick={() => {
                            onChange(o);
                            setShowOther(false);
                        }}
                        label={o}
                    />
                ))}
                {allowDecide ? (
                    <Pill
                        active={value === DECIDE}
                        onClick={() => {
                            onChange(DECIDE);
                            setShowOther(false);
                        }}
                        label="Decidir por mí"
                        muted
                    />
                ) : null}
                {allowOther ? (
                    <Pill
                        active={showOther || isCustom}
                        onClick={() => setShowOther((v) => !v)}
                        label="Otra…"
                        muted
                    />
                ) : null}
                {showOther ? (
                    <input
                        type="text"
                        value={otherText}
                        onChange={(e) => {
                            setOtherText(e.target.value);
                            onChange(e.target.value);
                        }}
                        placeholder="Otra respuesta…"
                        className="h-9 px-3 min-w-[220px] flex-1 rounded-full border border-black/[0.15] bg-white text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/60"
                    />
                ) : null}
            </div>
        </section>
    );
}

function Pill({
    active,
    onClick,
    label,
    muted,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    muted?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-9 px-4 rounded-full text-[13px] tracking-[-0.005em] transition-[background,border-color,color] duration-150 border ${
                active
                    ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                    : muted
                      ? "bg-transparent text-[#737373] border-black/[0.1] hover:border-black/30 hover:text-[#0a0a0a]"
                      : "bg-transparent text-[#0a0a0a] border-black/[0.12] hover:border-black/35 hover:bg-black/[0.03]"
            }`}
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
            {label}
        </button>
    );
}

function SeedField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-2">
                {label}
            </div>
            {children}
        </div>
    );
}
