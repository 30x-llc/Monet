"use client";

import { useState } from "react";
import type { CanvasElement, CanvasSlide, CanvasTextElement } from "@/lib/slide-types";

interface CanvasLayersPanelProps {
    slide: CanvasSlide;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (next: CanvasSlide) => void;
}

/**
 * Layers panel — left-side stacked list of canvas elements.
 *
 * Top of the list = front-most layer (highest z-order). Drag a row to
 * reorder, click to select. Eye icon toggles a `hidden` flag on the
 * element. Lock icon flips `locked` so canvas drag/resize can't move it
 * (the panel still works).
 */
export function CanvasLayersPanel({ slide, selectedId, onSelect, onChange }: CanvasLayersPanelProps) {
    // Display order: highest zIndex (= position in array, since the renderer
    // sorts ascending) at the top. We render reversed so newest/topmost is
    // visually at the top — Figma/Sketch convention.
    const ordered = slide.elements.slice().reverse();
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropAt, setDropAt] = useState<number | null>(null);

    function patchElement(id: string, patch: Partial<CanvasElement>) {
        onChange({
            ...slide,
            elements: slide.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CanvasElement) : e)),
        });
    }

    function reorder(fromDisplayIdx: number, toDisplayIdx: number) {
        // Display indices are reversed from storage indices.
        const arr = slide.elements.slice();
        const fromStorage = arr.length - 1 - fromDisplayIdx;
        const toStorage = arr.length - 1 - toDisplayIdx;
        const [moved] = arr.splice(fromStorage, 1);
        arr.splice(toStorage, 0, moved);
        onChange({ ...slide, elements: arr });
    }

    return (
        <aside className="w-[220px] shrink-0 border-r border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex flex-col text-[var(--chrome-fg)]">
            <header className="h-10 px-3 flex items-center border-b border-[var(--chrome-border)]">
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--chrome-fg-3)]">
                    Capas · {slide.elements.length}
                </span>
            </header>
            <div className="flex-1 overflow-y-auto py-1">
                {ordered.length === 0 ? (
                    <div className="px-3 py-6 text-[11px] text-[var(--chrome-fg-5)] text-center">
                        Canvas vacío. Usa la barra de arriba para insertar.
                    </div>
                ) : (
                    ordered.map((el, displayIdx) => {
                        const active = selectedId === el.id;
                        const dropTarget = dropAt === displayIdx && dragId !== el.id;
                        return (
                            <div
                                key={el.id}
                                draggable
                                onDragStart={(e) => {
                                    setDragId(el.id);
                                    e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragOver={(e) => {
                                    if (!dragId) return;
                                    e.preventDefault();
                                    setDropAt(displayIdx);
                                }}
                                onDragLeave={(e) => {
                                    if (e.currentTarget === e.target) setDropAt(null);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (!dragId) return;
                                    const fromIdx = ordered.findIndex((x) => x.id === dragId);
                                    if (fromIdx >= 0 && fromIdx !== displayIdx) {
                                        reorder(fromIdx, displayIdx);
                                    }
                                    setDragId(null);
                                    setDropAt(null);
                                }}
                                onDragEnd={() => {
                                    setDragId(null);
                                    setDropAt(null);
                                }}
                                onClick={() => onSelect(el.id)}
                                className={
                                    "group h-7 px-2 flex items-center gap-1.5 cursor-pointer transition-colors " +
                                    (active
                                        ? "bg-[var(--chrome-accent-soft-bg)] text-[var(--chrome-accent-fg)]"
                                        : "hover:bg-[var(--chrome-hover-bg-soft)]") +
                                    (dropTarget ? " border-t border-[#E9FF7B]" : "")
                                }
                            >
                                <ElementKindIcon el={el} />
                                <span className="flex-1 text-[11.5px] truncate">{labelFor(el)}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const isLocked = !!el.locked;
                                        patchElement(el.id, { locked: !isLocked });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-[var(--chrome-fg-5)] hover:text-[var(--chrome-fg)]"
                                    title={el.locked ? "Desbloquear" : "Bloquear"}
                                >
                                    {el.locked ? <LockIcon /> : <UnlockIcon />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const isHidden = !!(el as { hidden?: boolean }).hidden;
                                        patchElement(el.id, { hidden: !isHidden } as Partial<CanvasElement>);
                                    }}
                                    className={
                                        "opacity-0 group-hover:opacity-100 hover:opacity-100 " +
                                        ((el as { hidden?: boolean }).hidden
                                            ? "opacity-100 text-[var(--chrome-fg-5)]"
                                            : "text-[var(--chrome-fg-5)] hover:text-[var(--chrome-fg)]")
                                    }
                                    title={(el as { hidden?: boolean }).hidden ? "Mostrar" : "Ocultar"}
                                >
                                    {(el as { hidden?: boolean }).hidden ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}

function labelFor(el: CanvasElement): string {
    if (el.kind === "text") {
        const t = (el as CanvasTextElement).text?.trim() ?? "";
        return t.length > 0 ? t.slice(0, 32) : "Texto";
    }
    if (el.kind === "image") return "Imagen";
    return el.shape === "ellipse" ? "Elipse" : "Rectángulo";
}

function ElementKindIcon({ el }: { el: CanvasElement }) {
    const cn = "w-3 h-3 text-[var(--chrome-fg-5)]";
    if (el.kind === "text") {
        return (
            <svg viewBox="0 0 12 12" className={cn} fill="none">
                <path d="M2 3h8M6 3v6M4 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        );
    }
    if (el.kind === "image") {
        return (
            <svg viewBox="0 0 12 12" className={cn} fill="none">
                <rect x="1.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="4.5" cy="5" r="0.8" fill="currentColor" />
                <path d="M2 8.5l2.5-2 2 1.5L9 6.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
        );
    }
    if (el.shape === "ellipse") {
        return (
            <svg viewBox="0 0 12 12" className={cn} fill="none">
                <ellipse cx="6" cy="6" rx="4" ry="4" stroke="currentColor" strokeWidth="1.2" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 12 12" className={cn} fill="none">
            <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}

function UnlockIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 6V4a2 2 0 014 0" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}
