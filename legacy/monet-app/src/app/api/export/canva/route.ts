import type { NextRequest } from "next/server";
import { put as blobPut, del as blobDel } from "@vercel/blob";
import type { Deck } from "@/lib/slide-types";
import {
    absoluteBaseFromRequest,
    renderDeckToPdfBuffer,
    safeDeckTitle,
} from "@/lib/export/render-pdf";
import { isCanvaOAuthEnabled } from "@/lib/canva/config";
import { readSessionId } from "@/lib/session/session";
import { getFreshAccessToken } from "@/lib/canva/token-store";
import { importDesign, pollImportJob } from "@/lib/canva/client";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/export/canva
 *
 * Body: Deck JSON.
 * Returns:
 *   200 { ok: true, editUrl, viewUrl, designId }
 *   401 { ok: false, needsAuth: true, connectUrl } — user must OAuth first
 *   503 { ok: false, error } — Canva OAuth not configured in this env
 *
 * Pipeline:
 *   1. Validate OAuth is enabled + user is connected
 *   2. Render deck → PDF buffer (reuses /api/export/pdf pipeline)
 *   3. Upload PDF to Vercel Blob (24h TTL)
 *   4. Canva imports from the Blob URL
 *   5. Poll until import finishes → return editUrl
 *   6. Clean up the Blob (Canva already has the design)
 */
export async function POST(request: NextRequest) {
    if (!isCanvaOAuthEnabled()) {
        return Response.json(
            {
                ok: false,
                error: "Canva OAuth no habilitado. Usa la descarga manual de PDF mientras el admin configura la integración.",
            },
            { status: 503 },
        );
    }

    const sessionId = await readSessionId();
    if (!sessionId) {
        return Response.json(
            {
                ok: false,
                needsAuth: true,
                connectUrl: "/api/canva/connect?returnTo=" + encodeURIComponent(request.headers.get("referer") || "/"),
            },
            { status: 401 },
        );
    }

    const accessToken = await getFreshAccessToken(sessionId);
    if (!accessToken) {
        return Response.json(
            {
                ok: false,
                needsAuth: true,
                connectUrl: "/api/canva/connect?returnTo=" + encodeURIComponent(request.headers.get("referer") || "/"),
            },
            { status: 401 },
        );
    }

    let blobUrl: string | undefined;
    try {
        const deck: Deck = await request.json();
        if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
            return Response.json(
                { ok: false, error: "Deck vacío o inválido" },
                { status: 400 },
            );
        }

        const absoluteBase = absoluteBaseFromRequest(request);
        const pdf = await renderDeckToPdfBuffer(deck, absoluteBase);

        // Canva's max import size is ~25MB. Our PDFs with photos land
        // around 2–8MB, but guard anyway.
        if (pdf.byteLength > 25 * 1024 * 1024) {
            return Response.json(
                {
                    ok: false,
                    error: "El deck genera un PDF > 25MB — reduce slides o imágenes.",
                },
                { status: 413 },
            );
        }

        const fileName = `canva-exports/${safeDeckTitle(deck)}-${Date.now()}.pdf`;
        const uploaded = await blobPut(fileName, pdf, {
            access: "public",
            contentType: "application/pdf",
            // Canva fetches the blob once; add a random suffix so parallel
            // exports from the same deck don't collide.
            addRandomSuffix: true,
        });
        blobUrl = uploaded.url;

        const jobId = await importDesign({
            accessToken,
            sourceUrl: blobUrl,
            title: deck.deckTitle || "30x deck",
            mimeType: "application/pdf",
        });

        // Poll with a generous budget. Typical import lands in 10–20s;
        // big decks can take up to 60.
        const deadline = Date.now() + 120_000;
        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 1500));
            const status = await pollImportJob(accessToken, jobId);
            if (status.status === "failed") {
                return Response.json(
                    { ok: false, error: status.error || "Canva rechazó el import" },
                    { status: 502 },
                );
            }
            if (status.status === "success" && status.design) {
                return Response.json({
                    ok: true,
                    designId: status.design.id,
                    editUrl: status.design.urls.edit_url,
                    viewUrl: status.design.urls.view_url,
                });
            }
        }
        return Response.json(
            { ok: false, error: "Canva import demoró más de 120s — reintenta." },
            { status: 504 },
        );
    } catch (err) {
        console.error("[export/canva]", err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: message }, { status: 500 });
    } finally {
        // Best-effort cleanup — Canva has already fetched it.
        if (blobUrl) {
            try {
                await blobDel(blobUrl);
            } catch {}
        }
    }
}
