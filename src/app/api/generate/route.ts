import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getGeneratorPrompt } from "@/lib/prompts/generator";
import type { ResearchResult, IntakeAnswers, ProjectFormat } from "@/lib/slide-types";

// Opus 4.7 with 8192 max_tokens for a 9-slide deck regularly exceeds 60s.
// Pro plan allows up to 300s; we cap there.
export const maxDuration = 300;

async function callClaudeWithRetry(
    client: Anthropic,
    systemPrompt: string,
    userMessage: string,
): Promise<string> {
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                await new Promise((r) =>
                    setTimeout(r, 2000 * Math.pow(2, attempt)),
                );
            }
            const response = await client.messages.create({
                model: "claude-opus-4-7",
                max_tokens: 8192,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }],
            });
            const textBlocks = response.content.filter(
                (c) => c.type === "text",
            );
            return textBlocks
                .map((c) => (c as { type: "text"; text: string }).text)
                .join("");
        } catch (error) {
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
    throw new Error("Max retries exceeded");
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
                { ok: false, error: "Para propuestas, research y programa son requeridos" },
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

        let userMessage = `Genera un proyecto de formato "${resolvedFormat}" con ~${slideCount} slides.`;

        if (research) {
            userMessage += `

CLIENTE: ${research.companyName}

RESEARCH DE LA EMPRESA:
${JSON.stringify(research, null, 2)}`;
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

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "text", content: "Generando presentacion...\n\n" })}\n\n`,
                        ),
                    );

                    const result = await callClaudeWithRetry(
                        client,
                        systemPrompt,
                        userMessage,
                    );

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
        console.error("Error generando deck:", error);
        return Response.json(
            { ok: false, error: "Error generando la presentacion" },
            { status: 500 },
        );
    }
}
