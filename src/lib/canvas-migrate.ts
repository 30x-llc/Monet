import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type CanvasElement,
    type CanvasImageElement,
    type CanvasSlide,
    type CanvasTextElement,
} from "@/lib/slide-types";
import { inferTextStyle } from "@/lib/text-styles";

/**
 * Read the rendered DOM of a structured slide and produce a CanvasSlide
 * whose elements are positioned to visually match what the user sees.
 *
 * The trick is using the right reference root. The slide content lives
 * inside SlideStage's natural-size inner div (e.g. 1920×1080 for proposal),
 * which is then scaled by CSS transform to fit the editor area. Reading
 * `getBoundingClientRect` gives screen-pixel coords *after* that
 * transform — so to recover design-space coords we divide by the
 * scale (rect.width / offsetWidth).
 *
 * Then we map design-space → canvas-space (1280×720) using a single
 * uniform ratio so aspect is preserved.
 */
export function migrateStructuredSlideToCanvas(stageRoot: HTMLElement): CanvasSlide {
    // Locate the actual slide content section. Every structured slide
    // renderer outputs a `<section class="deck-slide ...">`. That's the
    // node whose offsetWidth/offsetHeight are the format's design dims.
    const slideRoot =
        stageRoot.querySelector<HTMLElement>("section.deck-slide") ??
        stageRoot.querySelector<HTMLElement>(".deck-stage") ??
        stageRoot;

    const designW = slideRoot.offsetWidth;
    const designH = slideRoot.offsetHeight;
    const visualRect = slideRoot.getBoundingClientRect();
    if (designW <= 0 || designH <= 0 || visualRect.width <= 0) {
        return { type: "canvas", background: "#ffffff", elements: [] };
    }
    // Screen → design ratio (one number; we trust isotropic scaling).
    const screenToDesign = designW / visualRect.width;
    // Design → canvas ratio: keep aspect, fit within 1280×720.
    const designToCanvas = Math.min(CANVAS_WIDTH / designW, CANVAS_HEIGHT / designH);
    // Center the migrated content inside 1280×720 if aspect doesn't match.
    const offsetX = (CANVAS_WIDTH - designW * designToCanvas) / 2;
    const offsetY = (CANVAS_HEIGHT - designH * designToCanvas) / 2;

    function toCanvas(rect: DOMRect): { x: number; y: number; w: number; h: number } {
        const designX = (rect.left - visualRect.left) * screenToDesign;
        const designY = (rect.top - visualRect.top) * screenToDesign;
        const designElW = rect.width * screenToDesign;
        const designElH = rect.height * screenToDesign;
        return {
            x: Math.round(designX * designToCanvas + offsetX),
            y: Math.round(designY * designToCanvas + offsetY),
            w: Math.round(designElW * designToCanvas),
            h: Math.round(designElH * designToCanvas),
        };
    }

    const elements: CanvasElement[] = [];

    // ── Background ──────────────────────────────────────────────────
    let background = "#ffffff";
    const bgImg = slideRoot.querySelector<HTMLImageElement>(".bg-img img, .bg img, .bg-img > img");
    if (bgImg && bgImg.src) {
        background = `#000 url("${bgImg.src}") center/cover no-repeat`;
    } else {
        const bg = window.getComputedStyle(slideRoot).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") background = bg;
    }

    // ── Text leaves ─────────────────────────────────────────────────
    // A text leaf is an element whose direct text content is non-empty
    // and whose only children (if any) are inline spans WITHOUT their
    // own non-empty text-bearing descendants. For our slides the common
    // case is `<h1>some text <span class="accent">accent</span> rest</h1>`
    // — we treat the entire h1 as one text element so the accent span
    // doesn't double-count.
    const allEls = Array.from(slideRoot.querySelectorAll<HTMLElement>("*"));
    const claimed = new Set<HTMLElement>();
    for (const el of allEls) {
        if (claimed.has(el)) continue;
        const text = (el.textContent ?? "").trim();
        if (text.length === 0 || text.length > 800) continue;
        // Only consider elements that contain text and where every
        // descendant is either inline (span/em/strong/b/i/sup/sub) or
        // a child without its own block layout.
        const blockyChild = Array.from(el.querySelectorAll<HTMLElement>("*")).some((c) => {
            const t = (c.textContent ?? "").trim();
            if (t.length === 0) return false;
            // If the child is a block-level text-bearing element, defer.
            const display = window.getComputedStyle(c).display;
            return display === "block" || display === "flex" || display === "grid";
        });
        if (blockyChild) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        // Skip nodes outside the slide's visible area (decorative offscreen).
        if (
            r.right < visualRect.left ||
            r.left > visualRect.right ||
            r.bottom < visualRect.top ||
            r.top > visualRect.bottom
        )
            continue;
        const cs = window.getComputedStyle(el);
        const fontSizePx = parseFloat(cs.fontSize) || 16;
        const fontSizeCanvas = Math.max(8, Math.round(fontSizePx * screenToDesign * designToCanvas));
        const fontWeight = parseFontWeight(cs.fontWeight);
        const lineHeightPx = parseFloat(cs.lineHeight);
        const lineHeight =
            Number.isFinite(lineHeightPx) && fontSizePx > 0 ? lineHeightPx / fontSizePx : 1.2;
        const lsPx = parseFloat(cs.letterSpacing);
        const letterSpacing = Number.isFinite(lsPx) && fontSizePx > 0 ? lsPx / fontSizePx : 0;
        const align = cs.textAlign;
        const box = toCanvas(r);
        const txt: CanvasTextElement = {
            id: rid(),
            kind: "text",
            text,
            ...box,
            // Mark the closest Monet style for the Estilo picker, but keep
            // the EXACT original font metrics as overrides so the migrated
            // text fits in the captured box. Picking a style in the panel
            // clears these overrides and snaps the element to the token.
            textStyle: inferTextStyle({ fontSize: fontSizeCanvas, fontWeight }),
            fontSize: fontSizeCanvas,
            fontWeight,
            lineHeight: round2(lineHeight),
            letterSpacing: round3(letterSpacing),
            color: cs.color,
            align: align === "center" ? "center" : align === "right" ? "right" : "left",
            fontStyle: cs.fontStyle === "italic" ? "italic" : "normal",
        };
        elements.push(txt);
        // Mark all descendants as claimed so their text doesn't double-count.
        Array.from(el.querySelectorAll<HTMLElement>("*")).forEach((c) => claimed.add(c));
    }

    // ── Images ──────────────────────────────────────────────────────
    const imgs = Array.from(slideRoot.querySelectorAll<HTMLImageElement>("img"));
    for (const img of imgs) {
        if (!img.src) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        // Skip background image — already absorbed into the slide bg.
        if (img.closest(".bg-img, .bg")) continue;
        const obj = window.getComputedStyle(img).objectFit as "cover" | "contain" | string;
        const radiusPx = parseFloat(window.getComputedStyle(img).borderRadius) || 0;
        const radiusDesign = radiusPx * screenToDesign;
        const box = toCanvas(r);
        const elImg: CanvasImageElement = {
            id: rid(),
            kind: "image",
            src: img.src,
            alt: img.alt || undefined,
            ...box,
            fit: obj === "contain" ? "contain" : "cover",
            radius: Math.round(radiusDesign * designToCanvas),
        };
        elements.push(elImg);
    }

    return { type: "canvas", background, elements };
}

function rid(): string {
    return Math.random().toString(36).slice(2, 10);
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}

function parseFontWeight(w: string): number {
    const n = Number(w);
    if (Number.isFinite(n)) return n;
    if (w === "bold") return 700;
    if (w === "normal") return 400;
    return 400;
}
