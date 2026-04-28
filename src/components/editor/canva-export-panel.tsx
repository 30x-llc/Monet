"use client";

import { useEffect, useState } from "react";
import type { Deck } from "@/lib/slide-types";
import {
    exportDeckAsPdfToCanvaFlow,
    CANVA_IMPORT_URL,
} from "@/lib/export/exporters";

/**
 * Canva export — three-tier panel.
 *
 * Tier 1 — Brand Templates Autofill (THE 10/10 path):
 *   When Juan Diego has Canva templates designed + IDs configured,
 *   30x Design generates each slide via Canva's Autofill API. Result:
 *   pixel-perfect Canva-quality slides with the salesperson's content.
 *
 * Tier 2 — PDF import (OAuth, no templates yet):
 *   Server renders PDF via puppeteer → uploads to Canva → user lands in
 *   a Canva design that imported the PDF. Lossy (text becomes images
 *   when Canva ingests PDFs in some cases) but works while templates
 *   are being designed.
 *
 * Tier 3 — Manual PDF download (no OAuth, no templates):
 *   The fallback that works for everyone, no Canva account needed.
 *
 * The panel auto-detects which tiers are available and shows the
 * highest-fidelity option as primary.
 */

interface CanvaExportPanelProps {
    deck: Deck;
    onClose: () => void;
}

type Phase =
    | { kind: "idle" }
    | { kind: "exporting-pdf"; current: number; total: number }
    | { kind: "rendering-server" }
    | { kind: "importing" }
    | { kind: "autofilling"; done: number; total: number }
    | { kind: "success-pdf"; editUrl: string }
    | { kind: "success-autofill"; results: AutofillSlideResult[] }
    | { kind: "error"; message: string };

interface AutofillSlideResult {
    slideIndex: number;
    slideType: string;
    kind: "success" | "fallback" | "failed";
    editUrl?: string;
    viewUrl?: string;
    reason?: string;
}

type OAuthStatus = { enabled: boolean; connected: boolean };
type AutofillStatus = {
    configured: number;
    oauthEnabled: boolean;
    templates: Array<{
        key: string;
        displayName: string;
        slideTypes: string[];
        templateId: string;
    }>;
};

