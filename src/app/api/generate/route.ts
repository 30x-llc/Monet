import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getGeneratorPrompt } from "@/lib/prompts/generator";
import type {
    ResearchResult,
    IntakeAnswers,
    ProjectFormat,
    Deck,
    Slide,
} from "@/lib/slide-types";
import { enrichCompany } from "@/lib/company-enrichment";
import { pickReferenceImages } from "@/lib/reference-decks";
import { sanitizeDeck } from "@/lib/sanitize-deck";

// Opus 4.7 with 8192 max_tokens for a 9-slide deck regularly exceeds 60s.
// Pro plan allows up to 300s; we cap there.
export const maxDuration = 300;

// Same idea as /api/research — force the deck out via a tool_use with an
// input_schema so Anthropic validates the JSON for us. Previously we streamed
// free-form text and parsed with a regex, which blew up whenever the model
// left unescaped quotes, code fences, or partial output inside a slide.
//
// The slides array stays loosely typed (`items: { type: "object" }`) because
// each slide type has its own shape (cover-hero, curriculum-grid, impact, …)
// and keeping the schema permissive avoids rejecting valid decks the model
// produces. The outer structure is what broke parsing before, and that's
// what the schema pins down.
const DECK_TOOL: Anthropic.Messages.Tool = {
    name: "save_deck",
    description:
        "Guarda el deck generado como datos estructurados. Llama esta herramienta UNA sola vez con el deck completo.",
    input_schema: {
        type: "object",
        properties: {
            deckTitle: { type: "string", description: "Título del deck" },
            companyName: {
                type: "string",
                description: "Nombre del cliente/empresa",
            },
            programName: {
                type: "string",
                description: "Nombre del programa 30x",
            },
            programId: { type: "string" },
            clientLogoUrl: { type: "string" },
            format: {
                type: "string",
                enum: [
                    "proposal",
                    "carousel-ig",
                    "story-ig",
                    "doc",
                    "prototype",
                    "other",
                ],
            },
            theme: { type: "string", enum: ["dark", "light"] },
            slides: {
                type: "array",
                description:
                    "Lista de slides. Cada slide tiene un campo 'type' que determina su shape (cover-hero, corporate-cover, problem-cards, diagnostic, curriculum-grid, mentor-grid, mentor-duo, methodology, impact, pricing-cta, content, cover-globe, intro-mentors, ig-cover, ig-text, ig-stat, ig-quote, ig-cta, story-cover, story-text, doc-cover, doc-section).",
                items: {
                    type: "object",
                    properties: { type: { type: "string" } },
                    required: ["type"],
                    additionalProperties: true,
                },
            },
        },
        required: ["deckTitle", "companyName", "programName", "slides"],
    },
};

async function generateDeck(
    client: Anthropic,
    systemPrompt: string,
    userMessage: string,
    referenceImages: Awaited<ReturnType<typeof pickReferenceImages>>,
): Promise<Deck> {
    const maxRetries = 3;
    let lastError: unknown;
    // Build the user message content. If we have reference images,
    // prepend them to the text so Claude sees the visual language of
    // real 30x decks before reading the instruction.
    const userContent: Anthropic.Messages.ContentBlockParam[] = [];
    if (referenceImages.length > 0) {
        userContent.push({
            type: "text",
            text: "REFERENCIAS VISUALES — así se ven decks reales de 30x (tipografía, layouts, grids, manejo de foto, densidad de texto, uso de logos). Adapta tu diseño a este lenguaje visual, aunque la paleta sea light mode:",
        });
        for (const img of referenceImages) {
            userContent.push({
                type: "image",
                source: {
                    type: "base64",
                    media_type: img.mediaType,
                    data: img.base64,
                },
            });
            if (img.note) {
                userContent.push({ type: "text", text: `↑ ${img.note}` });
            }
        }
        userContent.push({
            type: "text",
            text: "--- Fin de referencias visuales ---",
        });
    }
    userContent.push({ type: "text", text: userMessage });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
        }
        try {
            const response = await client.messages.create({
                model: "claude-opus-4-7",
                max_tokens: 8192,
                system: systemPrompt,
                tools: [DECK_TOOL],
                tool_choice: { type: "tool", name: "save_deck" },
                messages: [{ role: "user", content: userContent }],
            });

            const toolUse = response.content.find(
                (c) => c.type === "tool_use" && c.name === "save_deck",
            ) as Anthropic.Messages.ToolUseBlock | undefined;

            if (!toolUse) {
                const dump = response.content
                    .filter((c) => c.type === "text")
                    .map((c) => (c as { type: "text"; text: string }).text)
                    .join("\n")
                    .slice(0, 400);
                throw new Error(
                    `El modelo no llamó save_deck. Texto: ${dump || "(vacío)"}`,
                );
            }
            return toolUse.input as unknown as Deck;
        } catch (error) {
            lastError = error;
            const errStr = String(error);
            if (
                (errStr.includes("overloaded") || errStr.includes("529")) &&
                attempt < maxRetries - 1
            ) {
                continue;
            }
            throw error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Max retries exceeded");
}

/**
 * Rough list of slide types the generator is expected to produce for
 * each format. Used ONLY to pick reference images — we don't actually
 * enforce this on the output.
 */
