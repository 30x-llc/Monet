"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Deck } from "@/lib/slide-types";
import {
    type ElementAction,
    type ElementPath,
    applyAction,
    setTextAt,
} from "@/lib/element-edits";
import { SlideCanvas } from "./slide-canvas";
import { newCanvasSlide, newCanvasElementId } from "@/components/slides/canvas-slide";
import { CanvasPropertiesPanel } from "./canvas-properties-panel";
import { CanvasLayersPanel } from "./canvas-layers-panel";
import type { CanvasElement, CanvasSlide } from "@/lib/slide-types";
import { EditorToolbar } from "./editor-toolbar";
import { ChatPanel, type ChatMessage } from "./chat-panel";
import { HandoffModal } from "./handoff-modal";
import { SlideThumbnailRail } from "./slide-thumbnail-rail";
import { PropertiesPanel } from "./properties-panel";
import { findLocalPartnerLogo } from "@/lib/research/local-logos";

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
    const [selectedElementPath, setSelectedElementPath] =
        useState<ElementPath | null>(null);
    const [canvasSelectedId, setCanvasSelectedId] = useState<string | null>(null);
    const [chromeTheme, setChromeTheme] = useState<"dark" | "light">("light");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [handoffOpen, setHandoffOpen] = useState(false);

    // Reset element selection whenever the active slide changes — paths
    // are slide-local, so a stale path on a different slide is meaningless.
    useEffect(() => {
        setSelectedElementPath(null);
    }, [selectedIndex]);

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

    // Override clientLogoUrl with the curated 30X member logo when one
    // exists for this company. This covers older decks generated before
    // the curated-logos chain landed and replaces broken or generic
    // research-picked logos with Juan Diego's master white-on-transparent
    // partner wordmarks.
    const effectiveClientLogoUrl =
        findLocalPartnerLogo(deck.companyName, slideTheme) ?? deck.clientLogoUrl;
    const selectedSlide = deck.slides[selectedIndex];

    // ── Slide CRUD ────────────────────────────────────────────────────
    const handleDeleteSlide = useCallback(
        (index: number) => {
            if (deck.slides.length <= 1) return;
            const newSlides = deck.slides.filter((_, i) => i !== index);
            onDeckChange({ ...deck, slides: newSlides });
            setSelectedIndex((prev) => {
                if (prev > index) return prev - 1;
                if (prev === index) return Math.min(prev, newSlides.length - 1);
                return prev;
            });
        },
        [deck, onDeckChange],
    );

    const handleReorderSlide = useCallback(
        (from: number, to: number) => {
            if (from === to || from < 0 || to < 0) return;
            const newSlides = [...deck.slides];
            const [moved] = newSlides.splice(from, 1);
            newSlides.splice(to, 0, moved);
            onDeckChange({ ...deck, slides: newSlides });
            setSelectedIndex(to);
        },
        [deck, onDeckChange],
    );

    // ── Element actions (move/delete inside a slide) ─────────────────
    const handleElementAction = useCallback(
        (action: ElementAction) => {
            if (!selectedElementPath) return;
            const current = deck.slides[selectedIndex];
            if (!current) return;
            const { slide: nextSlide, newPath } = applyAction(
                current,
                selectedElementPath,
                action,
            );
            if (nextSlide === current) return; // no-op (action wasn't valid)
            const newSlides = [...deck.slides];
            newSlides[selectedIndex] = nextSlide;
            onDeckChange({ ...deck, slides: newSlides });
            setSelectedElementPath(newPath);
        },
        [deck, selectedIndex, selectedElementPath, onDeckChange],
    );

    // ── Arrow-key nav + Backspace/Delete + Esc ────────────────────────
    // When an element is selected: arrows move the element within its
    // array, Backspace deletes it, Esc clears selection. When no element
    // is selected: arrows navigate slides, Backspace deletes the slide.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
                return;

            // Canvas slides own their own keyboard (delete element, etc.) inside
            // SlideCanvas — don't fight them with the structured-slide handler.
            if (deck.slides[selectedIndex]?.type === "canvas") return;

            if (selectedElementPath) {
                if (e.key === "Escape") {
                    e.preventDefault();
                    setSelectedElementPath(null);
                    return;
                }
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    handleElementAction("moveLeft");
                    return;
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    handleElementAction("moveRight");
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    handleElementAction("moveUp");
                    return;
                }
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    handleElementAction("moveDown");
                    return;
                }
                if (e.key === "Backspace" || e.key === "Delete") {
                    e.preventDefault();
                    handleElementAction("delete");
                    return;
                }
                return;
            }

            if (e.key === "ArrowLeft") {
                setSelectedIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "ArrowRight") {
                setSelectedIndex((i) => Math.min(deck.slides.length - 1, i + 1));
            } else if ((e.key === "Backspace" || e.key === "Delete") && deck.slides.length > 1) {
                e.preventDefault();
                handleDeleteSlide(selectedIndex);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [deck.slides.length, selectedIndex, selectedElementPath, handleDeleteSlide, handleElementAction]);

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
                    .slice(0, 80) || "monet";
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
                onLogoChange={(url) => onDeckChange({ ...deck, clientLogoUrl: url })}
            />

            <div className="flex flex-1 min-h-0">
                <ChatPanel
                    messages={messages}
                    onSend={handleSend}
                    isLoading={isIterating}
                    chromeTheme={chromeTheme}
                />
                {selectedSlide?.type === "canvas" ? (
                    <CanvasLayersPanel
                        slide={selectedSlide as CanvasSlide}
                        selectedId={canvasSelectedId}
                        onSelect={setCanvasSelectedId}
                        onChange={(next) => {
                            const newSlides = [...deck.slides];
                            newSlides[selectedIndex] = next;
                            onDeckChange({ ...deck, slides: newSlides });
                        }}
                    />
                ) : null}
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
                    onSlideChange={(nextSlide) => {
                        const newSlides = [...deck.slides];
                        newSlides[selectedIndex] = nextSlide;
                        onDeckChange({ ...deck, slides: newSlides });
                    }}
                    onTextChange={(path, value) => {
                        const current = deck.slides[selectedIndex];
                        if (!current) return;
                        const next = setTextAt(current, path, value);
                        if (next === current) return;
                        const newSlides = [...deck.slides];
                        newSlides[selectedIndex] = next;
                        onDeckChange({ ...deck, slides: newSlides });
                    }}
                    clientLogoUrl={effectiveClientLogoUrl}
                    format={deck.format}
                    theme={slideTheme}
                    selectedPath={selectedElementPath}
                    onSelectElement={setSelectedElementPath}
                    canvasSelectedId={canvasSelectedId}
                    onCanvasSelectedChange={setCanvasSelectedId}
                />
                {selectedSlide?.type === "canvas" && canvasSelectedId ? (
                    <CanvasPropertiesPanel
                        slide={selectedSlide as CanvasSlide}
                        selectedId={canvasSelectedId}
                        onPatch={(id, patch) => {
                            const cs = selectedSlide as CanvasSlide;
                            const next: CanvasSlide = {
                                ...cs,
                                elements: cs.elements.map((e) =>
                                    e.id === id ? ({ ...e, ...patch } as CanvasElement) : e,
                                ),
                            };
                            const newSlides = [...deck.slides];
                            newSlides[selectedIndex] = next;
                            onDeckChange({ ...deck, slides: newSlides });
                        }}
                        onDelete={(id) => {
                            const cs = selectedSlide as CanvasSlide;
                            const next: CanvasSlide = {
                                ...cs,
                                elements: cs.elements.filter((e) => e.id !== id),
                            };
                            setCanvasSelectedId(null);
                            const newSlides = [...deck.slides];
                            newSlides[selectedIndex] = next;
                            onDeckChange({ ...deck, slides: newSlides });
                        }}
                        onDuplicate={(id) => {
                            const cs = selectedSlide as CanvasSlide;
                            const src = cs.elements.find((e) => e.id === id);
                            if (!src) return;
                            const dup: CanvasElement = {
                                ...(src as CanvasElement),
                                id: newCanvasElementId(),
                                x: src.x + 20,
                                y: src.y + 20,
                            };
                            const next: CanvasSlide = {
                                ...cs,
                                elements: [...cs.elements, dup],
                            };
                            const newSlides = [...deck.slides];
                            newSlides[selectedIndex] = next;
                            onDeckChange({ ...deck, slides: newSlides });
                            setCanvasSelectedId(dup.id);
                        }}
                        onClose={() => setCanvasSelectedId(null)}
                    />
                ) : null}
                {selectedElementPath && selectedSlide?.type !== "canvas" ? (
                    <PropertiesPanel
                        slide={selectedSlide}
                        slideIndex={selectedIndex}
                        selectedPath={selectedElementPath}
                        onAction={handleElementAction}
                        onElementImageChange={(url) => {
                            // Mutates the array item at the selected path,
                            // setting/clearing imageUrl. Today only used
                            // for mentors[i].imageUrl override.
                            if (!selectedElementPath || selectedElementPath.length < 2) return;
                            const arrayKey = selectedElementPath[selectedElementPath.length - 2] as string;
                            const idx = selectedElementPath[selectedElementPath.length - 1] as number;
                            const current = deck.slides[selectedIndex] as unknown as Record<string, unknown>;
                            const arr = current[arrayKey];
                            if (!Array.isArray(arr)) return;
                            const newArr = arr.map((item, i) => {
                                if (i !== idx) return item;
                                const next = { ...(item as Record<string, unknown>) };
                                if (url === undefined) delete next.imageUrl;
                                else next.imageUrl = url;
                                return next;
                            });
                            const nextSlide = { ...current, [arrayKey]: newArr };
                            const newSlides = [...deck.slides];
                            newSlides[selectedIndex] = nextSlide as unknown as typeof deck.slides[number];
                            onDeckChange({ ...deck, slides: newSlides });
                        }}
                        onClose={() => setSelectedElementPath(null)}
                    />
                ) : null}
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
                onAddCanvas={() => {
                    const newSlides = [...deck.slides];
                    newSlides.splice(selectedIndex + 1, 0, newCanvasSlide());
                    onDeckChange({ ...deck, slides: newSlides });
                    setSelectedIndex(selectedIndex + 1);
                }}
                onDelete={handleDeleteSlide}
                onReorder={handleReorderSlide}
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

