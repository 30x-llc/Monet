import { NextRequest } from "next/server";
import { createClaudeClient } from "@/lib/llm/vertex-client";
import { programs } from "@/lib/programs";
import type { ProjectFormat } from "@/lib/slide-types";

export const maxDuration = 60;

// ──────────────────────────────────────────────────────────────
// Per-format intake contracts
// ──────────────────────────────────────────────────────────────
//
// Cora adapts her questions to the format. Each format has:
// - A short identity brief (what she's designing + for whom)
// - The minimum required fields before she can ship
// - A closing JSON shape that matches what the generator needs

interface FormatBrief {
    label: string;
    identity: string;
    fields: string; // numbered list, one per line
    doneRule: string;
    closeJson: string;
}

const PROPOSAL_BRIEF: FormatBrief = {
    label: "propuesta comercial",
    identity:
        "Armas una propuesta tipo Colsubsidio: muy específica, con diagnóstico real, programa correcto y precio bien definido. Hablas con el vendedor de 30x, no con el cliente.",
    fields: `1. clientName — nombre exacto del cliente/empresa. Con el nombre de la empresa alcanza: usaremos su logo en la portada.
2. sector — industria / sector.
3. companySize — tamaño (empleados, revenue, o descripción libre).
4. objective — qué problema quieren resolver / objetivo principal.
5. format — presencial, virtual o híbrido.
6. budget — presupuesto estimado (rango es suficiente).
7. theme — oscuro o claro (opcional; default oscuro. Solo pregunta si el cliente/contexto sugiere claro, ej. marcas muy luminosas, o si el usuario lo pide).

NO preguntes por el decisor / punto de contacto / quién autoriza. Con el nombre de la empresa es suficiente.`,
    doneRule:
        "Mínimo 4 de 7, siempre incluyendo clientName, objective y format. Theme es opcional.",
    closeJson: `{"done": true, "intake": {"clientName": "...", "sector": "...", "companySize": "...", "objective": "...", "format": "presencial|virtual|hybrid", "budget": "...", "theme": "dark|light"}, "suggestedProgramId": "id-del-programa-de-la-lista"}`,
};

const PROTOTYPE_BRIEF: FormatBrief = {
    label: "prototipo de producto",
    identity:
        "Diseñas un prototipo web/app con el sistema 30X. Hablas con el founder/diseñador — tu trabajo es entender qué están construyendo y para quién, sin preguntar cosas que ya dijo.",
    fields: `1. clientName — nombre del producto/proyecto (lo llamaremos así en los archivos).
2. audience — para qué usuario es (una frase corta, no un brief).
3. objective — qué acción principal tiene que lograr el usuario.
4. keyScreens — qué pantallas/componentes son críticos (ej: "login, dashboard, detalle de deal").
5. tone — referencia estética o tono (ej: "Linear-like, denso, dark").
6. theme — oscuro o claro (opcional; default oscuro para apps, claro para landings marketing).`,
    doneRule:
        "Mínimo 3 de 6, siempre incluyendo clientName y keyScreens. Theme es opcional.",
    closeJson: `{"done": true, "intake": {"clientName": "...", "audience": "...", "objective": "...", "keyScreens": "...", "tone": "...", "theme": "dark|light"}}`,
};

const CAROUSEL_BRIEF: FormatBrief = {
    label: "carrusel de Instagram",
    identity:
        "Diseñas un carrusel 1:1 para Instagram/LinkedIn. Hablas con el creador — tu trabajo es clavar hook, ángulo y CTA sin pedirle que escriba el brief completo.",
    fields: `1. topic — el tema del carrusel (usa el que ya te dieron).
2. audience — a quién le habla (founders, vendedores, C-level, etc).
3. hook — ángulo del primer slide (lo que hace parar el scroll).
4. ctaLabel — qué pide el último slide (ej: "aplica a Sales Machine", "comenta PLAY").
5. theme — oscuro o claro (opcional; default oscuro. Sugiere claro solo si el tema es más editorial/suave).`,
    doneRule:
        "Mínimo 3 de 5, siempre incluyendo topic y hook. Theme es opcional.",
    closeJson: `{"done": true, "intake": {"topic": "...", "audience": "...", "hook": "...", "ctaLabel": "...", "theme": "dark|light"}}`,
};

