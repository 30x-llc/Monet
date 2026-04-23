"use client";

import { useState, useCallback } from "react";
import { programs } from "@/lib/programs";
import type { IntakeAnswers } from "@/lib/slide-types";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

interface SeedData {
    notes?: string;
    audioTranscript?: string;
    emailThread?: string;
}

export interface IntakeResult {
    intake: IntakeAnswers;
    programId: string;
    seed: SeedData;
    corporateMode: boolean;
}

interface GuidedIntakeProps {
    onComplete: (result: IntakeResult) => void;
    onCancel: () => void;
}

// ──────────────────────────────────────────────────────────────
// Questions — pills (multiple choice) with "Decidir por mí" + "Otra…"
// ──────────────────────────────────────────────────────────────

type QuestionType = "text" | "pills";

interface Question {
    id: keyof IntakeAnswers | "deadline";
    label: string;
    helper?: string;
    type: QuestionType;
    options?: string[];
    placeholder?: string;
}

const QUESTIONS: Question[] = [
    {
        id: "clientName",
        label: "¿Para qué cliente es la propuesta?",
        helper: "El nombre exacto como lo llamarías en la portada.",
        type: "text",
        placeholder: "Ej: Colsubsidio, Corficolombiana, Grupo Éxito…",
    },
    {
        id: "decisionMaker",
        label: "¿Quién decide?",
        helper: "A quién le tiene que llegar la propuesta para que avance.",
        type: "pills",
        options: [
            "Founder / CEO",
            "VP de Talento / Gente",
            "Comité ejecutivo",
            "Área comercial",
            "CIO / CTO",
            "Junta directiva",
        ],
    },
    {
        id: "sector",
        label: "¿En qué sector opera?",
        type: "pills",
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
        label: "¿Qué tamaño tiene la empresa?",
        type: "pills",
        options: ["1–50 empleados", "50–200", "200–1,000", "1,000–5,000", "5,000+"],
    },
    {
        id: "objective",
        label: "¿Cuál es el objetivo principal?",
        helper: "Lo que el cliente realmente quiere resolver.",
        type: "pills",
        options: [
            "Formar C-level en IA",
            "Acelerar ventas B2B",
            "Cultura de ejecución",
            "Transformación digital",
            "Leadership / growth para VPs",
            "Retener talento clave",
        ],
    },
    {
        id: "format",
        label: "¿Qué formato prefieren?",
        type: "pills",
        options: ["Presencial", "Virtual", "Híbrido"],
    },
    {
        id: "budget",
        label: "¿Presupuesto aproximado?",
        helper: "USD, para el programa completo.",
        type: "pills",
        options: ["< $20K", "$20K – $50K", "$50K – $100K", "$100K – $250K", "$250K+", "Por definir"],
    },
    {
        id: "deadline",
        label: "¿Cuándo necesitan arrancar?",
        type: "pills",
        options: ["Este mes", "Próximo mes", "Este trimestre", "Este año", "Flexible"],
    },
];

