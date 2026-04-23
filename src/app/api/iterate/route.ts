import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ITERATOR_SYSTEM_PROMPT } from "@/lib/prompts/iterator";
import type { Deck } from "@/lib/slide-types";

export const maxDuration = 60;

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
                    messages: [
                        {
                            role: "user",
                            content: `DECK ACTUAL:\n${JSON.stringify(deck, null, 2)}\n\nINSTRUCCION:\n${instruction}`,
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

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
            return Response.json(
                { ok: false, error: "No se recibio respuesta del modelo" },
                { status: 500 },
            );
        }

        // Extract JSON from the response (may be wrapped in markdown code block)
        let jsonText = textContent.text.trim();
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
        }

        const updatedDeck: Deck = JSON.parse(jsonText);

        return Response.json({ ok: true, deck: updatedDeck });
    } catch (error) {
        console.error("Error iterando deck:", error);
        return Response.json(
            { ok: false, error: "Error modificando la presentacion" },
            { status: 500 },
        );
    }
}
