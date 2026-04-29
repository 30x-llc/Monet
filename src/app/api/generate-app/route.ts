import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { APP_GENERATOR_SYSTEM } from "@/lib/prompts/app-generator";

export const maxDuration = 90;

const APP_TOOL: Anthropic.Messages.Tool = {
    name: "save_design",
    description:
        "Guarda el diseño HTML generado y un mensaje breve de resumen.",
    input_schema: {
        type: "object",
        properties: {
            html: {
                type: "string",
                description:
                    "Documento HTML completo, empieza con <!DOCTYPE html> y termina con </html>. Incluye Tailwind CDN, Inter font, y el diseño completo renderizable en un iframe sandbox.",
            },
            title: {
                type: "string",
                description: "Título corto del diseño, 3-6 palabras.",
            },
            summary: {
                type: "string",
                description:
                    "Una frase en español describiendo qué construiste. Máximo 14 palabras. Tono de diseñador senior, no chatbot.",
            },
        },
        required: ["html", "title", "summary"],
    },
};

export async function POST(req: NextRequest) {
    try {
        const { prompt }: { prompt: string } = await req.json();
        if (!prompt?.trim()) {
            return Response.json(
                { ok: false, error: "Falta el prompt" },
                { status: 400 },
            );
        }

        const client = new Anthropic();
        const response = await client.messages.create({
            model: "claude-opus-4-7",
            max_tokens: 16384,
            system: APP_GENERATOR_SYSTEM,
            tools: [APP_TOOL],
            tool_choice: { type: "tool", name: "save_design" },
            messages: [{ role: "user", content: prompt.trim() }],
        });

        const toolUse = response.content.find((b) => b.type === "tool_use");
        if (
            !toolUse ||
            toolUse.type !== "tool_use" ||
            toolUse.name !== "save_design"
        ) {
            return Response.json(
                { ok: false, error: "El modelo no devolvió diseño." },
                { status: 500 },
            );
        }

        const { html, title, summary } = toolUse.input as {
            html: string;
            title: string;
            summary: string;
        };

        if (!html || !html.toLowerCase().includes("<!doctype html")) {
            return Response.json(
                {
                    ok: false,
                    error: "El modelo devolvió HTML inválido.",
                },
                { status: 500 },
            );
        }

        return Response.json({ ok: true, html, title, summary });
    } catch (e) {
        return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
        );
    }
}
