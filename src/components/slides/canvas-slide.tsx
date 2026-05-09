"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type CanvasElement,
    type CanvasImageElement,
    type CanvasShapeElement,
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
    /** Drag-drop a file onto the canvas. Position is in canvas units (1280×720). */
    onDropFile?: (file: File, x: number, y: number) => void;
}

export function CanvasSlideView({ slide, onChange, selectedId, onSelect, onDropFile }: CanvasSlideViewProps) {
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

    const [dragOver, setDragOver] = useState(false);
    const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

    function handleDragOver(e: React.DragEvent) {
        if (!onDropFile) return;
        if (Array.from(e.dataTransfer.items).some((it) => it.kind === "file")) {
            e.preventDefault();
            setDragOver(true);
        }
    }

    function handleDragLeave(e: React.DragEvent) {
        if (e.currentTarget === e.target) setDragOver(false);
    }

    function handleDrop(e: React.DragEvent) {
        if (!onDropFile) return;
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        // Translate screen coords to canvas coords. The inner div is centered
        // and scaled, so subtract its top-left in screen space and divide.
        const wrap = wrapRef.current;
        if (!wrap) return;
        const wrapRect = wrap.getBoundingClientRect();
        const cx = wrapRect.left + wrapRect.width / 2;
        const cy = wrapRect.top + wrapRect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const xCanvas = CANVAS_WIDTH / 2 + dx / scale;
        const yCanvas = CANVAS_HEIGHT / 2 + dy / scale;
        onDropFile(file, xCanvas, yCanvas);
    }

    return (
        <div
            ref={wrapRef}
            className="relative w-full h-full overflow-hidden"
            style={{ background: slide.background ?? "#ffffff" }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {dragOver ? (
                <div className="absolute inset-0 z-40 pointer-events-none border-2 border-dashed border-[#E9FF7B] bg-[#E9FF7B]/10 grid place-items-center">
                    <div className="text-[14px] font-semibold text-[#0a0a0a] bg-white/90 rounded-full px-4 py-2 shadow">
                        Suelta para insertar imagen
                    </div>
                </div>
            ) : null}
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
                            siblings={slide.elements.filter((s) => s.id !== el.id)}
                            scale={scale}
                            interactive={interactive}
                            selected={selectedId === el.id}
                            onSelect={() => onSelect?.(el.id)}
                            onPatch={(patch) => updateElement(el.id, patch)}
                            onGuides={setGuides}
                        />
                    ))}
                {/* Pink alignment guides — drawn above elements while dragging. */}
                {guides.v.map((x, i) => (
                    <div
                        key={"v" + i}
                        className="pointer-events-none absolute top-0 bottom-0"
                        style={{ left: x, width: 1, background: "#FF007A", boxShadow: "0 0 4px rgba(255,0,122,0.5)" }}
                    />
                ))}
                {guides.h.map((y, i) => (
                    <div
                        key={"h" + i}
                        className="pointer-events-none absolute left-0 right-0"
                        style={{ top: y, height: 1, background: "#FF007A", boxShadow: "0 0 4px rgba(255,0,122,0.5)" }}
                    />
                ))}
            </div>
        </div>
    );
}

interface ElementViewProps {
    el: CanvasElement;
    siblings: CanvasElement[];
    scale: number;
    interactive: boolean;
    selected: boolean;
    onSelect: () => void;
    onPatch: (patch: Partial<CanvasElement>) => void;
    onGuides: (g: { v: number[]; h: number[] }) => void;
}

const SNAP_THRESHOLD = 6; // canvas units

/** Snap proposed x/y to siblings + canvas edges. Returns adjusted coords
 *  plus the guide lines (in canvas coords) that should be drawn. */
function snapBox(
    x: number,
    y: number,
    w: number,
    h: number,
    siblings: CanvasElement[],
): { x: number; y: number; vGuides: number[]; hGuides: number[] } {
    const sourceVerticals = [
        { type: "left" as const, value: x },
        { type: "centerX" as const, value: x + w / 2 },
        { type: "right" as const, value: x + w },
    ];
    const sourceHorizontals = [
        { type: "top" as const, value: y },
        { type: "centerY" as const, value: y + h / 2 },
        { type: "bottom" as const, value: y + h },
    ];
    // Snap targets: canvas edges/center + every sibling edge/center.
    const targetVs: number[] = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH];
    const targetHs: number[] = [0, CANVAS_HEIGHT / 2, CANVAS_HEIGHT];
    for (const s of siblings) {
        targetVs.push(s.x, s.x + s.w / 2, s.x + s.w);
        targetHs.push(s.y, s.y + s.h / 2, s.y + s.h);
    }
    let bestX: { delta: number; line: number } | null = null;
    for (const src of sourceVerticals) {
        for (const t of targetVs) {
            const delta = t - src.value;
            if (Math.abs(delta) < SNAP_THRESHOLD && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
                bestX = { delta, line: t };
            }
        }
    }
    let bestY: { delta: number; line: number } | null = null;
    for (const src of sourceHorizontals) {
        for (const t of targetHs) {
            const delta = t - src.value;
            if (Math.abs(delta) < SNAP_THRESHOLD && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
                bestY = { delta, line: t };
            }
        }
    }
    const nx = bestX ? Math.round(x + bestX.delta) : x;
    const ny = bestY ? Math.round(y + bestY.delta) : y;
    return {
        x: nx,
        y: ny,
        vGuides: bestX ? [bestX.line] : [],
        hGuides: bestY ? [bestY.line] : [],
    };
}

