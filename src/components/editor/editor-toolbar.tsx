"use client";

import type { Deck } from "@/lib/slide-types";
import {
    ArrowDownTrayIcon,
    ArrowsRightLeftIcon,
    SunIcon,
    MoonIcon,
} from "@heroicons/react/24/solid";
import { Logo30x } from "@/components/foundations/logo/30x-logo";

interface EditorToolbarProps {
    deck: Deck;
    onBack: () => void;
    onDownloadPdf: () => void | Promise<void>;
    onHandoff: () => void;
    isDownloadingPdf: boolean;
    pdfReady: boolean;
    theme?: "dark" | "light";
    onToggleTheme?: () => void;
}

export function EditorToolbar({
    deck,
    onBack,
    onDownloadPdf,
    onHandoff,
    isDownloadingPdf,
    pdfReady,
    theme = "dark",
    onToggleTheme,
}: EditorToolbarProps) {
    const isPrototype = deck.format === "prototype";
    return (
        <div className="h-12 shrink-0 border-b border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    aria-label="Volver al home"
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

                {isPrototype ? (
                    <button
                        onClick={onHandoff}
                        aria-label="Handoff to Claude Code"
                        className="h-7 px-3 rounded-md text-[11px] font-semibold bg-[var(--chrome-accent)] text-black hover:brightness-95 active:brightness-90 flex items-center gap-1.5 transition-[background,filter,opacity] duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                        Handoff to Claude Code
                    </button>
                ) : (
                    <button
                        onClick={onDownloadPdf}
                        disabled={isDownloadingPdf}
                        aria-label="Descargar PDF"
                        className="h-7 px-3 rounded-md text-[11px] font-semibold bg-[var(--chrome-accent)] text-black hover:brightness-95 active:brightness-90 disabled:opacity-60 flex items-center gap-1.5 transition-[background,filter,opacity] duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        {isDownloadingPdf
                            ? "Descargando..."
                            : pdfReady
                              ? "Descargar PDF"
                              : "Preparando PDF..."}
                    </button>
                )}
            </div>
        </div>
    );
}
