"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
    Deck,
    IntakeAnswers,
    ProjectFormat,
    ResearchResult,
} from "@/lib/slide-types";
import { EditorLayout } from "@/components/editor/editor-layout";
import { HomeView, type CreateArgs } from "@/components/app/home-view";
import { GuidedIntake, type IntakeResult } from "@/components/app/guided-intake";
import { ResearchReview } from "@/components/app/research-review";
import { saveDeck, getRecentDecks, getDeckById, deleteDeck, type StoredDeck } from "@/lib/deck-storage";
import { getTemplateById } from "@/lib/templates";

type AppView = "home" | "intake" | "researching" | "research-review" | "generating" | "editor";

// Staged generation context — we carry it between the research step
// (which calls /api/research) and the generate step (which calls
// /api/generate) with the user's edits applied.
interface PendingGeneration {
    format: ProjectFormat;
    intake?: IntakeAnswers;
    programId?: string;
    corporateMode?: boolean;
    theme?: "dark" | "light";
    topic?: string;
    seed?: { notes?: string; audioTranscript?: string; emailThread?: string };
    clientName?: string;
    research: ResearchResult;
    /** Briefing from the new ProposalForm — propagated through to
     *  /api/generate so the model has the full salesperson intel. */
    briefing?: string;
    notes?: string;
    /** Which research mode produced this payload — so the review
     *  screen can show "Exa deep research · 18 fuentes" vs the plain
     *  Claude web_search baseline. */
    researchMode?: "exa-deep" | "claude-web-search";
    sourceCount?: number;
    sourceUrls?: string[];
}

// Fetch with an explicit AbortController timeout so a stuck serverless call
// surfaces as a visible error instead of an infinite spinner. The default
// browser fetch has no time limit, so without this a hanging /api/generate
// would leave the "Construyendo tu diseño" screen frozen forever.
async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") {
            throw new Error(
                `La petición a ${url} no respondió en ${Math.round(timeoutMs / 1000)}s. Es probable que el modelo se haya atascado — reintenta.`,
            );
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

