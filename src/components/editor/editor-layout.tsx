"use client";

import { useState, useCallback } from "react";
import type { Deck } from "@/lib/slide-types";
import { SlideSidebar } from "./slide-sidebar";
import { SlideCanvas } from "./slide-canvas";
import { EditorToolbar } from "./editor-toolbar";
import { PropertiesPanel } from "./properties-panel";
import { ChatInput } from "@/components/chat-input";
import { saveDeck } from "@/lib/deck-storage";

interface EditorLayoutProps {
    deck: Deck;
    onDeckChange: (deck: Deck) => void;
    onIterate: (instruction: string) => Promise<void>;
    onDownload: () => Promise<void>;
    onNewDeck: () => void;
    isIterating: boolean;
    isDownloading: boolean;
}

export function EditorLayout({
    deck,
    onDeckChange,
    onIterate,
    onDownload,
    onNewDeck,
    isIterating,
    isDownloading,
}: EditorLayoutProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showProperties, setShowProperties] = useState(true);
    const theme = deck.theme || "dark";
    const toggleTheme = () =>
        onDeckChange({ ...deck, theme: theme === "dark" ? "light" : "dark" });

    const selectedSlide = deck.slides[selectedIndex];

    const handleDeleteSlide = useCallback(
        (index: number) => {
            if (deck.slides.length <= 3) return;
            const newSlides = deck.slides.filter((_, i) => i !== index);
            onDeckChange({ ...deck, slides: newSlides });
            if (selectedIndex >= newSlides.length) {
                setSelectedIndex(Math.max(0, newSlides.length - 1));
            }
        },
        [deck, selectedIndex, onDeckChange],
    );

    const handleMoveSlide = useCallback(
        (from: number, to: number) => {
            if (to < 0 || to >= deck.slides.length) return;
            const newSlides = [...deck.slides];
            const [moved] = newSlides.splice(from, 1);
            newSlides.splice(to, 0, moved);
            onDeckChange({ ...deck, slides: newSlides });
            setSelectedIndex(to);
        },
        [deck, onDeckChange],
    );

    const handleDuplicate = useCallback(() => {
        const cloned: Deck = {
            ...deck,
            deckTitle: `${deck.deckTitle} (copia)`,
            generatedAt: new Date().toISOString(),
        };
        saveDeck(cloned);
        onNewDeck();
    }, [deck, onNewDeck]);

    const handleDuplicateAsTemplate = useCallback(() => {
        const cloned: Deck = {
            ...deck,
            deckTitle: `Plantilla · ${deck.programName}`,
            companyName: "30X",
            generatedAt: new Date().toISOString(),
        };
        saveDeck(cloned);
        onNewDeck();
    }, [deck, onNewDeck]);

    return (
        <div className={`chrome-theme-${theme} ${theme === "dark" ? "dark-mode" : ""} flex flex-col h-screen bg-[var(--chrome-bg)] text-[var(--chrome-fg)] overflow-hidden`}>
            <EditorToolbar
                deck={deck}
                onExportPptx={onDownload}
                onDuplicate={handleDuplicate}
                onDuplicateAsTemplate={handleDuplicateAsTemplate}
                onNewDeck={onNewDeck}
                isExportingPptx={isDownloading}
                showProperties={showProperties}
                onToggleProperties={() => setShowProperties(!showProperties)}
                theme={theme}
                onToggleTheme={toggleTheme}
            />

            <div className="flex flex-1 min-h-0">
                <SlideSidebar
                    slides={deck.slides}
                    selectedIndex={selectedIndex}
                    onSelect={setSelectedIndex}
                    onDelete={handleDeleteSlide}
                    onMove={handleMoveSlide}
                    clientLogoUrl={deck.clientLogoUrl}
                    format={deck.format}
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
                />

                {showProperties && selectedSlide && (
                    <PropertiesPanel
                        slide={selectedSlide}
                        slideIndex={selectedIndex}
                        onClose={() => setShowProperties(false)}
                    />
                )}
            </div>

            <div className="shrink-0 border-t border-[var(--chrome-border)] bg-[var(--chrome-bg)] px-4 py-3">
                <div className="max-w-[700px] mx-auto">
                    <ChatInput onSend={onIterate} isLoading={isIterating} />
                </div>
            </div>
        </div>
    );
}
