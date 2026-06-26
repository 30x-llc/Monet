"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Phase = "researching" | "generating";

interface Props {
    phase: Phase;
    clientName?: string;
    error?: string | null;
    onCancel: () => void;
}

/** Per-phase step scripts. The labels track what the backend actually does
 *  (research grounding → deck generation → web-scraping logo/banner/photos),
 *  so the choreography reflects real work, not a fake spinner. `stepMs` paces
 *  the advance; the LAST step is held (pulsing) until generation finishes. */
function buildSteps(phase: Phase, client: string): { steps: string[]; stepMs: number; title: string } {
    if (phase === "researching") {
        return {
            title: `Investigando a ${client}`,
            stepMs: 8500,
            steps: [
                "Conectando con la web",
                `Buscando a ${client} en internet`,
                "Leyendo liderazgo, noticias y contexto",
                "Detectando dolores y oportunidades",
                "Sintetizando el brief comercial",
            ],
        };
    }
    return {
        title: "Diseñando tu propuesta",
        stepMs: 19000,
        steps: [
            "Estructurando la propuesta",
            "Redactando con la voz de 30X",
            `Buscando el logo de ${client}`,
            "Buscando un banner de la empresa",
            "Buscando fotos del equipo",
            "Puliendo el diseño final",
        ],
    };
}

function CheckIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function GenerationLoader({ phase, clientName, error, onCancel }: Props) {
    const client = clientName?.trim() || "la empresa";
    const { steps, stepMs, title } = buildSteps(phase, client);

    const [active, setActive] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(Date.now());

    // Advance steps on a timeline; hold the final step (never auto-complete).
    useEffect(() => {
        if (error) return;
        const id = setInterval(() => {
            setActive((i) => Math.min(i + 1, steps.length - 1));
        }, stepMs);
        return () => clearInterval(id);
    }, [error, stepMs, steps.length]);

    // Elapsed timer.
    useEffect(() => {
        if (error) return;
        startRef.current = Date.now();
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [error, phase]);

    const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
    // Cap at 95% so it never reads "done" before the deck actually arrives.
    const progress = Math.min(95, ((active + 0.85) / steps.length) * 100);

    if (error) {
        return (
            <div className="flex h-screen bg-[#fafafa] items-center justify-center">
                <div className="w-full max-w-[460px] px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-red-50 border-red-200 mb-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[11px] font-medium text-red-700">La generación falló</span>
                    </div>
                    <h2 className="text-[26px] font-semibold text-[#0a0a0a] tracking-[-0.03em] mb-2">
                        Algo salió mal
                    </h2>
                    <p className="text-[13px] text-[#737373] mb-4">
                        Revisa el detalle y vuelve a intentar.
                    </p>
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-5 text-[12px] text-red-800 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                        {error}
                    </div>
                    <button
                        onClick={onCancel}
                        className="h-9 px-4 rounded-md text-[12px] font-semibold text-[#0a0a0a] border border-black/15 bg-white hover:bg-black/[0.04] transition-colors"
                    >
                        Volver al home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#fafafa] items-center justify-center overflow-hidden">
            {/* soft animated backdrop */}
            <motion.div
                aria-hidden
                className="absolute w-[640px] h-[640px] rounded-full blur-[120px] bg-[#E9FF7B]/25"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative w-full max-w-[500px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-black/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.03)] mb-6">
                        <motion.span
                            className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                        />
                        <span className="text-[11px] font-medium tracking-[-0.005em] text-[#525252]">
                            Gemini 2.5 Pro · Vertex
                        </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-1.5">
                        <h2 className="text-[30px] font-semibold text-[#0a0a0a] tracking-[-0.035em] leading-tight">
                            {title}
                        </h2>
                        <span className="text-[12px] tabular-nums text-[#a3a3a3] shrink-0 pl-3">{mmss}</span>
                    </div>
                    <p className="text-[13px] text-[#737373] mb-6">
                        Esto toma 1-3 minutos. Estamos haciendo el trabajo pesado por ti.
                    </p>

                    {/* progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden mb-7">
                        <motion.div
                            className="h-full rounded-full bg-[#E9FF7B]"
                            initial={{ width: "4%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>

                    {/* steps */}
                    <div className="space-y-1">
                        {steps.map((label, i) => {
                            const done = i < active;
                            const isActive = i === active;
                            return (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: done || isActive ? 1 : 0.4, x: 0 }}
                                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                                    className="flex items-center gap-3 py-1.5"
                                >
                                    <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
                                        {done ? (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                                className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E9FF7B]"
                                            >
                                                <CheckIcon />
                                            </motion.span>
                                        ) : isActive ? (
                                            <motion.span
                                                className="w-4 h-4 rounded-full border-2 border-[#0a0a0a]/15 border-t-[#0a0a0a]"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                                        )}
                                    </span>
                                    <span
                                        className={`text-[13.5px] tracking-[-0.01em] ${
                                            isActive
                                                ? "text-[#0a0a0a] font-medium"
                                                : done
                                                  ? "text-[#525252]"
                                                  : "text-[#a3a3a3]"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onCancel}
                            className="h-9 px-4 rounded-md text-[12px] font-medium text-[#737373] border border-black/[0.08] bg-white hover:bg-black/[0.03] hover:text-[#0a0a0a] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