const DECIDE_SENTINEL = "__decide__";

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export function GuidedIntake({ onComplete, onCancel }: GuidedIntakeProps) {
    // Project config
    const [programId, setProgramId] = useState<string>("sales-machine");
    const [corporateMode, setCorporateMode] = useState<boolean>(true);

    // Optional context
    const [notes, setNotes] = useState("");
    const [emailThread, setEmailThread] = useState("");
    const [audioFileName, setAudioFileName] = useState<string | null>(null);
    const [audioTranscript, setAudioTranscript] = useState("");
    const [contextOpen, setContextOpen] = useState(false);

    // Question answers
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [finalNotes, setFinalNotes] = useState("");

    const setAnswer = useCallback((id: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
    }, []);

    const clientAnswered = (answers.clientName || "").trim().length > 1;

    const handleSubmit = useCallback(() => {
        if (!clientAnswered) return;

        const seed: SeedData = {
            notes: notes || undefined,
            audioTranscript: audioTranscript || undefined,
            emailThread: emailThread || undefined,
        };

        // "Decide por mí" (sentinel) → undefined so the AI infers it.
        const clean = (v?: string) =>
            !v || v === DECIDE_SENTINEL ? undefined : v;

        const formatRaw = clean(answers.format)?.toLowerCase();
        const formatVal: IntakeAnswers["format"] =
            formatRaw === "presencial" ? "presencial" :
            formatRaw === "virtual" ? "virtual" :
            formatRaw === "híbrido" || formatRaw === "hibrido" ? "hybrid" :
            undefined;

        const intake: IntakeAnswers = {
            clientName: answers.clientName.trim(),
            decisionMaker: clean(answers.decisionMaker),
            sector: clean(answers.sector),
            companySize: clean(answers.companySize),
            objective: clean(answers.objective),
            format: formatVal,
            budget: clean(answers.budget),
            notes: [
                finalNotes.trim() || undefined,
                answers.deadline && answers.deadline !== DECIDE_SENTINEL
                    ? `Timeline: ${answers.deadline}`
                    : undefined,
            ]
                .filter(Boolean)
                .join("\n") || undefined,
            audioTranscript: seed.audioTranscript,
            emailThread: seed.emailThread,
        };

        onComplete({ intake, programId, seed, corporateMode });
    }, [
        clientAnswered,
        answers,
        notes,
        emailThread,
        audioTranscript,
        finalNotes,
        programId,
        corporateMode,
        onComplete,
    ]);

    const handleAudioUpload = useCallback((file: File) => {
        setAudioFileName(file.name);
    }, []);

    // Progress: how many questions answered
    const answered = QUESTIONS.filter((q) => {
        const v = answers[q.id as string];
        return !!v && v.trim().length > 0;
    }).length;

    return (
        <div className="flex flex-col h-screen bg-white text-[#0a0a0a]">
            {/* Header */}
            <header className="h-10 shrink-0 border-b border-black/[0.06] flex items-center px-5 bg-white">
                <button
                    onClick={onCancel}
                    aria-label="Ir al home"
                    className="flex items-center gap-2 -mx-1 px-1 py-1 rounded hover:bg-black/[0.04] transition-colors"
                >
                    <Logo30x variant="dark" className="h-3.5" />
                    <span className="text-[11px] font-medium text-[#737373]">Design</span>
                </button>
                <div className="flex items-center gap-2 ml-2">
                    <span className="w-px h-3 bg-black/10 mx-0.5" />
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#525252] tracking-[-0.005em]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />
                        Propuesta nueva · Modo guiado
                    </span>
                    <span className="text-[11px] text-[#737373] ml-1.5 tracking-[-0.005em]">
                        · {answered}/{QUESTIONS.length} respondidas
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
                        Propuesta nueva.
                    </h1>
                    <p className="text-[16px] text-[#525252] leading-[1.5] mb-10 max-w-[560px] tracking-[-0.005em]">
                        Responde rápido. &ldquo;Decidir por mí&rdquo; si no estás seguro — el asistente infiere el resto.
                    </p>

                    {/* Context section (collapsible) */}
                    <section className="mb-12 rounded-md border border-black/[0.08] overflow-hidden">
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
                                <Field label="Audio">
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
                                            onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
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
                                </Field>

                                <Field label="Emails del cliente">
                                    <textarea
                                        value={emailThread}
                                        onChange={(e) => setEmailThread(e.target.value)}
                                        placeholder="Pega el hilo de emails…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </Field>

                                <Field label="Notas del vendedor">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Todo lo que sepas del cliente…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3 py-2 text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </Field>
                            </div>
                        ) : null}
                    </section>

                    {/* Questions */}
                    <div className="space-y-12">
                        {QUESTIONS.map((q) =>
                            q.type === "text" ? (
                                <TextQuestion
                                    key={q.id as string}
                                    q={q}
                                    value={answers[q.id as string] ?? ""}
                                    onChange={(v) => setAnswer(q.id as string, v)}
                                />
                            ) : (
                                <PillQuestion
                                    key={q.id as string}
                                    q={q}
                                    value={answers[q.id as string] ?? ""}
                                    onChange={(v) => setAnswer(q.id as string, v)}
                                />
                            ),
                        )}

                        {/* Program + type */}
                        <section>
                            <h3 className="text-[17px] font-semibold tracking-[-0.015em] mb-2">
                                ¿Qué programa encaja mejor?
                            </h3>
                            <p className="text-[13px] text-[#737373] tracking-[-0.005em] mb-3">
                                Sugerimos uno, puedes cambiarlo.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={programId}
                                    onChange={(e) => setProgramId(e.target.value)}
                                    className="h-10 px-3 rounded-md border border-black/[0.1] bg-white text-[13px] text-[#0a0a0a] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] appearance-none bg-no-repeat bg-right tracking-[-0.005em]"
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
                            </div>
                        </section>

                        {/* Final notes */}
                        <section>
                            <h3 className="text-[17px] font-semibold tracking-[-0.015em] mb-2">
                                ¿Algo más que el asistente deba saber?
                            </h3>
                            <p className="text-[13px] text-[#737373] tracking-[-0.005em] mb-3">
                                Opcional. Cualquier detalle que no te cupo arriba.
                            </p>
                            <textarea
                                value={finalNotes}
                                onChange={(e) => setFinalNotes(e.target.value)}
                                placeholder="Ej: ya hicimos una sesión piloto en enero, el CEO quiere algo más data-driven que la vez pasada…"
                                rows={4}
                                className="w-full resize-none bg-white border border-black/[0.1] rounded-md px-3.5 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                            />
                        </section>
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                        <p className="text-[12px] text-[#737373] tracking-[-0.005em]">
                            {clientAnswered
                                ? `Listo para generar la propuesta de ${answers.clientName}.`
                                : "Necesito al menos el nombre del cliente para arrancar."}
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={!clientAnswered}
                            className="h-10 px-5 rounded-md font-semibold text-[13px] tracking-[-0.01em] transition-[filter,transform] hover:brightness-95 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: "#E9FF7B", color: "#0a0a0a", transitionTimingFunction: "var(--ease-out)" }}
                        >
                            Crear propuesta →
                        </button>
                    </div>
                </div>
            </div>
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

function PillQuestion({
    q,
    value,
    onChange,
}: {
    q: Question;
    value: string;
    onChange: (v: string) => void;
}) {
    const isCustom = Boolean(
        value && value !== DECIDE_SENTINEL && !q.options?.includes(value),
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
                <Pill
                    active={value === DECIDE_SENTINEL}
                    onClick={() => {
                        onChange(DECIDE_SENTINEL);
                        setShowOther(false);
                    }}
                    label="Decidir por mí"
                    muted
                />
                <Pill
                    active={showOther || isCustom}
                    onClick={() => setShowOther((v) => !v)}
                    label="Otra…"
                    muted
                />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[11px] font-medium text-[#525252] tracking-[-0.005em] mb-2">
                {label}
            </div>
            {children}
        </div>
    );
}

function SmallToggle({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`h-8 rounded text-[12px] font-semibold tracking-[-0.005em] transition-[background,color] duration-150 ${
                active ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#525252] hover:text-[#0a0a0a]"
            }`}
        >
            {label}
        </button>
    );
}
