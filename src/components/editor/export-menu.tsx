"use client";

import { useEffect, useRef, useState } from "react";
import type { Deck } from "@/lib/slide-types";
import { exportDeckAsPdf, exportDeckToCanva, exportDeckAsHtml, exportDeckAsZip } from "@/lib/export/exporters";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";

interface ExportMenuProps {
    deck: Deck;
    onExportPptx: () => Promise<void>;
    onDuplicate: () => void;
    onDuplicateAsTemplate: () => void;
    isExportingPptx: boolean;
}

type ExportState =
    | { kind: "idle" }
    | { kind: "running"; label: string; current: number; total: number };

export function ExportMenu({
    deck,
    onExportPptx,
    onDuplicate,
    onDuplicateAsTemplate,
    isExportingPptx,
}: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<ExportState>({ kind: "idle" });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    const runClientExport = async (
        label: string,
        fn: (
            d: Deck,
            onProgress?: (i: number, t: number) => void,
        ) => Promise<void>,
    ) => {
        setOpen(false);
        setState({ kind: "running", label, current: 0, total: deck.slides.length });
        try {
            await fn(deck, (i, t) =>
                setState({ kind: "running", label, current: i, total: t }),
            );
        } catch (err) {
            console.error(`${label} failed:`, err);
        } finally {
            setState({ kind: "idle" });
        }
    };

    const isBusy = state.kind === "running" || isExportingPptx;

    const busyLabel =
        state.kind === "running"
            ? `${state.label} · ${state.current}/${state.total}`
            : isExportingPptx
              ? "Exportando PPTX…"
              : "Exportar";

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={isBusy}
                className="h-7 px-3 rounded-md text-[11px] font-semibold bg-[var(--chrome-accent)] text-black hover:brightness-95 active:brightness-90 disabled:opacity-60 flex items-center gap-1.5 transition-[background,filter,opacity] duration-150"
                style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                {isBusy ? busyLabel : "Exportar"}
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" className="opacity-70">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute right-0 top-9 w-[300px] rounded-lg border border-[var(--chrome-border)] bg-[var(--chrome-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden z-50"
                    style={{ transitionTimingFunction: "var(--ease-out)" }}
                >
                    <MenuSection>
                        <MenuItem icon={<DuplicateIcon />} label="Duplicar proyecto" onClick={() => { onDuplicate(); setOpen(false); }} />
                        <MenuItem icon={<TemplateIcon />} label="Duplicar como plantilla" onClick={() => { onDuplicateAsTemplate(); setOpen(false); }} />
                    </MenuSection>

                    <div className="h-px bg-[var(--chrome-divider)]" />

                    <MenuSection>
                        <MenuItem
                            icon={<DocIcon />}
                            label="Exportar como PDF"
                            onClick={() => runClientExport("PDF", exportDeckAsPdf)}
                        />
                        <MenuItem
                            icon={<DocIcon />}
                            label="Exportar como PPTX…"
                            onClick={() => { setOpen(false); onExportPptx(); }}
                        />
                        <MenuItem
                            icon={<ExternalIcon />}
                            label="Enviar a Canva…"
                            hint="Descarga PDF y abre Canva"
                            onClick={() => runClientExport("Canva", exportDeckToCanva)}
                        />
                        <MenuItem
                            icon={<HtmlIcon />}
                            label="Exportar como HTML standalone"
                            onClick={() => runClientExport("HTML", exportDeckAsHtml)}
                        />
                        <MenuItem
                            icon={<ZipIcon />}
                            label="Descargar proyecto como .zip"
                            onClick={() => runClientExport("ZIP", exportDeckAsZip)}
                        />
                    </MenuSection>
                </div>
            )}
        </div>
    );
}

function MenuSection({ children }: { children: React.ReactNode }) {
    return <div className="py-1.5">{children}</div>;
}

function MenuItem({
    icon,
    label,
    hint,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    hint?: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-left text-[13px] text-[var(--chrome-fg-2)] hover:bg-[var(--chrome-hover-bg-soft)] transition-colors"
        >
            <span className="w-4 h-4 flex items-center justify-center text-[var(--chrome-fg-4)]">{icon}</span>
            <span className="flex-1 tracking-[-0.005em]">{label}</span>
            {hint ? <span className="text-[11px] text-[var(--chrome-fg-5)]">{hint}</span> : null}
        </button>
    );
}

function DuplicateIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
    );
}
function TemplateIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    );
}
function DocIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
        </svg>
    );
}
function ExternalIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
    );
}
function HtmlIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17V7l8 10 8-10v10" />
        </svg>
    );
}
function ZipIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.3 7 12 12l8.7-5" />
            <path d="M12 22V12" />
        </svg>
    );
}
