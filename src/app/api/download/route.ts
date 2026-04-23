import { NextRequest, NextResponse } from "next/server";
import { buildDeckPptx } from "@/lib/pptx/builder";
import type { Deck } from "@/lib/slide-types";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
    try {
        const deck: Deck = await request.json();

        if (!deck.slides || deck.slides.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No hay slides en el deck" },
                { status: 400 },
            );
        }

        const buffer = await buildDeckPptx(deck);
        const bytes = new Uint8Array(buffer);

        const fileName = `30x-${deck.companyName.toLowerCase().replace(/\s+/g, "-")}-${deck.programName.toLowerCase()}.pptx`;

        return new NextResponse(bytes, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Error generando PPTX:", error);
        return NextResponse.json(
            { ok: false, error: "Error generando el archivo PPTX" },
            { status: 500 },
        );
    }
}
