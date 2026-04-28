"use client";

import type { Slide, ProjectFormat } from "@/lib/slide-types";
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
}: SlideCanvasProps) {
    const spec = FORMATS[format];
    const aspect = `${spec.width} / ${spec.height}`;
    const canPrev = slideIndex > 0;
    const canNext = slideIndex < totalSlides - 1;

    return (
        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[var(--chrome-canvas-bg)] p-10">
            <div
                className="relative rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/5"
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