function expectedSlideTypesFor(
    format: ProjectFormat,
    corporateMode: boolean | undefined,
): string[] {
    switch (format) {
        case "proposal":
            return corporateMode
                ? [
                      "corporate-cover",
                      "diagnostic",
                      "intro-mentors",
                      "methodology",
                      "curriculum-grid",
                      "mentor-grid",
                      "impact",
                      "pricing-cta",
                      "cover-globe",
                  ]
                : [
                      "cover-hero",
                      "intro-mentors",
                      "curriculum-grid",
                      "pricing-cta",
                      "cover-globe",
                  ];
        case "carousel-ig":
            return ["ig-cover", "ig-text", "ig-stat", "ig-quote", "ig-cta"];
        case "story-ig":
            return ["story-cover", "story-text"];
        case "doc":
            return ["doc-cover", "doc-section"];
        default:
            return ["content"];
    }
}

/**
 * After the model returns a deck, force-inject:
 *   • clientLogoUrl on the deck root (rendered top-right on every slide)
 *   • heroImageUrl on the first cover slide (corporate-cover / cover-hero)
 *   • theme default: proposals default to "light" unless the intake asked
 *     for dark explicitly
 *
 * We do this server-side instead of trusting the model because Claude
 * consistently forgets to pass research URLs back into the deck schema.
 */
function postProcessDeck(
    deck: Deck,
    research: ResearchResult | undefined,
    format: ProjectFormat,
    intake: IntakeAnswers | undefined,
): Deck {
    const slides: Slide[] = Array.isArray(deck.slides) ? [...deck.slides] : [];

    // 1. Client logo on every slide (via deck root). If research didn't
    //    return one, enrich from the company name.
    let clientLogoUrl = deck.clientLogoUrl || research?.logoUrl;
    if (!clientLogoUrl && deck.companyName && deck.companyName !== "30X") {
        clientLogoUrl = enrichCompany(deck.companyName).logoUrl;
    }

    // 2. First cover slide gets the hero image. Corporate-cover is the
    //    canonical flattering layout; cover-hero also accepts it.
    const heroImage = research?.heroImageUrl;
    if (heroImage && slides.length > 0) {
        const first = slides[0] as { type?: string; backgroundImage?: string };
        if (
            (first.type === "corporate-cover" || first.type === "cover-hero") &&
            !first.backgroundImage
        ) {
            slides[0] = { ...first, backgroundImage: heroImage } as Slide;
        }
    }

    // 3. Theme default. Per Juan Diego (abril 2026): every deck ships
    //    in LIGHT mode unless the intake explicitly asks for dark. The
    //    model's own theme field is ignored — it guesses wrong too often.
    const theme: "dark" | "light" =
        intake?.theme === "dark" ? "dark" : "light";

    return {
        ...deck,
        slides,
        clientLogoUrl,
        theme,
        format,
    };
}

export async function POST(request: NextRequest) {
    try {
        const {
            research,
            program,
            slideCount,
            notes,
            intake,
            corporateMode,
            format,
            topic,
        }: {
            research?: ResearchResult;
            program?: string;
            slideCount: number;
            notes?: string;
            intake?: IntakeAnswers;
            corporateMode?: boolean;
            format?: ProjectFormat;
            topic?: string;
        } = await request.json();

        const resolvedFormat: ProjectFormat = format ?? "proposal";

        // Program is optional: if the user didn't pick one, the generator
        // prompt falls back to the full 30x catalog and lets Claude choose
        // the right program from the topic/intake context. Research is also
        // optional — a proposal without a company name (speaker deck, marca,
        // partnership generic) skips the /api/research step entirely and
        // uses the intake + topic instead.

        const client = new Anthropic();
        const systemPrompt = getGeneratorPrompt({
            format: resolvedFormat,
            programId: program,
            corporateMode,
            topic,
        });

        let userMessage = `Genera un proyecto de formato "${resolvedFormat}" con ~${slideCount} slides. Llama la herramienta save_deck con el resultado final.`;

        if (research) {
            userMessage += `\n\nCLIENTE: ${research.companyName}\n\nRESEARCH DE LA EMPRESA (ya revisado por el vendedor):\n${JSON.stringify(research, null, 2)}`;

            // Call notes are the vendor's own intel — the stuff web_search
            // can't find. Surface it above the rest so the model weighs it
            // heavily in the pitch. The intake may be generic; callNotes
            // is specific to this deal.
            if (research.callNotes) {
                userMessage += `\n\nNOTAS DEL CALL (prioritario — esto lo dijo el cliente en la conversación, úsalo para guiar el ángulo y el detalle):\n${research.callNotes}`;
            }
            if (research.positioning) {
                userMessage += `\n\nÁNGULO DEL PITCH (úsalo literalmente en la portada corporativa):\n${research.positioning}`;
            }
        }
        if (topic) {
            userMessage += `\n\nTEMA/BRIEF:\n${topic}`;
        }
        if (intake) {
            userMessage += `\n\nRESPUESTAS DEL INTAKE (del vendedor):\n${JSON.stringify(intake, null, 2)}`;
        }
        if (notes) {
            userMessage += `\n\nNOTAS DEL VENDEDOR:\n${notes}`;
        }

        // Pick reference images based on the expected slide types for
        // this format. Covers + content for proposals, ig for carousel,
        // etc. Claude sees these via vision and adapts its layout
        // choices to 30x's real design language.
        const expectedSlideTypes = expectedSlideTypesFor(resolvedFormat, corporateMode);
        const referenceImages =
            resolvedFormat === "proposal"
                ? await pickReferenceImages(expectedSlideTypes, 5)
                : [];

        const deck = await generateDeck(
            client,
            systemPrompt,
            userMessage,
            referenceImages,
        );
        const processed = postProcessDeck(deck, research, resolvedFormat, intake);
        const finalDeck = sanitizeDeck(processed);
        return Response.json({ ok: true, deck: finalDeck });
    } catch (error) {
        console.error("[generate]", error);
        return Response.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
