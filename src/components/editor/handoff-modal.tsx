"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Deck } from "@/lib/slide-types";

/**
 * Handoff to Claude Code — clones the Claude Design pattern: when the
 * designer is happy with a prototype, they hand off a self-contained
 * brief that Claude Code can paste into a fresh repo and ship from.
 * Brief = (1) project shape, (2) the prototype JSON, and (3) the 30x
 * design-system reference. Copying it gives the engineer everything
 * they need without dragging files around.
 */
export function HandoffModal({
    deck,
    onClose,
}: {
    deck: Deck;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handoff = buildHandoffMarkdown(deck);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function copy() {
        try {
            await navigator.clipboard.writeText(handoff);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // ignore clipboard error
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm flex items-center justify-center px-6"
                onClick={onClose}
            >
                <motion.div
                    key="dialog"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-[720px] rounded-2xl border border-black/10 bg-white text-[#0a0a0a] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.35)] overflow-hidden"
                >
                    <div className="px-7 pt-6 pb-4 border-b border-black/[0.06] flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#0a0a0a] text-[#E9FF7B] text-[10px] font-bold">
                                    cc
                                </span>
                                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
                                    Handoff to Claude Code
                                </h2>
                            </div>
                            <p className="mt-1 text-[12px] text-[#737373]">
                                Copia el brief y pégalo en una conversación nueva con Claude Code.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="w-7 h-7 rounded-md text-[#737373] hover:text-[#0a0a0a] hover:bg-black/[0.04] flex items-center justify-center"
                        >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-7 py-4">
                        <pre className="max-h-[360px] overflow-auto rounded-lg border border-black/[0.06] bg-[#fafafa] text-[11.5px] leading-[1.5] font-mono text-[#0a0a0a] p-4 whitespace-pre-wrap">
                            {handoff}
                        </pre>
                    </div>

                    <div className="px-7 pb-6 pt-1 flex items-center gap-2">
                        <button
                            onClick={copy}
                            className="h-10 px-4 rounded-lg bg-[#0a0a0a] text-white text-[12.5px] font-semibold hover:bg-[#262626] active:bg-[#0a0a0a] flex items-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8l3.5 3.5L13 5" stroke="#E9FF7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Copiado
                                </>
                            ) : (
                                <>
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                        <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M3 3h8a1 1 0 011 1v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    Copiar brief
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => downloadJson(deck)}
                            className="h-10 px-4 rounded-lg border border-black/10 bg-white text-[12.5px] font-medium hover:bg-black/[0.04]"
                        >
                            Descargar prototype.json
                        </button>
                        <a
                            href="https://claude.ai/code"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto h-10 px-3 rounded-lg text-[12px] font-medium text-[#737373] hover:text-[#0a0a0a]"
                        >
                            Abrir Claude Code →
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function buildHandoffMarkdown(deck: Deck): string {
    const slides = JSON.stringify(deck.slides, null, 2);
    const proj = `${deck.companyName} · ${deck.programName}`;
    return `# 30X Prototype Handoff

**Project:** ${proj}
**Deck title:** ${deck.deckTitle}

## Goal

Build the prototype defined below as a Next.js + Tailwind v4 app
following the 30X design system (Untitled UI + shadcn). The JSON
\`slides\` array describes one or more screens; each \`prototype-frame\`
slide is a full UI mock with sidebar, KPIs, tables, charts, and badges.

## Stack to use

- Next.js (App Router) + Tailwind v4
- 30X design system: https://github.com/juandelaossa-30x/30x-design.git
- Color tokens: lima accent #E9FF7B on near-black #0a0a0a; light mode
  uses #fafafa cards on #ffffff canvas.
- Type: Inter Display 700 for titles (-6% letter-spacing), Inter 500
  for body. Card radii 12-16px. No em-dashes anywhere.

## Prototype data

\`\`\`json
${slides}
\`\`\`

## Acceptance criteria

- Pixel-faithful to the prototype-frame mock above.
- Responsive: desktop hero matches the mock, mobile collapses sidebar.
- All copy in Spanish (matches deck).
- Real interactivity for nav + primary CTA. Charts can be static SVGs.
- Accessible (semantic HTML, keyboard nav, contrast AA).

## Deliverable

A working Next.js project. Open a PR titled "${proj}".`;
}

function downloadJson(deck: Deck) {
    const blob = new Blob([JSON.stringify(deck, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe =
        `30x-prototype-${deck.companyName}-${deck.programName}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80) || "30x-prototype";
    a.href = url;
    a.download = `${safe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
