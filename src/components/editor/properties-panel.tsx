"use client";

import { useRef, useState } from "react";
import type { Slide } from "@/lib/slide-types";
import {
    type ElementAction,
    type ElementPath,
    canMove,
    describeElement,
} from "@/lib/element-edits";
import { uploadImage } from "@/lib/upload-image";

interface PropertiesPanelProps {
    slide: Slide;
    slideIndex: number;
    selectedPath: ElementPath | null;
    onAction: (action: ElementAction) => void;
    onElementImageChange?: (url: string | undefined) => void;
    onClose: () => void;
}

export function PropertiesPanel({
    slide,
    slideIndex,
    selectedPath,
    onAction,
    onElementImageChange,
    onClose,
}: PropertiesPanelProps) {
    const hasSelection = selectedPath !== null && selectedPath.length > 0;
    const elementLabel = hasSelection ? describeElement(selectedPath!) : null;
    const isArrayItem = hasSelection && selectedPath!.length >= 2;

    // Detect "this element supports an image" — currently mentors do
    // (custom imageUrl that overrides the imageKey lookup). Future:
    // company logos in intro-mentors angles, etc.
    const isMentorItem =
        isArrayItem && selectedPath![0] === "mentors" && typeof selectedPath![1] === "number";
    const mentor = isMentorItem
        ? (slide as unknown as { mentors?: { imageUrl?: string }[] }).mentors?.[
              selectedPath![1] as number
          ]
        : undefined;
    const mentorImgInputRef = useRef<HTMLInputElement>(null);
    const [mentorUploading, setMentorUploading] = useState(false);
    const [mentorError, setMentorError] = useState<string | null>(null);

    async function handleMentorFile(file: File) {
        if (!onElementImageChange) return;
        setMentorUploading(true);
        setMentorError(null);
        try {
            const url = await uploadImage(file);
            onElementImageChange(url);
        } catch (err) {
            setMentorError(err instanceof Error ? err.message : "Falló la subida.");
        } finally {
            setMentorUploading(false);
        }
    }

    const cap = (action: ElementAction) =>
        hasSelection && isArrayItem ? canMove(slide, selectedPath!, action) : false;
    const canUp = cap("moveUp");
    const canDown = cap("moveDown");
    const canLeft = cap("moveLeft");
    const canRight = cap("moveRight");
    const canDelete = cap("delete");

    return (
        <div className="properties-panel w-[260px] shrink-0 border-l border-[var(--chrome-border)] bg-[var(--chrome-bg-elevated)] flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[var(--chrome-border)] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-medium text-[var(--chrome-accent-fg)] tabular-nums">
                        #{slideIndex + 1}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--chrome-fg-3)] truncate">
                        {hasSelection ? elementLabel : "Editar slide"}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Cerrar panel"
                    className="w-5 h-5 rounded flex items-center justify-center text-[var(--chrome-fg-5)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] transition-colors shrink-0"
                >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-4">
                {hasSelection && isArrayItem ? (
                    <>
                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-[var(--chrome-fg-5)] uppercase tracking-wider">
                                Mover
                            </p>
                            <div className="grid grid-cols-3 gap-1.5 max-w-[140px]">
                                <div />
                                <ArrowButton dir="up" disabled={!canUp} onClick={() => onAction("moveUp")} />
                                <div />
                                <ArrowButton dir="left" disabled={!canLeft} onClick={() => onAction("moveLeft")} />
                                <div className="aspect-square rounded-md bg-[var(--chrome-bg)] border border-[var(--chrome-border)]" />
                                <ArrowButton dir="right" disabled={!canRight} onClick={() => onAction("moveRight")} />
                                <div />
                                <ArrowButton dir="down" disabled={!canDown} onClick={() => onAction("moveDown")} />
                                <div />
                            </div>
                        </div>

                        {isMentorItem && onElementImageChange ? (
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold text-[var(--chrome-fg-5)] uppercase tracking-wider">
                                    Foto del mentor
                                </p>
                                <input
                                    ref={mentorImgInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleMentorFile(file);
                                        e.target.value = "";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => mentorImgInputRef.current?.click()}
                                    disabled={mentorUploading}
                                    className="w-full text-[12px] font-medium px-3 py-2 rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] text-[var(--chrome-fg-2)] hover:bg-[var(--chrome-hover-bg)] hover:text-[var(--chrome-fg)] hover:border-[var(--chrome-accent-fg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {mentorUploading ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                            Subiendo…
                                        </>
                                    ) : (
                                        <>
                                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M8 11V3M8 3L4.5 6.5M8 3L11.5 6.5M3 13H13"
                                                    stroke="currentColor"
                                                    strokeWidth="1.4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            {mentor?.imageUrl ? "Cambiar foto" : "Subir foto"}
                                        </>
                                    )}
                                </button>
                                {mentor?.imageUrl ? (
                                    <button
                                        type="button"
                                        onClick={() => onElementImageChange(undefined)}
                                        className="w-full text-[11px] text-[var(--chrome-fg-3)] hover:text-red-400 transition-colors py-1"
                                    >
                                        Volver a la foto por defecto
                                    </button>
                                ) : null}
                                {mentorError ? (
                                    <p className="text-[10.5px] text-red-500 leading-snug">{mentorError}</p>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-[var(--chrome-fg-5)] uppercase tracking-wider">
                                Acciones
                            </p>
                            <button
                                disabled={!canDelete}
                                onClick={() => onAction("delete")}
                                className="w-full text-[12px] font-medium px-3 py-2 rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] text-[var(--chrome-fg-2)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M3 4H13M5.5 4V3C5.5 2.448 5.948 2 6.5 2H9.5C10.052 2 10.5 2.448 10.5 3V4M6.5 7V11M9.5 7V11M4.5 4L5 13C5 13.552 5.448 14 6 14H10C10.552 14 11 13.552 11 13L11.5 4"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                Eliminar elemento
                            </button>
                        </div>

                        <div className="rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] p-2.5">
                            <p className="text-[10px] text-[var(--chrome-fg-5)] leading-relaxed">
                                Atajos: <kbd className="font-mono">←↑↓→</kbd> mover,{" "}
                                <kbd className="font-mono">⌫</kbd> eliminar,{" "}
                                <kbd className="font-mono">Esc</kbd> deseleccionar.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] p-3">
                            <p className="text-[11px] text-[var(--chrome-fg-3)] leading-relaxed">
                                Click en un elemento del slide para seleccionarlo y moverlo o eliminarlo.
                            </p>
                            <p className="text-[10px] text-[var(--chrome-fg-5)] mt-2 leading-relaxed">
                                Para cambiar texto o copys, sigue usando el chat: &ldquo;cambia el headline a X&rdquo;.
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-[var(--chrome-fg-5)] uppercase tracking-wider mb-1">
                                Slide
                            </p>
                            <p className="text-[12px] font-mono text-[var(--chrome-accent-fg)]">{slide.type}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArrowButton({
    dir,
    disabled,
    onClick,
}: {
    dir: "up" | "down" | "left" | "right";
    disabled: boolean;
    onClick: () => void;
}) {
    const rotation = { up: 0, right: 90, down: 180, left: 270 }[dir];
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={`Mover ${dir}`}
            className="aspect-square rounded-md border border-[var(--chrome-border)] bg-[var(--chrome-bg)] text-[var(--chrome-fg-2)] hover:bg-[var(--chrome-hover-bg)] hover:text-[var(--chrome-fg)] hover:border-[var(--chrome-accent-fg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <path
                    d="M8 3V13M8 3L4 7M8 3L12 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}
