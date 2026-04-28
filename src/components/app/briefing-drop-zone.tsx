"use client";

import { useRef, useState } from "react";
import type { SuperPromptFormat } from "@/lib/super-prompt";

/**
 * Briefing drop zone — file upload + paste from clipboard + super-prompt
 * generator. Used across all formats (Propuesta, Documento, …) so any
 * artifact can be informed by an existing related document (e.g.,
 * generate a contract using the previous proposal as context).
 *
 * Format param adapts the super-prompt the user copies — a contract
 * brief asks different questions than a proposal brief.
 */

interface BriefingDropZoneProps {
    briefing: string;
    briefingFile: string | null;
    clientName: string;
    format: SuperPromptFormat;
    parsing?: boolean;
    parseError?: string | null;
    onFile: (file: File) => void;
    onPaste: () => void;
    onClear: () => void;
    onCopySuperPrompt: () => Promise<void>;
}

export function BriefingDropZone({
    briefing,
    briefingFile,
    clientName,
    format,
    parsing = false,
    parseError = null,
    onFile,
    onPaste,
    onClear,
    onCopySuperPrompt,
}: BriefingDropZoneProps) {
    const [drag, setDrag] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCopy = async () => {
        await onCopySuperPrompt();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
    };

    if (briefing) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                    <label className="text-[11px] font-medium text-[#525252] tracking-[-0.005em]">
                        Briefing cargado
                    </label>
                    <button
                        onClick={onClear}
                        className="text-[11px] text-[#737373] hover:text-[#0a0a0a] underline underline-offset-2"
                    >
                        Quitar
                    </button>
                </div>
                <div className="rounded-lg border border-[#0a0a0a]/15 bg-[#fafafa] p-3 flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-md bg-[#0a0a0a] text-[#E9FF7B] flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M3 8l3 3 7-7"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold text-[#0a0a0a] truncate">
                            {briefingFile || "briefing.md"}
                        </div>
                        <div className="text-[11px] text-[#737373] mt-0.5">
                            {briefing.length.toLocaleString()} caracteres · va al deep research como contexto prioritario
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const helperByFormat: Record<SuperPromptFormat, string> = {
        proposal:
            "Si tenés contrato anterior, sheet con notas, transcript del call, voice-note — montalo acá. La propuesta jala data verbatim.",
        doc:
            "Si tenés la propuesta del cliente, brief del call, contrato anterior — montalo acá. El doc se arma con esa información.",
        "carousel-ig":
            "Si tenés notas, casos, frases de mentores — montalo acá.",
        "story-ig": "Si tenés notas o frases — montalo acá.",
        prototype: "Si tenés specs, copys o brief — montalo acá.",
        other: "Si tenés contexto previo en archivo — montalo acá.",
    };

    const titleByFormat: Record<SuperPromptFormat, string> = {
        proposal: "Briefing del cliente — opcional",
        doc: "Material previo — opcional",
        "carousel-ig": "Briefing del contenido — opcional",
        "story-ig": "Briefing del contenido — opcional",
        prototype: "Brief del producto — opcional",
        other: "Material previo — opcional",
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
                <label className="text-[11px] font-medium text-[#525252] tracking-[-0.005em]">
                    {titleByFormat[format]}
                </label>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] font-medium text-[#0a0a0a] hover:text-black underline underline-offset-2 flex items-center gap-1"
                    title="Copia un prompt al portapapeles que puedes pegar en Claude/ChatGPT/Gemini para generar un brief"
                >
                    {copied ? (
                        <>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Copiado
                        </>
                    ) : (
                        <>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                <path d="M5 5h7v9H5zM3 3h7v2M3 3v9h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Copiar super-prompt
                        </>
                    )}
                </button>
            </div>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`rounded-lg border border-dashed p-4 transition-colors duration-150 ${
                    parsing
                        ? "border-[#0a0a0a]/30 bg-[#fafafa]"
                        : drag
                          ? "border-[#0a0a0a]/40 bg-black/[0.03]"
                          : "border-black/[0.12] bg-white hover:border-black/[0.25]"
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-md bg-black/[0.04] flex items-center justify-center text-[#737373]">
                        {parsing ? (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] border-t-transparent animate-spin" />
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                                <path d="M3 9.5V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5M8 2v8m-3-3l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 text-[12px] text-[#525252] leading-[1.4]">
                        {parsing ? (
                            <>
                                <div className="text-[#0a0a0a] font-medium">
                                    Subiendo + parseando archivo…
                                </div>
                                <div className="text-[10.5px] text-[#a3a3a3] mt-0.5">
                                    Stream directo a Vercel Blob, después extracción de texto. PDFs grandes pueden tardar 5-30s.
                                </div>
                            </>
                        ) : (
                            <>
                                Arrastra cualquier archivo (PDF, DOCX, PPTX, MD, TXT…) hasta 250MB, o{" "}
                                <button
                                    onClick={() => inputRef.current?.click()}
                                    className="text-[#0a0a0a] underline underline-offset-2 hover:text-black"
                                >
                                    elige archivo
                                </button>
                                ,{" "}
                                <button
                                    onClick={onPaste}
                                    className="text-[#0a0a0a] underline underline-offset-2 hover:text-black"
                                >
                                    pega del portapapeles
                                </button>
                                .
                                <div className="text-[10.5px] text-[#a3a3a3] mt-1">
                                    {helperByFormat[format]}{" "}
                                    {clientName
                                        ? `Si no, el deep research arma el contexto desde cero para ${clientName}.`
                                        : "Si no, el deep research arma el contexto desde cero."}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(f);
                    }}
                    className="hidden"
                />
            </div>
            {parseError ? (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-[11.5px] text-red-700">
                    {parseError}
                </div>
            ) : null}
        </div>
    );
}
