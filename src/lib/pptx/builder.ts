import "server-only";
import PptxGenJS from "pptxgenjs";
import type { Deck, ProjectFormat } from "../slide-types";
import { FORMATS } from "../slide-types";
import { renderDeckToSlideScreenshots } from "../export/render-pdf";

/**
 * PPTX export — image-per-slide builder.
 *
 * v1 (until 2026-04-25): pptxgenjs text-only renderer. Headlines and
 * bullets in flat black slides. Useless for the 30x sales team —
 * they were downloading the PPTX, opening it in PowerPoint, and
 * recreating the deck from scratch in Canva.
 *
 * v2 (now): the React preview is the source of truth. We render each
 * slide via the same puppeteer pipeline used for PDF export, then
 * embed each PNG as a full-bleed image in a PPTX slide. Visual
 * fidelity is identical to what the salesperson sees in the editor.
 *
 * Trade-off: text isn't editable inside PowerPoint anymore — the
 * salesperson does all text editing in the in-app editor before
 * downloading. When opened in Canva or Slides, both apps detect the
 * image, and the user can replace any slide with their own version.
 *
 * If text-editable PPT becomes a real need (vs Canva), the path is to
 * extract text positions from the rendered HTML and overlay them on
 * top of the image as PPT text frames. Out of scope for v2.
 */

interface FormatDims {
    /** PPTX layout dims in inches (pptxgenjs uses inches at 96 DPI). */
    widthIn: number;
    heightIn: number;
}

function pptxDimsFor(format: ProjectFormat): FormatDims {
    const spec = FORMATS[format];
    // pptxgenjs uses 96 DPI by convention for layout calculations.
    const widthIn = +(spec.width / 96).toFixed(3);
    const heightIn = +(spec.height / 96).toFixed(3);
    return { widthIn, heightIn };
}

export async function buildDeckPptx(
    deck: Deck,
    absoluteBase: string,
): Promise<Buffer> {
    if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
        throw new Error("Deck vacío");
    }

    // 1. Render every slide as a JPG via the shared puppeteer pipeline.
    //    Use a higher resolution than the critique pipeline (1024px →
    //    1920px) since this PPTX is meant for projection / client send.
    const screenshots = await renderDeckToSlideScreenshots(deck, absoluteBase, {
        outputWidth: 1920,
        quality: 92,
    });

    if (screenshots.length === 0) {
        throw new Error("No se generaron screenshots — revisa puppeteer/Chromium.");
    }

    // 2. Build PPTX with a custom layout matching the deck format.
    const format = deck.format ?? "proposal";
    const { widthIn, heightIn } = pptxDimsFor(format);

    const pptx = new PptxGenJS();
    pptx.author = "30X";
    pptx.company = "30X";
    pptx.title = deck.deckTitle ?? "30X Design";
    pptx.defineLayout({ name: "30x", width: widthIn, height: heightIn });
    pptx.layout = "30x";

    for (let i = 0; i < screenshots.length; i++) {
        const buf = screenshots[i];
        const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
        const slide = pptx.addSlide();
        slide.background = { color: deck.theme === "light" ? "FFFFFF" : "000000" };
        slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: widthIn,
            h: heightIn,
        });
    }

    const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    return out;
}
