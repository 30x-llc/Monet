"use client";

import { useState } from "react";
import type { Deck } from "@/lib/slide-types";

/**
 * Polish button — runs the vision-critique loop on the current deck.
 *
 * Hits /api/critique. Server renders each slide via puppeteer, sends
 * screenshots + reference 30x decks to Claude Opus with vision, gets
 * structured edits back, applies them, returns the polished deck.
 *
 * UX: button shows progress states ("Renderizando…" → "Analizando…"
 * → "Aplicando edits"). On success, a toast appears with the summary
 * and edit count. The polished deck replaces the current deck via
 * onDeckChange.
 */

interface PolishButtonProps {
    deck: Deck;
    onDeckChange: (next: Deck) => void;
}

type Phase =
    | { kind: "idle" }
    | { kind: "running"; label: string }
    | { kind: "success"; summary: string; editCount: number }
    | { kind: "error"; message: string };

export function PolishButton({ deck, onDeckChange }: PolishButtonProps) {
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });

    const run = async () => {
        setPhase({ kind: "running", label: "Renderizando slides…" });
        try {
            // The server does render → vision → apply atomically. We
            // can't easily stream stages; show the most representative
            // label after a small delay so it doesn't flash.
            const t0 = Date.now();
            const tickTimer = setTimeout(() => {
                setPhase({
                    kind: "running",
                    label: "Claude analizando con vision…",
                });
            }, 5000);
            const tick2 = setTimeout(() => {
                setPhase({ kind: "running", label: "Aplicando mejoras…" });
            }, 25_000);

            const res = await fetch("/api/critique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deck),
            });
            clearTimeout(tickTimer);
            clearTimeout(tick2);

            const data = (await res.json()) as
                | { ok: true; deck: Deck; summary: string; edits: unknown[] }
                | { ok: false; error: string };
            if (!("ok" in data) || !data.ok) {
                setPhase({
                    kind: "error",
                    message: ("error" in data && data.error) || "Critique falló",
                });
                return;
            }
            console.log("[polish] done in", Date.now() - t0, "ms", {
                editCount: data.edits.length,
            });
            onDeckChange(data.deck);
            setPhase({
                kind: "success",
                summary: data.summary,
                editCount: data.edits.length,
            });
            // Auto-dismiss the success toast after 6s.
            setTimeout(() => {
                setPhase((p) => (p.kind === "success" ? { kind: "idle" } : p));
            }, 6000);
        } catch (err) {
            setPhase({ kind: "error", message: String(err) });
        }
    };

    const busy = phase.kind === "running";

    return (
        <>
            <button
                onClick={run}
                disabled={busy}
                title="Pulir con Claude vision: render → critique → apply"
                className="h-7 px-2.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-[background,color,opacity] duration-150 text-[var(--chrome-fg-4)] hover:text-[var(--chrome-fg)] hover:bg-[var(--chrome-hover-bg)] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
                {busy ? (
                    <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                    <SparkIcon />
                )}
                {busy ? phase.label : "Pulir"}
            </button>

            {phase.kind === "success" && (
                <Toast
                    tone="success"
                    title={`${phase.editCount} ${phase.editCount === 1 ? "edit aplicado" : "edits aplicados"}`}
                    body={phase.summary}
                    onClose={() => setPhase({ kind: "idle" })}
                />
            )}
            {phase.kind === "error" && (
                <Toast
                    tone="error"
                    title="Polish falló"
                    body={phase.message}
                    onClose={() => setPhase({ kind: "idle" })}
                />
            )}
        </>
    );
}

function SparkIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
                d="M8 1.5l1.7 4.5 4.5 1.5-4.5 1.5L8 13.5 6.3 9 1.8 7.5 6.3 6 8 1.5z"
                fill="currentColor"
            />
        </svg>
    );
}

function Toast({
    tone,
    title,
    body,
    onClose,
}: {
    tone: "success" | "error";
    title: string;
    body: string;
    onClose: () => void;
}) {
    return (
        <div className="fixed bottom-6 right-6 z-[200] w-[380px] max-w-[90vw] rounded-xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.06] overflow-hidden">
            <div
                className={`px-4 py-3 ${tone === "success" ? "bg-[#0a0a0a] text-white" : "bg-red-50 text-red-800"}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-[12px] font-semibold tracking-[-0.005em]">
                            {title}
                        </div>
                        <div
                            className={`text-[11.5px] mt-0.5 leading-[1.4] ${tone === "success" ? "text-white/70" : "text-red-700"}`}
                        >
                            {body}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`shrink-0 w-5 h-5 rounded text-[14px] leading-none flex items-center justify-center ${tone === "success" ? "text-white/50 hover:text-white" : "text-red-500 hover:text-red-700"}`}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}
