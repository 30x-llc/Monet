/**
 * Client-side deck renderer for PDF / PNG export.
 *
 * Mounts each slide at its native canvas size (derived from deck.format),
 * waits for fonts + images, then snapshots each one to a PNG data URL.
 */

"use client";

import { createRoot, type Root } from "react-dom/client";
import { toPng } from "html-to-image";
import type { Deck } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";
import { SlideRenderer } from "@/components/slides/deck-slides";
import { SlideStage } from "@/components/slides/slide-stage";

async function waitForImages(el: HTMLElement): Promise<void> {
    const imgs = Array.from(el.querySelectorAll("img"));
    await Promise.all(
        imgs.map(
            (img) =>
                new Promise<void>((resolve) => {
                    if (img.complete && img.naturalWidth > 0) {
                        resolve();
                        return;
                    }
                    const done = () => resolve();
                    img.addEventListener("load", done, { once: true });
                    img.addEventListener("error", done, { once: true });
                }),
        ),
    );
}

export interface DeckSnapshot {
    dataUrl: string;
    width: number;
    height: number;
}

export async function snapshotDeck(
    deck: Deck,
    onProgress?: (index: number, total: number) => void,
): Promise<DeckSnapshot[]> {
    const spec = FORMATS[deck.format ?? "proposal"];
    const W = spec.width;
    const H = spec.height;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-30000px";
    container.style.left = "0";
    container.style.width = `${W}px`;
    container.style.height = `${H}px`;
    container.style.overflow = "hidden";
    container.style.zIndex = "-1";
    document.body.appendChild(container);

    try {
        await document.fonts?.ready;
    } catch {}

    const snapshots: DeckSnapshot[] = [];
    let root: Root | null = null;

    try {
        for (let i = 0; i < deck.slides.length; i++) {
            const slide = deck.slides[i];

            const slideHost = document.createElement("div");
            slideHost.style.width = `${W}px`;
            slideHost.style.height = `${H}px`;
            slideHost.style.position = "relative";
            container.replaceChildren(slideHost);

            root = createRoot(slideHost);
            root.render(
                <SlideStage format={deck.format ?? "proposal"}>
                    <SlideRenderer
                        slide={slide}
                        clientLogoUrl={deck.clientLogoUrl}
                        pageIndex={i + 1}
                    />
                </SlideStage>,
            );

            await new Promise((r) => requestAnimationFrame(() => r(null)));
            await new Promise((r) => setTimeout(r, 120));
            await waitForImages(slideHost);
            await new Promise((r) => setTimeout(r, 60));

            const dataUrl = await toPng(slideHost, {
                width: W,
                height: H,
                pixelRatio: 1.5,
                cacheBust: true,
                backgroundColor: "#000000",
                style: { transform: "none" },
            });

            snapshots.push({ dataUrl, width: W, height: H });
            onProgress?.(i + 1, deck.slides.length);

            root.unmount();
            root = null;
        }
    } finally {
        if (root) {
            try {
                root.unmount();
            } catch {}
        }
        container.remove();
    }

    return snapshots;
}
