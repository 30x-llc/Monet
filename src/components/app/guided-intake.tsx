"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { programs } from "@/lib/programs";
import type { IntakeAnswers, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

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

type ChatRole = "user" | "assistant";
interface ChatMessage {
    role: ChatRole;
    content: string;
}

// ──────────────────────────────────────────────────────────────
// Opening lines — cold-start when the home gave us nothing.
// When the home already passed client/topic/program, initialOpener
// composes a smarter first question instead of these.
// ──────────────────────────────────────────────────────────────

const OPENERS: Record<ProjectFormat, string> = {
    proposal:
        "Listo. Armamos una propuesta. ¿Para qué cliente es?",
    prototype:
        "Vamos con un prototipo. ¿Cuál es el producto y qué tiene que resolver?",
    "carousel-ig":
        "Vamos con un carrusel. ¿De qué trata y a quién le habla?",
    "story-ig":
        "Historia rápida. ¿Qué anuncia y qué acción pides?",
    doc: "Documento A4. ¿Cuál es el título y para quién es?",
    other:
        "Dale — describe lo que necesitas y yo escojo el formato y vamos al detalle.",
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
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: initialOpener(format, home) },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Seed context (collapsible)
    const [contextOpen, setContextOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [emailThread, setEmailThread] = useState("");
    const [audioFileName, setAudioFileName] = useState<string | null>(null);
    const [audioTranscript, setAudioTranscript] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Autoscroll to bottom on new message
    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, sending]);

    const finish = useCallback(
        (intake: IntakeAnswers, suggestedProgramId?: string) => {
            const resolvedProgramId =
                suggestedProgramId || home?.programId || "sales-machine";
            const resolvedFormat = intake.suggestedFormat ?? format;
            onComplete({
                intake,
                programId: resolvedProgramId,
                seed: {
                    notes: notes || undefined,
                    emailThread: emailThread || undefined,
                    audioTranscript: audioTranscript || undefined,
                },
                corporateMode: home?.corporateMode ?? true,
                format: resolvedFormat,
            });
        },
        [home, format, notes, emailThread, audioTranscript, onComplete],
    );

    const sendMessage = useCallback(
        async (userText: string) => {
            const trimmed = userText.trim();
            if (!trimmed || sending) return;

            const nextMessages: ChatMessage[] = [
                ...messages,
                { role: "user", content: trimmed },
            ];
            setMessages(nextMessages);
            setInput("");
            setSending(true);
            setError(null);

            try {
                const res = await fetch("/api/intake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        format,
                        home,
                        seed: {
                            notes: notes || undefined,
                            emailThread: emailThread || undefined,
                            audioTranscript: audioTranscript || undefined,
                        },
                        messages: nextMessages,
                    }),
                });
                const data = await res.json();
                if (!data.ok) throw new Error(data.error || "Intake falló");

                const reply: string = data.reply ?? "";

                // Try to detect closing JSON
                const jsonMatch = reply.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.done && parsed.intake) {
                            finish(
                                normalizeIntake(parsed.intake, home),
                                parsed.suggestedProgramId,
                            );
                            return;
                        }
                    } catch {
                        // fall through — show raw reply
                    }
                }

                setMessages([...nextMessages, { role: "assistant", content: reply }]);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setSending(false);
                textareaRef.current?.focus();
            }
        },
        [
            messages,
            sending,
            format,
            home,
            notes,
            emailThread,
            audioTranscript,
            finish,
        ],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleDecideForMe = () => {
        sendMessage("Decide tú, lo que veas.");
    };

    const handleAudioUpload = (file: File) => {
        setAudioFileName(file.name);
    };

    const formatLabel = FORMATS[format].label.toLowerCase();

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
                </div>
                <button
                    onClick={onCancel}
                    className="ml-auto text-[12px] text-[#737373] hover:text-[#0a0a0a] tracking-[-0.005em] transition-colors"
                >
                    Cancelar
                </button>
            </header>

            {/* Chat area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="max-w-[680px] mx-auto px-6 pt-10 pb-40">
                    {/* Seed context (collapsible) */}
                    <section className="mb-6 rounded-lg border border-black/[0.06] overflow-hidden bg-white">
                        <button
                            onClick={() => setContextOpen((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    className="text-[#737373]"
                                >
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[12.5px] font-semibold tracking-[-0.005em]">
                                    Contexto inicial
                                </span>
                                <span className="text-[11px] text-[#a3a3a3]">
                                    Audio · Emails · Notas — opcional
                                </span>
                            </div>
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                className={`text-[#737373] transition-transform duration-200 ${
                                    contextOpen ? "rotate-180" : ""
                                }`}
                            >
                                <path
                                    d="M4 6L8 10L12 6"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        {contextOpen ? (
                            <div className="border-t border-black/[0.06] p-4 space-y-3">
                                <SeedField label="Audio">
                                    <label className="flex items-center gap-2.5 border border-black/[0.1] hover:border-black/[0.25] transition-colors bg-white rounded-lg px-3.5 py-2.5 cursor-pointer">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[#525252]">
                                            <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M19 11a7 7 0 01-14 0M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="text-[12.5px] text-[#0a0a0a] flex-1 tracking-[-0.005em]">
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
                                            className="mt-2 w-full resize-none bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-[12.5px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                        />
                                    ) : null}
                                </SeedField>

                                <SeedField label="Emails del cliente">
                                    <textarea
                                        value={emailThread}
                                        onChange={(e) => setEmailThread(e.target.value)}
                                        placeholder="Pega el hilo de emails…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-[12.5px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </SeedField>

                                <SeedField label="Notas">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Todo lo que sepas del proyecto…"
                                        rows={3}
                                        className="w-full resize-none bg-white border border-black/[0.1] rounded-lg px-3 py-2 text-[12.5px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/[0.04] leading-[1.5] tracking-[-0.005em]"
                                    />
                                </SeedField>
                            </div>
                        ) : null}
                    </section>

                    {/* Chat messages */}
                    <div className="space-y-5">
                        {messages.map((m, i) =>
                            m.role === "assistant" ? (
                                <CoraMessage key={i} text={m.content} />
                            ) : (
                                <UserMessage key={i} text={m.content} />
                            ),
                        )}
                        {sending ? <CoraTyping /> : null}
                        {error ? (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-[12px] text-red-800">
                                {error}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Input dock */}
            <div className="shrink-0 border-t border-black/[0.06] bg-white">
                <div className="max-w-[680px] mx-auto px-6 py-4">
                    <div className="rounded-xl border border-black/[0.09] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_-6px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] focus-within:border-black/30 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Escribe sobre tu ${formatLabel}…`}
                            rows={2}
                            disabled={sending}
                            autoFocus
                            className="w-full resize-none bg-transparent px-4 pt-3 text-[14px] text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none tracking-[-0.005em] leading-[1.5]"
                        />
                        <div className="flex items-center gap-2 px-3 pb-3">
                            <button
                                type="button"
                                onClick={handleDecideForMe}
                                disabled={sending}
                                className="h-7 px-3 rounded-full border border-black/[0.09] bg-white text-[11.5px] font-medium text-[#525252] hover:bg-black/[0.03] hover:border-black/[0.2] transition-colors disabled:opacity-40"
                            >
                                Decide tú
                            </button>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10.5px] text-[#a3a3a3] hidden sm:inline">
                                    Enter para enviar · Shift+Enter para salto
                                </span>
                                <button
                                    type="button"
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || sending}
                                    className="h-8 w-8 rounded-lg bg-[#0a0a0a] text-white flex items-center justify-center hover:bg-[#262626] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Enviar"
                                >
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M8 13V3M8 3L3 8M8 3L13 8"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Message bubbles
// ──────────────────────────────────────────────────────────────

function CoraMessage({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3">
            <AssistantAvatar />
            <div className="flex-1 pt-0.5">
                <div className="text-[11px] font-semibold text-[#737373] mb-1 tracking-[-0.005em]">
                    30x Design
                </div>
                <div className="text-[14.5px] text-[#0a0a0a] leading-[1.55] tracking-[-0.005em] whitespace-pre-wrap">
                    {text}
                </div>
            </div>
        </div>
    );
}

function AssistantAvatar() {
    return (
        <img
            src="/30x-avatar.svg"
            alt="30x"
            className="shrink-0 w-7 h-7 rounded-full"
        />
    );
}

function UserMessage({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3 flex-row-reverse">
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#0a0a0a] text-white text-[10.5px] font-semibold flex items-center justify-center">
                JD
            </div>
            <div className="flex-1 pt-0.5 max-w-[85%]">
                <div className="rounded-2xl rounded-tr-md bg-[#0a0a0a] text-white px-4 py-2.5">
                    <div className="text-[14.5px] leading-[1.5] tracking-[-0.005em] whitespace-pre-wrap">
                        {text}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CoraTyping() {
    return (
        <div className="flex items-start gap-3">
            <AssistantAvatar />
            <div className="flex-1 pt-0.5">
                <div className="text-[11px] font-semibold text-[#737373] mb-1 tracking-[-0.005em]">
                    30x Design
                </div>
                <div className="flex items-center gap-1 h-[22px]">
                    <Dot />
                    <Dot delay="120ms" />
                    <Dot delay="240ms" />
                </div>
            </div>
        </div>
    );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
    return (
        <span
            className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3]"
            style={{
                animation: "coraDot 1.2s ease-in-out infinite",
                animationDelay: delay,
            }}
        />
    );
}

// ──────────────────────────────────────────────────────────────
// Seed field wrapper
// ──────────────────────────────────────────────────────────────

function SeedField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <div className="text-[10.5px] font-medium text-[#525252] tracking-[-0.005em] mb-1.5 uppercase">
                {label}
            </div>
            {children}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function initialOpener(format: ProjectFormat, home: HomeSeed | undefined): string {
    const base = OPENERS[format] ?? OPENERS.other;
    if (!home) return base;

    // Proposal with client + program already picked: both clientName and
    // objective are known (the objective is whatever the program teaches).
    // Jump straight to delivery details instead of re-asking things we have.
    if (format === "proposal" && home.clientName && home.programId) {
        const prog = programs.find((p) => p.id === home.programId);
        const progName = prog?.name ?? "el programa";
        return `${progName} para ${home.clientName}. ¿Cuántos cupos y en qué formato — presencial, virtual o híbrido?`;
    }

    if (format === "proposal" && home.clientName) {
        return `Propuesta para ${home.clientName}. ¿Qué programa de 30x les queremos vender?`;
    }

    if (format === "proposal" && home.programId) {
        const prog = programs.find((p) => p.id === home.programId);
        const progName = prog?.name ?? "el programa";
        return `Vamos con ${progName}. ¿Para qué cliente es?`;
    }

    if (home.topic && !home.clientName) {
        // Content formats seeded from the home textarea.
        return `Tengo el brief: "${home.topic.slice(0, 140)}". Cuéntame un poco más si hay algo clave que falte — o dime "listo" y lo diseño.`;
    }

    return base;
}

function normalizeIntake(raw: unknown, home: HomeSeed | undefined): IntakeAnswers {
    const obj = (raw ?? {}) as Record<string, unknown>;
    const str = (k: string): string | undefined => {
        const v = obj[k];
        return typeof v === "string" && v.trim() ? v.trim() : undefined;
    };
    const formatVal = str("format");
    const mappedFormat: IntakeAnswers["format"] =
        formatVal === "presencial" ? "presencial" :
        formatVal === "virtual" ? "virtual" :
        formatVal === "hybrid" || formatVal === "híbrido" || formatVal === "hibrido" ? "hybrid" :
        undefined;

    const suggested = str("suggestedFormat") as ProjectFormat | undefined;
    const themeRaw = str("theme")?.toLowerCase();
    const theme: IntakeAnswers["theme"] =
        themeRaw === "light" || themeRaw === "claro" ? "light" :
        themeRaw === "dark" || themeRaw === "oscuro" ? "dark" :
        undefined;

    return {
        clientName: str("clientName") || home?.clientName || "30X",
        decisionMaker: str("decisionMaker"),
        sector: str("sector"),
        companySize: str("companySize"),
        objective: str("objective"),
        format: mappedFormat,
        budget: str("budget"),
        topic: str("topic") || home?.topic,
        audience: str("audience"),
        hook: str("hook"),
        ctaLabel: str("ctaLabel"),
        tone: str("tone"),
        keyScreens: str("keyScreens"),
        suggestedFormat: suggested,
        theme,
    };
}
