"use client";

import type {
    CanvasElement,
    CanvasFrameElement,
    CanvasImageElement,
    CanvasSlide,
    CanvasTextElement,
} from "@/lib/slide-types";
import {
    TEXT_STYLES,
    TEXT_STYLE_NAMES,
    type TextStyleName,
    inferTextStyle,
} from "@/lib/text-styles";

/**
 * Right-side properties inspector for canvas elements.
 *
 * Mirrors the Framer/Figma right-panel pattern: compact sections, numeric
 * inputs with step buttons, toggle groups for enums. Every change calls
 * onPatch with a partial element diff — the parent is responsible for
 * routing that through handleDeckChange so undo/redo catches it.
 */

interface CanvasPropertiesPanelProps {
    slide: CanvasSlide;
    selectedId: string | null;
    onPatch: (id: string, patch: Partial<CanvasElement>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onClose: () => void;
}

export function CanvasPropertiesPanel({
    slide,
    selectedId,
    onPatch,
    onDelete,
    onDuplicate,
    onClose,
}: CanvasPropertiesPanelProps) {
    const el = selectedId ? slide.elements.find((e) => e.id === selectedId) : null;
    if (!el) return null;
    return (
        <aside className="w-[280px] shrink-0 border-l border-[var(--chrome-border)] bg-[var(--chrome-bg)] flex flex-col text-[var(--chrome-fg)]">
            <header className="h-10 px-3 flex items-center justify-between border-b border-[var(--chrome-border)]">
                <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--chrome-fg-3)]">
                    {el.kind === "text"
                        ? "Texto"
                        : el.kind === "image"
                          ? "Imagen"
                          : el.kind === "shape"
                            ? "Forma"
                            : "Frame"}
                </span>
                <button
                    onClick={onClose}
                    className="text-[var(--chrome-fg-5)] hover:text-[var(--chrome-fg)] text-[11px]"
                    aria-label="Cerrar"
                >
                    ✕
                </button>
            </header>

            <div className="flex-1 overflow-y-auto">
                {el.kind === "text" ? (
                    <TextSection el={el} onPatch={(p) => onPatch(el.id, p)} />
                ) : el.kind === "image" ? (
                    <ImageSection el={el as CanvasImageElement} onPatch={(p) => onPatch(el.id, p)} />
                ) : el.kind === "frame" ? (
                    <FrameSection el={el as CanvasFrameElement} onPatch={(p) => onPatch(el.id, p)} />
                ) : null}
                <GeometrySection el={el} onPatch={(p) => onPatch(el.id, p)} />
            </div>

            <footer className="border-t border-[var(--chrome-border)] p-2 flex gap-1">
                <button
                    onClick={() => onDuplicate(el.id)}
                    className="flex-1 h-8 rounded text-[11px] font-medium bg-[var(--chrome-hover-bg-soft)] hover:bg-[var(--chrome-hover-bg)] text-[var(--chrome-fg)]"
                    title="Duplicar (⌘D)"
                >
                    Duplicar
                </button>
                <button
                    onClick={() => onDelete(el.id)}
                    className="flex-1 h-8 rounded text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300"
                    title="Borrar (⌫)"
                >
                    Borrar
                </button>
            </footer>
        </aside>
    );
}

// ─── Sections ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-b border-[var(--chrome-border)] py-3 px-3">
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--chrome-fg-5)] mb-2">
                {title}
            </div>
            <div className="flex flex-col gap-2">{children}</div>
        </section>
    );
}

