"use client";

import {
    useState,
    useCallback,
    useRef,
    useEffect,
    type KeyboardEvent,
} from "react";
import type { AppDoc, AppMessage } from "@/lib/app-types";
import { saveApp } from "@/lib/app-storage";

interface AppViewProps {
    initialApp: AppDoc;
    appId: string;
    onBack: () => void;
}

export function AppView({ initialApp, appId, onBack }: AppViewProps) {
    const [app, setApp] = useState<AppDoc>(initialApp);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [app.messages.length, busy]);

    const sendIteration = useCallback(async () => {
        const text = input.trim();
        if (!text || busy) return;
        const userMsg: AppMessage = {
            role: "user",
            content: text,
            timestamp: new Date().toISOString(),
        };
        const optimistic: AppDoc = {
            ...app,
            messages: [...app.messages, userMsg],
        };
        setApp(optimistic);
        saveApp(optimistic, appId);
        setInput("");
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/iterate-app", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html: app.html, instruction: text }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Iteración falló");
            const assistantMsg: AppMessage = {
                role: "assistant",
                content: data.summary || "Listo.",
                timestamp: new Date().toISOString(),
            };
            const updated: AppDoc = {
                title: data.title || app.title,
                html: data.html,
                messages: [...optimistic.messages, assistantMsg],
            };
            setApp(updated);
            saveApp(updated, appId);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
            textareaRef.current?.focus();
        }
    }, [app, appId, busy, input]);

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendIteration();
        }
    };

    const onCopyHtml = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(app.html);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard denied */
        }
    }, [app.html]);

    const onDownloadHtml = useCallback(() => {
        const blob = new Blob([app.html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${app.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [app.html, app.title]);

    return (
        <div className="flex h-screen bg-white">
            {/* Chat panel */}
            <aside className="w-[380px] flex flex-col border-r border-black/[0.06] shrink-0">
                <header className="h-14 px-4 flex items-center justify-between border-b border-black/[0.06] gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#525252] hover:text-[#0a0a0a] transition-colors duration-150 shrink-0"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M10 4L6 8L10 12"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Home
                    </button>
                    <h1 className="text-[12.5px] font-semibold text-[#0a0a0a] tracking-[-0.005em] truncate text-center flex-1 min-w-0">
                        {app.title}
                    </h1>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={onCopyHtml}
                            title="Copiar HTML"
                            className="h-7 w-7 rounded-md hover:bg-black/[0.04] text-[#525252] hover:text-[#0a0a0a] transition-[background-color,color] duration-150 flex items-center justify-center"
                            style={{
                                transitionTimingFunction: "var(--ease-out)",
                            }}
                        >
                            {copied ? (
                                <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M3.5 8L7 11.5L13 5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <rect
                                        x="5"
                                        y="5"
                                        width="8"
                                        height="9"
                                        rx="1.5"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                    />
                                    <path
                                        d="M3 11V3.5C3 2.67 3.67 2 4.5 2H10"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={onDownloadHtml}
                            title="Descargar .html"
                            className="h-7 w-7 rounded-md hover:bg-black/[0.04] text-[#525252] hover:text-[#0a0a0a] transition-[background-color,color] duration-150 flex items-center justify-center"
                            style={{
                                transitionTimingFunction: "var(--ease-out)",
                            }}
                        >
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M8 2V10M8 10L4.5 6.5M8 10L11.5 6.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M2.5 12.5V13.5C2.5 13.78 2.72 14 3 14H13C13.28 14 13.5 13.78 13.5 13.5V12.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 scrollbar-hide">
                    {app.messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex ${
                                m.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[280px] px-3 py-2 rounded-lg text-[12.5px] tracking-[-0.005em] leading-[1.5] ${
                                    m.role === "user"
                                        ? "bg-[#0a0a0a] text-white"
                                        : "bg-black/[0.04] text-[#0a0a0a]"
                                }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {busy ? (
                        <div className="flex justify-start">
                            <div className="px-3 py-2.5 rounded-lg bg-black/[0.04] flex items-center gap-1">
                                <span
                                    className="w-1 h-1 bg-[#525252] rounded-full"
                                    style={{
                                        animation:
                                            "deck-cursor-blink 1.2s steps(2) infinite",
                                    }}
                                />
                                <span
                                    className="w-1 h-1 bg-[#525252] rounded-full"
                                    style={{
                                        animation:
                                            "deck-cursor-blink 1.2s steps(2) infinite 200ms",
                                    }}
                                />
                                <span
                                    className="w-1 h-1 bg-[#525252] rounded-full"
                                    style={{
                                        animation:
                                            "deck-cursor-blink 1.2s steps(2) infinite 400ms",
                                    }}
                                />
                            </div>
                        </div>
                    ) : null}
                    {error ? (
                        <div className="flex justify-start">
                            <div className="max-w-[280px] px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-800 tracking-[-0.005em] leading-[1.45]">
                                {error}
                            </div>
                        </div>
                    ) : null}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-black/[0.06] bg-white">
                    <div className="rounded-xl border border-black/[0.09] bg-white focus-within:border-black/35 focus-within:ring-4 focus-within:ring-black/[0.04] transition-[border-color,box-shadow] duration-150">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Pídele un cambio: 'agrega una métrica', 'hazlo dark mode', 'reduce el sidebar'…"
                            disabled={busy}
                            rows={2}
                            className="w-full resize-none px-3 py-2.5 text-[12.5px] tracking-[-0.005em] leading-[1.45] bg-transparent focus:outline-none placeholder:text-[#a3a3a3] disabled:opacity-60 text-[#0a0a0a]"
                        />
                        <div className="flex items-center justify-between px-2.5 pb-2">
                            <span className="text-[10.5px] text-[#a3a3a3] tracking-[-0.005em]">
                                Enter para enviar · Shift+Enter salto de línea
                            </span>
                            <button
                                onClick={sendIteration}
                                disabled={!input.trim() || busy}
                                className="h-7 px-3 rounded-md bg-[#0a0a0a] text-white text-[11.5px] font-semibold tracking-[-0.005em] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#262626] transition-colors duration-150"
                                style={{
                                    transitionTimingFunction:
                                        "var(--ease-out)",
                                }}
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Preview */}
            <main className="flex-1 bg-[#FAFAFA] p-4 min-w-0 overflow-hidden">
                <div className="h-full rounded-xl border border-black/[0.06] bg-white overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02),0_12px_32px_-12px_rgba(0,0,0,0.08)]">
                    <iframe
                        sandbox="allow-scripts"
                        srcDoc={app.html}
                        title={app.title}
                        className="w-full h-full bg-white border-0"
                    />
                </div>
            </main>
        </div>
    );
}
