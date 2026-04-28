"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Deck } from "@/lib/slide-types";
import { SlideCanvas } from "./slide-canvas";
import { EditorToolbar } from "./editor-toolbar";
import { ChatPanel, type ChatMessage } from "./chat-panel";
import { HandoffModal } from "./handoff-modal";
import { SlideThumbnailRail } from "./slide-thumbnail-rail";

const CHROME_THEME_KEY = "30x.chromeTheme";

interface EditorLayoutProps {
    deck: Deck;
    onDeckChange: (deck: Deck) => void;
    onIterate: (instruction: string) => Promise<{ ok: boolean; summary?: string; error?: string }>;
    onNewDeck: () => void;
    isIterating: boolean;
}

export function EditorLayout({
    deck,
    onDeckChange,
    onIterate,
    onNewDeck,
    isIterating,
}: EditorLayoutProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [chromeTheme, setChromeTheme] = useState<"dark" | "light">("light");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [handoffOpen, setHandoffOpen] = useState(false);

    // Restore chrome theme preference.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(CHROME_THEME_KEY);
        if (stored === "dark" || stored === "light") setChromeTheme(stored);
    }, []);
    const toggleTheme = () => {
        setChromeTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            if (typeof window !== "undefined") {
                window.localStorage.setItem(CHROME_THEME_KEY, next);
            }
            return next;
        });
    };

    const slideTheme = deck.theme || "light";
    const selectedSlide = deck.slides[selectedIndex];

    // ── Arrow-key navigation ─────────────────────────────────────────
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
                return;
            if (e.key === "ArrowLeft") {
                setSelectedIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "ArrowRight") {
                setSelectedIndex((i) => Math.min(deck.slides.length - 1, i + 1));
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [deck.slides.length]);

    // ── PDF pre-render: re-runs whenever the deck mutates ─────────────
    // Debounced 1.2s so a flurry of iterate edits batch into one render.
    const pdfBlobRef = useRef<Blob | null>(null);
    const pdfRequestRef = useRef<Promise<Blob | null> | null>(null);
    const [pdfReady, setPdfReady] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    useEffect(() => {
        setPdfReady(false);
        pdfBlobRef.current = null;
        const ctrl = new AbortController();
        const timer = setTimeout(() => {
            const promise = (async () => {
                try {
                    const res = await fetch("/api/export/pdf", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(deck),
                        signal: ctrl.signal,
                    });
                    if (!res.ok) return null;
                    const blob = await res.blob();
                    pdfBlobRef.current = blob;
                    setPdfReady(true);
                    return blob;
                } catch {
                    return null;
                } finally {
                    pdfRequestRef.current = null;
                }
            })();
            pdfRequestRef.current = promise;
        }, 1200);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [deck]);

    const downloadPdf = useCallback(async () => {
        setIsDownloadingPdf(true);
        try {
            let blob = pdfBlobRef.current;
            if (!blob) {
                blob = (await pdfRequestRef.current) ?? null;
            }
            if (!blob) {
                // Render miss — force a fresh one synchronously.
                const res = await fetch("/api/export/pdf", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(deck),
                });
                if (!res.ok) throw new Error("PDF render failed");
                blob = await res.blob();
                pdfBlobRef.current = blob;
                setPdfReady(true);
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const safeName =
                `30x-${deck.companyName}-${deck.programName}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80) || "30x-design";
            a.href = url;
            a.download = `${safeName}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error("PDF download failed", err);
        } finally {
            setIsDownloadingPdf(false);
        }
    }, [deck]);

    // ── Chat send ─────────────────────────────────────────────────────
    const handleSend = useCallback(
        async (text: string) => {
            const userMsg: ChatMessage = {
                id: `u-${Date.now()}-${Math.random()}`,
                role: "user",
                text,
            };
            const thinkingId = `t-${Date.now()}-${Math.random()}`;
            const thinking: ChatMessage = {
                id: thinkingId,
                role: "assistant",
                text: "",
                state: "thinking",
            };
            setMessages((prev) => [...prev, userMsg, thinking]);

            const result = await onIterate(text);

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === thinkingId
                        ? result.ok
                            ? {
                                  id: thinkingId,
                                  role: "assistant",
                                  text: result.summary?.trim() || "Listo, ya lo cambié.",
                                  state: "done",
                              }
                            : {
                                  id: thinkingId,
                                  role: "error",
                                  text:
                                      result.error?.trim() ||
                                      "No pude aplicar el cambio. Intenta otra vez.",
                              }
                        : m,
                ),
            );
        },
        [onIterate],
    );

    return (
        <div
            className={`chrome-theme-${chromeTheme} ${chromeTheme === "dark" ? "dark-mode" : ""} flex flex-col h-screen bg-[var(--chrome-bg)] text-[var(--chrome-fg)] overflow-hidden`}
        >
            <EditorToolbar
                deck={deck}
                onBack={onNewDeck}
                onDownloadPdf={downloadPdf}
                onHandoff={() => setHandoffOpen(true)}
                isDownloadingPdf={isDownloadingPdf}
                pdfReady={pdfReady}
                theme={chromeTheme}
                onToggleTheme={toggleTheme}
            />

            <div className="flex flex-1 min-h-0">
                <ChatPanel
                    messages={messages}
                    onSend={handleSend}
                    isLoading={isIterating}
                    chromeTheme={chromeTheme}
                />
                <SlideCanvas
                    slide={selectedSlide}
                    slideIndex={selectedIndex}
                    totalSlides={deck.slides.length}
                    onPrev={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                    onNext={() =>
                        setSelectedIndex(
                            Math.min(deck.slides.length - 1, selectedIndex + 1),
                        )
                    }
                    clientLogoUrl={deck.clientLogoUrl}
                    format={deck.format}
                    theme={slideTheme}
                />
            </div>

            <SlideThumbnailRail
                slides={deck.slides}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                onAdd={() => {
                    const current = deck.slides[selectedIndex];
                    if (!current) return;
                    const cloned = JSON.parse(JSON.stringify(current));
                    const newSlides = [...deck.slides];
                    newSlides.splice(selectedIndex + 1, 0, cloned);
                    onDeckChange({ ...deck, slides: newSlides });
                    setSelectedIndex(selectedIndex + 1);
                }}
                clientLogoUrl={deck.clientLogoUrl}
                format={deck.format ?? "proposal"}
                theme={slideTheme}
            />

            {handoffOpen && (
                <HandoffModal deck={deck} onClose={() => setHandoffOpen(false)} />
            )}
        </div>
    );
}