function TextSection({
    el,
    onPatch,
}: {
    el: CanvasTextElement;
    onPatch: (patch: Partial<CanvasTextElement>) => void;
}) {
    // The Monet 8-style set is the canonical typography. The picker snaps
    // the element to a token and clears any ad-hoc overrides.
    const currentStyle: TextStyleName = el.textStyle
        ? el.textStyle
        : inferTextStyle({ fontSize: el.fontSize, fontWeight: el.fontWeight });
    return (
        <>
            <Section title="Estilo">
                <Row label="Estilo">
                    <SelectInput
                        value={currentStyle}
                        options={TEXT_STYLE_NAMES.map((n) => ({
                            value: n,
                            label: TEXT_STYLES[n].label,
                        }))}
                        onChange={(v) => {
                            // Apply the named style by clearing per-element
                            // overrides — the renderer will use the token.
                            onPatch({
                                textStyle: v as TextStyleName,
                                fontSize: undefined,
                                fontWeight: undefined,
                                lineHeight: undefined,
                                letterSpacing: undefined,
                            });
                        }}
                    />
                </Row>
            </Section>
            <Section title="Color y alineación">
                <Row label="Color">
                    <ColorInput
                        value={el.color ?? "#0a0a0a"}
                        onChange={(v) => onPatch({ color: v })}
                    />
                </Row>
                <Row label="Alinear">
                    <ToggleGroup
                        value={el.align ?? "left"}
                        options={[
                            { value: "left", label: "⇤" },
                            { value: "center", label: "↔" },
                            { value: "right", label: "⇥" },
                        ]}
                        onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })}
                    />
                </Row>
                <Row label="Italic">
                    <ToggleGroup
                        value={el.fontStyle ?? "normal"}
                        options={[
                            { value: "normal", label: "Aa" },
                            { value: "italic", label: "Aa", italic: true },
                        ]}
                        onChange={(v) => onPatch({ fontStyle: v as "normal" | "italic" })}
                    />
                </Row>
                <Row label="V-Align">
                    <ToggleGroup
                        value={el.verticalAlign ?? "top"}
                        options={[
                            { value: "top", label: "⤒" },
                            { value: "middle", label: "—" },
                            { value: "bottom", label: "⤓" },
                        ]}
                        onChange={(v) =>
                            onPatch({ verticalAlign: v as "top" | "middle" | "bottom" })
                        }
                    />
                </Row>
                <Row label="Lista">
                    <ToggleGroup
                        value={el.listStyle ?? "none"}
                        options={[
                            { value: "none", label: "—" },
                            { value: "bullet", label: "•" },
                            { value: "ordered", label: "1." },
                        ]}
                        onChange={(v) =>
                            onPatch({
                                listStyle: v === "none" ? undefined : (v as "bullet" | "ordered"),
                            })
                        }
                    />
                </Row>
            </Section>

            <Section title="Color y alineación">
                <Row label="Color">
                    <ColorInput
                        value={el.color ?? "#0a0a0a"}
                        onChange={(v) => onPatch({ color: v })}
                    />
                </Row>
                <Row label="Alinear">
                    <ToggleGroup
                        value={el.align ?? "left"}
                        options={[
                            { value: "left", label: "⇤" },
                            { value: "center", label: "↔" },
                            { value: "right", label: "⇥" },
                        ]}
                        onChange={(v) => onPatch({ align: v as "left" | "center" | "right" })}
                    />
                </Row>
            </Section>
        </>
    );
}

function FrameSection({
    el,
    onPatch,
}: {
    el: CanvasFrameElement;
    onPatch: (patch: Partial<CanvasFrameElement>) => void;
}) {
    return (
        <>
            <Section title="Auto-layout">
                <Row label="Dirección">
                    <ToggleGroup
                        value={el.direction}
                        options={[
                            { value: "column", label: "↓" },
                            { value: "row", label: "→" },
                        ]}
                        onChange={(v) => onPatch({ direction: v as "row" | "column" })}
                    />
                </Row>
                <Row label="Gap">
                    <NumberInput
                        value={el.gap ?? 16}
                        min={0}
                        max={400}
                        step={2}
                        onChange={(v) => onPatch({ gap: v })}
                    />
                </Row>
                <Row label="Padding ↑">
                    <NumberInput
                        value={el.paddingTop ?? 24}
                        min={0}
                        max={400}
                        step={2}
                        onChange={(v) => onPatch({ paddingTop: v })}
                    />
                </Row>
                <Row label="Padding →">
                    <NumberInput
                        value={el.paddingRight ?? 24}
                        min={0}
                        max={400}
                        step={2}
                        onChange={(v) => onPatch({ paddingRight: v })}
                    />
                </Row>
                <Row label="Padding ↓">
                    <NumberInput
                        value={el.paddingBottom ?? 24}
                        min={0}
                        max={400}
                        step={2}
                        onChange={(v) => onPatch({ paddingBottom: v })}
                    />
                </Row>
                <Row label="Padding ←">
                    <NumberInput
                        value={el.paddingLeft ?? 24}
                        min={0}
                        max={400}
                        step={2}
                        onChange={(v) => onPatch({ paddingLeft: v })}
                    />
                </Row>
            </Section>
            <Section title="Alineación">
                <Row label="Main">
                    <SelectInput
                        value={el.alignMain ?? "start"}
                        options={[
                            { value: "start", label: "Inicio" },
                            { value: "center", label: "Centro" },
                            { value: "end", label: "Fin" },
                            { value: "between", label: "Distribuir" },
                            { value: "around", label: "Alrededor" },
                        ]}
                        onChange={(v) =>
                            onPatch({
                                alignMain: v as "start" | "center" | "end" | "between" | "around",
                            })
                        }
                    />
                </Row>
                <Row label="Cross">
                    <SelectInput
                        value={el.alignCross ?? "stretch"}
                        options={[
                            { value: "start", label: "Inicio" },
                            { value: "center", label: "Centro" },
                            { value: "end", label: "Fin" },
                            { value: "stretch", label: "Estirar" },
                        ]}
                        onChange={(v) =>
                            onPatch({
                                alignCross: v as "start" | "center" | "end" | "stretch",
                            })
                        }
                    />
                </Row>
            </Section>
            <Section title="Apariencia">
                <Row label="Fondo">
                    <ColorInput
                        value={el.background ?? "#f4f4f5"}
                        onChange={(v) => onPatch({ background: v })}
                    />
                </Row>
                <Row label="Radio">
                    <NumberInput
                        value={el.radius ?? 0}
                        min={0}
                        max={400}
                        step={1}
                        onChange={(v) => onPatch({ radius: v })}
                    />
                </Row>
            </Section>
        </>
    );
}

