import PptxGenJS from "pptxgenjs";
import type { Deck, Slide } from "../slide-types";

/**
 * PPTX export — simplified generic renderer.
 * The HTML preview is the primary format; PPTX is a text-first fallback
 * for customers who need an editable deck in PowerPoint.
 */

const BG = "0A0A0A";
const SURFACE = "141414";
const TEXT = "F0F0F0";
const GRAY = "9A9A9A";
const ACCENT = "E9FF7B";
const FONT = "Inter";

function getHeadline(slide: Slide): string {
    if ("headline" in slide && slide.headline) return slide.headline;
    if ("title" in slide && slide.title) return slide.title;
    return "";
}

function getSubtitle(slide: Slide): string | undefined {
    if ("subtitle" in slide && slide.subtitle) return slide.subtitle as string;
    if ("description" in slide && slide.description) return slide.description as string;
    if ("body" in slide && slide.body) return slide.body as string;
    return undefined;
}

function getBullets(slide: Slide): string[] {
    if ("bullets" in slide && Array.isArray(slide.bullets)) return slide.bullets as string[];
    if ("checklist" in slide && slide.checklist) return slide.checklist as string[];
    if ("cards" in slide && slide.cards) {
        return slide.cards.map((c) => `${c.title} — ${c.body}`);
    }
    if ("modules" in slide && slide.modules) {
        return slide.modules.map((m) => `${m.name}: ${m.description}`);
    }
    if ("steps" in slide && slide.steps) {
        return slide.steps.map((s) => `${s.title}: ${s.description}`);
    }
    if ("angles" in slide && slide.angles) {
        return slide.angles.map((a) => `${a.title}: ${a.description}`);
    }
    if ("findings" in slide && slide.findings) {
        return slide.findings.map((f) => `${f.title}: ${f.description}`);
    }
    if ("stats" in slide && slide.stats) {
        return slide.stats.map((s) => `${s.value} — ${s.label}`);
    }
    if ("mentors" in slide && Array.isArray(slide.mentors)) {
        return slide.mentors.map((m) => `${m.name} · ${m.role}`);
    }
    return [];
}

function renderSlide(pptx: PptxGenJS, slide: Slide) {
    const s = pptx.addSlide();
    s.background = { color: BG };

    const headline = getHeadline(slide);
    const subtitle = getSubtitle(slide);
    const bullets = getBullets(slide);

    if (headline) {
        s.addText(headline, {
            x: 0.6,
            y: 0.6,
            w: 12.2,
            h: 1.6,
            fontSize: 40,
            fontFace: FONT,
            color: TEXT,
            bold: true,
            align: "left",
            valign: "top",
            lineSpacingMultiple: 1.0,
        });
    }

    if (subtitle) {
        s.addText(subtitle, {
            x: 0.6,
            y: 2.4,
            w: 12.2,
            h: 1.2,
            fontSize: 20,
            fontFace: FONT,
            color: GRAY,
            align: "left",
            valign: "top",
            lineSpacingMultiple: 1.3,
        });
    }

    if (bullets.length > 0) {
        s.addText(
            bullets.slice(0, 8).map((b) => ({ text: b, options: { bullet: true, color: TEXT } })),
            {
                x: 0.6,
                y: subtitle ? 3.8 : 2.4,
                w: 12.2,
                h: 4.0,
                fontSize: 16,
                fontFace: FONT,
                color: TEXT,
                align: "left",
                valign: "top",
                lineSpacingMultiple: 1.4,
            },
        );
    }

    if (slide.type === "pricing-cta") {
        s.addText(slide.price, {
            x: 0.6,
            y: 6.4,
            w: 12.2,
            h: 1.0,
            fontSize: 48,
            fontFace: FONT,
            color: ACCENT,
            bold: true,
            align: "left",
        });
    }

    // Footer: 30X
    s.addText("30X", {
        x: 0.6,
        y: 7.0,
        w: 2,
        h: 0.3,
        fontSize: 10,
        fontFace: FONT,
        color: GRAY,
        align: "left",
    });
}

export async function buildDeckPptx(deck: Deck): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in (16:9)
    pptx.author = "30X";
    pptx.company = "30X";
    pptx.title = deck.deckTitle;

    for (const slide of deck.slides) {
        renderSlide(pptx, slide);
    }

    const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    return buf;
}

// Legacy re-export used by /api/download
export const addContentSlide = renderSlide;
