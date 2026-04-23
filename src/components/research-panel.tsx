"use client";

import { useEffect, useRef, useState } from "react";
import type { ResearchResult } from "@/lib/slide-types";
import { Button30x } from "@/components/30x/button-30x";
import { Button } from "@/components/base/buttons/button";

export function ResearchPanel({
    companyName,
    notes,
    onComplete,
}: {
    companyName: string;
    notes: string;
    onComplete: (research: ResearchResult) => void;
}) {
    const [streamText, setStreamText] = useState("");
    const [status, setStatus] = useState<"researching" | "done" | "error">(
        "researching",
    );
    const [parsedResearch, setParsedResearch] = useState<ResearchResult | null>(
        null,
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;

        async function runResearch() {
            try {
                const res = await fetch("/api/research", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ companyName, notes }),
                });

                if (!res.ok) throw new Error("Error en la investigacion");

                const reader = res.body?.getReader();
                if (!reader) throw new Error("No stream");

                const decoder = new TextDecoder();
                let fullText = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n\n").filter(Boolean);

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === "text") {
                                fullText += data.content;
                                setStreamText(fullText);
                            } else if (data.type === "done") {
                                const jsonMatch = fullText.match(
                                    /\{[\s\S]*"companyName"[\s\S]*\}/,
                                );
                                if (jsonMatch) {
                                    const research: ResearchResult = JSON.parse(
                                        jsonMatch[0],
                                    );
                                    setParsedResearch(research);
                                    setStatus("done");
                                } else {
                                    setStatus("error");
                                }
                            } else if (data.type === "error") {
                                setStatus("error");
                            }
                        } catch {
                            // skip
                        }
                    }
                }

                if (status === "researching") {
                    const jsonMatch = fullText.match(
                        /\{[\s\S]*"companyName"[\s\S]*\}/,
                    );
                    if (jsonMatch) {
                        const research: ResearchResult = JSON.parse(
                            jsonMatch[0],
                        );
                        setParsedResearch(research);
                        setStatus("done");
                    }
                }
            } catch (error) {
                console.error(error);
                setStatus("error");
            }
        }

        runResearch();
    }, [companyName, notes]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [streamText]);

    return (
        <div className="w-full">
            <h2 className="text-display-xs font-semibold tracking-tight text-primary mb-1">
                Investigando{" "}
                <span className="text-brand-600">{companyName}</span>
            </h2>
            <p className="text-tertiary text-sm mb-6">
                {status === "researching" &&
                    "Buscando informacion actualizada..."}
                {status === "done" && "Investigacion completa."}
                {status === "error" &&
                    "Error en la investigacion. Intenta de nuevo."}
            </p>

            {/* Terminal */}
            <div
                ref={containerRef}
                className="bg-secondary rounded-xl p-5 h-[260px] overflow-y-auto font-mono text-xs text-tertiary whitespace-pre-wrap mb-6 shadow-xs ring-1 ring-primary ring-inset scrollbar-hide"
            >
                {streamText || "Iniciando investigacion..."}
            </div>

            {/* Research summary */}
            {parsedResearch && (
                <div className="rounded-xl ring-1 ring-primary ring-inset shadow-xs overflow-hidden mb-6">
                    <div className="p-5 border-b border-secondary">
                        <h3 className="text-lg font-semibold text-primary">
                            {parsedResearch.companyName}
                        </h3>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-secondary">
                        <div className="p-4">
                            <span className="text-xs text-quaternary block mb-1">
                                Industria
                            </span>
                            <span className="text-sm font-medium text-primary">
                                {parsedResearch.industry}
                            </span>
                        </div>
                        <div className="p-4">
                            <span className="text-xs text-quaternary block mb-1">
                                Tamano
                            </span>
                            <span className="text-sm font-medium text-primary">
                                {parsedResearch.size}
                            </span>
                        </div>
                        <div className="p-4">
                            <span className="text-xs text-quaternary block mb-1">
                                Sede
                            </span>
                            <span className="text-sm font-medium text-primary">
                                {parsedResearch.headquarters}
                            </span>
                        </div>
                    </div>
                    {parsedResearch.painPoints.length > 0 && (
                        <div className="p-5 border-t border-secondary">
                            <span className="text-xs text-quaternary block mb-3">
                                Pain points identificados
                            </span>
                            <ul className="space-y-2">
                                {parsedResearch.painPoints.map((p, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-secondary"
                                    >
                                        <span className="text-brand-500 mt-0.5">
                                            &bull;
                                        </span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {status === "done" && parsedResearch && (
                    <Button30x
                        variant="accent"
                        onClick={() => onComplete(parsedResearch)}
                    >
                        Generar Deck
                    </Button30x>
                )}
                {status === "error" && (
                    <Button
                        size="md"
                        color="secondary"
                        onClick={() => window.location.reload()}
                    >
                        Reintentar
                    </Button>
                )}
            </div>
        </div>
    );
}
