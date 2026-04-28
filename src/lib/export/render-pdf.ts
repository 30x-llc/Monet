/**
 * Shared Chromium → PDF pipeline. Used by both /api/export/pdf (user
 * download) and /api/export/canva (upload to Blob → Canva import).
 */

import "server-only";
import type { Browser } from "puppeteer-core";
import { renderDeckHtml } from "@/lib/export/render-deck-html-ssr";
import type { Deck } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveChromiumExecutablePath(chromium: any): Promise<string> {
    // First attempt: let the package resolve its own bin folder.
    try {
        return await chromium.executablePath();
    } catch (err) {
        const msg = String(err);
        if (!msg.includes("does not exist")) throw err;
    }
    // Second attempt: scan common node_modules paths for a folder that
    // starts with "chromium" and contains a bin directory. Handles the
    // Turbopack hash rename on Vercel.
    const { readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const roots = [
        "/var/task/node_modules/@sparticuz",
        join(process.cwd(), "node_modules/@sparticuz"),
        join(process.cwd(), ".next/server/chunks/node_modules/@sparticuz"),
        join(process.cwd(), ".next/standalone/node_modules/@sparticuz"),
    ];
    for (const root of roots) {
        try {
            const entries = readdirSync(root);
            const match = entries.find((e) => e.startsWith("chromium"));
            if (!match) continue;
            const binPath = join(root, match, "bin");
            statSync(binPath);
            return await chromium.executablePath(binPath);
        } catch {
            // try next root
        }
    }
    throw new Error(
        "Chromium bin directory not found in any known location (Turbopack hash rename?).",
    );
}

/**
 * Render a deck to a PDF buffer. The absoluteBase must resolve all
 * /assets/... URLs inside the deck — in a route handler that's built
 * from the incoming request headers.
 */
export async function renderDeckToPdfBuffer(
    deck: Deck,
    absoluteBase: string,
): Promise<Buffer> {
    const html = await renderDeckHtml(deck, absoluteBase);

    const [{ default: chromium }, puppeteer] = await Promise.all([
        import("@sparticuz/chromium"),
        import("puppeteer-core"),
    ]);

    const executablePath =
        process.env.LOCAL_CHROMIUM_PATH ||
        (await resolveChromiumExecutablePath(chromium));

    let browser: Browser | undefined;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        const format = deck.format ?? "proposal";
        const spec = FORMATS[format];
        await page.setViewport({
            width: spec.width,
            height: spec.height,
            deviceScaleFactor: 1,
        });

        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 60_000,
        });

        const pdfBuffer = await page.pdf({
            width: `${spec.width}px`,
            height: `${spec.height}px`,
            printBackground: true,
            preferCSSPageSize: false,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        try {
            await browser?.close();
        } catch {}
    }
}

/**
 * Derive the absolute base URL from a Request so asset paths resolve.
 * Works both locally and behind Vercel's proxy.
 */
export function absoluteBaseFromRequest(request: Request): string {
    const url = new URL(request.url);
    const proto =
        request.headers.get("x-forwarded-proto") ||
        url.protocol.replace(":", "");
    const host =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        url.host;
    return `${proto}://${host}`;
}

export function safeDeckTitle(deck: Deck): string {
    return (deck.deckTitle ?? "30x-design")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

/**
 * Render each slide as a JPG buffer — used by the vision-critique
 * pipeline to show Claude what the generated deck actually LOOKS like,
 * not just what the JSON says.
 *
 * Returns one JPG per slide at `outputWidth` pixels wide (defaults to
 * 1024 — plenty for Claude vision and keeps the payload small). Each
 * image is clipped to the .print-page at its native canvas size, then
 * resized by the browser via viewport.deviceScaleFactor.
 */
export async function renderDeckToSlideScreenshots(
    deck: Deck,
    absoluteBase: string,
    opts: { outputWidth?: number; quality?: number } = {},
): Promise<Buffer[]> {
    const outputWidth = opts.outputWidth ?? 1024;
    const quality = opts.quality ?? 82;

    const html = await renderDeckHtml(deck, absoluteBase);

    const [{ default: chromium }, puppeteer] = await Promise.all([
        import("@sparticuz/chromium"),
        import("puppeteer-core"),
    ]);

    const executablePath =
        process.env.LOCAL_CHROMIUM_PATH ||
        (await resolveChromiumExecutablePath(chromium));

    let browser: Browser | undefined;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        const format = deck.format ?? "proposal";
        const spec = FORMATS[format];

        // Set viewport so the deviceScaleFactor downscales the final
        // screenshot cleanly to outputWidth. A proposal slide is
        // 1920 × 1080; we want the captured PNG at outputWidth × proportional.
        const scale = outputWidth / spec.width;
        await page.setViewport({
            width: spec.width,
            height: spec.height,
            deviceScaleFactor: scale,
        });

        await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: 60_000,
        });

        const handles = await page.$$(".print-page");
        const buffers: Buffer[] = [];
        for (const handle of handles) {
            const buf = await handle.screenshot({
                type: "jpeg",
                quality,
                optimizeForSpeed: true,
            });
            buffers.push(Buffer.from(buf));
        }
        return buffers;
    } finally {
        try {
            await browser?.close();
        } catch {}
    }
}
