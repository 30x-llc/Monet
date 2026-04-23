"use client";

import type { Deck } from "@/lib/slide-types";
import {
    PlusIcon,
    AdjustmentsHorizontalIcon,
    SunIcon,
    MoonIcon,
} from "@heroicons/react/24/solid";
import { Logo30x } from "@/components/foundations/logo/30x-logo";
import { ExportMenu } from "./export-menu";

interface EditorToolbarProps {
    deck: Deck;
    onExportPptx: () => Promise<void>;
    onDuplicate: () => void;
    onDuplicateAsTemplate: () => void;
    onNewDeck: () => void;
    isExportingPptx: boolean;
    showProperties: boolean;
    onToggleProperties: () => void;
    theme?: "dark" | "light";
    onToggleTheme?: () => void;
}

export function EditorToolbar({
    deck,
    onExportPptx,
    onDuplicate,
    onDuplicateAsTemplate,
    onNewDeck,
    isExportingPptx,
    showProperties,
    onToggleProperties,
    theme = "dark",
    onToggleTheme,
}: EditorToolbarProps) {
    return (
        <div className="h-12 shrink-0 border-b border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
                <button
                    onClick={onNewDeck}
                    aria-label="Ir al home"
                    className="flex items-center gap-3 -mx-1 px-1 py-1 rounded hover:bg-[var(--chrome-hover-bg-soft)] transition-colors"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <Logo30x variant={theme === "light" ? "dark" : "accent"} className="h-4" />
                    <div className="w-px h-4 bg-[var(--chrome-divider)]" />
                    <span className="text-[11px] font-medium text-[var(--chrome-fg-3)]">Design</span>
                </button>
                <div className="w-px h-4 bg-[var(--chrome-divider)]" />
                <span className="text-[12px] font-medium text-[var(--chrome-fg-3)] truncate max-w-[200px]">
                    {deck.deckTitle}
                </span>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[var(--chrome-fg)]">{deck.companyName}</span>
                <span className="text-[11px] text-[var(--chrome-fg-5)]">&middot;</span>
                <span className="text-[11px] text-[var(--chrome-accent-fg)]">{deck.programName}</span>
            </div>

            <div className="flex items-center gap-1.5">
                {onToggleTheme && (
                    <button
                        onClick={onToggleTheme}
                        aria-label={theme === "dark" ? "Cambiar a light mode" : "Cambiar a dark mode"}
                        className="h-7 w-7 rounded-md text-[var(--chrome-fg-4)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] flex items-center justify-center transition-[background,color] duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        {theme === "dark" ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
                    </button>
                )}

                <button
                    onClick={onToggleProperties}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-[background,color] duration-150 ${
                        showProperties
                            ? "bg-[var(--chrome-accent-bg-soft)] text-[var(--chrome-accent-fg)]"
                            : "text-[var(--chrome-fg-4)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)]"
                    }`}
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                    Propiedades
                </button>

                <button
                    onClick={onNewDeck}
                    className="h-7 px-2.5 rounded-md text-[11px] font-medium text-[var(--chrome-fg-4)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] flex items-center gap-1.5 transition-[background,color] duration-150"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Nuevo
                </button>

                <ExportMenu
                    deck={deck}
                    onExportPptx={onExportPptx}
                    onDuplicate={onDuplicate}
                    onDuplicateAsTemplate={onDuplicateAsTemplate}
                    isExportingPptx={isExportingPptx}
                />
            </div>
        </div>
    );
}
