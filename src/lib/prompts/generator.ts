import { programs, COMPANY_INFO, ALL_MENTORS } from "../programs";
import type { ProjectFormat } from "../slide-types";

function buildProgramContext(): string {
    return programs
        .map(
            (p) =>
                `## ${p.name} (${p.id})
Tagline: ${p.tagline}
${p.description}
Nivel: ${p.level} | Audiencia: ${p.audience}
Formato: ${p.format} | Duración: ${p.duration} | Precio: ${p.price}
Próxima edición: ${p.nextDate}${p.city ? ` (${p.city})` : ""}
Mentores: ${p.mentors.map((m) => `${m.name} [imageKey: ${m.imageKey}] (${m.role})`).join(", ")}
Módulos: ${p.modules.map((m) => m.name).join(" → ")}
Puntos clave:
${p.keyPoints.map((k) => `- ${k}`).join("\n")}`,
        )
        .join("\n\n---\n\n");
}

function buildSelectedProgram(programId?: string): string {
    if (!programId) return "";
    const program = programs.find((p) => p.id === programId);
    if (!program) return "";

    return `
## PROGRAMA DE CONTEXTO: ${program.name}

${program.tagline}

${program.description}

**Detalles:**
- Nivel: ${program.level}
- Audiencia: ${program.audience}
- Formato: ${program.format}
- Duración: ${program.duration}
- Precio: ${program.price}
- Próxima edición: ${program.nextDate}${program.city ? ` en ${program.city}` : ""}

**Mentores:**
${program.mentors.map((m) => `- ${m.name} [imageKey: "${m.imageKey}"] — ${m.role}`).join("\n")}

**Módulos:**
${program.modules.map((m, i) => `${i + 1}. ${m.name}: ${m.description}`).join("\n")}

**Puntos clave:**
${program.keyPoints.map((k) => `- ${k}`).join("\n")}`;
}

function buildMentorImageKeys(): string {
    return Object.entries(ALL_MENTORS)
        .map(([key, m]) => `"${key}" → ${m.name} (${m.role})`)
        .join("\n");
}

// ─────────────────────────────────────────────────────────────
// Shared voice + brand rules
// ─────────────────────────────────────────────────────────────

const BRAND_BLOCK = `## SOBRE 30X

${COMPANY_INFO.fullName} — ${COMPANY_INFO.tagline}
${COMPANY_INFO.motto}

**Fundadores:**
${COMPANY_INFO.founders.map((f) => `- ${f.name} — ${f.role}. ${f.bio}`).join("\n")}

**Stats reales (usa SOLO estos, nunca inventes):**
- ${COMPANY_INFO.stats.alumni} ejecutivos alumni
- ${COMPANY_INFO.stats.leaders} líderes usando sus metodologías
- ${COMPANY_INFO.stats.mentors} operadores mentores
- Presencia en ${COMPANY_INFO.stats.countries} países`;

const VOICE_BLOCK = `## VOZ Y TONO

- Directa. Datos antes que adjetivos.
- Sin hype, sin motivacional, sin guru.
- Cada frase justifica su existencia.
- Español primero.
- NUNCA: "premium", "increíble", "transformador", "única", "intensos", "revolucionario", "disruptivo", "ecosistema", "AI-powered", "10x", "unicornio", "moonshot"
- Mencionar empresas reales: Rappi, Truora, Habi, GeoPark, OnTop
- Nunca sentences en MAYÚSCULAS completas
- Nunca italic, nunca "Word. Word. Word." staccato`;

// ─────────────────────────────────────────────────────────────
// Format-specific prompts
// ─────────────────────────────────────────────────────────────

function proposalBlock(corporateMode: boolean): string {
    return corporateMode
        ? `## MODO: PROPUESTA CORPORATIVA (tipo Colsubsidio)

Este deck es para un cliente corporativo puntual. Se siente personalizada: portada con el nombre del cliente como eyebrow, diagnóstico específico, metodología 30X, impacto esperado con números, inversión total del programa. Usa slides: corporate-cover → diagnostic → intro-mentors → methodology → curriculum-grid → mentor-grid → impact → pricing-cta → cover-globe.`
        : `## MODO: PROPUESTA ABIERTA (programa 30X estándar)

Este deck sirve para vender el programa a un lead o comunidad. Usa: cover-hero → intro-mentors → curriculum-grid → pricing-cta → cover-globe.`;
}

