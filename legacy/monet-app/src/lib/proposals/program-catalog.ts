/**
 * Monet — 30X program catalog.
 *
 * The agent receives intake messages like "propuesta Sales Machine para
 * Bavaria" and needs to resolve "Sales Machine" to a known program with
 * its audience fit, modules, duration, and pricing. This catalog is the
 * resolution table.
 *
 * Add new programs by appending entries. Keep slugs stable — they're
 * referenced from generated proposals.
 */

export interface ProgramEntry {
    slug: string;
    name: string;
    /** Common aliases the LLM might receive in intake messages. */
    aliases: string[];
    positioning: string;
    audience: string;
    durationLabel: string;
    /** Reference pricing in USD. */
    pricing?: {
        openTuition?: number;
        privateCohort?: number;
        privateCohortSeats?: number;
    };
    modules: string[];
    format: "inmersivo" | "online" | "hybrid";
    keyMentors: string[];
}

export const PROGRAMS: ProgramEntry[] = [
    {
        slug: "sales-machine",
        name: "Sales Machine",
        aliases: ["sales machine", "ventas machine", "máquina de ventas", "salesmachine"],
        positioning:
            "El sistema operativo de ventas consultivas con IA para founders y equipos comerciales que quieren cerrar enterprise sin contratar más vendedores.",
        audience: "Founders y heads of sales B2B con ticket >$50K USD",
        durationLabel: "3 días inmersivos + 90 días de implementación",
        pricing: {
            openTuition: 3000,
            privateCohort: 180000,
            privateCohortSeats: 30,
        },
        modules: [
            "Diagnóstico del funnel actual",
            "Diseño del playbook de prospección",
            "Calibración de mensajería y narrativa",
            "Stack de IA para prospección + qualification",
            "Operación de cierre y forecasting",
            "Compensación, KPIs y cadencia de revisión",
        ],
        format: "inmersivo",
        keyMentors: ["Andrés Bilbao", "Felipe Restrepo", "Daniel Bilbao"],
    },
    {
        slug: "ai-sales",
        name: "Ventas con IA",
        aliases: [
            "ai sales",
            "ventas con ia",
            "ventas con ai",
            "ai-sales",
            "ventas ai",
            "ventas ia",
        ],
        positioning:
            "Cómo usar agentes de IA para 10x la productividad del equipo comercial sin perder el toque humano.",
        audience: "Heads of sales, CEOs y founders en empresas con equipo comercial existente",
        durationLabel: "2 días inmersivos",
        pricing: {
            openTuition: 2000,
            privateCohort: 90000,
            privateCohortSeats: 25,
        },
        modules: [
            "Mapa del funnel y palancas de IA",
            "Diseño de agentes para prospección",
            "Agentes para qualification y enrichment",
            "Agentes para drafting de propuestas",
            "Stack de tooling práctico (claude / openai / vercel)",
            "Operación y métricas post-implementación",
        ],
        format: "inmersivo",
        keyMentors: ["Andrés Bilbao", "Juan Diego De La Ossa"],
    },
    {
        slug: "fundraising-school",
        name: "Fundraising School",
        aliases: ["fundraising school", "fundraising", "escuela de fundraising"],
        positioning:
            "Cómo levantar capital institucional siendo un founder LATAM, contado por los founders que ya lo hicieron.",
        audience: "Founders pre-seed a Serie B con plan de levantar capital en los próximos 12 meses",
        durationLabel: "3 días inmersivos + 60 días de office hours",
        pricing: {
            openTuition: 3500,
            privateCohort: 150000,
            privateCohortSeats: 25,
        },
        modules: [
            "Modelo de negocio fund-worthy",
            "Tesis y narrative de inversión",
            "Construcción del data room",
            "Calendario y proceso de outreach",
            "Negociación de term sheet",
            "Estructura post-cierre y reporting",
        ],
        format: "inmersivo",
        keyMentors: ["Andrés Bilbao", "Daniel Bilbao"],
    },
    {
        slug: "multipliers",
        name: "Multipliers",
        aliases: ["multipliers", "multiplicadores", "hnw", "patrimonial"],
        positioning:
            "Comunidad cerrada de fundadores y operadores con patrimonio HNW, enfocada en preservación y multiplicación de capital.",
        audience: "Founders/CEOs con patrimonio personal >$2M USD",
        durationLabel: "1 año de membresía continua",
        pricing: {
            openTuition: 24000,
        },
        modules: [
            "Diagnóstico patrimonial",
            "Estructuración fiscal y jurisdiccional",
            "Asset allocation HNW",
            "Sucesión y vehículos familiares",
            "Acceso a deals privados curados",
            "Mastermind mensual",
        ],
        format: "hybrid",
        keyMentors: ["Andrés Bilbao", "Cinthya Sánchez"],
    },
    {
        slug: "growth-con-ia",
        name: "Growth con IA",
        aliases: ["growth con ia", "growth con ai", "growth ai", "growth ia"],
        positioning:
            "Cómo armar una máquina de growth con IA sin contratar agencia ni equipo masivo.",
        audience: "Heads of growth, founders product-led, marketing leads",
        durationLabel: "2 días inmersivos",
        pricing: {
            openTuition: 2000,
            privateCohort: 80000,
            privateCohortSeats: 25,
        },
        modules: [
            "Funnel actual + benchmarks",
            "Agentes para content + SEO",
            "Agentes para paid + creative testing",
            "Agentes para lifecycle + retención",
            "Atribución y forecasting",
            "Stack + operación",
        ],
        format: "inmersivo",
        keyMentors: ["Felipe Restrepo"],
    },
    {
        slug: "ia-para-board",
        name: "IA para Board",
        aliases: ["ia para board", "ai para board", "ai for board", "board"],
        positioning:
            "Programa corto para que CEOs y boards entiendan el impacto estratégico de la IA en sus empresas y tomen mejores decisiones de allocation.",
        audience: "CEOs y miembros de board de empresas con revenue >$10M USD",
        durationLabel: "1 día inmersivo",
        pricing: {
            openTuition: 1500,
            privateCohort: 60000,
            privateCohortSeats: 20,
        },
        modules: [
            "Estado del arte: qué cambió en los últimos 12 meses",
            "Casos LATAM y casos globales",
            "Decisiones de capital allocation",
            "Política de adopción y riesgo",
            "Q&A con founders que ya están adelante",
        ],
        format: "inmersivo",
        keyMentors: ["Andrés Bilbao"],
    },
];

/** Resolve a free-text program reference to a catalog entry. */
export function resolveProgram(query: string): ProgramEntry | null {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    // Exact slug match first.
    const bySlug = PROGRAMS.find((p) => p.slug === q);
    if (bySlug) return bySlug;
    // Alias match (case-insensitive).
    for (const p of PROGRAMS) {
        if (p.aliases.some((a) => a.toLowerCase() === q)) return p;
    }
    // Substring match against name or aliases.
    for (const p of PROGRAMS) {
        if (p.name.toLowerCase().includes(q)) return p;
        if (p.aliases.some((a) => a.toLowerCase().includes(q))) return p;
    }
    return null;
}

/** Best-effort resolve multiple programs from a comma/AND-separated string. */
export function resolveManyPrograms(query: string): ProgramEntry[] {
    if (!query) return [];
    const tokens = query
        .split(/[,·;\n]| y | and /i)
        .map((t) => t.trim())
        .filter(Boolean);
    const found: ProgramEntry[] = [];
    const seen = new Set<string>();
    for (const t of tokens) {
        const p = resolveProgram(t);
        if (p && !seen.has(p.slug)) {
            seen.add(p.slug);
            found.push(p);
        }
    }
    return found;
}
