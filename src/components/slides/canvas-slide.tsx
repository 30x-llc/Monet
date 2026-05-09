"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type CanvasElement,
    type CanvasImageElement,
    type CanvasSlide,
    type CanvasTextElement,
} from "@/lib/slide-types";

/**
 * Canvas slide renderer — Monet's free-positioning surface.
 *
 * The canvas lives in a fixed 1280x720 coordinate space. The wrapper
 * scales the whole inner div with a CSS transform so positioning math
 * stays in design units regardless of how big the editor stage is.
 *
 * Read-only mode (preview, PDF export, thumbnails) just renders the
 * elements. Editable mode adds drag handles, resize handles, selection,
 * and double-click-to-edit text.
 */

interface CanvasSlideViewProps {
    slide: CanvasSlide;
    /** When provided, the canvas becomes interactive. Each mutation calls
     *  onChange with the new slide so the parent can run it through
     *  handleDeckChange (which also pushes to undo). */
    onChange?: (next: CanvasSlide) => void;
    /** Externally controlled selection (for keyboard delete from parent). */
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
}

export function CanvasSlideView({ slide, onChange, selectedId, onSelect }: CanvasSlideViewProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Recompute scale whenever the container resizes so the design-space
    // canvas always fits inside the editor stage.
    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        function compute() {
            if (!wrap) return;
            const rect = wrap.getBoundingClientRect();
            const sx = rect.width / CANVAS_WIDTH;
            const sy = rect.height / CANVAS_HEIGHT;
            setScale(Math.min(sx, sy));
        }
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, []);

    const interactive = !!onChange;

    const updateElement = useCallback(
        (id: string, patch: Partial<CanvasElement>) => {
            if (!onChange) return;
            const next: CanvasSlide = {
                ...slide,
                elements: slide.elements.map((el) =>
                    el.id === id ? ({ ...el, ...patch } as CanvasElement) : el,
                ),
            };
            onChange(next);
        },
        [onChange, slide],
    );

    const deselect = useCallback(
        (e: React.MouseEvent) => {
            if (!interactive) return;
            // Clicking the empty canvas deselects.
            if (e.target === e.currentTarget) onSelect?.(null);
        },
        [interactive, onSelect],
    );

    return (
        <div
            ref={wrapRef}
            className="relative w-full h-full overflow-hidden"
            style={{ background: slide.background ?? "#ffffff" }}
        >
            <div
                className="absolute top-1/2 left-1/2 origin-center"
                style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                }}
                onMouseDown={deselect}
            >
                {slide.elements
                    .slice()
                    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                    .map((el) => (
                        <ElementView
                            key={el.id}
                            el={el}
                            scale={scale}
                            interactive={interactive}
                            selected={selectedId === el.id}
                            onSelect={() => onSelect?.(el.id)}
                            onPatch={(patch) => updateElement(el.id, patch)}
                        />
                    ))}
            </div>
        </div>
    );
}

interface ElementViewProps {
    el: CanvasElement;
    scale: number;
    interactive: boolean;
    selected: boolean;
    onSelect: () => void;
    onPatch: (patch: Partial<CanvasElement>) => void;
}

function ElementView({ el, scale, interactive, selected, onSelect, onPatch }: ElementViewProps) {
    const [editing, setEditing] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
        baseW: number;
        baseH: number;
        handle: "nw" | "ne" | "sw" | "se";
    } | null>(null);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!interactive || el.locked || editing) return;
            e.stopPropagation();
            onSelect();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                baseX: el.x,
                baseY: el.y,
            };
        },
        [interactive, el.locked, el.x, el.y, editing, onSelect],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            const drag = dragRef.current;
            const resize = resizeRef.current;
            if (drag) {
                const dx = (e.clientX - drag.startX) / scale;
                const dy = (e.clientY - drag.startY) / scale;
                onPatch({ x: Math.round(drag.baseX + dx), y: Math.round(drag.baseY + dy) });
            } else if (resize) {
                const dx = (e.clientX - resize.startX) / scale;
                const dy = (e.clientY - resize.startY) / scale;
                let nx = resize.baseX;
                let ny = resize.baseY;
                let nw = resize.baseW;
                let nh = resize.baseH;
                if (resize.handle === "se") {
                    nw = Math.max(20, resize.baseW + dx);
                    nh = Math.max(20, resize.baseH + dy);
                } else if (resize.handle === "ne") {
                    nw = Math.max(20, resize.baseW + dx);
                    nh = Math.max(20, resize.baseH - dy);
                    ny = resize.baseY + (resize.baseH - nh);
                } else if (resize.handle === "sw") {
                    nw = Math.max(20, resize.baseW - dx);
                    nh = Math.max(20, resize.baseH + dy);
                    nx = resize.baseX + (resize.baseW - nw);
                } else {
                    nw = Math.max(20, resize.baseW - dx);
                    nh = Math.max(20, resize.baseH - dy);
                    nx = resize.baseX + (resize.baseW - nw);
                    ny = resize.baseY + (resize.baseH - nh);
                }
                onPatch({ x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) });
            }
        },
        [scale, onPatch],
    );

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        dragRef.current = null;
        resizeRef.current = null;
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
    }, []);

    const startResize = useCallback(
        (handle: "nw" | "ne" | "sw" | "se") => (e: React.PointerEvent) => {
            if (!interactive || el.locked) return;
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            resizeRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                baseX: el.x,
                baseY: el.y,
                baseW: el.w,
                baseH: el.h,
                handle,
            };
        },
        [interactive, el.locked, el.x, el.y, el.w, el.h],
    );

    const baseStyle: React.CSSProperties = {
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
        cursor: interactive && !editing ? (selected ? "move" : "pointer") : "default",
    };

    return (
        <div
            style={baseStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={(e) => {
                if (!interactive || el.kind !== "text") return;
                e.stopPropagation();
                setEditing(true);
            }}
        >
            {el.kind === "text" ? (
                <TextElementBody
                    el={el}
                    editing={editing}
                    onCommit={(text) => {
                        setEditing(false);
                        if (text !== el.text) onPatch({ text });
                    }}
                    onCancel={() => setEditing(false)}
                />
            ) : (
                <ImageElementBody el={el as CanvasImageElement} />
            )}
            {selected && interactive && !editing ? (
                <>
                    <div className="pointer-events-none absolute inset-0 ring-2 ring-[#E9FF7B]" />
                    <ResizeHandle position="nw" onPointerDown={startResize("nw")} />
                    <ResizeHandle position="ne" onPointerDown={startResize("ne")} />
                    <ResizeHandle position="sw" onPointerDown={startResize("sw")} />
                    <ResizeHandle position="se" onPointerDown={startResize("se")} />
                </>
            ) : null}
        </div>
    );
}