const CAROUSEL_STRUCTURE = `## ESTRUCTURA DE CARRUSEL (6–9 slides cuadradas 1080×1080)

Slide 1: **ig-cover** — hook potente (título grande + subtítulo). backgroundImage opcional (foto de mentor).
Slides 2–N: alternar entre:
  - **ig-text** — headline + body mediano. Numerado opcional ("01", "02"…).
  - **ig-stat** — dato grande (número + label corto + footnote opcional).
  - **ig-quote** — cita con mentor (imageKey si aplica).
Slide final: **ig-cta** — CTA concreta con ctaLabel breve (ej: "Aplica al programa", "Únete al próximo cohort").

REGLAS:
- Headlines de 3–8 palabras, nunca más de 10.
- Body entre 12 y 24 palabras máx.
- Alternar tipos de slide para mantener ritmo.
- Para ig-stat, usar números redondos y claros (ej: "3,100+", "$1,990", "4 semanas").`;

const STORY_STRUCTURE = `## ESTRUCTURA DE HISTORIA (3–5 slides verticales 1080×1920)

Slide 1: **story-cover** — foto de fondo (mentor o evento) + eyebrow + headline + CTA.
Slides siguientes: **story-text** alternando con **story-cover**. Cada story-text tiene headline corto + body + footer opcional.

REGLAS:
- Máximo 12 palabras por headline.
- Body como máximo 30 palabras.
- Siempre terminar con un CTA claro (swipe up, link en bio, etc.).`;

const DOC_STRUCTURE = `## ESTRUCTURA DE DOCUMENTO (A4 vertical, 3–8 páginas)

Slide 1: **doc-cover** — eyebrow (ej: "Propuesta comercial"), headline, subtitle, forClient, date.
Slides siguientes: **doc-section** con sectionNumber (ej: "01", "02"), heading, array de paragraphs (2–4 por sección), bullets opcionales.

REGLAS:
- Lenguaje formal pero directo.
- Párrafos de 40–80 palabras.
- Bullets de máximo 18 palabras.
- Un heading por sección. Subsecciones dentro del mismo slide si aplica.`;

// ─────────────────────────────────────────────────────────────
// Main entry
// ─────────────────────────────────────────────────────────────

export interface GeneratorOptions {
    format: ProjectFormat;
    programId?: string;
    corporateMode?: boolean;
    topic?: string;
}

export function getGeneratorPrompt(opts: GeneratorOptions): string {
    const { format, programId, corporateMode = false, topic } = opts;
    const selected = buildSelectedProgram(programId);
    const mentorKeys = buildMentorImageKeys();
    const allPrograms = buildProgramContext();

    let modeBlock: string;
    let outputHint: string;

    switch (format) {
        case "carousel-ig":
            modeBlock = CAROUSEL_STRUCTURE;
            outputHint = `slides de tipo ig-cover, ig-text, ig-stat, ig-quote, ig-cta`;
            break;
        case "story-ig":
            modeBlock = STORY_STRUCTURE;
            outputHint = `slides de tipo story-cover, story-text`;
            break;
        case "doc":
            modeBlock = DOC_STRUCTURE;
            outputHint = `slides de tipo doc-cover, doc-section`;
            break;
        case "proposal":
        default:
            modeBlock = proposalBlock(corporateMode);
            outputHint = `slides corporate-cover, cover-hero, intro-mentors, diagnostic, curriculum-grid, mentor-grid, methodology, impact, pricing-cta, cover-globe`;
            break;
    }

    const topicBlock = topic
        ? `\n## TEMA/BRIEF DEL CONTENIDO\n\n${topic}\n`
        : "";

    return `Eres el especialista en diseño de 30X. Generas proyectos con diseño nivel Apple/Linear: Inter Display, fondo negro, acento lima #E9FF7B, fotos reales. El diseño visual ya está implementado; tú solo produces el JSON.

${BRAND_BLOCK}

${modeBlock}

${topicBlock}

${selected}

---

## MENTOR IMAGE KEYS (usa estos EXACTOS en los campos imageKey)

${mentorKeys}

---

${VOICE_BLOCK}

## REGLAS DE ASSETS

- Mentores: backgroundImage / imageKey deben usar rutas /assets/mentors-real/<name>.png (o .jpg para cinthya/dago). Si solo das imageKey (para ig-quote), usa los keys exactos de arriba.
- Immersivo: /assets/immersive/cubrimiento-dscfXXXX.jpg solo para Inmersión Ejecutiva.
- Portada corporativa: /assets/brand/portada-oficial.png.

## CATÁLOGO DE PROGRAMAS (contexto)

${allPrograms}

---

## FORMATO DE RESPUESTA

Formato del proyecto: "${format}". Tipos de slide permitidos: ${outputHint}.

Responde SOLO en JSON válido:

{
  "deckTitle": "string",
  "companyName": "string",
  "programName": "string",
  "programId": "string?",
  "format": "${format}",
  "clientLogoUrl": "string?",
  "theme": "dark",
  "slides": [ /* array según la estructura de arriba */ ],
  "generatedAt": "ISO date"
}`;
}
