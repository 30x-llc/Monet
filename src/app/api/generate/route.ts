import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getGeneratorPrompt } from "@/lib/prompts/generator";
import type {
    ResearchResult,
    IntakeAnswers,
    ProjectFormat,
    Deck,
} from "@/lib/slide-types";

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
): Promise<Deck> {
    const maxRetries = 3;
    let lastError: unknown;
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
                messages: [{ role: "user", content: userMessage }],
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

        if (resolvedFormat === "proposal" && (!research || !program)) {
            return Response.json(
                {
                    ok: false,
                    error: "Para propuestas, research y programa son requeridos",
                },
                { status: 400 },
            );
        }

        const client = new Anthropic();
        const systemPrompt = getGeneratorPrompt({
            format: resolvedFormat,
            programId: program,
            corporateMode,
            topic,
        });

        let userMessage = `Genera un proyecto de formato "${resolvedFormat}" con ~${slideCount} slides. Llama la herramienta save_deck con el resultado final.`;

        if (research) {
            userMessage += `\n\nCLIENTE: ${research.companyName}\n\nRESEARCH DE LA EMPRESA:\n${JSON.stringify(research, null, 2)}`;
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

        const deck = await generateDeck(client, systemPrompt, userMessage);
        return Response.json({ ok: true, deck });
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