function ElementView({ el, siblings, scale, interactive, selected, onSelect, onPatch, onGuides }: ElementViewProps) {
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
                const rawX = drag.baseX + dx;
                const rawY = drag.baseY + dy;
                const snap = snapBox(rawX, rawY, el.w, el.h, siblings);
                onGuides({ v: snap.vGuides, h: snap.hGuides });
                onPatch({ x: snap.x, y: snap.y });
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
        [scale, onPatch, el.w, el.h, siblings, onGuides],
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            dragRef.current = null;
            resizeRef.current = null;
            onGuides({ v: [], h: [] });
            if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            }
        },
        [onGuides],
    );

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
            ) : el.kind === "image" ? (
                <ImageElementBody el={el as CanvasImageElement} />
            ) : (
                <ShapeElementBody el={el as CanvasShapeElement} />
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

function ShapeElementBody({ el }: { el: CanvasShapeElement }) {
    const fill = el.fill ?? "#E9FF7B";
    const stroke = el.stroke;
    const strokeWidth = el.strokeWidth ?? 0;
    if (el.shape === "ellipse") {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: fill,
                    border: stroke && strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : undefined,
                    borderRadius: "50%",
                }}
            />
        );
    }
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: fill,
                border: stroke && strokeWidth > 0 ? `${strokeWidth}px solid ${stroke}` : undefined,
                borderRadius: el.radius ?? 0,
            }}
        />
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

// ─── Element factories ──────────────────────────────────────────────

/** Centers a w×h box on the 1280×720 canvas. */
function centeredBox(w: number, h: number): { x: number; y: number; w: number; h: number } {
    return { x: Math.round((CANVAS_WIDTH - w) / 2), y: Math.round((CANVAS_HEIGHT - h) / 2), w, h };
}

export function newTextElement(): CanvasTextElement {
    return {
        id: newCanvasElementId(),
        kind: "text",
        text: "Texto",
        ...centeredBox(360, 56),
        fontSize: 32,
        fontWeight: 500,
        color: "#0a0a0a",
        align: "left",
        lineHeight: 1.2,
    };
}

export function newImageElement(src: string, w = 480, h = 320): CanvasImageElement {
    return {
        id: newCanvasElementId(),
        kind: "image",
        src,
        ...centeredBox(w, h),
        fit: "cover",
    };
}

export function newRectElement(): CanvasShapeElement {
    return {
        id: newCanvasElementId(),
        kind: "shape",
        shape: "rect",
        ...centeredBox(280, 200),
        fill: "#E9FF7B",
        radius: 12,
    };
}

export function newEllipseElement(): CanvasShapeElement {
    return {
        id: newCanvasElementId(),
        kind: "shape",
        shape: "ellipse",
        ...centeredBox(240, 240),
        fill: "#E9FF7B",
    };
}

// ─── Floating creation toolbar ─────────────────────────────────────

interface CanvasCreationToolbarProps {
    onAdd: (el: CanvasElement) => void;
    onUploadImage: (file: File) => Promise<void>;
}

export function CanvasCreationToolbar({ onAdd, onUploadImage }: CanvasCreationToolbarProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg ring-1 ring-black/5 p-1">
            <ToolbarButton label="Texto" onClick={() => onAdd(newTextElement())}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M8 4v8M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            </ToolbarButton>
            <ToolbarButton label="Rectángulo" onClick={() => onAdd(newRectElement())}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            </ToolbarButton>
            <ToolbarButton label="Elipse" onClick={() => onAdd(newEllipseElement())}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <ellipse cx="8" cy="8" rx="5.5" ry="5.5" stroke="currentColor" strokeWidth="1.6" />
                </svg>
            </ToolbarButton>
            <span className="w-px h-5 bg-black/10 mx-0.5" />
            <ToolbarButton label="Subir imagen" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M2 11l3-3 3 3 2-2 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
                    <circle cx="11" cy="6" r="1" fill="currentColor" />
                </svg>
            </ToolbarButton>
            <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
                hidden
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadImage(f);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

function ToolbarButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#0a0a0a] hover:bg-black/5 active:scale-95 transition"
        >
            {children}
        </button>
    );
}
