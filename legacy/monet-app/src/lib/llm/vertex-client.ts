import "server-only";
import { GoogleGenAI } from "@google/genai";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Gemini (Vertex AI) behind an Anthropic-Messages-shaped facade.
 *
 * The app was written against Claude's Messages API (forced tool calls for
 * structured JSON, base64 image blocks, web_search). We now run everything on
 * Google's own Gemini via Vertex (GCP project monet-500520) — no Anthropic.
 *
 * Rather than rewrite all 7 call sites, this shim exposes `.messages.create()`
 * with the same request/response shape and translates to Gemini internally:
 *
 *   • Forced single tool (tool_choice == {type:"tool"}) → Gemini JSON mode
 *     (responseMimeType application/json + the tool's JSON-Schema injected into
 *     the system prompt). The returned JSON is surfaced as a synthetic
 *     `tool_use` block, so callers keep reading `toolUse.input`.
 *   • No tools → plain text generation, returned as a `text` block.
 *   • web_search tool + auto choice → Google Search grounding (pass A), then a
 *     JSON-mode pass (pass B) to structure the grounded findings into the
 *     custom tool's schema.
 *   • Anthropic image blocks {type:"image", source:{type:"base64",...}} →
 *     Gemini inlineData parts. Vision (critique) keeps working.
 *
 * Auth: Application Default Credentials. Model + location from env.
 */

const MODEL = process.env.VERTEX_GEMINI_MODEL ?? "gemini-2.5-pro";
const LOCATION = process.env.CLOUD_ML_REGION ?? "us-central1";
const PROJECT = process.env.ANTHROPIC_VERTEX_PROJECT_ID ?? "monet-500520";

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
    if (!_ai) {
        _ai = new GoogleGenAI({ vertexai: true, project: PROJECT, location: LOCATION });
    }
    return _ai;
}

// ── helpers ──────────────────────────────────────────────────────────

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

/** Anthropic message content (string | block[]) → Gemini parts. */
function toParts(content: unknown): Part[] {
    if (typeof content === "string") return [{ text: content }];
    if (!Array.isArray(content)) return [{ text: String(content ?? "") }];
    const parts: Part[] = [];
    for (const block of content as Array<Record<string, unknown>>) {
        if (block.type === "text") {
            parts.push({ text: String(block.text ?? "") });
        } else if (block.type === "image") {
            const src = block.source as { type?: string; media_type?: string; data?: string } | undefined;
            if (src?.type === "base64" && src.data) {
                parts.push({ inlineData: { mimeType: src.media_type ?? "image/jpeg", data: src.data } });
            }
        } else if (block.type === "tool_result") {
            parts.push({ text: typeof block.content === "string" ? block.content : JSON.stringify(block.content) });
        }
    }
    return parts.length ? parts : [{ text: "" }];
}

function toContents(messages: Array<{ role: string; content: unknown }>) {
    return messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: toParts(m.content),
    }));
}

function parseJsonLoose(text: string): unknown {
    const t = (text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    try {
        return JSON.parse(t);
    } catch {
        const a = t.indexOf("{");
        const b = t.lastIndexOf("}");
        if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
        throw new Error("Gemini no devolvió JSON parseable");
    }
}

function schemaPrompt(tool: { name?: string; description?: string; input_schema?: unknown }): string {
    return [
        "",
        `Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto fuera del JSON).`,
        `El JSON es el argumento de la función "${tool.name}": ${tool.description ?? ""}`,
        `Debe cumplir este JSON Schema:`,
        JSON.stringify(tool.input_schema ?? {}),
    ].join("\n");
}

function asMessage(content: unknown[], stopReason: string): Anthropic.Messages.Message {
    return {
        id: "gemini_" + Math.random().toString(36).slice(2, 10),
        type: "message",
        role: "assistant",
        model: MODEL,
        content: content as Anthropic.Messages.ContentBlock[],
        stop_reason: stopReason as Anthropic.Messages.Message["stop_reason"],
        stop_sequence: null,
        usage: {
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_input_tokens: null,
            cache_read_input_tokens: null,
            server_tool_use: null,
            service_tier: null,
        } as unknown as Anthropic.Messages.Usage,
    } as Anthropic.Messages.Message;
}

// ── the facade ───────────────────────────────────────────────────────

export interface ClaudeClient {
    messages: {
        create(params: Anthropic.Messages.MessageCreateParams): Promise<Anthropic.Messages.Message>;
    };
}

async function create(
    params: Anthropic.Messages.MessageCreateParams,
): Promise<Anthropic.Messages.Message> {
    const system = typeof params.system === "string" ? params.system : undefined;
    // Gemini 2.5 Pro is a thinking model: thinking tokens count toward
    // maxOutputTokens, so add headroom or the JSON answer gets truncated.
    const maxOutputTokens = (params.max_tokens ?? 4096) + 8192;
    const messages = params.messages as Array<{ role: string; content: unknown }>;
    const contents = toContents(messages);

    const tools = (params.tools ?? []) as unknown as Array<Record<string, unknown>>;
    const webSearch = tools.find((t) => typeof t.type === "string" && (t.type as string).startsWith("web_search"));
    const customTool = tools.find((t) => t.name && t.input_schema);

    // ── Case 1: web_search + a structured tool → grounded research (2 passes)
    if (webSearch && customTool) {
        const passA = await ai().models.generateContent({
            model: MODEL,
            contents,
            config: {
                systemInstruction: system,
                maxOutputTokens,
                temperature: 0.4,
                tools: [{ googleSearch: {} }],
            },
        });
        const grounded = passA.text ?? "";
        const chunks = (passA.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []) as Array<{
            web?: { uri?: string; title?: string };
        }>;
        const sources = chunks
            .map((c) => c.web)
            .filter((w): w is { uri?: string; title?: string } => Boolean(w))
            .map((w) => `- ${w.title ?? ""} ${w.uri ?? ""}`)
            .join("\n");

        const passB = await ai().models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                `Estructura esta investigación en el JSON pedido.\n\nINVESTIGACIÓN:\n${grounded}\n\nFUENTES:\n${sources}`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: (system ?? "") + schemaPrompt(customTool),
                maxOutputTokens,
                responseMimeType: "application/json",
            },
        });
        const input = parseJsonLoose(passB.text ?? "");
        return asMessage(
            [{ type: "tool_use", id: "toolu_" + Math.random().toString(36).slice(2, 10), name: customTool.name, input }],
            "tool_use",
        );
    }

    // ── Case 2: forced single tool → JSON mode
    if (customTool) {
        const resp = await ai().models.generateContent({
            model: MODEL,
            contents,
            config: {
                systemInstruction: (system ?? "") + schemaPrompt(customTool),
                maxOutputTokens,
                responseMimeType: "application/json",
            },
        });
        const input = parseJsonLoose(resp.text ?? "");
        return asMessage(
            [{ type: "tool_use", id: "toolu_" + Math.random().toString(36).slice(2, 10), name: customTool.name, input }],
            "tool_use",
        );
    }

    // ── Case 3: plain text
    const resp = await ai().models.generateContent({
        model: MODEL,
        contents,
        config: {
            systemInstruction: system,
            maxOutputTokens,
        },
    });
    return asMessage([{ type: "text", text: resp.text ?? "" }], "end_turn");
}

export function createClaudeClient(): ClaudeClient {
    return { messages: { create } };
}
