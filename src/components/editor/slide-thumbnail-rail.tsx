"use client";

import { useEffect, useRef } from "react";
import type { Slide, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";

/**
 * Canva-style horizontal thumbnail rail at the bottom of the editor.
 * Each thumbnail is a real, scaled-down render of the slide (not a
 * generated PNG), so it stays in sync with edits instantly. Click to
 * jump, active thumbnail has the lime accent border, page number under
 * each card.
 */
interface SlideThumbnailRailProps {
    slides: Slide[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onAdd?: () => void;
    clientLogoUrl?: string;
    format: ProjectFormat;
    theme: "dark" | "light";
}

export function SlideThumbnailRail({
    slides,
    selectedIndex,
    onSelect,
    onAdd,
    clientLogoUrl,
    format,
    theme,
}: SlideThumbnailRailProps) {
    const railRef = useRef<HTMLDivElement>(null);

    // Scroll the active thumbnail into view when selectedIndex changes
    // (e.g., when arrow keys move the canvas selection).
    useEffect(() => {
        const el = railRef.current?.querySelector<HTMLElement>(
            `[data-thumb-index="${selectedIndex}"]`,
        );
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [selectedIndex]);

    const spec = FORMATS[format];
    const aspect = `${spec.width} / ${spec.height}`;
    // Thumbnail target height; width derived from aspect ratio.
    // Story (9:16) gets narrower thumbs, doc (A4) too. Most are 16:9.
    const thumbHeight = format === "story-ig" || format === "doc" ? 88 : 72;

    return (
        <div className="proto-rail" ref={railRef}>
            <div className="proto-rail-inner">
                {slides.map((slide, i) => (
                    <button
                        key={i}
                        data-thumb-index={i}
                        onClick={() => onSelect(i)}
                        className={`proto-rail-thumb${i === selectedIndex ? " is-active" : ""}`}
                        aria-label={`Ir a slide ${i + 1}`}
                        aria-current={i === selectedIndex ? "true" : undefined}
                    >
                        <div
                            className="proto-rail-thumb-canvas"
                            style={{
                                aspectRatio: aspect,
                                height: thumbHeight,
                            }}
                        >
                            <SlideStage format={format} theme={theme}>
                                <SlideRenderer
                                    slide={slide}
                                    clientLogoUrl={clientLogoUrl}
                                    pageIndex={i + 1}
                                />
                            </SlideStage>
                        </div>
                        <span className="proto-rail-thumb-num">{i + 1}</span>
                    </button>
                ))}
                {onAdd ? (
                    <button
                        onClick={onAdd}
                        className="proto-rail-add"
                        aria-label="Agregar slide"
                        style={{ height: thumbHeight }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 5v14M5 12h14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                ) : null}
            </div>
        </div>
    );
}
