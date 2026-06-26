"use client";

import { useCallback, useState } from "react";
import type { Deck, Slide } from "@/lib/slide-types";
import { SlideRenderer } from "@/components/slides/deck-slides";
import { SlideStage } from "@/components/slides/slide-stage";
import {
    DECK_FIELDS,
    fieldsForSlide,
    SLIDE_TYPE_LABELS,
    type FieldDef,
    type ScalarField,
    type LinesField,
} from "@/lib/proposals/editable-fields";
import { getByPath, setByPath } from "@/lib/proposals/path-utils";

/** Route external image URLs through the same-origin proxy for thumbnails. */
function proxied(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith("/") || url.startsWith("data:")) return url;
    return `/api/logo-proxy?url=${encodeURIComponent(url)}`;
}

type Path = (string | number)[];

interface Props {
    deck: Deck;
    onChange: (deck: Deck) => void;
    onBack: () => void;
}

export function ProposalFieldsEditor({ deck, onChange, onBack }: Props) {
    const slides = (deck.slides ?? []) as Slide[];
    const [selected, setSelected] = useState(0);
    const [exporting, setExporting] = useState(false);

    const setAt = useCallback(
        (path: Path, value: unknown) => onChange(setByPath(deck, path, value)),
        [deck, onChange],
    );

    const exportPdf = useCallback(async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/export/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deck),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(deck.deckTitle || "propuesta").replace(/[^a-z0-9]+/gi, "-")}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert(`No se pudo exportar el PDF: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setExporting(false);
        }
    }, [deck]);

    const slide = slides[selected];

    return (
        <div className="flex flex-col h-screen bg-[#fafafa]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-black/[0.08] bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="h-8 px-3 rounded-md text-[12px] font-medium text-[#0a0a0a] border border-black/15 bg-white hover:bg-black/[0.04]"
                    >
                        ← Volver al canvas
                    </button>
                    <span className="text-[13px] font-semibold text-[#0a0a0a]">Editar propuesta</span>
                </div>
                <button
                    onClick={exportPdf}
                    disabled={exporting}
                    className="h-8 px-4 rounded-md text-[12px] font-semibold bg-[#0a0a0a] text-white hover:bg-black disabled:opacity-60"
                >
                    {exporting ? "Exportando…" : "Exportar PDF"}
                </button>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Form */}
                <div className="w-[44%] max-w-[560px] overflow-y-auto border-r border-black/[0.08] bg-white">
                    {/* Deck-level */}
                    <Section title="Propuesta">
                        {DECK_FIELDS.map((f) => (
                            <Field key={f.key} def={f} basePath={[]} deck={deck} setAt={setAt} />
                        ))}
                    </Section>

                    {/* Slide selector */}
                    <div className="px-5 py-3 border-y border-black/[0.06] bg-[#fafafa] sticky top-0 z-10">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#737373] mb-2">
                            Slides
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {slides.map((sl, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelected(i)}
                                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors ${
                                        i === selected
                                            ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                                            : "bg-white text-[#525252] border-black/15 hover:bg-black/[0.04]"
                                    }`}
                                >
                                    {i + 1}· {SLIDE_TYPE_LABELS[(sl as { type: string }).type] ?? (sl as { type: string }).type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected slide fields */}
                    {slide ? (
                        <Section title={`Slide ${selected + 1} — ${SLIDE_TYPE_LABELS[(slide as { type: string }).type] ?? (slide as { type: string }).type}`}>
                            {fieldsForSlide((slide as { type: string }).type).map((f) => (
                                <Field
                                    key={f.key}
                                    def={f}
                                    basePath={["slides", selected]}
                                    deck={deck}
                                    setAt={setAt}
                                />
                            ))}
                            {fieldsForSlide((slide as { type: string }).type).length === 0 ? (
                                <p className="text-[12px] text-[#a3a3a3]">
                                    Este tipo de slide ({(slide as { type: string }).type}) no tiene campos editables todavía.
                                </p>
                            ) : null}
                        </Section>
                    ) : null}
                </div>

                {/* Preview */}
                <div className="flex-1 min-w-0 flex items-center justify-center p-8 bg-[#e9e9e9]">
                    <div className="w-full h-full max-h-full flex items-center justify-center">
                        {slide ? (
                            <div className="w-full" style={{ aspectRatio: "16 / 9", maxHeight: "100%" }}>
                                <SlideStage format={deck.format} theme={deck.theme}>
                                    <SlideRenderer slide={slide} clientLogoUrl={deck.clientLogoUrl} pageIndex={selected} />
                                </SlideStage>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="px-5 py-4 border-b border-black/[0.06]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#737373] mb-3">
                {title}
            </div>
            <div className="space-y-3.5">{children}</div>
        </div>
    );
}

