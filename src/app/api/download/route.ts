import { NextRequest, NextResponse } from "next/server";
import { buildDeckPptx } from "@/lib/pptx/builder";
import { absoluteBaseFromRequest } from "@/lib/export/render-pdf";
import type { Deck } from "@/lib/slide-types";

// PPTX export now goes through puppeteer (Chromium) → image-per-slide,
// so the budget needs to match /api/export/pdf.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
    try {
        const deck: Deck = await request.json();

        if (!deck.slides || deck.slides.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No hay slides en el deck" },
                { status: 400 },
            );
        }

        const absoluteBase = absoluteBaseFromRequest(request);
        const buffer = await buildDeckPptx(deck, absoluteBase);
        const bytes = new Uint8Array(buffer);

        const safeCompany = (deck.companyName || "30x")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const safeProgram = (deck.programName || "deck")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const fileName = `30x-${safeCompany}-${safeProgram}.pptx`;

        return new NextResponse(bytes, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Error generando PPTX:", error);
        const message =
            error instanceof Error ? error.message : "Error generando el archivo PPTX";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
