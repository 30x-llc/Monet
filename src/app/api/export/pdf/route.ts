import type { NextRequest } from "next/server";
import type { Browser } from "puppeteer-core";
import { renderDeckHtml } from "@/lib/export/render-deck-html-ssr";
import type { Deck } from "@/lib/slide-types";
import { FORMATS } from "@/lib/slide-types";

// Chromium is heavy — keep the route as a Node.js function and give it
// headroom. Chromium launch + 9-slide render usually lands well under
// 90s but network-idle waits for assets can push it.
export const runtime = "nodejs";
export const maxDuration = 300;

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
 * POST /api/export/pdf
 *
 * Body: Deck JSON (the same shape the editor stores locally).
 *
 * Flow: render the deck to a self-contained HTML document via
 * renderDeckHtml, launch Chromium, setContent(html) with networkidle0
 * so mentor portraits + portada + logos finish loading, then page.pdf()
 * at the format's native canvas size. Returns the PDF binary with a
 * download filename derived from deckTitle.
 *
 * On Vercel we use puppeteer-core + @sparticuz/chromium because the
 * full puppeteer bundle ships Chromium and blows past the function
 * size limit. Locally we prefer the system Chrome/Chromium if the dev
 * exposes LOCAL_CHROMIUM_PATH, otherwise we still use @sparticuz which
 * works on macOS too for smoke-testing.
 */
export async function POST(request: NextRequest) {
    let browser: Browser | undefined;
    try {
        const deck: Deck = await request.json();

        if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
            return Response.json(
                { ok: false, error: "Deck vacío o inválido" },
                { status: 400 },
            );
        }

        // Build the absolute base URL so all /assets/... references in the
        // rendered HTML resolve. When inlined content has no origin, mentor
        // portraits would 404 and the PDF would ship with broken images.
        const url = new URL(request.url);
        const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
        const host =
            request.headers.get("x-forwarded-host") ||
            request.headers.get("host") ||
            url.host;
        const absoluteBase = `${proto}://${host}`;

        const html = await renderDeckHtml(deck, absoluteBase);

        // Lazy-import so the route still compiles for environments where
        // puppeteer isn't installed (dev first-time setup).
        const [{ default: chromium }, puppeteer] = await Promise.all([
            import("@sparticuz/chromium"),
            import("puppeteer-core"),
        ]);

        // Turbopack hashes the @sparticuz/chromium folder name on Vercel
        // (e.g. `chromium-1c0c52b587824cb1`), so the package's internal
        // `require.resolve("@sparticuz/chromium/bin")` fails. We locate
        // the bin folder by scanning node_modules/@sparticuz at runtime
        // and pass it explicitly to executablePath(). Falls back to the
        // default behavior for local dev where the folder isn't hashed.
        const executablePath =
            process.env.LOCAL_CHROMIUM_PATH || (await resolveChromiumExecutablePath(chromium));

        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        const format = deck.format ?? "proposal";
        const spec = FORMATS[format];
        await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: 1 });

        await page.setContent(html, { waitUntil: "networkidle0", timeout: 60_000 });

        const pdfBuffer = await page.pdf({
            width: `${spec.width}px`,
            height: `${spec.height}px`,
            printBackground: true,
            preferCSSPageSize: false,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        await browser.close();
        browser = undefined;

        const safeTitle = (deck.deckTitle ?? "30x-design")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);

        return new Response(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${safeTitle || "30x-design"}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[export/pdf]", err);
        try {
            await browser?.close();
        } catch {}
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: message }, { status: 500 });
    }
}
