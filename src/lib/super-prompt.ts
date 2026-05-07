/**
 * 30x super-prompt — the template salespeople copy to clipboard, paste
 * into any LLM, and use to extract a comprehensive briefing they then
 * upload here.
 *
 * Synthesis-first: the salesperson dumps everything they have at the
 * start, the LLM treats that as the source of truth and emits the
 * brief immediately. It only asks for truly missing critical fields
 * AFTER reading everything — never as a round-robin questionnaire.
 *
 * Format-aware: the questions tailor to the artifact being built. A
 * proposal wants pitch angle + decision maker + ideal next step. A
 * contract wants scope + deliverables + payment terms + signing party.
 * A one-pager wants the elevator pitch + key proof. The output schema
 * is the same markdown shape so 30x Design can ingest any of them.
 */

export type SuperPromptFormat = "proposal" | "doc" | "carousel-ig" | "story-ig" | "prototype" | "other";

interface FormatProfile {
    label: string;
    angles: string[];
    schema: string;
}

const PROFILES: Record<SuperPromptFormat, FormatProfile> = {
    proposal: {
        label: "propuesta comercial",
        angles: [
            "**El deal** — ¿Qué pasó? ¿De dónde salió este cliente? ¿Quién está del otro lado (nombre + cargo)? ¿En qué punto de la conversación estamos?",
            "**La oportunidad** — ¿Qué quiere lograr el cliente? ¿Cuál es el dolor real que están sintiendo? ¿Qué los hace querer hablar AHORA?",
            "**El ángulo del pitch** — ¿Por qué nosotros y no otro? ¿Qué hace especial a este cliente que podemos reconocer en la portada (la frase tipo 'la aerolínea predilecta de clientes premium en LATAM')?",
            "**El programa** — ¿Qué proponemos exactamente? ¿Cohorte abierta o edición privada? ¿Qué mentor del equipo encaja?",
            "**El call** — ¿Hay alguna frase que dijo el cliente que se queda? ¿Cómo hablan ellos de sí mismos? ¿Algo sensible que evitar?",
            "**Next step** — ¿Qué pasa después de esta propuesta? ¿Reunión, firma, piloto, decisión por comité?",
        ],
        schema: `## Cliente
[Nombre · Industria · tamaño · ciudad — o \`[pendiente]\`]

## Decisión
[Nombre + cargo del decision maker, otros stakeholders]

## La oportunidad
[Qué quieren lograr, qué dolor sienten, por qué ahora]

## Ángulo del pitch
[1-2 frases: cómo reconocer al cliente como #1 en su categoría]

## Lo que proponemos
[Programa específico, cohorte vs privada, mentor, precio si lo tenemos]

## Lenguaje del cliente
[Frases verbatim que ellos usan sobre sí mismos]

## Notas del call
[Lo que dijo el cliente, sensibilidades, must-haves]

## Next step
[Qué pasa después]`,
    },
    doc: {
        label: "documento (contrato, brief, one-pager)",
        angles: [
            "**Tipo de documento** — ¿Es contrato, brief de proyecto, one-pager comercial, propuesta corta, otro?",
            "**Cliente / contraparte** — ¿Para quién es? Si es contrato, ¿quién firma del otro lado (nombre + cargo + razón social)?",
            "**Scope / objetivo del documento** — ¿Qué cubre concretamente? Servicios, entregables, alcance. Si es brief, ¿cuál es el resultado esperado?",
            "**Términos comerciales** — Si aplica: precio, cuotas, fechas clave, duración, condiciones de pago, exclusividades.",
            "**Contexto previo** — ¿Hay propuesta, contrato anterior, o conversación que este documento aterriza? Si me puedes pegar fragmentos de ese material, mejor.",
            "**Tono y restricciones** — ¿Formal/legal/conversacional? ¿Algo sensible — confidencialidad, branding, propiedad intelectual?",
        ],
        schema: `## Tipo de documento
[Contrato · Brief · One-pager · Propuesta corta · Otro]

## Cliente / contraparte
[Razón social, decision maker, contacto firmante]

## Scope / objetivo
[Qué cubre el documento, alcance concreto, entregables]

## Términos comerciales
[Precio, cuotas, fechas, duración, condiciones — si aplica]

## Antecedentes
[Propuesta o contrato previo, conversación, resumen del deal]

## Tono y restricciones
[Formal/legal/conversacional + sensibilidades]

## Lenguaje del cliente
[Frases verbatim que ellos usan]

## Next step
[Firma, revisión legal, kick-off]`,
    },
    "carousel-ig": {
        label: "carrusel para Instagram / LinkedIn",
        angles: [
            "**Tema / hook** — ¿De qué se trata el carrusel? ¿Cuál es la frase de gancho del slide 1?",
            "**Audiencia** — ¿A quién le hablamos? ¿Founders, vendedores, marketing, RH?",
            "**Mensaje núcleo** — ¿Cuál es la idea que quieres que se lleven? Una sola frase.",
            "**Datos / proof** — ¿Hay números, casos o frases de mentores que podemos usar como soporte?",
            "**CTA** — ¿Qué quieres que hagan al final? ¿Aplicar, comentar, mandar DM, leer artículo?",
        ],
        schema: `## Tema
[Hook + ángulo en 1 frase]

## Audiencia
[Quién leerá]

## Mensaje núcleo
[La idea que se llevan]

## Proof points
[Datos, casos, mentores, citas verbatim]

## CTA
[Acción concreta del cierre]`,
    },
    "story-ig": {
        label: "historia para Instagram / WhatsApp",
        angles: [
            "**Hook del slide 1** — ¿Qué frase para la historia?",
            "**Mensaje** — ¿Qué quieres contar? Una idea por slide (3-5 slides).",
            "**CTA** — ¿Swipe up, link en bio, mandar mensaje?",
        ],
        schema: `## Hook
[Frase del slide 1]

## Mensaje por slide
[3-5 ideas cortas, una por línea]

## CTA
[Acción]`,
    },
    prototype: {
        label: "prototipo de app o landing",
        angles: [
            "**Producto** — ¿Qué es? Nombre, una frase de qué hace.",
            "**Pantalla principal** — ¿Qué muestras? Lista, dashboard, formulario, feed?",
            "**Datos de ejemplo** — ¿Qué nombres, métricas, ítems usar para que se sienta real?",
        ],
        schema: `## Producto
[Nombre + una frase]

## Pantalla principal
[Tipo + qué muestra]

## Datos de ejemplo
[Nombres y números reales/plausibles]`,
    },
    other: {
        label: "asset libre",
        angles: [
            "**Qué necesitas** — ¿Qué tipo de pieza? Describe qué te imaginas.",
            "**Audiencia y propósito** — ¿Para quién y para qué?",
            "**Restricciones** — ¿Formato, longitud, tono?",
        ],
        schema: `## Qué necesitas
[Descripción libre]

## Audiencia + propósito
[Para quién y para qué]

## Restricciones
[Formato, longitud, tono]`,
    },
};

