import type { NextRequest } from "next/server";
import type { Deck } from "@/lib/slide-types";
import {
    absoluteBaseFromRequest,
    renderDeckToPdfBuffer,
    safeDeckTitle,
} from "@/lib/export/render-pdf";

// Chromium is heavy — keep the route as a Node.js function and give it
// headroom. Chromium launch + 9-slide render usually lands well under
// 90s but network-idle waits for assets can push it.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/export/pdf
 *
 * Body: Deck JSON (the same shape the editor stores locally).
 * Returns: PDF binary with a download filename derived from deckTitle.
 */
export async function POST(request: NextRequest) {
    try {
        const deck: Deck = await request.json();

        if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
            return Response.json(
                { ok: false, error: "Deck vacío o inválido" },
                { status: 400 },
            );
        }

        const absoluteBase = absoluteBaseFromRequest(request);
        const pdfBuffer = await renderDeckToPdfBuffer(deck, absoluteBase);
        const fileName = safeDeckTitle(deck);

        return new Response(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName || "monet"}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[export/pdf]", err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: message }, { status: 500 });
    }
}