const STORY_BRIEF: FormatBrief = {
    label: "historia de Instagram",
    identity:
        "Diseñas una historia 9:16 de IG — rápida, una idea, una acción. Breve: 2-3 preguntas máximo.",
    fields: `1. topic — qué anuncia / qué comunica.
2. ctaLabel — qué acción pide (swipe up, DM, link en bio).
3. theme — oscuro o claro (opcional; default oscuro).`,
    doneRule: "Mínimo topic; ctaLabel y theme si tiene sentido.",
    closeJson: `{"done": true, "intake": {"topic": "...", "ctaLabel": "...", "theme": "dark|light"}}`,
};

const DOC_BRIEF: FormatBrief = {
    label: "documento A4",
    identity:
        "Diseñas un documento A4 — propuesta corta, contrato, o one-pager. Tu trabajo es definir tipo, destinatario y tono sin sobrepreguntar.",
    fields: `1. clientName — título o destinatario del documento.
2. objective — tipo de documento (propuesta corta, contrato, one-pager, otro).
3. audience — a quién se lo va a enviar el vendedor.
4. tone — tono del documento (formal, directo, ejecutivo).
5. theme — oscuro o claro (opcional; default claro para docs).`,
    doneRule: "Mínimo 2 de 5, siempre incluyendo clientName. Theme es opcional.",
    closeJson: `{"done": true, "intake": {"clientName": "...", "objective": "...", "audience": "...", "tone": "...", "theme": "dark|light"}}`,
};

const OTHER_BRIEF: FormatBrief = {
    label: "diseño libre",
    identity:
        "El usuario no escogió formato — tú decides qué tiene más sentido a partir de lo que te describe. Tu primera tarea es entender qué está pidiendo; la segunda es sugerir el formato óptimo y confirmarlo.",
    fields: `1. clientName — título del proyecto (puede ser el tema si no hay cliente).
2. suggestedFormat — cuál de {proposal, carousel-ig, story-ig, doc, prototype} recomiendas.
3. objective — qué tiene que lograr el diseño.
4. audience — quién lo va a ver.`,
    doneRule:
        "Mínimo 3 de 4, siempre incluyendo clientName y suggestedFormat.",
    closeJson: `{"done": true, "intake": {"clientName": "...", "suggestedFormat": "proposal|carousel-ig|story-ig|doc|prototype", "objective": "...", "audience": "..."}}`,
};

const BRIEFS: Record<ProjectFormat, FormatBrief> = {
    proposal: PROPOSAL_BRIEF,
    prototype: PROTOTYPE_BRIEF,
    "carousel-ig": CAROUSEL_BRIEF,
    "story-ig": STORY_BRIEF,
    doc: DOC_BRIEF,
    other: OTHER_BRIEF,
};

// ──────────────────────────────────────────────────────────────
// System prompt builder
// ──────────────────────────────────────────────────────────────

interface HomeContext {
    clientName?: string;
    topic?: string;
    programId?: string;
    corporateMode?: boolean;
    prototypeKind?: "app" | "landing" | "component";
    docKind?: "proposal" | "contract" | "one-pager" | "other";
}

interface SeedContext {
    notes?: string;
    audioTranscript?: string;
    emailThread?: string;
}

