"use client";

import type { Slide, ProjectFormat } from "@/lib/slide-types";
import { cx } from "@/utils/cx";
import { useState } from "react";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";

const SLIDE_TYPE_LABELS: Record<string, string> = {
    "cover-hero": "Cover",
    "corporate-cover": "Portada",
    "cover-globe": "Cierre",
    "intro-mentors": "Intro",
    "problem-cards": "Problema",
    "diagnostic": "Diagnóstico",
    "curriculum-grid": "Currículo",
    "mentor-duo": "Mentores",
    "mentor-grid": "Speakers",
    "methodology": "Metodología",
    "impact": "Impacto",
    "pricing-cta": "Inversión",
    "content": "Contenido",
};

interface SlideSidebarProps {
    slides: Slide[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onDelete: (index: number) => void;
    onMove: (from: number, to: number) => void;
    clientLogoUrl?: string;
    format?: ProjectFormat;
}

export function SlideSidebar({
    slides,
    selectedIndex,
    onSelect,
    onDelete,
    onMove,
    clientLogoUrl,
    format = "proposal",
}: SlideSidebarProps) {
    const thumbAspect = format === "carousel-ig" ? "1 / 1" : format === "story-ig" ? "9 / 16" : format === "doc" ? "794 / 1123" : "16 / 9";
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="w-[220px] shrink-0 border-r border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--chrome-border)] flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--chrome-fg-3)] uppercase tracking-[0.12em]">
                    Slides
                </span>
                <span className="text-[11px] text-[var(--chrome-fg-5)] tabular-nums">{slides.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-3 space-y-3">
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className="group relative"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <span
                                className={cx(
                                    "text-[10px] font-medium tabular-nums",
                                    i === selectedIndex ? "text-[var(--chrome-accent-fg)]" : "text-[var(--chrome-fg-5)]",
                                )}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[10px] text-[var(--chrome-fg-5)] uppercase tracking-wider">
                                {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                            </span>
                        </div>

                        <button
                            onClick={() => onSelect(i)}
                            className={cx(
                                "w-full rounded-md overflow-hidden ring-1 bg-[var(--chrome-thumb-bg)]",
                                "transition-[box-shadow,ring-color] duration-200",
                                i === selectedIndex
                                    ? "ring-[var(--chrome-ring-active)] shadow-[var(--chrome-shadow-active)]"
                                    : "ring-[var(--chrome-ring-idle)] hover:ring-[var(--chrome-ring-idle-hover)]",
                            )}
                            style={{ aspectRatio: thumbAspect }}
                        >
                            <div className="w-full h-full pointer-events-none">
                                <SlideStage format={format}>
                                    <SlideRenderer slide={slide} clientLogoUrl={clientLogoUrl} pageIndex={i + 1} />
                                </SlideStage>
                            </div>
                        </button>

                        {hoveredIndex === i && (
                            <div className="absolute top-6 right-0 flex flex-col gap-0.5 z-10">
                                {i > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMove(i, i - 1);
                                        }}
                                        className="w-5 h-5 rounded bg-[var(--chrome-divider)] text-[var(--chrome-fg-3)] flex items-center justify-center hover:bg-[var(--chrome-ring-idle-hover)] hover:text-[var(--chrome-fg)] transition-colors"
                                        aria-label={`Move slide ${i + 1} up`}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                )}
                                {i < slides.length - 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMove(i, i + 1);
                                        }}
                                        className="w-5 h-5 rounded bg-[var(--chrome-divider)] text-[var(--chrome-fg-3)] flex items-center justify-center hover:bg-[var(--chrome-ring-idle-hover)] hover:text-[var(--chrome-fg)] transition-colors"
                                        aria-label={`Move slide ${i + 1} down`}
                                    >
                                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(i);
                                    }}
                                    className="w-5 h-5 rounded bg-[var(--chrome-divider)] text-[var(--chrome-fg-3)] flex items-center justify-center hover:bg-red-500/30 hover:text-red-400 transition-colors"
                                    aria-label={`Delete slide ${i + 1}`}
                                >
                                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M3 4H13M5.5 4V3C5.5 2.448 5.948 2 6.5 2H9.5C10.052 2 10.5 2.448 10.5 3V4M6.5 7V11M9.5 7V11M4.5 4L5 13C5 13.552 5.448 14 6 14H10C10.552 14 11 13.552 11 13L11.5 4"
                                            stroke="currentColor"
                                            strokeWidth="1.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
