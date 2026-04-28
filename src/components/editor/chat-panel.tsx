"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "error";
    text: string;
    /** "thinking" used for the placeholder bubble while iterate is running. */
    state?: "thinking" | "done";
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSend: (message: string) => void;
    isLoading: boolean;
    chromeTheme: "dark" | "light";
}

const SUGGESTIONS = [
    "Cambia el headline de la portada",
    "Hazlo mas concreto y cuantitativo",
    "Agrega una slide de testimonios",
    "Ajusta el tono a mas ejecutivo",
];

export function ChatPanel({ messages, onSend, isLoading, chromeTheme }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    function submit() {
        const value = input.trim();
        if (!value || isLoading) return;
        onSend(value);
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
    }

    const isEmpty = messages.length === 0;

    return (
        <aside
            className="w-[360px] shrink-0 border-r border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex flex-col min-h-0"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
            <div className="h-10 shrink-0 px-4 flex items-center gap-2 border-b border-[var(--chrome-border)]">
                <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--chrome-accent)]"
                    aria-hidden
                />
                <span className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--chrome-fg)]">
                    Asistente
                </span>
                <span className="ml-auto text-[10px] font-medium text-[var(--chrome-fg-5)] uppercase tracking-[0.04em]">
                    Agentic edits
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
                {isEmpty ? (
                    <EmptyState chromeTheme={chromeTheme} onPick={(s) => onSend(s)} />
                ) : (
                    <ul className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                            {messages.map((m) => (
                                <MessageBubble key={m.id} m={m} />
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </div>

            <div className="shrink-0 border-t border-[var(--chrome-border)] p-3">
                <div className="rounded-[14px] border border-[var(--chrome-border)] bg-[var(--chrome-input-bg,var(--chrome-bg-2))] focus-within:border-[var(--chrome-accent)] focus-within:ring-2 focus-within:ring-[var(--chrome-accent)]/30 transition-[border-color,box-shadow] duration-150">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            const el = e.currentTarget;
                            el.style.height = "auto";
                            el.style.height = Math.min(el.scrollHeight, 160) + "px";
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        rows={1}
                        placeholder="Pidele al agente: cambiar texto, agregar slide, ajustar imagen..."
                        disabled={isLoading}
                        className="w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1 text-[13px] leading-snug text-[var(--chrome-fg)] placeholder:text-[var(--chrome-fg-5)] focus:outline-none disabled:opacity-50"
                    />
                    <div className="flex items-center justify-between px-2.5 pb-2 pt-0.5">
                        <span className="text-[10px] text-[var(--chrome-fg-5)]">
                            Enter envia, Shift+Enter salto de linea
                        </span>
                        <button
                            onClick={submit}
                            disabled={!input.trim() || isLoading}
                            aria-label="Enviar"
                            className="h-7 w-7 rounded-full bg-[var(--chrome-accent)] text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:scale-105 enabled:active:scale-95 transition-transform duration-150"
                            style={{ transitionTimingFunction: "var(--ease-out)" }}
                        >
                            {isLoading ? (
                                <Spinner />
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M8 13V3M8 3L4 7M8 3L12 7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function EmptyState({
    chromeTheme,
    onPick,
}: {
    chromeTheme: "dark" | "light";
    onPick: (s: string) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col h-full"
        >
            <div className="flex items-center gap-2.5 mb-4">
                <Logo30x
                    variant={chromeTheme === "light" ? "dark" : "accent"}
                    className="h-4"
                />
                <span className="text-[11px] font-medium text-[var(--chrome-fg-3)]">
                    Design
                </span>
            </div>
            <p className="text-[14px] leading-snug font-medium text-[var(--chrome-fg)] tracking-[-0.015em]">
                Edita el deck con instrucciones en lenguaje natural.
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--chrome-fg-3)] mt-1.5">
                Cambia textos, ajusta layouts, reemplaza imagenes o agrega slides.
                El agente reescribe la presentacion al instante.
            </p>

            <div className="mt-5 flex flex-col gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                    <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.28,
                            delay: 0.1 + i * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={() => onPick(s)}
                        className="text-left text-[12px] text-[var(--chrome-fg-2)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg-soft)] rounded-lg px-3 py-2 border border-[var(--chrome-border)] transition-[background,color,border-color] duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        {s}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

function MessageBubble({ m }: { m: ChatMessage }) {
    if (m.role === "user") {
        return (
            <motion.li
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-end"
            >
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--chrome-accent)] text-black px-3.5 py-2 text-[12.5px] leading-snug">
                    {m.text}
                </div>
            </motion.li>
        );
    }

    if (m.role === "error") {
        return (
            <motion.li
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-start"
            >
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-500/30 bg-red-500/10 text-red-300 px-3.5 py-2 text-[12.5px] leading-snug">
                    {m.text}
                </div>
            </motion.li>
        );
    }

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-start"
        >
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[var(--chrome-bg-2)] border border-[var(--chrome-border)] px-3.5 py-2 text-[12.5px] leading-snug text-[var(--chrome-fg)]">
                {m.state === "thinking" ? <ThinkingDots /> : m.text}
            </div>
        </motion.li>
    );
}

function ThinkingDots() {
    return (
        <span className="inline-flex items-center gap-1 h-[18px]">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-[var(--chrome-fg-3)]"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </span>
    );
}

function Spinner() {
    return (
        <motion.svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="20"
                strokeDashoffset="10"
                strokeLinecap="round"
            />
        </motion.svg>
    );
}