function ImageSection({
    el,
    onPatch,
}: {
    el: CanvasImageElement;
    onPatch: (patch: Partial<CanvasImageElement>) => void;
}) {
    return (
        <Section title="Imagen">
            <Row label="Encaje">
                <ToggleGroup
                    value={el.fit ?? "cover"}
                    options={[
                        { value: "cover", label: "Cover" },
                        { value: "contain", label: "Contain" },
                    ]}
                    onChange={(v) => onPatch({ fit: v as "cover" | "contain" })}
                />
            </Row>
            <Row label="Radio">
                <NumberInput
                    value={el.radius ?? 0}
                    min={0}
                    max={500}
                    step={1}
                    onChange={(v) => onPatch({ radius: v })}
                />
            </Row>
        </Section>
    );
}

function GeometrySection({
    el,
    onPatch,
}: {
    el: CanvasElement;
    onPatch: (patch: Partial<CanvasElement>) => void;
}) {
    return (
        <Section title="Posición y tamaño">
            <Row label="X">
                <NumberInput value={el.x} min={-2000} max={4000} step={1} onChange={(v) => onPatch({ x: v })} />
            </Row>
            <Row label="Y">
                <NumberInput value={el.y} min={-2000} max={4000} step={1} onChange={(v) => onPatch({ y: v })} />
            </Row>
            <Row label="Ancho">
                <NumberInput value={el.w} min={4} max={4000} step={1} onChange={(v) => onPatch({ w: v })} />
            </Row>
            <Row label="Alto">
                <NumberInput value={el.h} min={4} max={4000} step={1} onChange={(v) => onPatch({ h: v })} />
            </Row>
            <Row label="Rotación">
                <NumberInput
                    value={el.rotate ?? 0}
                    min={-360}
                    max={360}
                    step={1}
                    onChange={(v) => onPatch({ rotate: v })}
                />
            </Row>
        </Section>
    );
}

// ─── Atoms ───────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--chrome-fg-3)] flex-1">{label}</span>
            <div className="w-[160px]">{children}</div>
        </div>
    );
}

function NumberInput({
    value,
    min,
    max,
    step,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <input
            type="number"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onChange(n);
            }}
            className="w-full h-7 px-2 rounded bg-[var(--chrome-hover-bg-soft)] border border-transparent focus:border-[#E9FF7B] focus:outline-none text-[12px] tabular-nums"
        />
    );
}

function SelectInput({
    value,
    options,
    onChange,
}: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-7 px-2 rounded bg-[var(--chrome-hover-bg-soft)] border border-transparent focus:border-[#E9FF7B] focus:outline-none text-[12px]"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={normalizeHex(value)}
                onChange={(e) => onChange(e.target.value)}
                className="h-7 w-7 rounded border border-[var(--chrome-border)] bg-transparent cursor-pointer"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 h-7 px-2 rounded bg-[var(--chrome-hover-bg-soft)] border border-transparent focus:border-[#E9FF7B] focus:outline-none text-[11px] font-mono"
            />
        </div>
    );
}

function ToggleGroup({
    value,
    options,
    onChange,
}: {
    value: string;
    options: { value: string; label: string; italic?: boolean }[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex rounded bg-[var(--chrome-hover-bg-soft)] p-0.5 gap-0.5">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        className={
                            "flex-1 h-6 text-[11px] rounded transition-colors " +
                            (active
                                ? "bg-[var(--chrome-fg)] text-[var(--chrome-bg)]"
                                : "text-[var(--chrome-fg-3)] hover:text-[var(--chrome-fg)]")
                        }
                        style={o.italic ? { fontStyle: "italic" } : undefined}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function normalizeHex(value: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
        return (
            "#" +
            value
                .slice(1)
                .split("")
                .map((c) => c + c)
                .join("")
        );
    }
    return "#000000";
}
