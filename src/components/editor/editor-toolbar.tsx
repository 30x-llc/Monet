"use client";

import { useRef, useState } from "react";
import type { Deck } from "@/lib/slide-types";
import {
    ArrowDownTrayIcon,
    ArrowsRightLeftIcon,
    SunIcon,
    MoonIcon,
} from "@heroicons/react/24/solid";
import { MonetLogo } from "@/components/foundations/logo/monet-logo";
import { uploadImage } from "@/lib/upload-image";

interface EditorToolbarProps {
    deck: Deck;
    onBack: () => void;
    onDownloadPdf: () => void | Promise<void>;
    onHandoff: () => void;
    isDownloadingPdf: boolean;
    pdfReady: boolean;
    theme?: "dark" | "light";
    onToggleTheme?: () => void;
    onLogoChange?: (url: string | undefined) => void;
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
    onLogoChange,
}: EditorToolbarProps) {
    const isPrototype = deck.format === "prototype";
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoMenuOpen, setLogoMenuOpen] = useState(false);

    async function handleLogoFile(file: File) {
        if (!onLogoChange) return;
        setLogoUploading(true);
        try {
            const url = await uploadImage(file);
            onLogoChange(url);
        } catch {
            // Silently swallow — toolbar isn't the place for verbose errors.
            // The user will see the logo didn't change and can retry.
        } finally {
            setLogoUploading(false);
            setLogoMenuOpen(false);
        }
    }
    return (
        <div className="h-12 shrink-0 border-b border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    aria-label="Volver al home"
                    className="flex items-center gap-3 -mx-1 px-1 py-1 rounded hover:bg-[var(--chrome-hover-bg-soft)] transition-colors"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <MonetLogo variant={theme === "light" ? "dark" : "accent"} />
                    <div className="w-px h-4 bg-[var(--chrome-divider)]" />
                    <span className="text-[11px] font-medium text-[var(--chrome-fg-3)]">by 30X</span>
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
                {onLogoChange && (
                    <div className="relative">
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoFile(file);
                                e.target.value = "";
                            }}
                        />
                        <button
                            onClick={() => {
                                if (deck.clientLogoUrl) {
                                    setLogoMenuOpen((v) => !v);
                                } else {
                                    logoInputRef.current?.click();
                                }
                            }}
                            disabled={logoUploading}
                            aria-label="Cambiar logo del cliente"
                            title={deck.clientLogoUrl ? "Logo del cliente" : "Subir logo del cliente"}
                            className="h-7 px-2 rounded-md text-[var(--chrome-fg-4)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] flex items-center gap-1.5 transition-[background,color] duration-150 disabled:opacity-50"
                            style={{ transitionTimingFunction: "var(--ease-out)" }}
                        >
                            {logoUploading ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-current opacity-50 animate-pulse" />
                            ) : deck.clientLogoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={deck.clientLogoUrl}
                                    alt=""
                                    className="h-3.5 w-auto max-w-[28px] object-contain"
                                    style={{ filter: theme === "dark" ? "brightness(0) invert(1)" : "none" }}
                                />
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M2 11V13H14V11M8 2V11M8 11L11 8M8 11L5 8"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                            <span className="text-[10.5px] font-medium">Logo</span>
                        </button>
                        {logoMenuOpen ? (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setLogoMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-1 w-44 rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg-elevated)] shadow-lg z-20 py-1 text-[11.5px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogoMenuOpen(false);
                                            logoInputRef.current?.click();
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-[var(--chrome-hover-bg)] text-[var(--chrome-fg)] transition-colors"
                                    >
                                        Subir nuevo logo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onLogoChange(undefined);
                                            setLogoMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 hover:text-red-400 text-[var(--chrome-fg-3)] transition-colors"
                                    >
                                        Quitar logo
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
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
