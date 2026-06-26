"use client";

import { useRef, useState } from "react";
import type { ResearchResult } from "@/lib/slide-types";
import { uploadImage } from "@/lib/upload-image";

/**
 * Research approval gate.
 *
 * After /api/research returns, the salesperson lands here to review +
 * edit the pitch BEFORE we call /api/generate. This converts research
 * from a black box behind a spinner into the salesperson's working
 * surface — they add intel from the call, tighten the pitch angle,
 * swap a logo URL if Claude picked a bad one.
 *
 * Everything they touch flows verbatim into the generator prompt.
 * Positioning drives the flattering cover headline; callNotes becomes
 * vendor context; painPoints anchor the diagnostic slide.
 */

interface ResearchReviewProps {
    initial: ResearchResult;
    onBack: () => void;
    onGenerate: (edited: ResearchResult) => void;
    isGenerating: boolean;
    /** Which pipeline produced the research — drives the trust badge. */
    researchMode?: "exa-deep" | "claude-web-search";
    /** How many pages Exa consulted (only set when researchMode=exa-deep). */
    sourceCount?: number;
    /** Full URL list so the salesperson can audit the research. */
    sourceUrls?: string[];
}

export function ResearchReview({
    initial,
    onBack,
    onGenerate,
    isGenerating,
    researchMode,
    sourceCount,
    sourceUrls,
}: ResearchReviewProps) {
    const [positioning, setPositioning] = useState(initial.positioning ?? "");
    const [callNotes, setCallNotes] = useState(initial.callNotes ?? "");
    const [painPoints, setPainPoints] = useState<string[]>(
        initial.painPoints ?? [],
    );
    const [clientLanguage, setClientLanguage] = useState<string[]>(
        initial.clientLanguage ?? [],
    );
    const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
    const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl ?? "");

    const submit = () => {
        onGenerate({
            ...initial,
            positioning: positioning.trim() || undefined,
            callNotes: callNotes.trim() || undefined,
            painPoints: painPoints.map((p) => p.trim()).filter(Boolean),
            clientLanguage: clientLanguage.map((p) => p.trim()).filter(Boolean),
            logoUrl: logoUrl.trim() || undefined,
            heroImageUrl: heroImageUrl.trim() || undefined,
        });
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
            <header className="sticky top-0 z-20 bg-[#fafafa]/85 backdrop-blur-md border-b border-black/[0.06]">
                <div className="max-w-[960px] mx-auto px-6 h-12 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        disabled={isGenerating}
                        className="text-[12px] text-[#525252] hover:text-[#0a0a0a] tracking-[-0.005em] flex items-center gap-1 disabled:opacity-40"
                    >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M10 4L6 8L10 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Atrás
                    </button>
                    <div className="flex-1 text-[11px] tracking-[0.06em] uppercase text-[#a3a3a3]">
                        Paso 2 de 2 · Confirma el pitch
                    </div>
                </div>
            </header>

            <main className="max-w-[760px] mx-auto px-6 pt-10 pb-24">
                <div className="flex items-center gap-4 mb-1">
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-contain bg-white border border-black/[0.06]"
                            onError={(e) => {
                                e.currentTarget.style.opacity = "0.3";
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/[0.04] border border-black/[0.06]" />
                    )}
                    <div>
                        <div className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#a3a3a3]">
                            Propuesta para
                        </div>
                        <h1 className="text-[28px] font-semibold tracking-[-0.025em] leading-[1.1]">
                            {initial.companyName}
                        </h1>
                    </div>
                </div>
                <p className="text-[13px] text-[#525252] mt-1 max-w-[540px] leading-[1.5]">
                    Esto fue lo que encontré. Edita cualquier cosa antes de generar — tu
                    intel del call vale más que cualquier web_search.
                </p>

                {researchMode === "exa-deep" && sourceCount && sourceCount > 0 ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0a0a0a] text-white">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M3 8l3 3 7-7"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="text-[11px] font-medium tracking-[-0.005em]">
                            Deep research vía Exa · {sourceCount} fuentes
                        </span>
                    </div>
                ) : researchMode === "claude-web-search" ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/[0.05]">
                        <span className="text-[11px] font-medium tracking-[-0.005em] text-[#525252]">
                            Web search baseline · activá EXA_API_KEY para deep research
                        </span>
                    </div>
                ) : null}

                <Section title="Ángulo del pitch" hint="Esta frase arranca la portada — 30x reconoce a la empresa como líder en su categoría.">
                    <textarea
                        value={positioning}
                        onChange={(e) => setPositioning(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border border-black/[0.09] bg-white text-[14px] leading-[1.45] tracking-[-0.005em] text-[#0a0a0a] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] resize-none"
                        placeholder="ej: la aerolínea bandera de México, predilecta de clientes premium en LATAM"
                    />
                </Section>

                <Section
                    title="Dolores y oportunidades"
                    hint="Los 3-5 más críticos. Quita los genéricos, agrega los del call."
                >
                    <EditableList
                        items={painPoints}
                        onChange={setPainPoints}
                        placeholder="ej: Expansión internacional acelerada exige líderes con mindset global"
                    />
                </Section>

                <Section
                    title="Lenguaje del cliente"
                    hint="Frases que la EMPRESA usa sobre sí misma. Usadas literal en el copy del deck para que se sienta hecho por ellos. (Aeroméxico → 'premium' · Action Black → 'We're not a fucking gym')."
                >
                    <EditableList
                        items={clientLanguage}
                        onChange={setClientLanguage}
                        placeholder={`ej: "Mexico's Global Airline"`}
                    />
                </Section>

                <Section
                    title="Algo más del call"
                    hint="Lo que el research no puede saber: con quién hablaste, qué pidieron específicamente, deadline, restricciones."
                >
                    <textarea
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-black/[0.09] bg-white text-[14px] leading-[1.45] tracking-[-0.005em] text-[#0a0a0a] focus:outline-none focus:border-black/35 focus:ring-4 focus:ring-black/[0.04] resize-none"
                        placeholder="ej: Andrés Conesa mencionó en el call que quieren empezar con los VPs de Revenue y Experiencia del Cliente. Presupuesto ya aprobado por Banco Lambia."
                    />
                </Section>

                <Section title="Assets visuales" hint="Logo aparece en cada slide. Hero image va en la portada. Click otro candidato si Claude eligió mal.">
                    <CandidatePicker
                        label="Logo"
                        url={logoUrl}
                        onChange={setLogoUrl}
                        placeholder="https://.../logo.svg"
                        candidates={initial.logoCandidates ?? []}
                        mode="logo"
                    />
                    <CandidatePicker
                        label="Portada (hero)"
                        url={heroImageUrl}
                        onChange={setHeroImageUrl}
                        placeholder="https://.../foto-empresa.jpg"
                        candidates={initial.heroCandidates ?? []}
                        mode="hero"
                    />
                </Section>

                {(initial.leadership?.length ?? 0) > 0 && (
                    <Section title="Liderazgo visible" hint="Referencia — no se edita aquí.">
                        <ul className="space-y-1.5">
                            {initial.leadership.map((l, i) => (
                                <li
                                    key={i}
                                    className="text-[13px] text-[#525252] tracking-[-0.005em]"
                                >
                                    {l}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {(initial.recentNews?.length ?? 0) > 0 && (
                    <Section title="Noticias recientes" hint="Referencia — no se edita aquí.">
                        <ul className="space-y-1.5">
                            {initial.recentNews.map((n, i) => (
                                <li
                                    key={i}
                                    className="text-[13px] text-[#525252] tracking-[-0.005em] leading-[1.5]"
                                >
                                    {n}
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}

                {sourceUrls && sourceUrls.length > 0 && (
                    <Section
                        title="Fuentes consultadas"
                        hint="Abre cualquiera para auditar el brief. Si una fuente está mal, edita los campos arriba."
                    >
                        <ul className="space-y-1">
                            {sourceUrls.map((u, i) => {
                                let host = u;
                                try {
                                    host = new URL(u).hostname.replace(/^www\./, "");
                                } catch {}
                                return (
                                    <li key={i} className="text-[12px] leading-[1.4]">
                                        <a
                                            href={u}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#525252] hover:text-[#0a0a0a] tracking-[-0.005em] underline underline-offset-2 decoration-black/20 hover:decoration-black/60"
                                        >
                                            {host}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </Section>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-black/[0.06]">
                <div className="max-w-[760px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-[11.5px] text-[#737373] tracking-[-0.005em]">
                        {isGenerating
                            ? "Generando propuesta con Gemini 2.5 Pro…"
                            : "El ángulo del pitch y las notas del call alimentan directamente el deck."}
                    </div>
                    <button
                        onClick={submit}
                        disabled={isGenerating}
                        className="h-10 px-5 rounded-lg bg-[#0a0a0a] text-white text-[13px] font-semibold tracking-[-0.005em] hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-[filter,opacity] duration-150"
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Generando…
                            </>
                        ) : (
                            <>
                                Generar propuesta
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M6 4l4 4-4 4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mt-9">
            <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-[#0a0a0a]">
                    {title}
                </h2>
            </div>
            {hint ? (
                <p className="text-[11.5px] text-[#a3a3a3] mb-2.5 leading-[1.45]">
                    {hint}
                </p>
            ) : null}
            <div className="space-y-2">{children}</div>
        </section>
    );
}

function EditableList({
    items,
    onChange,
    placeholder,
}: {
    items: string[];
    onChange: (next: string[]) => void;
    placeholder: string;
}) {
    return (
        <>
            {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                    <div className="pt-2.5 text-[11px] text-[#a3a3a3] tabular-nums w-5 text-right shrink-0">
                        {String(i + 1).padStart(2, "0")}
                    </div>
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                            const next = [...items];
                            next[i] = e.target.value;
                            onChange(next);
                        }}
                        className="flex-1 h-10 px-3 rounded-md border border-black/[0.09] bg-white text-[13px] tracking-[-0.005em] text-[#0a0a0a] focus:outline-none focus:border-black/35 focus:ring-2 focus:ring-black/[0.04]"
                    />
                    <button
                        onClick={() => onChange(items.filter((_, j) => j !== i))}
                        className="w-10 h-10 rounded-md text-[#a3a3a3] hover:text-[#0a0a0a] hover:bg-black/[0.04] flex items-center justify-center transition-colors"
                        aria-label={`Eliminar item ${i + 1}`}
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button
                onClick={() => onChange([...items, ""])}
                className="h-10 px-3 rounded-md text-[12px] font-medium text-[#525252] hover:text-[#0a0a0a] hover:bg-black/[0.04] flex items-center gap-1.5 transition-colors"
            >
                <span className="text-[15px] leading-none">+</span>
                Agregar {items.length === 0 ? placeholder.slice(0, 40) + "…" : "otro"}
            </button>
        </>
    );
}

/**
 * CandidatePicker — current selection big + clickable thumbnail grid
 * of all alternatives Exa surfaced. URLs that fail to load (broken
 * hotlink, 404) auto-hide so the grid stays clean.
 */
function CandidatePicker({
    label,
    url,
    onChange,
    placeholder,
    candidates,
    mode,
}: {
    label: string;
    url: string;
    onChange: (next: string) => void;
    placeholder: string;
    candidates: string[];
    mode: "logo" | "hero";
}) {
    // Move the currently-selected URL to the front and dedupe.
    const ordered = [
        ...(url ? [url] : []),
        ...candidates.filter((c) => c !== url),
    ];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    async function handleFile(file: File) {
        setUploading(true);
        setUploadError(null);
        try {
            const uploadedUrl = await uploadImage(file);
            onChange(uploadedUrl);
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : "No se pudo subir la imagen.",
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
                <div className="text-[11px] font-medium text-[#525252]">{label}</div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = "";
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-[10.5px] font-medium text-[#0a0a0a] hover:text-[#525252] disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                        {uploading ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-[#0a0a0a] animate-pulse" />
                                Subiendo…
                            </>
                        ) : (
                            <>
                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M8 11V3M8 3L4.5 6.5M8 3L11.5 6.5M3 13H13"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                Subir
                            </>
                        )}
                    </button>
                    <span className="text-[10.5px] text-[#a3a3a3]">
                        {ordered.length} {ordered.length === 1 ? "candidato" : "candidatos"}
                    </span>
                </div>
            </div>
            {uploadError ? (
                <div className="text-[10.5px] text-red-600 leading-snug">{uploadError}</div>
            ) : null}

            {/* Currently selected — big preview */}
            <div className="flex items-start gap-3">
                <div
                    className={`shrink-0 bg-[#0a0a0a] border border-black/[0.06] overflow-hidden grid place-items-center ${
                        mode === "logo" ? "w-16 h-16 rounded-lg" : "w-28 h-16 rounded-md"
                    }`}
                >
                    {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={url}
                            alt=""
                            className={
                                mode === "logo"
                                    ? "max-w-[78%] max-h-[78%] object-contain"
                                    : "w-full h-full object-cover"
                            }
                            style={{ filter: mode === "logo" ? "brightness(0) invert(1)" : "none" }}
                            onError={(e) => {
                                e.currentTarget.style.opacity = "0.2";
                            }}
                        />
                    ) : (
                        <span className="text-[9px] text-[#737373] tracking-[0.06em] uppercase">
                            Sin asset
                        </span>
                    )}
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 h-9 px-3 rounded-md border border-black/[0.09] bg-white text-[11.5px] font-mono tracking-[-0.005em] text-[#0a0a0a] focus:outline-none focus:border-black/35 focus:ring-2 focus:ring-black/[0.04] truncate"
                />
            </div>

            {/* Candidates grid */}
            {ordered.length > 1 ? (
                <div className="grid grid-cols-7 gap-1.5">
                    {ordered.slice(0, 14).map((u, i) => (
                        <CandidateTile
                            key={u + i}
                            url={u}
                            mode={mode}
                            selected={u === url}
                            onClick={() => onChange(u)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

/** Single thumbnail in the grid. Hides itself if the image errors. */
function CandidateTile({
    url,
    mode,
    selected,
    onClick,
}: {
    url: string;
    mode: "logo" | "hero";
    selected: boolean;
    onClick: () => void;
}) {
    const [broken, setBroken] = useState(false);
    if (broken) return null;
    return (
        <button
            type="button"
            onClick={onClick}
            title={url}
            className={`group aspect-square rounded-md overflow-hidden bg-[#0a0a0a] border-2 transition-all duration-100 grid place-items-center ${
                selected
                    ? "border-[#0a0a0a]"
                    : "border-transparent hover:border-black/30"
            }`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt=""
                className={
                    mode === "logo"
                        ? "max-w-[80%] max-h-[80%] object-contain"
                        : "w-full h-full object-cover"
                }
                style={{ filter: mode === "logo" ? "brightness(0) invert(1)" : "none" }}
                onError={() => setBroken(true)}
            />
        </button>
    );
}