export function buildSuperPrompt(opts: { clientName?: string; format?: SuperPromptFormat | string } = {}): string {
    const client = opts.clientName?.trim() || "[NOMBRE DEL CLIENTE]";
    const formatKey = (opts.format ?? "proposal") as SuperPromptFormat;
    const profile = PROFILES[formatKey] ?? PROFILES.proposal;

    return `# Briefing 30x Design — ${client}

Eres mi asistente de BD. Vamos a sacar un briefing en markdown que voy a subir a 30x Design (la herramienta interna). Lo que armemos aquí va a alimentar la generación de una **${profile.label}**. La idea NO es que me hagas un cuestionario: la idea es que sintetices lo que ya tengo y SOLO me preguntes lo que de verdad falte después de leer todo.

## Cómo trabajamos

**Paso 1 — Yo te paso material.** En mi siguiente mensaje voy a pegar (o linkear) todo lo que tengo del cliente: notas de la llamada, hilo de emails, transcripción, hoja de Drive, nota de voz transcrita, propuesta o contrato anterior si existe, lo que sea. Puede ser estructurado o un dump caótico.

**Paso 2 — Lees todo y me devuelves el brief.** En tu primera respuesta no me hagas un cuestionario. Haz esto en este orden:

1. **Sintetiza** todo lo que tengo en el formato markdown de abajo. Llena cada sección con lo que ESTÉ en el material. Sin inventar nada.
2. **Marca con \`[pendiente]\`** los campos que no aparecen en el material. No me los preguntes todavía.
3. Devuelve el bloque markdown completo en tu primera respuesta, dentro de un \`\`\`markdown\`\`\` block para que lo copie de una.
4. **Después** del bloque markdown, en una sección "**Gaps**", lístame en máximo 3 bullets las cosas críticas que están en \`[pendiente]\` y que vale la pena que yo te aclare.

**Paso 3 — Yo decido si rellenar gaps o no.** Si te respondo con info, actualiza el markdown. Si te digo "ya, eso es todo lo que tengo" o "dame el brief", devuelves el markdown final con los \`[pendiente]\` que queden — sin volver a preguntar nada. 30x Design + Exa van a rellenar lo que se pueda con deep research.

## Ángulos a cubrir (en este orden si me haces preguntas)

${profile.angles.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Formato del brief (siempre así)

\`\`\`markdown
${profile.schema}
\`\`\`

## Reglas

- **No me hagas cuestionarios.** Una sola pasada de gaps al final, máximo 3 items.
- **No inventes datos.** Si no aparece, va \`[pendiente]\`.
- **Respeta el lenguaje del cliente** — copia frases verbatim cuando aparezcan.
- **Si yo no tengo nada y te empiezo desde cero**, solo en ese caso hazme 4-5 preguntas cortas. Pero ese no es el caso típico.

Empieza diciéndome: "Listo. Pásame el material y armo el brief." y espera mi siguiente mensaje.`;
}
