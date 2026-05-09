import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Deck, ProjectFormat } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";

// Slide CSS is authored for the editor's SlideStage. For print we inline
// the same stylesheet + a tiny reset so each slide fills a page exactly
// at its native canvas size (1920x1080 for proposals, etc.). Fonts come
// from the public/assets/fonts directory already referenced inside
// deck.css via @font-face.
function readDeckCss(): string {
    try {
        const p = join(process.cwd(), "src/styles/deck.css");
        return readFileSync(p, "utf8");
    } catch {
        return "";
    }
}

const STAGE_VARS_DARK = `
    --t-canvas: #000000;
    --t-fg: #ffffff;
    --t-fg-2: rgba(255,255,255,0.82);
    --t-fg-3: rgba(255,255,255,0.6);
    --t-fg-4: rgba(255,255,255,0.45);
    --t-card-bg: #0A0A0A;
    --t-card-border: #222222;
    --t-hairline: rgba(255,255,255,0.14);
    --t-overlay-top: rgba(0,0,0,0.45);
    --t-overlay-mid: rgba(0,0,0,0.15);
    --t-overlay-bottom: rgba(0,0,0,0.85);
    --t-pill-bg: transparent;
    --t-pill-fg: #E9FF7B;
    --t-pill-border: #E9FF7B;
    --t-logo-filter: none;
    --t-client-logo-filter: brightness(0) invert(1);
    --t-icon-fg: #E9FF7B;
    --t-icon-bg: transparent;
    --t-accent: #E9FF7B;
    --t-accent-fg: #0a0a0a;
`;

const STAGE_VARS_LIGHT = `
    --t-canvas: #ffffff;
    --t-fg: #0a0a0a;
    --t-fg-2: rgba(10,10,10,0.78);
    --t-fg-3: rgba(10,10,10,0.55);
    --t-fg-4: rgba(10,10,10,0.4);
    --t-card-bg: #fafafa;
    --t-card-border: rgba(0,0,0,0.08);
    --t-hairline: rgba(0,0,0,0.1);
    --t-overlay-top: rgba(0,0,0,0.15);
    --t-overlay-mid: rgba(0,0,0,0.05);
    --t-overlay-bottom: rgba(0,0,0,0.65);
    --t-pill-bg: rgba(0,0,0,0.04);
    --t-pill-fg: #0a0a0a;
    --t-pill-border: rgba(0,0,0,0.1);
    --t-logo-filter: brightness(0) invert(0);
    --t-client-logo-filter: none;
    --t-icon-fg: #0a0a0a;
    --t-icon-bg: rgba(0,0,0,0.04);
    --t-accent: #0a0a0a;
    --t-accent-fg: #ffffff;
`;

function pageCss(width: number, height: number, theme: "dark" | "light"): string {
    const vars = theme === "light" ? STAGE_VARS_LIGHT : STAGE_VARS_DARK;
    const bodyBg = theme === "light" ? "#fff" : "#000";
    return `
        @page { size: ${width}px ${height}px; margin: 0; }
        html, body {
            margin: 0; padding: 0;
            background: ${bodyBg};
            font-family: "Inter Display", Inter, -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .print-page {
            width: ${width}px;
            height: ${height}px;
            position: relative;
            overflow: hidden;
            page-break-after: always;
            break-after: page;
            ${vars}
            background: var(--t-canvas);
            color: var(--t-fg);
        }
        .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
        }
        .deck-stage {
            width: 100% !important;
            height: 100% !important;
            position: absolute;
            inset: 0;
            transform: none !important;
        }
    `;
}

/**
 * Render the full deck as a self-contained HTML document. Uses
 * renderToStaticMarkup via a dynamic import so Next's static analyzer
 * doesn't complain about react-dom/server in a module that transitively
 * imports "use client" files (all slide renderers carry the directive).
 * One .print-page per slide at native canvas size.
 */
export async function renderDeckHtml(deck: Deck, absoluteBase: string): Promise<string> {
    const format: ProjectFormat = deck.format ?? "proposal";
    const spec = FORMATS[format];
    const { width, height } = spec;

    // Absolutize /assets/... so mentor portraits and the portada load.
    const absolutize = (node: unknown): unknown => {
        if (typeof node === "string") {
            if (node.startsWith("/") && !node.startsWith("//")) return `${absoluteBase}${node}`;
            return node;
        }
        if (Array.isArray(node)) return node.map(absolutize);
        if (node && typeof node === "object") {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
                out[k] = absolutize(v);
            }
            return out;
        }
        return node;
    };
    const deckAbs = absolutize(deck) as Deck;

    // Dynamic import keeps react-dom/server out of the statically-analyzed
    // module graph (which otherwise trips Next's client-component check).
    const [{ renderToStaticMarkup }, { SlideRenderer }] = await Promise.all([
        import("react-dom/server"),
        import("@/components/slides/deck-slides"),
    ]);

    const slidesHtml = deckAbs.slides
        .map((slide, i) => {
            const inner = renderToStaticMarkup(
                <SlideRenderer
                    slide={slide}
                    clientLogoUrl={deckAbs.clientLogoUrl}
                    pageIndex={i + 1}
                />,
            );
            return `<div class="print-page" data-slide-index="${i}">${inner}</div>`;
        })
        .join("\n");

    const css = pageCss(width, height, deck.theme ?? "light") + "\n" + readDeckCss();

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <base href="${absoluteBase}/" />
    <title>${escapeHtml(deck.deckTitle ?? "Monet")}</title>
    <style>${css}</style>
</head>
<body>
    ${slidesHtml}
</body>
</html>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
