import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/prompts/research";
import type { ResearchResult } from "@/lib/slide-types";

// Opus 4.7 + web_search can take 30-120s; Pro plan allows up to 300s.
export const maxDuration = 300;

// Forcing the model to emit via a tool call with an input_schema is the only
// reliable way to get clean JSON out of a free-form generation — the previous
// "dump text, parse with regex" approach kept breaking on unescaped quotes
// inside string values and leftover <cite> fragments from web_search.
const RESEARCH_TOOL: Anthropic.Messages.Tool = {
    name: "save_research",
    description:
        "Guarda el research de la empresa como datos estructurados. Llama esta herramienta UNA sola vez cuando tengas la investigación completa.",
    input_schema: {
        type: "object",
        properties: {
            companyName: { type: "string", description: "Nombre oficial" },
            industry: { type: "string", description: "Industria / sector" },
            size: {
                type: "string",
                description: "Tamaño aproximado (empleados, ingresos)",
            },
            headquarters: { type: "string", description: "Ciudad, país" },
            leadership: {
                type: "array",
                items: { type: "string" },
                description:
                    "Liderazgo visible: cada item 'Nombre - Cargo'",
            },
            painPoints: {
                type: "array",
                items: { type: "string" },
                description:
                    "Desafíos estratégicos o pain points públicos",
            },
            recentNews: {
                type: "array",
                items: { type: "string" },
                description: "Noticias relevantes últimos 6 meses",
            },
            relevantContext: {
                type: "string",
                description:
                    "Párrafo con contexto relevante para la propuesta de 30x",
            },
        },
        required: [
            "companyName",
            "industry",
            "size",
            "headquarters",
            "leadership",
            "painPoints",
            "recentNews",
            "relevantContext",
        ],
    },
};

const WEB_SEARCH_TOOL = {
    type: "web_search_20250305" as const,
    name: "web_search",
    max_uses: 5,
} as unknown as Anthropic.Messages.Tool;

async function runResearch(
    client: Anthropic,
    userMessage: string,
    useWebSearch: boolean,
): Promise<ResearchResult> {
    const tools = useWebSearch
        ? [WEB_SEARCH_TOOL, RESEARCH_TOOL]
        : [RESEARCH_TOOL];

    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: RESEARCH_SYSTEM_PROMPT,
        tools,
        tool_choice: useWebSearch
            ? { type: "auto" }
            : { type: "tool", name: "save_research" },
        messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find(
        (c) => c.type === "tool_use" && c.name === "save_research",
    ) as Anthropic.Messages.ToolUseBlock | undefined;

    if (!toolUse) {
        const textDump = response.content
            .filter((c) => c.type === "text")
            .map((c) => (c as { type: "text"; text: string }).text)
            .join("\n")
            .slice(0, 500);
        throw new Error(
            `El modelo no llamó save_research. Texto devuelto: ${textDump || "(vacío)"}`,
        );
    }

    return toolUse.input as unknown as ResearchResult;
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
            ? `Investiga la empresa "${companyName}" para preparar una presentacion comercial de 30x. Usa web_search si lo necesitas y luego llama save_research con los datos.\n\nNotas del vendedor:\n${notes}`
            : `Investiga la empresa "${companyName}" para preparar una presentacion comercial de 30x. Usa web_search si lo necesitas y luego llama save_research con los datos.`;

        let research: ResearchResult;
        try {
            research = await runResearch(client, userMessage, true);
        } catch (err) {
            const errStr = String(err);
            if (errStr.includes("overloaded") || errStr.includes("529")) {
                // Fallback without web search
                research = await runResearch(client, userMessage, false);
            } else {
                throw err;
            }
        }

        return Response.json({ ok: true, research });
    } catch (error) {
        console.error("[research]", error);
        return Response.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
