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
    const [intakeHome, setIntakeHome] = useState<{
        clientName?: string;
        topic?: string;
        programId?: string;
        corporateMode?: boolean;
        prototypeKind?: "app" | "landing" | "component";
        docKind?: "proposal" | "contract" | "one-pager" | "other";
    } | undefined>(undefined);
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
                    setGenerationLog("Investigando la empresa…");
                    const researchRes = await fetch("/api/research", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            companyName: effectiveClientName,
                            notes: [
                                intake?.objective ? `Objetivo: ${intake.objective}` : "",
                                intake?.sector ? `Sector: ${intake.sector}` : "",
                                intake?.companySize ? `Tamaño: ${intake.companySize}` : "",
                                seed?.notes ? `Notas: ${seed.notes}` : "",
                                seed?.emailThread ? `Emails: ${seed.emailThread}` : "",
                            ]
                                .filter(Boolean)
                                .join("\n"),
                        }),
                    });
                    const researchData = await researchRes.json().catch(() => ({
                        ok: false,
                        error: `Research devolvió HTTP ${researchRes.status} sin JSON`,
                    }));
                    if (!researchData.ok || !researchData.research) {
                        throw new Error(
                            `Research falló: ${researchData.error || `HTTP ${researchRes.status}`}`,
                        );
                    }
                    research = researchData.research;
                    setGenerationLog(
                        `Research listo para ${research.companyName}. Industria: ${research.industry}.`,
                    );
                }

                const slideCount =
                    format === "proposal" ? (corporateMode ? 9 : 5) :
                    format === "carousel-ig" ? 7 :
                    format === "story-ig" ? 4 :
                    format === "prototype" ? 1 :
                    format === "other" ? 5 :
                    /* doc */ 5;

                setGenerationLog(
                    `${research ? `Research de ${research.companyName} listo. ` : ""}Generando el deck con Claude Opus 4.7…`,
                );

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
                const genData = await genRes.json().catch(() => ({
                    ok: false,
                    error: `Generate devolvió HTTP ${genRes.status} sin JSON`,
                }));
                if (!genData.ok || !genData.deck) {
                    throw new Error(
                        `Generate falló: ${genData.error || `HTTP ${genRes.status}`}`,
                    );
                }

                const generatedDeck: Deck = genData.deck;
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
            const themeDefault: "dark" | "light" =
                result.format === "doc" ? "light" : "dark";
            await runGeneration({
                format: result.format,
                intake: result.intake,
                programId: result.programId,
                corporateMode: result.corporateMode,
                seed: result.seed,
                topic: result.intake.topic,
                clientName: result.intake.clientName,
                theme: result.intake.theme ?? themeDefault,
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

    const handleOpenIntake = useCallback(
        (
            format: ProjectFormat,
            home?: {
                clientName?: string;
                topic?: string;
                programId?: string;
                corporateMode?: boolean;
                prototypeKind?: "app" | "landing" | "component";
                docKind?: "proposal" | "contract" | "one-pager" | "other";
            },
        ) => {
            setIntakeFormat(format);
            setIntakeHome(home);
            setView("intake");
        },
        [],
    );

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
        return (
            <GuidedIntake
                onComplete={handleGenerateFromIntake}
                onCancel={handleNewDeck}
                format={intakeFormat}
                home={intakeHome}
            />
        );
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
