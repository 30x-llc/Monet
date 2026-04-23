"use client";

import { useState, useCallback, useEffect } from "react";
import type { Deck, IntakeAnswers, ProjectFormat } from "@/lib/slide-types";
import { EditorLayout } from "@/components/editor/editor-layout";
import { HomeView, type CreateArgs } from "@/components/app/home-view";
import { GuidedIntake, type IntakeResult } from "@/components/app/guided-intake";
import { saveDeck, getRecentDecks, getDeckById, deleteDeck, type StoredDeck } from "@/lib/deck-storage";
import { getTemplateById } from "@/lib/templates";

type AppView = "home" | "intake" | "generating" | "editor";

export default function Home() {
    const [view, setView] = useState<AppView>("home");
    const [deck, setDeck] = useState<Deck | null>(null);
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [isIterating, setIsIterating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLog, setGenerationLog] = useState("");
    const [recentDecks, setRecentDecks] = useState<StoredDeck[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [intakeFormat, setIntakeFormat] = useState<ProjectFormat>("proposal");
    const [generationError, setGenerationError] = useState<string | null>(null);

    useEffect(() => {
        setRecentDecks(getRecentDecks(50));
    }, [refreshKey]);

    const runGeneration = useCallback(
        async (args: {
            format: ProjectFormat;
            intake?: IntakeAnswers;
            programId?: string;
            corporateMode?: boolean;
            theme?: "dark" | "light";
            topic?: string;
            seed?: { notes?: string; audioTranscript?: string; emailThread?: string };
            clientName?: string;
        }) => {
            setView("generating");
            setIsGenerating(true);
            setGenerationLog("");
            setGenerationError(null);

            const { format, intake, programId, corporateMode, topic, seed, clientName, theme } = args;
            const effectiveClientName = intake?.clientName || clientName || "30X";
            const isProposal = format === "proposal";

            try {
                let research = null;

                // Research only for proposals
                if (isProposal) {
                    const researchRes = await fetch("/api/research", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            companyName: effectiveClientName,
                            notes: [
                                intake?.objective ? `Objetivo: ${intake.objective}` : "",
                                intake?.sector ? `Sector: ${intake.sector}` : "",
                                intake?.companySize ? `Tamaño: ${intake.companySize}` : "",
                                intake?.decisionMaker ? `Decision maker: ${intake.decisionMaker}` : "",
                                seed?.notes ? `Notas: ${seed.notes}` : "",
                                seed?.emailThread ? `Emails: ${seed.emailThread}` : "",
                            ]
                                .filter(Boolean)
                                .join("\n"),
                        }),
                    });
                    if (!researchRes.ok) {
                        const body = await researchRes.text().catch(() => "");
                        throw new Error(
                            `Research falló (HTTP ${researchRes.status}). ${body.slice(0, 200)}`,
                        );
                    }
                    const reader = researchRes.body?.getReader();
                    if (!reader) throw new Error("Research no devolvió un stream legible");
                    const decoder = new TextDecoder();
                    let researchText = "";
                    let researchStreamError: string | null = null;
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        for (const line of chunk.split("\n\n").filter(Boolean)) {
                            if (!line.startsWith("data: ")) continue;
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.type === "text") {
                                    researchText += data.content;
                                    setGenerationLog(researchText);
                                } else if (data.type === "error") {
                                    researchStreamError = String(data.content ?? "Error desconocido");
                                }
                            } catch {}
                        }
                    }
                    if (researchStreamError) {
                        throw new Error(`Research falló durante el stream: ${researchStreamError}`);
                    }
                    const researchJson = researchText.match(/\{[\s\S]*\}/)?.[0];
                    research = researchJson
                        ? JSON.parse(researchJson)
                        : {
                              companyName: effectiveClientName,
                              industry: intake?.sector ?? "",
                              size: intake?.companySize ?? "",
                              headquarters: "",
                              leadership: [],
                              painPoints: [],
                              recentNews: [],
                              relevantContext: intake?.objective ?? "",
                          };
                }

                const slideCount =
                    format === "proposal" ? (corporateMode ? 9 : 5) :
                    format === "carousel-ig" ? 7 :
                    format === "story-ig" ? 4 :
                    /* doc */ 5;

                const genRes = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        format,
                        research,
                        program: programId,
                        slideCount,
                        notes: seed?.notes || intake?.notes,
                        intake,
                        corporateMode,
                        topic,
                    }),
                });
                if (!genRes.ok) {
                    const body = await genRes.text().catch(() => "");
                    throw new Error(
                        `Generate falló (HTTP ${genRes.status}). ${body.slice(0, 300)}`,
                    );
                }

                const genReader = genRes.body?.getReader();
                if (!genReader) throw new Error("Generate no devolvió un stream legible");
                const decoder = new TextDecoder();
                let genText = "";
                let genStreamError: string | null = null;
                while (true) {
                    const { done, value } = await genReader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split("\n\n").filter(Boolean)) {
                        if (!line.startsWith("data: ")) continue;
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === "text") {
                                genText += data.content;
                                setGenerationLog(genText);
                            } else if (data.type === "error") {
                                genStreamError = String(data.content ?? "Error desconocido");
                            }
                        } catch {}
                    }
                }
                if (genStreamError) {
                    throw new Error(`Claude rechazó la generación: ${genStreamError}`);
                }

                const jsonMatch = genText.match(/\{[\s\S]*"slides"[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error(
                        `El modelo no devolvió un deck válido. Salida (primeros 400 char): ${genText.slice(0, 400) || "(vacía)"}`,
                    );
                }
                const generatedDeck: Deck = JSON.parse(jsonMatch[0]);
                generatedDeck.generatedAt = new Date().toISOString();
                generatedDeck.theme = theme || generatedDeck.theme || "dark";
                generatedDeck.format = format;

                const id = saveDeck(generatedDeck);
                setCurrentDeckId(id);
                setDeck(generatedDeck);
                setView("editor");
                setRefreshKey((k) => k + 1);
            } catch (err) {
                console.error("[generation]", err);
                const message = err instanceof Error ? err.message : String(err);
                setGenerationError(message);
                // Stay on the generating view so the user sees the error
                // and can retry or go back; never silently bounce to home.
            } finally {
                setIsGenerating(false);
            }
        },
        [],
    );

    const handleGenerateFromIntake = useCallback(
        async (result: IntakeResult) => {
            await runGeneration({
                format: "proposal",
                intake: result.intake,
                programId: result.programId,
                corporateMode: result.corporateMode,
                seed: result.seed,
            });
        },
        [runGeneration],
    );

    const handleCreateDirect = useCallback(
        async (args: CreateArgs) => {
            const intake: IntakeAnswers | undefined =
                args.format === "proposal" ? { clientName: args.clientName } : undefined;
            await runGeneration({
                format: args.format,
                intake,
                programId: args.programId || undefined,
                corporateMode: args.corporateMode,
                theme: args.theme,
                topic: args.topic,
                clientName: args.clientName,
            });
        },
        [runGeneration],
    );

    const handleOpenDeck = useCallback((id: string) => {
        const stored = getDeckById(id);
        if (stored) {
            setDeck(stored.deck);
            setCurrentDeckId(id);
            setView("editor");
        }
    }, []);

    const handleDeleteDeck = useCallback((id: string) => {
        deleteDeck(id);
        setRefreshKey((k) => k + 1);
    }, []);

    const handleOpenTemplate = useCallback((templateId: string) => {
        const template = getTemplateById(templateId);
        if (template) {
            const cloned: Deck = { ...template.deck, generatedAt: new Date().toISOString() };
            const id = saveDeck(cloned);
            setDeck(cloned);
            setCurrentDeckId(id);
            setView("editor");
            setRefreshKey((k) => k + 1);
        }
    }, []);

    const handleDeckChange = useCallback(
        (newDeck: Deck) => {
            setDeck(newDeck);
            if (currentDeckId) saveDeck(newDeck, currentDeckId);
            setRefreshKey((k) => k + 1);
        },
        [currentDeckId],
    );

    const handleIterate = useCallback(
        async (instruction: string) => {
            if (!deck) return;
            setIsIterating(true);
            try {
                const res = await fetch("/api/iterate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deck, instruction }),
                });
                const data = await res.json();
                if (data.ok && data.deck) {
                    handleDeckChange(data.deck);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsIterating(false);
            }
        },
        [deck, handleDeckChange],
    );

    const handleDownload = useCallback(async () => {
        if (!deck) return;
        setIsDownloading(true);
        try {
            const res = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deck),
            });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `30x-${deck.companyName.toLowerCase().replace(/\s+/g, "-")}-${deck.programName.toLowerCase()}.pptx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setIsDownloading(false);
        }
    }, [deck]);

    const handleNewDeck = useCallback(() => {
        setView("home");
        setDeck(null);
        setCurrentDeckId(null);
    }, []);

    const handleOpenIntake = useCallback((format: ProjectFormat) => {
        setIntakeFormat(format);
        setView("intake");
    }, []);

    // ── Editor view ──
    if (view === "editor" && deck) {
        return (
            <EditorLayout
                deck={deck}
                onDeckChange={handleDeckChange}
                onIterate={handleIterate}
                onDownload={handleDownload}
                onNewDeck={handleNewDeck}
                isIterating={isIterating}
                isDownloading={isDownloading}
            />
        );
    }

    // ── Guided intake ──
    if (view === "intake") {
        return <GuidedIntake onComplete={handleGenerateFromIntake} onCancel={handleNewDeck} />;
    }

    // ── Generating ──
    if (view === "generating" || isGenerating) {
        const hasError = generationError !== null;
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <div className="w-full max-w-[640px] px-6 text-center">
                    <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
                            hasError
                                ? "bg-red-50 border-red-200"
                                : "bg-black/[0.04] border-black/[0.06]"
                        }`}
                    >
                        <div
                            className={`w-1.5 h-1.5 rounded-full ${
                                hasError ? "bg-red-500" : "bg-[#E9FF7B] animate-pulse"
                            }`}
                        />
                        <span
                            className={`text-[11px] font-medium tracking-[-0.005em] ${
                                hasError ? "text-red-700" : "text-[#0a0a0a]"
                            }`}
                        >
                            {hasError ? "La generación falló" : "Generando con Claude Opus 4.7"}
                        </span>
                    </div>
                    <h2 className="text-[28px] font-semibold text-[#0a0a0a] tracking-[-0.03em] mb-2">
                        {hasError ? "Algo salió mal" : "Construyendo tu diseño"}
                    </h2>
                    <p className="text-[13px] text-[#737373] mb-8">
                        {hasError
                            ? "Revisa el detalle abajo. Puedes volver al home y reintentar."
                            : "Estructurando el proyecto…"}
                    </p>
                    {hasError ? (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-4 text-[12px] text-red-800 text-left whitespace-pre-wrap break-words">
                            {generationError}
                        </div>
                    ) : null}
                    <div className="rounded-xl bg-[#fafafa] border border-black/[0.06] p-4 h-[260px] overflow-y-auto text-[11px] text-[#525252] text-left whitespace-pre-wrap scrollbar-hide">
                        {generationLog || (hasError ? "(sin salida del modelo)" : "Conectando…")}
                    </div>
                    {hasError ? (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                onClick={() => {
                                    setGenerationError(null);
                                    setGenerationLog("");
                                    setView("home");
                                }}
                                className="h-9 px-4 rounded-md text-[12px] font-semibold text-[#0a0a0a] border border-black/15 bg-white hover:bg-black/[0.04] transition-colors"
                            >
                                Volver al home
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    // ── Home ──
    return (
        <HomeView
            recentDecks={recentDecks}
            onOpenDeck={handleOpenDeck}
            onDeleteDeck={handleDeleteDeck}
            onOpenTemplate={handleOpenTemplate}
            onCreateNew={handleCreateDirect}
            onOpenIntake={handleOpenIntake}
        />
    );
}