export default function Home() {
    const [view, setView] = useState<AppView>("home");
    const [deck, setDeck] = useState<Deck | null>(null);
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [isIterating, setIsIterating] = useState(false);
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
    const [pendingGen, setPendingGen] = useState<PendingGeneration | null>(null);

    // Undo/redo history for the active deck. Coalesces fast successive
    // changes (typing) into a single entry: only changes more than
    // COALESCE_MS apart push a new snapshot. Reset whenever a different
    // deck loads.
    const HISTORY_LIMIT = 100;
    const COALESCE_MS = 1000;
    const historyRef = useRef<{ undo: Deck[]; redo: Deck[]; lastChangeAt: number }>({
        undo: [],
        redo: [],
        lastChangeAt: 0,
    });
    const resetHistory = useCallback(() => {
        historyRef.current = { undo: [], redo: [], lastChangeAt: 0 };
    }, []);

    useEffect(() => {
        setRecentDecks(getRecentDecks(50));
    }, [refreshKey]);

    // Deep-link from /ops dashboard: /?open=<deckId> fetches the
    // deck server-side (so a Sales Ops user can open someone else's
    // deck even though it's not in their localStorage) and switches
    // straight into the editor.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const openId = params.get("open");
        if (!openId) return;
        // Strip the param so back/refresh doesn't re-trigger.
        params.delete("open");
        const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState(null, "", newUrl);
        // Try local first.
        const local = getDeckById(openId);
        if (local) {
            resetHistory();
            setDeck(local.deck);
            setCurrentDeckId(openId);
            setView("editor");
            return;
        }
        // Otherwise fetch from server (Sales Ops viewing someone else's).
        fetch(`/api/decks/${openId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d?.ok && d.deck?.deckJson) {
                    resetHistory();
                    setDeck(d.deck.deckJson);
                    setCurrentDeckId(openId);
                    setView("editor");
                }
            })
            .catch(() => {});
    }, []);

    // Phase 2 — user approved / edited the research in ResearchReview.
    // Calls /api/generate with the (possibly edited) research payload.
    const runGenerate = useCallback(
        async (pending: PendingGeneration, editedResearch: ResearchResult | null) => {
            setIsGenerating(true);
            setGenerationLog("Generando deck con Claude Opus 4.7…");
            setGenerationError(null);
            setView("generating");

            const { format, intake, programId, corporateMode, topic, seed, theme, briefing, notes: pendingNotes } = pending;
            const slideCount =
                format === "proposal" ? (corporateMode ? 9 : 5) :
                format === "carousel-ig" ? 7 :
                format === "story-ig" ? 4 :
                format === "prototype" ? 1 :
                format === "other" ? 5 :
                /* doc */ 7;

            // Build the generator-side notes payload too. Briefing is
            // separate from notes so the prompt can prioritize it.
            const generatorNotes = [
                briefing ? `BRIEFING DEL VENDEDOR:\n${briefing}` : "",
                pendingNotes || seed?.notes || intake?.notes || "",
            ]
                .filter(Boolean)
                .join("\n\n");

            try {
                const tg = Date.now();
                const genRes = await fetchWithTimeout(
                    "/api/generate",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            format,
                            research: editedResearch,
                            program: programId,
                            slideCount,
                            notes: generatorNotes,
                            intake,
                            corporateMode,
                            topic,
                        }),
                    },
                    180_000,
                );
                const genData = await genRes.json().catch(() => ({
                    ok: false,
                    error: `Generate devolvió HTTP ${genRes.status} sin JSON`,
                }));
                console.log("[gen] generate:done", {
                    ms: Date.now() - tg,
                    ok: genData.ok,
                    slides: genData.deck?.slides?.length,
                });
                if (!genData.ok || !genData.deck) {
                    throw new Error(
                        `Generate falló: ${genData.error || `HTTP ${genRes.status}`}`,
                    );
                }

                const generatedDeck: Deck = genData.deck;
                generatedDeck.generatedAt = new Date().toISOString();
                generatedDeck.theme = theme || generatedDeck.theme || "light";
                generatedDeck.format = format;

                const id = saveDeck(generatedDeck);
                setCurrentDeckId(id);
                resetHistory();
                setDeck(generatedDeck);
                setPendingGen(null);
                setView("editor");
                setRefreshKey((k) => k + 1);
            } catch (err) {
                console.error("[gen] failed", err);
                const message = err instanceof Error ? err.message : String(err);
                setGenerationError(message);
            } finally {
                setIsGenerating(false);
            }
        },
        [],
    );

    // Phase 1 — research OR skip straight to generate. For proposals
    // with a real client name, do web_search first, then let the user
    // edit the findings on the research-review screen. Everything else
    // goes straight to generate.
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
            /** Markdown brief from the new ProposalForm. Goes into the
             *  Exa research notes as PRIORITY context — overrides
             *  generic intake fields. */
            briefing?: string;
            /** Free-form notes from the new ProposalForm — single
             *  context box that replaces the older two boxes. */
            notes?: string;
        }) => {
            const { format, intake, programId, corporateMode, topic, seed, clientName, theme, briefing, notes: directNotes } = args;
            const effectiveClientName = intake?.clientName || clientName || "";
            const isProposal = format === "proposal";
            const shouldResearch =
                isProposal &&
                effectiveClientName &&
                effectiveClientName.trim().toLowerCase() !== "30x";

            if (!shouldResearch) {
                // No research step — straight to generation. Used for
                // non-proposal formats, speaker decks, internal 30x proposals.
                await runGenerate(
                    {
                        format,
                        intake,
                        programId,
                        corporateMode,
                        theme,
                        topic,
                        seed,
                        clientName,
                        briefing,
                        notes: directNotes,
                        // ResearchResult is required by PendingGeneration; fabricate
                        // a minimal record so the flow works without web_search.
                        research: {
                            companyName: effectiveClientName || "30X",
                            industry: intake?.sector || "",
                            size: intake?.companySize || "",
                            headquarters: "",
                            leadership: [],
                            painPoints: [],
                            recentNews: [],
                            relevantContext: intake?.objective || topic || briefing || "",
                        },
                    },
                    null,
                );
                return;
            }

            // Proposal with a real company → run research → show review.
            setView("researching");
            setIsGenerating(true);
            setGenerationLog(`Investigando ${effectiveClientName}…`);
            setGenerationError(null);
            try {
                const t0 = Date.now();
                // Build the research notes payload. Briefing (the markdown
                // brief from the new ProposalForm super-prompt flow) goes
                // first as PRIORITY context — it's the salesperson's own
                // intel and beats anything the model can find on the web.
                // Then the topic/objective/sector etc fall in below.
                const researchNotes = [
                    briefing ? `BRIEFING DEL VENDEDOR (prioritario):\n${briefing}` : "",
                    directNotes ? `NOTAS ADICIONALES:\n${directNotes}` : "",
                    topic ? `Proyecto: ${topic}` : "",
                    intake?.objective ? `Objetivo: ${intake.objective}` : "",
                    intake?.sector ? `Sector: ${intake.sector}` : "",
                    intake?.companySize ? `Tamaño: ${intake.companySize}` : "",
                    seed?.notes ? `Notas: ${seed.notes}` : "",
                    seed?.emailThread ? `Emails: ${seed.emailThread}` : "",
                ]
                    .filter(Boolean)
                    .join("\n\n");

                const researchRes = await fetchWithTimeout(
                    "/api/research",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            companyName: effectiveClientName,
                            notes: researchNotes,
                        }),
                    },
                    240_000,
                );
                const researchData = await researchRes.json().catch(() => ({
                    ok: false,
                    error: `Research devolvió HTTP ${researchRes.status} sin JSON`,
                }));
                console.log("[gen] research:done", {
                    ms: Date.now() - t0,
                    ok: researchData.ok,
                });
                if (!researchData.ok || !researchData.research) {
                    throw new Error(
                        `Research falló: ${researchData.error || `HTTP ${researchRes.status}`}`,
                    );
                }

                const research = researchData.research as ResearchResult;
                setPendingGen({
                    format,
                    intake,
                    programId,
                    corporateMode,
                    theme,
                    topic,
                    seed,
                    clientName,
                    research,
                    briefing,
                    notes: directNotes,
                    researchMode: researchData.researchMode,
                    sourceCount: researchData.sourceCount,
                    sourceUrls: researchData.sourceUrls,
                });
                setIsGenerating(false);
                setView("research-review");
            } catch (err) {
                console.error("[gen] research failed", err);
                const message = err instanceof Error ? err.message : String(err);
                setGenerationError(message);
                setIsGenerating(false);
                setView("generating"); // reuse error screen
            }
        },
        [runGenerate],
    );

    const handleGenerateFromIntake = useCallback(
        async (result: IntakeResult) => {
            // All formats default to light now (Juan Diego, Apr 2026).
            const themeDefault: "dark" | "light" = "light";
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
                briefing: args.briefing,
                notes: args.notes,
            });
        },
        [runGeneration],
    );

    const handleOpenDeck = useCallback((id: string) => {
        const stored = getDeckById(id);
        if (stored) {
            resetHistory();
            setDeck(stored.deck);
            setCurrentDeckId(id);
            setView("editor");
        }
    }, [resetHistory]);

    const handleDeleteDeck = useCallback((id: string) => {
        deleteDeck(id);
        setRefreshKey((k) => k + 1);
    }, []);

    const handleOpenTemplate = useCallback((templateId: string) => {
        const template = getTemplateById(templateId);
        if (template) {
            const cloned: Deck = { ...template.deck, generatedAt: new Date().toISOString() };
            const id = saveDeck(cloned);
            resetHistory();
            setDeck(cloned);
            setCurrentDeckId(id);
            setView("editor");
            setRefreshKey((k) => k + 1);
        }
    }, [resetHistory]);

    const handleDeckChange = useCallback(
        (newDeck: Deck) => {
            setDeck((prev) => {
                if (prev) {
                    const now = Date.now();
                    const h = historyRef.current;
                    if (now - h.lastChangeAt >= COALESCE_MS || h.undo.length === 0) {
                        h.undo.push(structuredClone(prev));
                        if (h.undo.length > HISTORY_LIMIT) h.undo.shift();
                    }
                    h.redo = [];
                    h.lastChangeAt = now;
                }
                return newDeck;
            });
            if (currentDeckId) saveDeck(newDeck, currentDeckId);
            setRefreshKey((k) => k + 1);
        },
        [currentDeckId],
    );

    const handleUndo = useCallback(() => {
        const h = historyRef.current;
        if (h.undo.length === 0) return;
        setDeck((prev) => {
            if (!prev) return prev;
            const target = h.undo.pop()!;
            h.redo.push(structuredClone(prev));
            if (h.redo.length > HISTORY_LIMIT) h.redo.shift();
            h.lastChangeAt = 0;
            if (currentDeckId) saveDeck(target, currentDeckId);
            return target;
        });
        setRefreshKey((k) => k + 1);
    }, [currentDeckId]);

    const handleRedo = useCallback(() => {
        const h = historyRef.current;
        if (h.redo.length === 0) return;
        setDeck((prev) => {
            if (!prev) return prev;
            const target = h.redo.pop()!;
            h.undo.push(structuredClone(prev));
            if (h.undo.length > HISTORY_LIMIT) h.undo.shift();
            h.lastChangeAt = 0;
            if (currentDeckId) saveDeck(target, currentDeckId);
            return target;
        });
        setRefreshKey((k) => k + 1);
    }, [currentDeckId]);

    useEffect(() => {
        if (view !== "editor" || !deck) return;
        function onKeyDown(e: KeyboardEvent) {
            if (!(e.metaKey || e.ctrlKey)) return;
            if (e.key !== "z" && e.key !== "Z") return;
            const t = e.target as HTMLElement | null;
            // Let the browser handle native undo inside an active text edit.
            if (t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [view, deck, handleUndo, handleRedo]);

    const handleIterate = useCallback(
        async (instruction: string): Promise<{ ok: boolean; summary?: string; error?: string }> => {
            if (!deck) return { ok: false, error: "No hay deck activo" };
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
                    return { ok: true, summary: data.summary };
                }
                return { ok: false, error: data.error || "El agente no pudo aplicar el cambio." };
            } catch (err) {
                console.error(err);
                return { ok: false, error: err instanceof Error ? err.message : "Error de red" };
            } finally {
                setIsIterating(false);
            }
        },
        [deck, handleDeckChange],
    );

    const handleNewDeck = useCallback(() => {
        setView("home");
        setDeck(null);
        setCurrentDeckId(null);
        resetHistory();
    }, [resetHistory]);

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
                onNewDeck={handleNewDeck}
                isIterating={isIterating}
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

    // ── Research review (edit the pitch before generating) ──
    if (view === "research-review" && pendingGen) {
        return (
            <ResearchReview
                initial={pendingGen.research}
                researchMode={pendingGen.researchMode}
                sourceCount={pendingGen.sourceCount}
                sourceUrls={pendingGen.sourceUrls}
                onBack={() => {
                    setPendingGen(null);
                    setView("intake");
                }}
                onGenerate={(edited) => runGenerate(pendingGen, edited)}
                isGenerating={isGenerating}
            />
        );
    }

    // ── Researching (running /api/research) ──
    if (view === "researching") {
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <div className="w-full max-w-[520px] px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/[0.04] border-black/[0.06] mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E9FF7B] animate-pulse" />
                        <span className="text-[11px] font-medium tracking-[-0.005em] text-[#0a0a0a]">
                            Research con web_search + Opus 4.7
                        </span>
                    </div>
                    <h2 className="text-[28px] font-semibold text-[#0a0a0a] tracking-[-0.03em] mb-2">
                        Buscando intel de {pendingGen?.clientName ?? "la empresa"}…
                    </h2>
                    <p className="text-[13px] text-[#737373] mb-1">
                        Logo, foto hero, noticias recientes, liderazgo, dolores.
                    </p>
                    <p className="text-[12px] text-[#a3a3a3]">
                        ~30-60 segundos. Después revisas y ajustas antes de generar.
                    </p>
                    {generationError ? (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mt-6 text-[12px] text-red-800 text-left whitespace-pre-wrap break-words">
                            {generationError}
                        </div>
                    ) : null}
                </div>
            </div>
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
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => {
                                setGenerationError(null);
                                setGenerationLog("");
                                setView("home");
                            }}
                            className="h-9 px-4 rounded-md text-[12px] font-semibold text-[#0a0a0a] border border-black/15 bg-white hover:bg-black/[0.04] transition-colors"
                        >
                            {hasError ? "Volver al home" : "Cancelar"}
                        </button>
                    </div>
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
