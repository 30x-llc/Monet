/**
 * Anthropic-driven generator for Plantilla Monet variables.
 *
 * Given an intake (client name, programs) plus optional research from
 * Exa, asks Claude to produce a complete variable payload that can be
 * dropped into the Canva proposal template — cover positioning, five
 * partnership pillars tailored to the client's industry, and best-guess
 * brand asset URLs (logo + hero image from the company's official site).
 *
 * This is deliberately a pure data transform: no Canva calls happen
 * here. The Slack orchestrator decides whether to commit the result to
 * Canva (when Canva Connect OAuth is configured) or store the variables
 * for a human to review.
 */

import "server-only";
import { createClaudeClient } from "@/lib/llm/vertex-client";
import type { ResearchResult } from "@/lib/slide-types";
import type { ProgramEntry } from "@/lib/proposals/program-catalog";
import type { PillarSlot, PlantillaMonetVariables } from "@/lib/proposals/plantilla-monet";

const PILLAR_SLOTS: PillarSlot[] = [
    "alianza-corporativa",
    "promo-portfolio-premium",
    "experiencia-hvu",
    "promo-clientes-corporativos",
    "intercambio-especie",
];

const SYSTEM_PROMPT = `Eres Monet, el AI designer de 30X (red ejecutiva más grande de Latam). Tu trabajo es escribir el contenido variable de una propuesta de partnership en el estilo exacto que Andrés Bilbao usa: directo, founder-to-founder, sin course-marketing, sin clichés.

La propuesta sigue la estructura Aeroméxico que Andrés perfeccionó: portada con reconocimiento al cliente, página 2 con cinco pilares de partnership (cada pilar tiene objetivo / descripción / qué aporta 30X / qué aporta el cliente), y páginas 3-7 estables que ya están en el template.

Solo escribes los pilares y el copy de portada. NO inventes métricas. NO uses frases prohibidas: "la red ejecutiva más grande de Latinoamérica" como tag, "cohortes" (son ediciones), "$10M de revenue mínimo".

Los cinco pilares siempre tienen la misma identidad estructural pero el contenido se adapta a la industria del cliente:
1. **alianza-corporativa** — alianza marco donde el cliente se vuelve proveedor predilecto en eventos 30X o 30X usa exclusivamente sus servicios
2. **promo-portfolio-premium** — Andrés promociona en sus redes (Instagram, LinkedIn, TikTok) los productos premium del cliente
3. **experiencia-hvu** — 30X conecta al cliente con sus High Value Users (top 5-10 contactos por mes) para experiencias VIP
4. **promo-clientes-corporativos** — 30X abre puertas con CEOs/CMOs/Procurement de empresas en su red para que el cliente venda B2B
5. **intercambio-especie** — pool de valor equivalente: cliente aporta producto/servicio, 30X aporta cupos en programas de formación

El cliente entrega cosas concretas y cuantificables (USD anuales, % descuento, # de leads). 30X entrega activación con métricas concretas (frecuencia de posts, # HVUs/mes, # eventos, etc).

Output: JSON puro, sin markdown fences, exactamente con este shape:
{
  "designTitle": "Cliente | 30X | Andrés Bilbao",
  "cover": {
    "headline": "30X reconoce a {Cliente} como la {posicionamiento específico del cliente en su industria} y quiere construir una relación de largo plazo.",
    "body1": "Buscamos una alianza estratégica de largo aliento que conecte a {Cliente} con la red de fundadores y operadores de mayor poder adquisitivo de {país principal del cliente}.",
    "body2": "En el marco de la alianza queremos trabajar juntos rápidamente con proyectos pequeños que construyan confianza, hasta el punto donde 30X sea el aliado preferido global de {Cliente} para llegar a sus clientes de mayor valor."
  },
  "partnerColumnHeader": "{Cliente} aporta",
  "pillars": {
    "alianza-corporativa": { "objective": "Alianza Corporativa {Cliente} - 30X", "description": "...", "thirtyXContributes": "Línea1\\nLínea2\\nLínea3", "partnerContributes": "Línea1\\nLínea2" },
    "promo-portfolio-premium": { "objective": "...", "description": "...", "thirtyXContributes": "...", "partnerContributes": "..." },
    "experiencia-hvu": { "objective": "...", "description": "...", "thirtyXContributes": "...", "partnerContributes": "..." },
    "promo-clientes-corporativos": { "objective": "...", "description": "...", "thirtyXContributes": "...", "partnerContributes": "..." },
    "intercambio-especie": { "objective": "...", "description": "...", "thirtyXContributes": "...", "partnerContributes": "..." }
  },
  "assets": {
    "partnerLogoUrl": "URL directa al logo oficial del cliente (preferir sitios oficiales del cliente, Wikipedia commons, o press kits — no Unsplash genérico)",
    "heroImageUrl": "URL directa a una foto editorial OFICIAL del cliente (sus instalaciones, productos, campaña corporativa). Si el cliente es Bavaria → bavaria.co. Si Mastercard → mastercard.com. NUNCA Unsplash o stock genérico."
  }
}

Las líneas dentro de thirtyXContributes y partnerContributes van separadas con \\n. Cada bullet es una acción concreta, medible.`;

export interface GenerateVariablesInput {
    clientName: string;
    programs: ProgramEntry[];
    research?: ResearchResult;
    /** Free-form additional hints from the intake (e.g., "4 sedes, AI Sales"). */
    hints?: string;
}

