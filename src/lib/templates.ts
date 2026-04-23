import type { Deck } from "./slide-types";

export interface Template {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    badge?: string;
    deck: Deck;
}

// Shared closing slide
const closingSlide = {
    type: "cover-globe" as const,
    headline: "La mejor educación ejecutiva de Latinoamérica.",
};

export const TEMPLATES: Template[] = [
    {
        id: "sales-machine",
        name: "Sales Machine",
        description: "El playbook completo de ventas B2B",
        coverImage: "/assets/mentors-real/felipe-restrepo.png",
        badge: "Popular",
        deck: {
            deckTitle: "Sales Machine",
            companyName: "30X",
            programName: "Sales Machine",
            programId: "sales-machine",
            theme: "dark",
            generatedAt: new Date().toISOString(),
            slides: [
                {
                    type: "cover-hero",
                    headline: "Sales Machine",
                    subtitle: "Programa 30X · Virtual, 4 semanas",
                    backgroundImage: "/assets/mentors-real/felipe-restrepo.png",
                    meta: [
                        { key: "Duración", value: "4 semanas", icon: "clock" },
                        { key: "Formato", value: "Virtual", icon: "laptop" },
                        { key: "Próxima edición", value: "Miércoles, 8 de Abril", icon: "calendar" },
                    ],
                },
                {
                    type: "intro-mentors",
                    title: "Sales Machine",
                    pill: "Abierto a todos",
                    description:
                        "El playbook completo: desde prospección fría hasta cierre. Aprende a calificar leads, manejar objeciones y estructurar deals que escalan tu revenue desde cero.",
                    angles: [
                        { title: "Tu pipeline no se llena solo", description: "El playbook completo de ventas B2B: prospección, calificación, objeciones y cierre.", icon: "target" },
                        { title: "Un proceso que se repite y escala", description: "Estructura tu máquina de ventas para que funcione sin depender de un solo closer.", icon: "refresh" },
                        { title: "Métricas que predicen revenue", description: "Aprende a medir cada etapa del funnel y tomar decisiones con datos, no con intuición.", icon: "chart" },
                    ],
                    mentors: [
                        { name: "Felipe Restrepo", role: "VP Growth, Habi", imageKey: "felipe", company: "Habi" },
                        { name: "Andrés Bilbao", role: "Co-Founder Rappi · 30X", imageKey: "andres", company: "Rappi" },
                        { name: "Natalia Salcedo", role: "Founder, Pitz", imageKey: "natalia_s" },
                        { name: "Santiago Aparicio", role: "Co-Founder, OnTop", imageKey: "santiago", company: "OnTop" },
                    ],
                },
                {
                    type: "curriculum-grid",
                    headline: "4 semanas de ejecución",
                    subtitle: "Cada semana terminas con algo implementado sobre tu pipeline real. No hay módulos teóricos. Lo que aprendes, lo ejecutas en tu funnel antes de la siguiente sesión.",
                    modules: [
                        { number: "Semana 1", name: "Prospección outbound", description: "Lista, mensaje, canal. Llenar el top del funnel con disciplina." },
                        { number: "Semana 2", name: "Calificación y discovery", description: "Marcos para separar deals reales de conversaciones de cortesía." },
                        { number: "Semana 3", name: "Objeciones y negociación", description: "Guiones para las objeciones más frecuentes del comprador B2B." },
                        { number: "Semana 4", name: "Cierre y forecast", description: "Técnicas de cierre y métricas que predicen revenue, no que lo explican." },
                        { number: "Entregable 1", name: "Playbook comercial", description: "Guion completo de prospección, discovery, objeciones y cierre." },
                        { number: "Entregable 2", name: "Scorecard de calificación", description: "Marco propio para priorizar dónde invierte tiempo tu equipo." },
                        { number: "Entregable 3", name: "Forecast operable", description: "Modelo de forecast que el CFO y el board pueden leer sin traducción." },
                        { number: "Entregable 4", name: "Plan de implementación", description: "Roadmap de 90 días para llevar el playbook a todo tu equipo." },
                    ],
                },
                {
                    type: "pricing-cta",
                    headline: "Construye tu motor de ventas en 4 semanas.",
                    checklist: [
                        "Playbook comercial completo, adaptado a tu negocio y ciclo de venta",
                        "Scorecard de calificación y guion de discovery listo para tu equipo",
                        "Librería de guiones para las objeciones más frecuentes del comprador B2B",
                        "Modelo de forecast operable para reporte al CFO y al board",
                        "Revisión semanal de pipeline real con los mentores del programa",
                        "Acceso continuo a grabaciones y material por 12 meses",
                    ],
                    price: "USD $1,990",
                    paymentNote: "Tarjeta de crédito o transferencia bancaria · Hasta 2 cuotas",
                    sidebar: [
                        { label: "Duración", value: "4 semanas" },
                        { label: "Sesiones", value: "4 en vivo de 2h (grabadas)" },
                        { label: "Contenido", value: "Playbook + 4 entregables" },
                        { label: "Modalidad", value: "100% online" },
                        { label: "Acceso", value: "Grabaciones por 12 meses" },
                        { label: "Cupo", value: "Abierto a todos" },
                    ],
                    contact: {
                        name: "Angie Linares",
                        role: "Executive Programs",
                        details: "+57 310 753 8785\nangie@30x.com",
                    },
                },
                closingSlide,
            ],
        },
    },
    {
        id: "inmersion-ejecutiva",
        name: "Inmersión Ejecutiva",
        description: "3 días que cambian tu empresa",
        coverImage: "/assets/immersive/cubrimiento-dscf3083.jpg",
        deck: {
            deckTitle: "Inmersión Ejecutiva Presencial",
            companyName: "30X",
            programName: "Inmersión Ejecutiva",
            programId: "inmersion-ejecutiva",
            theme: "dark",
            generatedAt: new Date().toISOString(),
            slides: [
                {
                    type: "cover-hero",
                    headline: "Inmersión Ejecutiva",
                    subtitle: "Programa 30X · Presencial, 3 días",
                    backgroundImage: "/assets/immersive/cubrimiento-dscf3418.jpg",
                    meta: [
                        { key: "Duración", value: "3 días", icon: "clock" },
                        { key: "Formato", value: "Presencial · Bogotá", icon: "location" },
                        { key: "Próxima edición", value: "28 de Abril 2026", icon: "calendar" },
                    ],
                },
                {
                    type: "intro-mentors",
                    title: "Inmersión Ejecutiva",
                    pill: "Solo para founders y C-Level",
                    description:
                        "Tres días de estrategia, ejecución y networking con operadores que ya construyeron empresas reales en Latinoamérica. Un punto de encuentro para quienes están construyendo en serio.",
                    angles: [
                        { title: "Estrategia y networking de alto nivel", description: "Sesiones privadas con quienes escalaron Rappi y Truora.", icon: "target" },
                        { title: "Tu próximo socio está en la sala", description: "Construye relaciones con fundadores y directivos de toda LATAM.", icon: "users" },
                        { title: "Sal con un plan, no con inspiración", description: "Pausa tu operación, rediseña tu estrategia y vuelve con una hoja de ruta ejecutable.", icon: "chart" },
                    ],
                    mentors: [
                        { name: "Andrés Bilbao", role: "Co-Founder Rappi & 30X", imageKey: "andres", company: "Rappi" },
                        { name: "Daniel Bilbao", role: "Co-Founder Truora", imageKey: "daniel", company: "Truora" },
                        { name: "Dylan Rosemberg", role: "Growth Rockstar Founder", imageKey: "dylan" },
                        { name: "Felipe Restrepo", role: "VP Growth, Habi", imageKey: "felipe", company: "Habi" },
                    ],
                },
                closingSlide,
            ],
        },
    },
    {
        id: "ai-for-executives",
        name: "AI for Executives",
        description: "IA estratégica para C-Level",
        coverImage: "/assets/mentors-real/cinthya-sanchez.jpg",
        deck: {
            deckTitle: "AI for Executives",
            companyName: "30X",
            programName: "AI for Executives",
            programId: "ai-for-executives",
            theme: "dark",
            generatedAt: new Date().toISOString(),
            slides: [
                {
                    type: "cover-hero",
                    headline: "AI for Executives",
                    subtitle: "Programa 30X · Virtual en vivo, 8 semanas",
                    backgroundImage: "/assets/mentors-real/cinthya-sanchez.jpg",
                    meta: [
                        { key: "Duración", value: "8 semanas", icon: "clock" },
                        { key: "Formato", value: "Virtual en vivo", icon: "laptop" },
                        { key: "Próxima edición", value: "26 de Mayo 2026", icon: "calendar" },
                    ],
                },
                {
                    type: "intro-mentors",
                    title: "AI for Executives",
                    pill: "Ejecutivo · C-Level y VPs",
                    description:
                        "Programa ejecutivo de inteligencia artificial para C-Level y VPs. Desarrolla estrategia empresarial en IA, gobierna implementaciones y toma decisiones bajo incertidumbre.",
                    angles: [
                        { title: "Productividad desde semana 1", description: "Aplica IA estratégicamente y multiplica tu rendimiento ejecutivo.", icon: "target" },
                        { title: "Decisiones más rápidas, mejor informadas", description: "Usa IA para analizar datos, resumir información y acelerar tu toma de decisiones.", icon: "refresh" },
                        { title: "Implementa IA sin depender de tu equipo técnico", description: "Aprende a gobernar herramientas de IA como ejecutivo, no como developer.", icon: "chart" },
                    ],
                    mentors: [
                        { name: "Cinthya Sánchez", role: "CIO, GeoPark", imageKey: "cinthya" },
                        { name: "Dago Borda", role: "Head of AI, GeoPark", imageKey: "dago" },
                        { name: "Andrés Bilbao", role: "Co-Founder Rappi & 30X", imageKey: "andres", company: "Rappi" },
                    ],
                },
                closingSlide,
            ],
        },
    },
    {
        id: "achievers",
        name: "Achievers",
        description: "No te preparamos. Te ponemos a construir.",
        coverImage: "/assets/mentors-real/maria-jose-munoz.png",
        deck: {
            deckTitle: "Achievers",
            companyName: "30X",
            programName: "Achievers",
            programId: "achievers",
            theme: "dark",
            generatedAt: new Date().toISOString(),
            slides: [
                {
                    type: "cover-hero",
                    headline: "Achievers",
                    subtitle: "Programa 30X · Virtual, 8 semanas",
                    backgroundImage: "/assets/mentors-real/maria-jose-munoz.png",
                    meta: [
                        { key: "Duración", value: "8 semanas", icon: "clock" },
                        { key: "Formato", value: "Virtual", icon: "laptop" },
                        { key: "Próxima edición", value: "7 de Abril 2026", icon: "calendar" },
                    ],
                },
                closingSlide,
            ],
        },
    },
];

export function getTemplateById(id: string): Template | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
