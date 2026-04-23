import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/prompts/research";

export const maxDuration = 60;

async function callClaude(
    client: Anthropic,
    userMessage: string,
    useWebSearch: boolean,
): Promise<string> {
    const tools: Anthropic.Messages.Tool[] = useWebSearch
        ? [
              {
                  type: "web_search_20250305" as const,
                  name: "web_search",
                  max_uses: 5,
              } as unknown as Anthropic.Messages.Tool,
          ]
        : [];

    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: RESEARCH_SYSTEM_PROMPT,
        ...(tools.length > 0 ? { tools } : {}),
        messages: [{ role: "user", content: userMessage }],
    });

    const textBlocks = response.content.filter((c) => c.type === "text");
    return textBlocks.map((c) => (c as { type: "text"; text: string }).text).join("");
}

export async function POST(request: NextRequest) {
    try {
        const { companyName, notes } = await request.json();

        if (!companyName) {
            return Response.json(
                { ok: false, error: "Nombre de empresa requerido" },
                { status: 400 },
            );
        }

        const client = new Anthropic();

        const userMessage = notes
            ? `Investiga la empresa "${companyName}" para preparar una presentacion comercial de 30x.\n\nNotas adicionales del vendedor:\n${notes}`
            : `Investiga la empresa "${companyName}" para preparar una presentacion comercial de 30x.`;

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    // Try with web search first, fall back to without
                    let result: string;
                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: "text", content: "Investigando con busqueda web...\n\n" })}\n\n`,
                            ),
                        );
                        result = await callClaude(client, userMessage, true);
                    } catch (err) {
                        const errStr = String(err);
                        if (
                            errStr.includes("overloaded") ||
                            errStr.includes("529")
                        ) {
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ type: "text", content: "API sobrecargada. Investigando con conocimiento base...\n\n" })}\n\n`,
                                ),
                            );
                            // Retry without web search
                            result = await callClaude(
                                client,
                                userMessage,
                                false,
                            );
                        } else {
                            throw err;
                        }
                    }

                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "text", content: result })}\n\n`,
                        ),
                    );
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "done" })}\n\n`,
                        ),
                    );
                    controller.close();
                } catch (error) {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "error", content: String(error) })}\n\n`,
                        ),
                    );
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Error en research:", error);
        return Response.json(
            { ok: false, error: "Error investigando la empresa" },
            { status: 500 },
        );
    }
}