function buildSystemPrompt(
    format: ProjectFormat,
    home: HomeContext | undefined,
    seed: SeedContext | undefined,
): string {
    const brief = BRIEFS[format] ?? OTHER_BRIEF;

    const homeLines = home
        ? [
              home.clientName ? `- clientName: ${home.clientName}` : "",
              home.topic ? `- topic: ${home.topic}` : "",
              home.programId ? `- programId sugerido: ${home.programId}` : "",
              home.corporateMode !== undefined
                  ? `- modo: ${home.corporateMode ? "corporativa" : "abierta"}`
                  : "",
              home.prototypeKind
                  ? `- tipo de prototipo: ${home.prototypeKind}`
                  : "",
              home.docKind ? `- tipo de documento: ${home.docKind}` : "",
          ].filter(Boolean)
        : [];

    const resolvedProgram =
        format === "proposal" && home?.programId
            ? programs.find((p) => p.id === home.programId)
            : undefined;

    const homeBlock = homeLines.length
        ? `\nCONTEXTO DEL HOME (lo que el usuario YA te dijo — NO lo vuelvas a preguntar, bajo ninguna circunstancia):
${homeLines.join("\n")}${
              resolvedProgram
                  ? `\n\nEl programa ${resolvedProgram.name} ya está elegido. El OBJETIVO del cliente se deriva del programa: "${resolvedProgram.tagline || resolvedProgram.description?.slice(0, 180)}". NO preguntes por el objetivo — asúmelo del programa.`
                  : ""
          }\n`
        : "";

    const seedBlock = seed
        ? `\nCONTEXTO INICIAL (audio/emails/notas del usuario):
${[
    seed.notes ? `NOTAS:\n${seed.notes}` : "",
    seed.audioTranscript ? `AUDIO:\n${seed.audioTranscript}` : "",
    seed.emailThread ? `EMAILS:\n${seed.emailThread}` : "",
]
    .filter(Boolean)
    .join("\n\n")}\n`
        : "";

    const programsBlock =
        format === "proposal"
            ? `\nPROGRAMAS DISPONIBLES (para sugerir al cerrar):\n${programs
                  .map(
                      (p) =>
                          `- ${p.id}: ${p.name} (${p.level}, ${p.format}, ${p.duration}, ${p.price}, audiencia: ${p.audience})`,
                  )
                  .join("\n")}\n`
            : "";

    return `Eres Cora, la asistente de diseño de 30X. ${brief.identity}

ESTILO:
- Directo. UNA pregunta por turno.
- Español, sin emojis, sin hype. Nada de "¡Genial!", "¡Perfecto!".
- Máximo una línea corta de acknowledgment antes de la siguiente pregunta.
- PROHIBIDO preguntar por cualquier campo que ya esté en el "CONTEXTO DEL HOME". Eso no es opcional — si ves clientName en el contexto, NO preguntes "¿para qué cliente es?". Usa el valor. Mismo con topic, programId, modo, etc.
- PROHIBIDO preguntar por el objetivo cuando hay un programa elegido. El objetivo del cliente es comprar ese programa y obtener lo que enseña.
- Si el usuario dice "decide tú" o "lo que veas", tómalo como señal para saltar ese campo.
- Si ya tienes lo mínimo para cerrar, CIERRA con el JSON — no busques excusas para preguntar más.

CAMPOS A RECOLECTAR (en este orden, saltando los que ya tengas):
${brief.fields}

REGLA DE SALIDA:
${brief.doneRule} Cuando tengas lo mínimo, responde con UN SOLO bloque JSON así (sin backticks ni code fences):

${brief.closeJson}

Antes de cerrar, responde solo texto natural con la siguiente pregunta (sin JSON).
${homeBlock}${seedBlock}${programsBlock}`;
}

// ──────────────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────────────

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const {
            messages,
            format = "proposal",
            home,
            seed,
        }: {
            messages: ChatMessage[];
            format?: ProjectFormat;
            home?: HomeContext;
            seed?: SeedContext;
        } = await request.json();

        const client = createClaudeClient();
        const systemPrompt = buildSystemPrompt(format, home, seed);

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
        console.error("[intake]", error);
        return Response.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
