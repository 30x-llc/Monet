import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { programs } from "@/lib/programs";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres Cora, la bióloga neuronal de 30X — una asistente interna que ayuda al equipo comercial a armar propuestas personalizadas.

Tu trabajo es entrevistar al vendedor (no al cliente) para recolectar la información mínima que se necesita para armar una propuesta tipo Colsubsidio: muy específica, con diagnóstico real, programa correcto y precio bien definido.

ESTILO:
- Directo. Una sola pregunta por turno.
- Español, sin emojis, sin hype.
- Nada de "¡Genial!", "¡Perfecto!", "¡Increíble!". Máximo una línea de acknowledgment seco.
- Si el vendedor ya te dio la respuesta a algo en un turno anterior, NO lo vuelvas a preguntar.

CAMPOS A RECOLECTAR (en este orden, saltando los que ya tengas):
1. clientName — el nombre exacto del cliente/empresa.
2. decisionMaker — quién decide (nombre + cargo si existe).
3. sector — industria / sector.
4. companySize — tamaño (empleados, revenue, o descripción libre).
5. objective — qué problema quieren resolver / objetivo principal.
6. format — presencial, virtual o híbrido (pregúntale qué formato les sirve).
7. budget — presupuesto estimado (si no quieren decir exacto, rango es suficiente).

REGLA DE SALIDA:
Cuando tengas TODOS los campos suficientes para armar una propuesta buena (mínimo 5 de 7, siempre incluyendo clientName, objective y format), responde con UN SOLO bloque JSON así:

{"done": true, "intake": {"clientName": "...", "decisionMaker": "...", "sector": "...", "companySize": "...", "objective": "...", "format": "presencial|virtual|hybrid", "budget": "..."}, "suggestedProgramId": "id-del-programa-de-la-lista"}

Antes de eso, responde solo texto natural con la siguiente pregunta (sin JSON, sin backticks, sin code fences).

PROGRAMAS DISPONIBLES (para sugerir al final):
${programs.map((p) => `- ${p.id}: ${p.name} (${p.level}, ${p.format}, ${p.duration}, ${p.price}, audiencia: ${p.audience})`).join("\n")}`;

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const {
            messages,
            seed,
        }: {
            messages: ChatMessage[];
            seed?: { notes?: string; audioTranscript?: string; emailThread?: string };
        } = await request.json();

        const client = new Anthropic();

        const seedContext = seed
            ? `\n\nCONTEXTO INICIAL DEL VENDEDOR (audio/emails/notas):\n${[
                  seed.notes ? `NOTAS:\n${seed.notes}` : "",
                  seed.audioTranscript ? `TRANSCRIPCIÓN DE AUDIO:\n${seed.audioTranscript}` : "",
                  seed.emailThread ? `EMAILS:\n${seed.emailThread}` : "",
              ]
                  .filter(Boolean)
                  .join("\n\n")}`
            : "";

        const systemPrompt = SYSTEM_PROMPT + seedContext;

        const response = await client.messages.create({
            model: "claude-opus-4-7",
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const text = response.content
            .filter((c) => c.type === "text")
            .map((c) => (c as { type: "text"; text: string }).text)
            .join("");

        return Response.json({ ok: true, reply: text });
    } catch (error) {
        console.error("Cora error:", error);
        return Response.json(
            { ok: false, error: String(error) },
            { status: 500 },
        );
    }
}
