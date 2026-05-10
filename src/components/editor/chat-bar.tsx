"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./chat-panel";

interface ChatBarProps {
    messages: ChatMessage[];
    onSend: (msg: string) => void;
    isLoading: boolean;
}

/**
 * Compact bottom-center chat bar — single-line input by default with an
 * expandable popover above showing recent messages. Lives at the bottom
 * of the canvas area, floats over the slide.
 */
export function ChatBar({ messages, onSend, isLoading }: ChatBarProps) {
    const [input, setInput] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages, open]);

    function submit() {
        const v = input.trim();
        if (!v || isLoading) return;
        onSend(v);
        setInput("");
        if (!open) setOpen(true);
    }

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[640px] max-w-[calc(100%-160px)] pointer-events-auto">
            {open && messages.length > 0 ? (
                <div
                    ref={scrollRef}
                    className="mb-2 max-h-[40vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 px-4 py-3 flex flex-col gap-2.5"
                >
                    {messages.map((m) => (
                        <MessageBubble key={m.id} m={m} />
                    ))}
                </div>
            ) : null}
            <div className="rounded-full bg-white/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 flex items-center pl-4 pr-1.5 h-11 gap-2">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Ocultar conversación" : "Mostrar conversación"}
                    className="text-[#737373] hover:text-[#0a0a0a] flex items-center justify-center transition-colors"
                    title={messages.length > 0 ? `${messages.length} mensajes` : "Sin conversación"}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M2.5 4.5C2.5 3.39543 3.39543 2.5 4.5 2.5h7C12.6046 2.5 13.5 3.39543 13.5 4.5v5C13.5 10.6046 12.6046 11.5 11.5 11.5H6.5L4 14V11.5h-.5C2.39543 11.5 1.5 10.6046 1.5 9.5"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    placeholder={
                        isLoading
                            ? "Monet está pensando…"
                            : "Pídele a Monet: cambiar texto, agregar slide, ajustar imagen…"
                    }
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-[#0a0a0a] placeholder:text-[#a3a3a3] tracking-[-0.005em] leading-[1.4] py-1.5"
                    style={{ maxHeight: 80 }}
                />
                <button
                    onClick={submit}
                    disabled={isLoading || !input.trim()}
                    aria-label="Enviar"
                    className="h-8 w-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.05] active:scale-95 transition-transform"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function MessageBubble({ m }: { m: ChatMessage }) {
    const isUser = m.role === "user";
    const isError = m.role === "error";
    return (
        <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
            <div
                className={
                    "max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-[1.4] tracking-[-0.005em] " +
                    (isUser
                        ? "bg-[#0a0a0a] text-white"
                        : isError
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-[#f4f4f5] text-[#0a0a0a]")
                }
            >
                {m.state === "thinking" ? (
                    <span className="inline-flex gap-1 items-center">
                        <Dot />
                        <Dot delay="120ms" />
                        <Dot delay="240ms" />
                    </span>
                ) : (
                    m.text
                )}
            </div>
        </div>
    );
}

function Dot({ delay }: { delay?: string }) {
    return (
        <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse"
            style={delay ? { animationDelay: delay } : undefined}
        />
    );
}