function TextElementBody({
    el,
    editing,
    onCommit,
    onCancel,
}: {
    el: CanvasTextElement;
    editing: boolean;
    onCommit: (text: string) => void;
    onCancel: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const originalRef = useRef(el.text);

    useEffect(() => {
        if (!editing) return;
        const node = ref.current;
        if (!node) return;
        originalRef.current = node.textContent ?? "";
        node.focus();
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }, [editing]);

    const style: React.CSSProperties = {
        width: "100%",
        height: "100%",
        fontSize: el.fontSize ?? 24,
        fontWeight: el.fontWeight ?? 400,
        color: el.color ?? "#0a0a0a",
        textAlign: el.align ?? "left",
        lineHeight: el.lineHeight ?? 1.2,
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
        fontStyle: el.fontStyle ?? "normal",
        outline: "none",
        cursor: editing ? "text" : "inherit",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    };

    return (
        <div
            ref={ref}
            contentEditable={editing}
            suppressContentEditableWarning
            style={style}
            onKeyDown={(e) => {
                if (!editing) return;
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.blur();
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    if (ref.current) ref.current.textContent = originalRef.current;
                    onCancel();
                }
            }}
            onBlur={(e) => {
                if (!editing) return;
                onCommit(e.currentTarget.textContent ?? "");
            }}
        >
            {el.text}
        </div>
    );
}

function ImageElementBody({ el }: { el: CanvasImageElement }) {
    return (
        <img
            src={el.src}
            alt={el.alt ?? ""}
            draggable={false}
            style={{
                width: "100%",
                height: "100%",
                objectFit: el.fit ?? "cover",
                borderRadius: el.radius ?? 0,
                userSelect: "none",
                pointerEvents: "none",
            }}
        />
    );
}

function ResizeHandle({
    position,
    onPointerDown,
}: {
    position: "nw" | "ne" | "sw" | "se";
    onPointerDown: (e: React.PointerEvent) => void;
}) {
    const positionStyle: React.CSSProperties = {
        position: "absolute",
        width: 10,
        height: 10,
        background: "#0a0a0a",
        border: "2px solid #E9FF7B",
        borderRadius: 2,
        cursor: position === "nw" || position === "se" ? "nwse-resize" : "nesw-resize",
    };
    if (position === "nw") Object.assign(positionStyle, { top: -6, left: -6 });
    if (position === "ne") Object.assign(positionStyle, { top: -6, right: -6 });
    if (position === "sw") Object.assign(positionStyle, { bottom: -6, left: -6 });
    if (position === "se") Object.assign(positionStyle, { bottom: -6, right: -6 });
    return <div style={positionStyle} onPointerDown={onPointerDown} />;
}

/** Factory: a fresh empty canvas slide with one starter text element. */
export function newCanvasSlide(): CanvasSlide {
    const id = Math.random().toString(36).slice(2, 10);
    return {
        type: "canvas",
        background: "#ffffff",
        elements: [
            {
                id,
                kind: "text",
                text: "Doble click para editar",
                x: 80,
                y: 320,
                w: 1120,
                h: 80,
                fontSize: 56,
                fontWeight: 700,
                color: "#0a0a0a",
                align: "left",
            },
        ],
    };
}

export function newCanvasElementId(): string {
    return Math.random().toString(36).slice(2, 10);
}
