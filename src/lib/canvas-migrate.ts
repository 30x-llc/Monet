import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type CanvasElement,
    type CanvasImageElement,
    type CanvasSlide,
    type CanvasTextElement,
} from "@/lib/slide-types";

/**
 * Read the rendered DOM of a structured slide and produce a CanvasSlide
 * with one absolutely-positioned element per visible text node and per
 * image. The conversion is one-way and lossy by design — the user is
 * "freeing" the slide from its template into the canvas surface so they
 * can rearrange anything.
 *
 * Coordinates: every measured rect is mapped from screen space (the
 * editor stage's bounding rect) into canvas space (1280×720). Aspect
 * mismatches between the source format and the canvas are absorbed by
 * a uniform scale based on width — slight vertical stretch on
 * non-16:9 formats is acceptable in v1.
 */
export function migrateStructuredSlideToCanvas(stageRoot: HTMLElement): CanvasSlide {
    const stageRect = stageRoot.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) {
        return { type: "canvas", background: "#ffffff", elements: [] };
    }
    const sx = CANVAS_WIDTH / stageRect.width;
    const sy = CANVAS_HEIGHT / stageRect.height;
    // Use a single scale (the smaller one) so text doesn't stretch.
    const s = Math.min(sx, sy);

    const elements: CanvasElement[] = [];

    // ── Background ──────────────────────────────────────────────────
    let background = "#ffffff";
    // Look for a backgroundImage rendered inside the slide (the cover/
    // intro slides use an absolutely positioned <img class="bg-img">).
    const bgImg = stageRoot.querySelector<HTMLImageElement>(".bg-img img, .bg img");
    if (bgImg && bgImg.src) {
        background = `url("${bgImg.src}") center/cover no-repeat`;
    } else {
        // Fall back to the section's computed background-color.
        const section = stageRoot.querySelector<HTMLElement>("section.deck-slide");
        if (section) {
            const bg = window.getComputedStyle(section).backgroundColor;
            if (bg && bg !== "rgba(0, 0, 0, 0)") background = bg;
        }
    }

    // ── Text leaves ─────────────────────────────────────────────────
    // A "text leaf" is an element whose direct text content is non-empty
    // and which has no element children that themselves carry text.
    const allEls = Array.from(stageRoot.querySelectorAll<HTMLElement>("*"));
    for (const el of allEls) {
        const text = (el.textContent ?? "").trim();
        if (text.length === 0) continue;
        const hasTextyChild = Array.from(el.children).some(
            (c) => (c.textContent ?? "").trim().length > 0,
        );
        if (hasTextyChild) continue;
        // Skip decorative chips (logos rendered as text fallbacks etc.)
        if (text.length > 800) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        const cs = window.getComputedStyle(el);
        const fontSize = parseFloat(cs.fontSize) || 16;
        const lineHeightPx = parseFloat(cs.lineHeight);
        const lineHeight =
            Number.isFinite(lineHeightPx) && fontSize > 0 ? lineHeightPx / fontSize : 1.2;
        const align = (cs.textAlign as "left" | "center" | "right") ?? "left";
        const txt: CanvasTextElement = {
            id: rid(),
            kind: "text",
            text,
            x: Math.round((r.left - stageRect.left) * s),
            y: Math.round((r.top - stageRect.top) * s),
            w: Math.round(r.width * s),
            h: Math.round(r.height * s),
            fontSize: Math.round(fontSize * s),
            fontWeight: parseFontWeight(cs.fontWeight),
            color: cs.color,
            align: ["left", "center", "right"].includes(align) ? align : "left",
            lineHeight: round2(lineHeight),
            letterSpacing: round3(parseFloat(cs.letterSpacing) / fontSize || 0),
            fontStyle: cs.fontStyle === "italic" ? "italic" : "normal",
        };
        elements.push(txt);
    }

    // ── Images ──────────────────────────────────────────────────────
    const imgs = Array.from(stageRoot.querySelectorAll<HTMLImageElement>("img"));
    for (const img of imgs) {
        if (!img.src) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        // Skip the background image — already absorbed into the slide bg.
        if (img.closest(".bg-img, .bg")) continue;
        const obj = window.getComputedStyle(img).objectFit as "cover" | "contain" | string;
        const radiusPx = parseFloat(window.getComputedStyle(img).borderRadius) || 0;
        const elImg: CanvasImageElement = {
            id: rid(),
            kind: "image",
            src: img.src,
            alt: img.alt || undefined,
            x: Math.round((r.left - stageRect.left) * s),
            y: Math.round((r.top - stageRect.top) * s),
            w: Math.round(r.width * s),
            h: Math.round(r.height * s),
            fit: obj === "contain" ? "contain" : "cover",
            radius: Math.round(radiusPx * s),
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
