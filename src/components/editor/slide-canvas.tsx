"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide, ProjectFormat } from "@/lib/slide-types";
import type { ElementPath } from "@/lib/element-edits";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";
import { FORMATS } from "@/lib/slide-types";
import { uploadImage } from "@/lib/upload-image";

// Slide types that support an optional editorial backgroundImage.
const BG_CAPABLE_TYPES = new Set([
    "cover-hero",
    "corporate-cover",
    "problem-cards",
    "diagnostic",
    "curriculum-grid",
    "methodology",
    "impact",
]);

interface SlideCanvasProps {
    slide: Slide;
    slideIndex: number;
    totalSlides: number;
    onPrev: () => void;
    onNext: () => void;
    onSlideChange?: (slide: Slide) => void;
    clientLogoUrl?: string;
    format?: ProjectFormat;
    theme?: "dark" | "light";
    selectedPath?: ElementPath | null;
    onSelectElement?: (path: ElementPath | null) => void;
}

function pathsEqual(a: ElementPath | null | undefined, b: ElementPath | null | undefined): boolean {
    if (!a || !b) return a === b;
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
}

export function SlideCanvas({
    slide,
    slideIndex,
    totalSlides,
    onPrev,
    onNext,
    onSlideChange,
    clientLogoUrl,
    format = "proposal",
    theme = "light",
    selectedPath,
    onSelectElement,
}: SlideCanvasProps) {
    const spec = FORMATS[format];
    const aspect = `${spec.width} / ${spec.height}`;
    const canPrev = slideIndex > 0;
    const canNext = slideIndex < totalSlides - 1;
    const stageWrapRef = useRef<HTMLDivElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const [bgUploading, setBgUploading] = useState(false);
    const [bgError, setBgError] = useState<string | null>(null);

    const supportsBg = BG_CAPABLE_TYPES.has(slide.type);
    const currentBg = (slide as { backgroundImage?: string }).backgroundImage;

    async function handleBgFile(file: File) {
        if (!onSlideChange) return;
        setBgUploading(true);
        setBgError(null);
        try {
            const url = await uploadImage(file);
            onSlideChange({ ...slide, backgroundImage: url } as Slide);
        } catch (err) {
            setBgError(err instanceof Error ? err.message : "Falló la subida.");
        } finally {
            setBgUploading(false);
        }
    }

    function handleRemoveBg() {
        if (!onSlideChange) return;
        const next = { ...slide } as Slide & { backgroundImage?: string };
        delete next.backgroundImage;
        onSlideChange(next);
    }

    // Toggle data-selected on the matching element so CSS can outline it.
    // We re-query on every selection change and on every slide change so
    // the outline lands on the right node after a render.
    useEffect(() => {
        const root = stageWrapRef.current;
        if (!root) return;
        root.querySelectorAll<HTMLElement>('[data-element-selected="true"]').forEach((el) => {
            el.removeAttribute("data-element-selected");
        });
        if (!selectedPath) return;
        const target = JSON.stringify(selectedPath);
        const match = root.querySelector<HTMLElement>(`[data-element-path='${target}']`);
        if (match) match.setAttribute("data-element-selected", "true");
    }, [selectedPath, slide, slideIndex]);

    function handleCanvasClick(e: React.MouseEvent) {
        if (!onSelectElement) return;
        const target = e.target as HTMLElement;
        const node = target.closest<HTMLElement>("[data-element-path]");
        if (!node) {
            if (selectedPath) onSelectElement(null);
            return;
        }
        const raw = node.getAttribute("data-element-path");
        if (!raw) return;
        try {
            const path = JSON.parse(raw) as ElementPath;
            if (!pathsEqual(path, selectedPath)) {
                onSelectElement(path);
            }
        } catch {
            // ignore malformed path
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[var(--chrome-canvas-bg)] p-10">
            <div
                ref={stageWrapRef}
                onClick={handleCanvasClick}
                className="relative rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/5 deck-edit-surface"
                style={{
                    aspectRatio: aspect,
                    maxWidth: format === "story-ig" ? 520 : format === "doc" ? 780 : 1400,
                    maxHeight: "calc(100vh - 220px)",
                    width: format === "story-ig" || format === "doc" ? "auto" : "100%",
                    height: format === "story-ig" || format === "doc" ? "calc(100vh - 220px)" : "auto",
                }}
            >
                <SlideStage format={format} theme={theme}>
                    <SlideRenderer slide={slide} clientLogoUrl={clientLogoUrl} pageIndex={slideIndex + 1} />
                </SlideStage>
            </div>

            {canPrev && (
                <button
                    onClick={onPrev}
                    aria-label="Slide anterior"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 flex items-center justify-center text-[#0a0a0a] hover:bg-white hover:scale-105 active:scale-95 transition-[transform,background,box-shadow] duration-150"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M10 12L6 8L10 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}

            {canNext && (
                <button
                    onClick={onNext}
                    aria-label="Slide siguiente"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 flex items-center justify-center text-[#0a0a0a] hover:bg-white hover:scale-105 active:scale-95 transition-[transform,background,box-shadow] duration-150"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M6 4L10 8L6 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}

            {supportsBg && onSlideChange ? (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
                    <input
                        ref={bgInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBgFile(file);
                            e.target.value = "";
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => bgInputRef.current?.click()}
                        disabled={bgUploading}
                        className="h-8 px-3 rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 flex items-center gap-1.5 text-[11px] font-medium text-[#0a0a0a] hover:bg-white hover:scale-[1.03] active:scale-95 disabled:opacity-60 transition-[transform,background] duration-150"
                        style={{ transitionTimingFunction: "var(--ease-out)" }}
                    >
                        {bgUploading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-[#0a0a0a] animate-pulse" />
                                Subiendo…
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M2.5 12L5.5 9L8 11.5L11 8L13.5 10.5M2 3H14V13H2V3ZM10 6.5C10.276 6.5 10.5 6.276 10.5 6C10.5 5.724 10.276 5.5 10 5.5C9.724 5.5 9.5 5.724 9.5 6C9.5 6.276 9.724 6.5 10 6.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {currentBg ? "Cambiar imagen" : "Imagen de fondo"}
                            </>
                        )}
                    </button>
                    {currentBg ? (
                        <button
                            type="button"
                            onClick={handleRemoveBg}
                            className="h-8 px-2.5 rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 text-[11px] text-[#525252] hover:text-red-600 hover:bg-white transition-colors flex items-center"
                            aria-label="Quitar imagen de fondo"
                        >
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    ) : null}
                    {bgError ? (
                        <span className="text-[10.5px] text-red-600 bg-white/95 px-2 py-1 rounded-md shadow-lg ring-1 ring-red-100">
                            {bgError}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
