/**
 * Deck exporters: PDF, standalone HTML, ZIP, plus "open in Canva" helpers.
 */

"use client";

import { jsPDF } from "jspdf";
import JSZip from "jszip";
import type { Deck } from "@/lib/slide-types";
import { snapshotDeck } from "./render-deck";

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function deckFileName(deck: Deck, ext: string): string {
    const company = slugify(deck.companyName || "cliente");
    const program = slugify(deck.programName || "programa");
    return `30x-${company}-${program}.${ext}`;
}

function triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================
// PDF — 16:9 landscape, one slide per page, 1920×1080 snapshot
// ============================================================

export async function exportDeckAsPdf(
    deck: Deck,
    onProgress?: (i: number, total: number) => void,
): Promise<void> {
    const snapshots = await snapshotDeck(deck, onProgress);
    if (snapshots.length === 0) return;

    const format = deck.format ?? "proposal";

    // PDF page size per format (inches). jsPDF uses PDF points but `unit: "in"` accepts inches.
    const pageSizes: Record<string, { w: number; h: number; orientation: "landscape" | "portrait" }> = {
        proposal: { w: 13.333, h: 7.5, orientation: "landscape" },
        "carousel-ig": { w: 8, h: 8, orientation: "portrait" },
        "story-ig": { w: 5.625, h: 10, orientation: "portrait" },
        doc: { w: 8.27, h: 11.69, orientation: "portrait" }, // A4
    };
    const page = pageSizes[format] ?? pageSizes.proposal;

    const pdf = new jsPDF({
        orientation: page.orientation,
        unit: "in",
        format: [page.w, page.h],
        compress: true,
    });

    for (let i = 0; i < snapshots.length; i++) {
        const s = snapshots[i];
        if (i > 0) pdf.addPage([page.w, page.h], page.orientation);
        pdf.addImage(s.dataUrl, "PNG", 0, 0, page.w, page.h, undefined, "FAST");
    }

    pdf.save(deckFileName(deck, "pdf"));
}

// ============================================================
// Send to Canva — manual handoff (no OAuth required)
//
// Flow: download the PDF locally, then open Canva's "Import file"
// page in a new tab. The user drags the downloaded PDF onto that page
// and Canva creates an editable design.
//
// This is the fallback that works for every user without any API
// credentials. When Canva Partners approval lands + CANVA_OAUTH_ENABLED
// is flipped on, the "Abrir en Canva" flow (in <CanvaExportPanel/>)
// takes over and skips the manual drag step entirely.
// ============================================================

export const CANVA_IMPORT_URL = "https://www.canva.com/create/presentations/";

export async function exportDeckAsPdfToCanvaFlow(
    deck: Deck,
    onProgress?: (i: number, total: number) => void,
): Promise<void> {
    await exportDeckAsPdf(deck, onProgress);
    window.open(CANVA_IMPORT_URL, "_blank", "noopener,noreferrer");
}

// Back-compat export — older code paths still import the old name.
export const exportDeckToCanva = exportDeckAsPdfToCanvaFlow;

// ============================================================
// Standalone HTML — one file with all slides, self-contained
// ============================================================

async function fetchAsDataUrl(url: string): Promise<string | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function exportDeckAsHtml(
    deck: Deck,
    onProgress?: (i: number, total: number) => void,
): Promise<void> {
    const snapshots = await snapshotDeck(deck, onProgress);
    // Embed each snapshot as a data URL in a self-contained HTML
    const slidesHtml = snapshots
        .map(
            (s, i) => `
    <section class="slide" aria-label="Slide ${i + 1}">
      <img src="${s.dataUrl}" alt="Slide ${i + 1}" />
    </section>`,
        )
        .join("");

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${deck.deckTitle} · 30X</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; }
  body { min-height: 100vh; overflow-x: hidden; }
  .deck { display: flex; flex-direction: column; gap: 24px; padding: 24px; max-width: 1400px; margin: 0 auto; }
  .slide { width: 100%; aspect-ratio: 16/9; background: #000; border: 1px solid #222; box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden; }
  .slide img { width: 100%; height: 100%; display: block; object-fit: cover; }
  .hdr { display: flex; justify-content: space-between; align-items: baseline; padding: 32px 24px 0; max-width: 1400px; margin: 0 auto; }
  .hdr h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 0; color: #fff; }
  .hdr .tag { font-size: 12px; color: #8a8a8a; letter-spacing: 0.04em; text-transform: uppercase; }
  .footer { padding: 24px; text-align: center; color: #555; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
  @media print {
    body { background: #fff; }
    .hdr, .footer { display: none; }
    .deck { padding: 0; gap: 0; max-width: none; }
    .slide { page-break-after: always; border: none; box-shadow: none; aspect-ratio: auto; width: 100vw; height: 100vh; }
  }
</style>
</head>
<body>
  <header class="hdr">
    <h1>${deck.deckTitle}</h1>
    <span class="tag">${deck.companyName} · ${deck.programName}</span>
  </header>
  <main class="deck">${slidesHtml}
  </main>
  <footer class="footer">30X · La mejor educación ejecutiva de Latinoamérica</footer>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    triggerDownload(blob, deckFileName(deck, "html"));
}

// ============================================================
// ZIP — HTML + PNGs + deck.json
// ============================================================

export async function exportDeckAsZip(
    deck: Deck,
    onProgress?: (i: number, total: number) => void,
): Promise<void> {
    const snapshots = await snapshotDeck(deck, onProgress);
    const zip = new JSZip();

    // deck.json
    zip.file("deck.json", JSON.stringify(deck, null, 2));

    // slides folder
    const slidesFolder = zip.folder("slides");
    snapshots.forEach((s, i) => {
        const base64 = s.dataUrl.split(",")[1];
        slidesFolder?.file(
            `slide-${String(i + 1).padStart(2, "0")}.png`,
            base64,
            { base64: true },
        );
    });

    // A simple index.html referencing the PNGs
    const slidesListHtml = snapshots
        .map(
            (_s, i) => `
    <section class="slide">
      <img src="slides/slide-${String(i + 1).padStart(2, "0")}.png" alt="Slide ${i + 1}" />
    </section>`,
        )
        .join("");

    const indexHtml = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${deck.deckTitle} · 30X</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .deck { display: flex; flex-direction: column; gap: 24px; padding: 24px; max-width: 1400px; margin: 0 auto; }
  .slide { width: 100%; aspect-ratio: 16/9; background: #000; border: 1px solid #222; overflow: hidden; }
  .slide img { width: 100%; height: 100%; display: block; object-fit: cover; }
  @media print {
    .deck { padding: 0; gap: 0; max-width: none; }
    .slide { page-break-after: always; border: none; aspect-ratio: auto; width: 100vw; height: 100vh; }
  }
</style>
</head>
<body>
  <main class="deck">${slidesListHtml}
  </main>
</body>
</html>`;
    zip.file("index.html", indexHtml);

    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, deckFileName(deck, "zip"));
}
