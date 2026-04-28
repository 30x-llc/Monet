import type { NextRequest } from "next/server";
import type { Deck } from "@/lib/slide-types";
import { runVisionCritique } from "@/lib/critique/critique";
import { absoluteBaseFromRequest } from "@/lib/export/render-pdf";

// Critique = puppeteer render of N slides + Claude Opus vision call.
// Renders dominate latency; budget similar to /api/export/pdf.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/critique
 *
 * Body: Deck JSON.
 * Returns:
 *   200 { ok: true, deck: PolishedDeck, summary, edits }
 *
 * Renders each slide → vision-critiques against 30x reference decks →
 * applies structured edits → returns polished deck. Non-destructive on
 * the client side; the editor receives the new deck and can choose to
 * apply or discard.
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
        const result = await runVisionCritique(deck, absoluteBase);

        return Response.json({
            ok: true,
            deck: result.polishedDeck,
            summary: result.summary,
            edits: result.edits,
        });
    } catch (err) {
        console.error("[critique]", err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: message }, { status: 500 });
    }
}