export function CanvaExportPanel({ deck, onClose }: CanvaExportPanelProps) {
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });
    const [oauth, setOauth] = useState<OAuthStatus | null>(null);
    const [autofill, setAutofill] = useState<AutofillStatus | null>(null);

    useEffect(() => {
        let cancel = false;
        Promise.all([
            fetch("/api/canva/status").then((r) => r.json()),
            fetch("/api/export/canva-autofill").then((r) => r.json()),
        ])
            .then(([s, a]: [OAuthStatus, AutofillStatus]) => {
                if (cancel) return;
                setOauth(s);
                setAutofill(a);
            })
            .catch(() => {
                if (!cancel) {
                    setOauth({ enabled: false, connected: false });
                    setAutofill({ configured: 0, oauthEnabled: false, templates: [] });
                }
            });
        return () => {
            cancel = true;
        };
    }, []);

    const runManual = async () => {
        setPhase({ kind: "exporting-pdf", current: 0, total: deck.slides.length });
        try {
            await exportDeckAsPdfToCanvaFlow(deck, (i, t) =>
                setPhase({ kind: "exporting-pdf", current: i, total: t }),
            );
            setPhase({ kind: "idle" });
            onClose();
        } catch (err) {
            setPhase({ kind: "error", message: String(err) });
        }
    };

    const runPdfImport = async () => {
        setPhase({ kind: "rendering-server" });
        try {
            const res = await fetch("/api/export/canva", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deck),
            });
            if (res.status === 401) {
                const data = (await res.json().catch(() => ({}))) as {
                    connectUrl?: string;
                };
                window.open(
                    data.connectUrl || "/api/canva/connect?returnTo=/",
                    "_blank",
                    "noopener,noreferrer",
                );
                setPhase({
                    kind: "error",
                    message: "Conecta Canva en la ventana que se abrió y reintenta.",
                });
                return;
            }
            setPhase({ kind: "importing" });
            const data = (await res.json()) as
                | { ok: true; editUrl: string }
                | { ok: false; error?: string };
            if (!("ok" in data) || !data.ok) {
                setPhase({
                    kind: "error",
                    message:
                        ("error" in data && data.error) ||
                        "La exportación a Canva falló.",
                });
                return;
            }
            setPhase({ kind: "success-pdf", editUrl: data.editUrl });
            window.open(data.editUrl, "_blank", "noopener,noreferrer");
        } catch (err) {
            setPhase({ kind: "error", message: String(err) });
        }
    };

    const runAutofill = async () => {
        setPhase({ kind: "autofilling", done: 0, total: deck.slides.length });
        try {
            const res = await fetch("/api/export/canva-autofill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deck),
            });
            if (res.status === 401) {
                const data = (await res.json().catch(() => ({}))) as {
                    connectUrl?: string;
                };
                window.open(
                    data.connectUrl || "/api/canva/connect?returnTo=/",
                    "_blank",
                    "noopener,noreferrer",
                );
                setPhase({
                    kind: "error",
                    message: "Conecta Canva en la ventana y reintenta.",
                });
                return;
            }
            const data = (await res.json()) as
                | {
                      ok: true;
                      results: AutofillSlideResult[];
                      totalUploadedAssets: number;
                      durationMs: number;
                  }
                | { ok: false; error?: string };
            if (!("ok" in data) || !data.ok) {
                setPhase({
                    kind: "error",
                    message:
                        ("error" in data && data.error) ||
                        "Autofill a Canva falló.",
                });
                return;
            }
            setPhase({ kind: "success-autofill", results: data.results });
            // Auto-open the first successful slide so the user lands in
            // Canva immediately. Subsequent slides accessible via the
            // results list below.
            const firstSuccess = data.results.find((r) => r.kind === "success");
            if (firstSuccess?.editUrl) {
                window.open(firstSuccess.editUrl, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            setPhase({ kind: "error", message: String(err) });
        }
    };

    const oauthAvailable = oauth?.enabled ?? false;
    const autofillAvailable =
        oauthAvailable && (autofill?.configured ?? 0) > 0;
    const busy =
        phase.kind === "exporting-pdf" ||
        phase.kind === "rendering-server" ||
        phase.kind === "importing" ||
        phase.kind === "autofilling";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !busy && onClose()}
        >
            <div
                className="w-[560px] max-w-[92vw] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)] relative"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-6 pt-6 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <CanvaLogo />
                        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#a3a3a3]">
                            Exportar a Canva
                        </span>
                    </div>
                    <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">
                        {phase.kind === "success-autofill"
                            ? "Listo en Canva con tus templates"
                            : phase.kind === "success-pdf"
                              ? "Listo en Canva"
                              : "Abre tu deck en Canva"}
                    </h2>
                    <p className="mt-1 text-[12.5px] leading-[1.45] text-[#525252]">
                        {phase.kind === "success-autofill"
                            ? "Cada slide está en tu cuenta de Canva con los templates 30x. Click cualquiera para abrir."
                            : phase.kind === "success-pdf"
                              ? "El deck abrió en una pestaña nueva."
                              : "Tres rutas — la primera es la mejor calidad."}
                    </p>
                </header>

                <div className="px-6 pb-5 space-y-3">
                    {phase.kind === "success-autofill" && (
                        <div className="space-y-1.5">
                            {phase.results.map((r) => (
                                <SlideResultRow key={r.slideIndex} r={r} />
                            ))}
                        </div>
                    )}

                    {phase.kind === "success-pdf" && (
                        <a
                            href={phase.editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center h-10 leading-10 rounded-lg bg-[#0a0a0a] text-white text-[13px] font-semibold hover:brightness-110"
                        >
                            Abrir de nuevo en Canva
                        </a>
                    )}

                    {phase.kind !== "success-autofill" && phase.kind !== "success-pdf" && (
                        <>
                            {/* TIER 1 — Brand Templates Autofill (la mejor calidad) */}
                            {autofillAvailable && (
                                <OptionCard
                                    title="Generar con tus templates de Canva"
                                    hint={`${autofill?.configured} ${autofill?.configured === 1 ? "template" : "templates"} listos · 10/10 fidelidad`}
                                    description="Cada slide se rellena en Canva usando los Brand Templates que diseñaste. Resultado: tu mano de diseño exacta, con el contenido del cliente."
                                    cta={
                                        phase.kind === "autofilling"
                                            ? `Rellenando · ${phase.done}/${phase.total}`
                                            : oauth?.connected
                                              ? "Generar en Canva"
                                              : "Conectar Canva y generar"
                                    }
                                    disabled={busy}
                                    onClick={runAutofill}
                                    primary
                                    accent
                                />
                            )}

                            {/* TIER 2 — PDF import (OAuth, no templates) */}
                            {oauthAvailable && !autofillAvailable && (
                                <OptionCard
                                    title="Importar PDF a Canva"
                                    hint="OAuth · fidelidad media"
                                    description="Renderizamos el deck como PDF y lo subimos a Canva. Útil mientras Juan Diego termina los Brand Templates."
                                    cta={
                                        phase.kind === "rendering-server"
                                            ? "Preparando PDF…"
                                            : phase.kind === "importing"
                                              ? "Subiendo a Canva…"
                                              : oauth?.connected
                                                ? "Abrir en Canva"
                                                : "Conectar Canva y abrir"
                                    }
                                    disabled={busy}
                                    onClick={runPdfImport}
                                    primary
                                />
                            )}

                            {/* TIER 3 — manual PDF + drag */}
                            <OptionCard
                                title="Descargar PDF y arrastrar a Canva"
                                hint="Sin login · disponible siempre"
                                description="Descarga el PDF, abrimos Canva en otra pestaña — arrastra el PDF y listo."
                                cta={
                                    phase.kind === "exporting-pdf"
                                        ? `Generando PDF · ${phase.current}/${phase.total}`
                                        : "Descargar PDF y abrir Canva"
                                }
                                disabled={busy}
                                onClick={runManual}
                                primary={!oauthAvailable && !autofillAvailable}
                            />
                        </>
                    )}

                    {phase.kind === "error" && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-[12px] text-red-700 whitespace-pre-wrap">
                            {phase.message}
                        </div>
                    )}
                </div>

                {!autofillAvailable && phase.kind !== "success-autofill" && phase.kind !== "success-pdf" && (
                    <footer className="px-6 py-3 bg-[#fafafa] border-t border-black/[0.06] text-[11px] text-[#737373] leading-[1.5]">
                        <strong className="text-[#525252]">¿Querés calidad 10/10?</strong>{" "}
                        Pide a Juan Diego que termine los Brand Templates de Canva. Cada
                        template configurado activa la opción &ldquo;Generar con tus
                        templates&rdquo; arriba. Doc:{" "}
                        <code className="text-[10.5px] px-1 py-0.5 rounded bg-black/[0.04]">
                            CANVA_TEMPLATES_SPEC.md
                        </code>
                    </footer>
                )}

                {oauthAvailable && phase.kind !== "success-autofill" && phase.kind !== "success-pdf" && (
                    <CanvaUrlHint url={CANVA_IMPORT_URL} connected={oauth?.connected ?? false} />
                )}

                <button
                    onClick={onClose}
                    disabled={busy}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-black/[0.06] flex items-center justify-center text-[#737373] disabled:opacity-40"
                    aria-label="Cerrar"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

function SlideResultRow({ r }: { r: AutofillSlideResult }) {
    if (r.kind === "success") {
        return (
            <a
                href={r.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-black/[0.06] hover:border-black/[0.2] hover:bg-black/[0.015] transition-[border-color,background] duration-150"
            >
                <div className="shrink-0 w-7 h-7 rounded-md bg-[#0a0a0a] text-[#E9FF7B] flex items-center justify-center text-[11px] font-semibold tabular-nums">
                    {String(r.slideIndex + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium text-[#0a0a0a] tracking-[-0.005em]">
                        {r.slideType}
                    </div>
                    <div className="text-[11px] text-[#737373] truncate">{r.editUrl}</div>
                </div>
                <span className="text-[11px] text-[#0a0a0a] font-semibold">Abrir →</span>
            </a>
        );
    }
    if (r.kind === "fallback") {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#fafafa] border border-black/[0.04]">
                <div className="shrink-0 w-7 h-7 rounded-md bg-black/[0.06] text-[#737373] flex items-center justify-center text-[11px] font-semibold tabular-nums">
                    {String(r.slideIndex + 1).padStart(2, "0")}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[#525252]">{r.slideType}</div>
                    <div className="text-[10.5px] text-[#a3a3a3]">
                        Sin template — usá el PDF/PPT export
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="shrink-0 w-7 h-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center text-[11px] font-semibold tabular-nums">
                {String(r.slideIndex + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[12px] text-red-800">{r.slideType}</div>
                <div className="text-[10.5px] text-red-600 truncate">
                    {r.reason ?? "Falló"}
                </div>
            </div>
        </div>
    );
}

function OptionCard({
    title,
    hint,
    description,
    cta,
    onClick,
    disabled,
    primary,
    accent,
}: {
    title: string;
    hint?: string;
    description: string;
    cta: string;
    onClick: () => void;
    disabled: boolean;
    primary: boolean;
    accent?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full text-left rounded-xl border p-4 transition-[border-color,box-shadow,opacity] duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
                accent
                    ? "border-[#0a0a0a]/30 hover:border-[#0a0a0a] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(0,0,0,0.08)]"
                    : primary
                      ? "border-[#0a0a0a]/20 hover:border-[#0a0a0a]/60 bg-white"
                      : "border-black/[0.08] hover:border-black/[0.2] bg-white"
            }`}
        >
            <div className="flex items-start justify-between mb-1.5">
                <div className="text-[13.5px] font-semibold text-[#0a0a0a] tracking-[-0.005em]">
                    {title}
                </div>
                {hint && (
                    <span
                        className={`text-[10.5px] px-1.5 py-0.5 rounded font-medium ${
                            accent
                                ? "bg-[#E9FF7B] text-[#0a0a0a]"
                                : "bg-[#0a0a0a]/[0.06] text-[#525252]"
                        }`}
                    >
                        {hint}
                    </span>
                )}
            </div>
            <p className="text-[12px] text-[#737373] leading-[1.45] mb-3">
                {description}
            </p>
            <div
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[-0.005em] ${
                    primary ? "text-[#0a0a0a]" : "text-[#525252]"
                }`}
            >
                {cta}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </button>
    );
}

function CanvaLogo() {
    return (
        <svg width="14" height="14" viewBox="0 0 100 100" aria-hidden>
            <defs>
                <linearGradient id="cg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00c4cc" />
                    <stop offset="100%" stopColor="#7d2ae8" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#cg)" />
            <path
                d="M34.5 44.5c0-8 5-13 12-13 6 0 10 4 11 10h-7c-.5-2-2-4-4-4-3 0-5 3-5 7s2 7 5 7c2 0 3.5-1.5 4-4h7c-1 6-5 10-11 10-7 0-12-5-12-13z"
                fill="#fff"
            />
        </svg>
    );
}

function CanvaUrlHint({ url, connected }: { url: string; connected: boolean }) {
    return (
        <footer className="px-6 py-3 bg-[#fafafa] border-t border-black/[0.06] text-[11px] text-[#737373] leading-[1.45] flex items-center justify-between gap-3">
            <span>
                {connected ? (
                    <>
                        Canva conectado.{" "}
                        <form
                            method="POST"
                            action="/api/canva/disconnect"
                            className="inline"
                        >
                            <button
                                type="submit"
                                className="underline underline-offset-2 hover:text-[#525252]"
                            >
                                Desconectar
                            </button>
                        </form>
                    </>
                ) : (
                    <>Aún no conectado a Canva.</>
                )}
            </span>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#737373] hover:text-[#0a0a0a] underline underline-offset-2"
            >
                Abrir Canva
            </a>
        </footer>
    );
}
