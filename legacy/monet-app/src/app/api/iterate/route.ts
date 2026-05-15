import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ITERATOR_SYSTEM_PROMPT } from "@/lib/prompts/iterator";
import type { Deck } from "@/lib/slide-types";
import { sanitizeDeck, stripDashes } from "@/lib/sanitize-deck";

export const maxDuration = 60;

// Same pattern as /api/generate — force JSON via a tool call so the model
// can't wrap the deck in prose, markdown fences, or apology text. The old
// regex-extract approach kept breaking on "Aquí está el deck actualizado:"
// preambles and on nested ```json blocks inside slide bodies.
const ITERATE_TOOL: Anthropic.Messages.Tool = {
    name: "save_deck",
    description:
        "Guarda el deck modificado como datos estructurados. Llama esta herramienta UNA sola vez con el deck completo actualizado.",
    input_schema: {
        type: "object",
        properties: {
            summary: {
                type: "string",
                description:
                    "Mensaje breve para el usuario (1 frase, max 12 palabras) describiendo el cambio en español neutro. Ej: 'Cambié el headline a X', 'Agregué una slide de testimonios', 'Actualicé el logo'.",
            },
            deckTitle: { type: "string" },
            companyName: { type: "string" },
            programName: { type: "string" },
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
                items: {
                    type: "object",
                    properties: { type: { type: "string" } },
                    required: ["type"],
                    additionalProperties: true,
                },
            },
        },
        required: ["summary", "deckTitle", "companyName", "programName", "slides"],
    },
};

export async function POST(request: NextRequest) {
    try {
        const { deck, instruction }: { deck: Deck; instruction: string } =
            await request.json();

        if (!deck || !instruction) {
            return Response.json(
                { ok: false, error: "Deck e instruccion requeridos" },
                { status: 400 },
            );
        }

        const client = new Anthropic();

        let response: Anthropic.Messages.Message | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                if (attempt > 0)
                    await new Promise((r) =>
                        setTimeout(r, 2000 * Math.pow(2, attempt)),
                    );
                response = await client.messages.create({
                    model: "claude-opus-4-7",
                    max_tokens: 8192,
                    system: ITERATOR_SYSTEM_PROMPT,
                    tools: [ITERATE_TOOL],
                    tool_choice: { type: "tool", name: "save_deck" },
                    messages: [
                        {
                            role: "user",
                            content: `DECK ACTUAL:\n${JSON.stringify(deck, null, 2)}\n\nINSTRUCCION:\n${instruction}\n\nLlama save_deck con el deck completo modificado según la instrucción. Preserva todos los slides que no cambien.`,
                        },
                    ],
                });
                break;
            } catch (err) {
                const errStr = String(err);
                if (
                    (errStr.includes("overloaded") ||
                        errStr.includes("529")) &&
                    attempt < 2
                )
                    continue;
                throw err;
            }
        }
        if (!response) throw new Error("No response after retries");

        const toolUse = response.content.find(
            (c) => c.type === "tool_use" && c.name === "save_deck",
        ) as Anthropic.Messages.ToolUseBlock | undefined;

        if (!toolUse) {
            const dump = response.content
                .filter((c) => c.type === "text")
                .map((c) => (c as { type: "text"; text: string }).text)
                .join("\n")
                .slice(0, 400);
            return Response.json(
                {
                    ok: false,
                    error: `El modelo no llamó save_deck. Texto: ${dump || "(vacío)"}`,
                },
                { status: 500 },
            );
        }

        const input = toolUse.input as Record<string, unknown>;
        const rawSummary =
            typeof input.summary === "string" ? input.summary : "Listo, ya lo cambié.";
        const { summary: _ignored, ...deckPayload } = input;
        void _ignored;
        const updatedDeck = sanitizeDeck(deckPayload as unknown as Deck);
        return Response.json({
            ok: true,
            deck: updatedDeck,
            summary: stripDashes(rawSummary),
        });
    } catch (error) {
        console.error("Error iterando deck:", error);
        return Response.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Error modificando la presentacion",
            },
            { status: 500 },
        );
    }
}
