"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRendererClient as SlideRenderer } from "@/components/slides/slide-renderer-client";

/**
 * Canva-style horizontal thumbnail rail at the bottom of the editor.
 * Each thumbnail is a real, scaled-down render of the slide (not a
 * generated PNG), so it stays in sync with edits instantly. Click to
 * jump, active thumbnail has the lime accent border, page number under
 * each card. Hover reveals a delete button. Native HTML5 drag-and-drop
 * lets the user reorder slides; Backspace/Delete on focused active
 * thumb deletes it.
 */
interface SlideThumbnailRailProps {
    slides: Slide[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onAdd?: () => void;
    onDelete?: (index: number) => void;
    onReorder?: (from: number, to: number) => void;
    clientLogoUrl?: string;
    format: ProjectFormat;
    theme: "dark" | "light";
}

export function SlideThumbnailRail({
    slides,
    selectedIndex,
    onSelect,
    onAdd,
    onDelete,
    onReorder,
    clientLogoUrl,
    format,
    theme,
}: SlideThumbnailRailProps) {
    const railRef = useRef<HTMLDivElement>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

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

    const canDelete = !!onDelete && slides.length > 1;

    function handleDragStart(e: React.DragEvent, i: number) {
        if (!onReorder) return;
        setDragIndex(i);
        e.dataTransfer.effectAllowed = "move";
        // Required for some browsers to start the drag operation.
        e.dataTransfer.setData("text/plain", String(i));
    }

    function handleDragOver(e: React.DragEvent, i: number) {
        if (!onReorder || dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (i !== dropIndex) setDropIndex(i);
    }

    function handleDrop(e: React.DragEvent, i: number) {
        if (!onReorder || dragIndex === null) return;
        e.preventDefault();
        if (dragIndex !== i) {
            onReorder(dragIndex, i);
        }
        setDragIndex(null);
        setDropIndex(null);
    }

    function handleDragEnd() {
        setDragIndex(null);
        setDropIndex(null);
    }

    return (
        <div className="proto-rail" ref={railRef}>
            <div className="proto-rail-inner">
                {slides.map((slide, i) => {
                    const isActive = i === selectedIndex;
                    const isDragging = i === dragIndex;
                    const isDropTarget =
                        dragIndex !== null && i === dropIndex && dragIndex !== i;
                    return (
                        <div
                            key={i}
                            data-thumb-index={i}
                            className={[
                                "proto-rail-thumb",
                                isActive ? "is-active" : "",
                                isDragging ? "is-dragging" : "",
                                isDropTarget ? "is-drop-target" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            draggable={!!onReorder}
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={(e) => handleDrop(e, i)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onSelect(i)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ir a slide ${i + 1}`}
                            aria-current={isActive ? "true" : undefined}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelect(i);
                                }
                            }}
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
                            {canDelete ? (
                                <button
                                    type="button"
                                    className="proto-rail-thumb-del"
                                    aria-label={`Borrar slide ${i + 1}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete!(i);
                                    }}
                                >
                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M3 3l10 10M13 3L3 13"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            ) : null}
                        </div>
                    );
                })}
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