function Field({
    def,
    basePath,
    deck,
    setAt,
}: {
    def: FieldDef;
    basePath: Path;
    deck: Deck;
    setAt: (path: Path, value: unknown) => void;
}) {
    if (def.kind === "list") {
        const arr = (getByPath(deck, [...basePath, def.key]) as unknown[]) ?? [];
        return (
            <div>
                <div className="text-[11px] font-semibold text-[#404040] mb-2">{def.label}</div>
                <div className="space-y-3">
                    {arr.map((_, j) => {
                        const itemPath = [...basePath, def.key, j];
                        const heading =
                            (def.itemTitleKey &&
                                (getByPath(deck, [...itemPath, def.itemTitleKey]) as string)) ||
                            `${def.label} ${j + 1}`;
                        return (
                            <div key={j} className="rounded-lg border border-black/[0.08] p-3 bg-[#fafafa]">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#a3a3a3] mb-2.5">
                                    {String(heading).slice(0, 48)}
                                </div>
                                <div className="space-y-3">
                                    {def.itemFields.map((sub) => (
                                        <Field
                                            key={sub.key}
                                            def={sub}
                                            basePath={itemPath}
                                            deck={deck}
                                            setAt={setAt}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {arr.length === 0 ? (
                        <p className="text-[11px] text-[#a3a3a3]">Sin elementos.</p>
                    ) : null}
                </div>
            </div>
        );
    }

    if (def.kind === "lines") {
        const path = [...basePath, def.key];
        const val = (getByPath(deck, path) as string[]) ?? [];
        return (
            <label className="block">
                <span className="block text-[11px] font-medium text-[#404040] mb-1">{def.label}</span>
                <textarea
                    value={Array.isArray(val) ? val.join("\n") : String(val ?? "")}
                    onChange={(e) =>
                        setAt(path, e.target.value.split("\n").filter((l) => l.trim() !== ""))
                    }
                    rows={Math.min(8, Math.max(2, (Array.isArray(val) ? val.length : 1) + 1))}
                    className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-[12px] text-[#0a0a0a] leading-relaxed focus:outline-none focus:border-black/40 resize-y"
                />
            </label>
        );
    }

    // scalar
    return <ScalarInput def={def} basePath={basePath} deck={deck} setAt={setAt} />;
}

function ScalarInput({
    def,
    basePath,
    deck,
    setAt,
}: {
    def: ScalarField | LinesField;
    basePath: Path;
    deck: Deck;
    setAt: (path: Path, value: unknown) => void;
}) {
    const scalar = def as ScalarField;
    const path = [...basePath, def.key];
    const value = (getByPath(deck, path) as string) ?? "";

    if (scalar.type === "image") {
        return (
            <label className="block">
                <span className="block text-[11px] font-medium text-[#404040] mb-1">{def.label}</span>
                <div className="flex items-center gap-2.5">
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={proxied(value)}
                            alt=""
                            className="w-9 h-9 rounded object-contain bg-[#1a1a1a] border border-black/10 shrink-0"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded bg-black/[0.05] border border-black/10 shrink-0" />
                    )}
                    <input
                        type="text"
                        value={value}
                        placeholder="https://…"
                        onChange={(e) => setAt(path, e.target.value)}
                        className="flex-1 rounded-md border border-black/15 px-2.5 py-1.5 text-[12px] text-[#0a0a0a] focus:outline-none focus:border-black/40"
                    />
                </div>
            </label>
        );
    }

    if (scalar.type === "textarea") {
        return (
            <label className="block">
                <span className="block text-[11px] font-medium text-[#404040] mb-1">{def.label}</span>
                <textarea
                    value={value}
                    onChange={(e) => setAt(path, e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-[12px] text-[#0a0a0a] leading-relaxed focus:outline-none focus:border-black/40 resize-y"
                />
            </label>
        );
    }

    return (
        <label className="block">
            <span className="block text-[11px] font-medium text-[#404040] mb-1">{def.label}</span>
            <input
                type="text"
                value={value}
                onChange={(e) => setAt(path, e.target.value)}
                className="w-full rounded-md border border-black/15 px-2.5 py-1.5 text-[12px] text-[#0a0a0a] focus:outline-none focus:border-black/40"
            />
        </label>
    );
}