export async function generatePlantillaMonetVariables(
    input: GenerateVariablesInput,
): Promise<PlantillaMonetVariables> {
    const client = createClaudeClient();

    const userMessage = buildUserMessage(input);

    const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
        throw new Error("Anthropic returned no text content");
    }

    const parsed = extractJSON(textBlock.text);
    return validateVariables(parsed, input.clientName);
}

function buildUserMessage(input: GenerateVariablesInput): string {
    const parts: string[] = [];
    parts.push(`Cliente: ${input.clientName}`);
    if (input.programs.length > 0) {
        parts.push(
            `Programas 30X mencionados en el intake: ${input.programs.map((p) => p.name).join(", ")}`,
        );
    }
    if (input.hints) parts.push(`Detalles adicionales: ${input.hints}`);
    const r = input.research;
    if (r) {
        parts.push("");
        parts.push("Research del cliente (úsalo verbatim para posicionar portada + pilares):");
        if (r.industry) parts.push(`Industria: ${r.industry}`);
        if (r.size) parts.push(`Tamaño: ${r.size}`);
        if (r.headquarters) parts.push(`Sede: ${r.headquarters}`);
        if (r.positioning) parts.push(`Posicionamiento: ${r.positioning}`);
        if (r.relevantContext) parts.push(`Contexto: ${r.relevantContext}`);
        if (r.leadership?.length) parts.push(`Liderazgo: ${r.leadership.slice(0, 4).join(", ")}`);
        if (r.painPoints?.length) {
            parts.push("Pain points:");
            for (const p of r.painPoints.slice(0, 5)) parts.push(`• ${p}`);
        }
        if (r.recentNews?.length) {
            parts.push("Noticias recientes:");
            for (const n of r.recentNews.slice(0, 4)) parts.push(`• ${n}`);
        }
        if (r.clientLanguage?.length) {
            parts.push(
                `Lenguaje del cliente (imítalo en la portada): ${r.clientLanguage.slice(0, 6).join(" · ")}`,
            );
        }
        if (r.callNotes) parts.push(`Notas del vendedor: ${r.callNotes}`);
    }
    parts.push("");
    parts.push(
        `Devuelve solo el JSON, sin texto antes o después. Adapta los cinco pilares a la industria de ${input.clientName} con métricas concretas y entregables específicos.`,
    );
    return parts.join("\n");
}

/**
 * Extract a JSON object from a possibly-fenced LLM response. Strips
 * ```json fences if present and trims whitespace.
 */
function extractJSON(text: string): unknown {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fenced ? fenced[1].trim() : trimmed;
    try {
        return JSON.parse(jsonText);
    } catch (err) {
        // Sometimes the model emits trailing prose — try grabbing the
        // first { ... } block.
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                /* fall through */
            }
        }
        throw new Error(
            `Could not parse JSON from Anthropic response: ${err instanceof Error ? err.message : err}`,
        );
    }
}

function validateVariables(raw: unknown, clientName: string): PlantillaMonetVariables {
    if (!raw || typeof raw !== "object") {
        throw new Error("Variables payload is not an object");
    }
    const obj = raw as Record<string, unknown>;
    const cover = obj.cover as Record<string, unknown> | undefined;
    const pillars = obj.pillars as Record<string, unknown> | undefined;
    const assets = obj.assets as Record<string, unknown> | undefined;
    if (!cover || !pillars || !assets) {
        throw new Error("Variables payload missing cover/pillars/assets");
    }
    const filledPillars: PlantillaMonetVariables["pillars"] = {} as PlantillaMonetVariables["pillars"];
    for (const slot of PILLAR_SLOTS) {
        const p = pillars[slot] as Record<string, unknown> | undefined;
        if (!p) throw new Error(`Missing pillar: ${slot}`);
        filledPillars[slot] = {
            objective: String(p.objective ?? ""),
            description: String(p.description ?? ""),
            thirtyXContributes: String(p.thirtyXContributes ?? p.thirty_x_contributes ?? ""),
            partnerContributes: String(p.partnerContributes ?? p.partner_contributes ?? ""),
        };
    }
    return {
        designTitle: String(obj.designTitle ?? `${clientName} | 30X | Andrés Bilbao`),
        cover: {
            headline: String(cover.headline ?? ""),
            body1: String(cover.body1 ?? ""),
            body2: String(cover.body2 ?? ""),
        },
        pillars: filledPillars,
        partnerColumnHeader: String(obj.partnerColumnHeader ?? `${clientName} aporta`),
        assets: {
            partnerLogoUrl: String(assets.partnerLogoUrl ?? ""),
            heroImageUrl: String(assets.heroImageUrl ?? ""),
        },
    };
}

/**
 * Helper for the orchestrator: pre-fill the assets from the research
 * result if Anthropic didn't return them (or returned worse guesses
 * than what Exa already found). Research-derived URLs are preferred
 * because they come from the company's own pages.
 */
export function preferResearchAssets(
    vars: PlantillaMonetVariables,
    research: { logoUrl?: string; heroImageUrl?: string } | undefined,
): PlantillaMonetVariables {
    if (!research) return vars;
    return {
        ...vars,
        assets: {
            partnerLogoUrl: research.logoUrl || vars.assets.partnerLogoUrl,
            heroImageUrl: research.heroImageUrl || vars.assets.heroImageUrl,
        },
    };
}
