"use client";

import { useEffect, useRef } from "react";
import type { Slide, ProjectFormat } from "@/lib/slide-types";
import type { ElementPath } from "@/lib/element-edits";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";
import { FORMATS } from "@/lib/slide-types";

interface SlideCanvasProps {
    slide: Slide;
    slideIndex: number;
    totalSlides: number;
    onPrev: () => void;
    onNext: () => void;
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
        </div>
    );
}
