/**
 * 30x Program Catalog — Complete Knowledge Base
 *
 * Source: 30x.com + 30x Deck PDF (April 2026)
 * This is the source of truth for the AI agent.
 * All data is real — never invent or approximate.
 */

export interface Mentor {
    name: string;
    role: string;
    imageKey: string;
}

export interface Module {
    name: string;
    description: string;
}

export interface Program {
    id: string;
    name: string;
    tagline: string;
    description: string;
    level: "abierto" | "ejecutivo" | "intermedio" | "avanzado";
    audience: string;
    format: "virtual" | "presencial" | "virtual-en-vivo";
    duration: string;
    price: string;
    nextDate: string;
    city?: string;
    mentors: Mentor[];
    modules: Module[];
    keyPoints: string[];
    includes: string[];
}

// ============================================================
// FOUNDERS & COMPANY STATS
// ============================================================

export const COMPANY_INFO = {
    name: "30x",
    fullName: "30x Escuela de Negocios",
    tagline: "La mejor educacion ejecutiva de Latinoamerica",
    motto: "Los lideres que construyen son quienes ensenan",
    philosophy:
        "Aqui no ensena quien estudio el tema. Ensena quien lo ejecuto, lo escalo, y decidio que valia la pena compartirlo.",
    founders: [
        {
            name: "Andres Bilbao",
            role: "Co-Founder de Rappi & 30x",
            bio: "Co-fundo Rappi (valorada en $5.25B, levanto $2B+ de DST/Sequoia/SoftBank, escalo a 9 paises)",
        },
        {
            name: "Daniel Bilbao",
            role: "Co-Founder de Truora",
            bio: "Co-fundo Truora (YC W19, opera en 15+ paises de LATAM), angel investor",
        },
        {
            name: "Dylan Rosemberg",
            role: "Growth Rockstar Founder & Co-Founder de 30x",
            bio: "Construyo motores de adquisicion escalando empresas de $0 a $10M+ ARR en 200+ empresas tech",
        },
    ],
    stats: {
        alumni: "3,100+",
        leaders: "4,000+",
        mentors: "120+",
        countries: "15+",
        cities: "Bogota, CDMX, Miami, y mas",
    },
    corporateUrl: "30x.com/para-empresas",
    corporateServices: [
        "Inmersion In-Company: 4 dias de entrenamiento ejecutivo 100% personalizado",
        "Tracks departamentales: Ventas, marketing, producto, operaciones",
        "Executive Coaching: Mentoria 1-on-1 para C-Level y directores",
    ],
    corporateMethodology:
        "Diagnostico → Diseno → Ejecucion → Medicion",
} as const;

// ============================================================
// ALL MENTORS
// ============================================================

export const ALL_MENTORS: Record<string, Mentor> = {
    andres: { name: "Andres Bilbao", role: "Co-Founder Rappi & 30x", imageKey: "andres" },
    daniel: { name: "Daniel Bilbao", role: "Co-Founder Truora", imageKey: "daniel" },
    dylan: { name: "Dylan Rosemberg", role: "Growth Rockstar Founder", imageKey: "dylan" },
    cinthya: { name: "Cinthya Sanchez", role: "CIO GeoPark", imageKey: "cinthya" },
    dago: { name: "Dago Borda", role: "Head de AI en GeoPark", imageKey: "dago" },
    jefferson: { name: "Jefferson Arcos", role: "30x Head of AI", imageKey: "jefferson" },
    felipe: { name: "Felipe Restrepo", role: "VP Growth Habi", imageKey: "felipe" },
    nicolas: { name: "Nicolas Rojas", role: "CEO Dapta", imageKey: "nicolas" },
    santiago: { name: "Santiago Aparicio", role: "Co-Founder OnTop", imageKey: "santiago" },
    natalia_s: { name: "Natalia Salcedo", role: "Founder Pitz", imageKey: "natalia_s" },
    estefany: { name: "Estefany Benavides", role: "Founder 30x Closers", imageKey: "estefany" },
    guillermo: { name: "Guillermo Jaramillo", role: "Ex-CEO KPMG", imageKey: "andres" },
    ramiro: { name: "Ramiro Castro", role: "Product & Growth", imageKey: "ramiro" },
    tatiana: { name: "Tatiana Leon", role: "AI Educator & Product Director", imageKey: "tatiana" },
    roman: { name: "Roman Hughes", role: "Rappi VP Marketing", imageKey: "roman" },
    mariajose_m: {
        name: "Maria Jose Munoz",
        role: "Managing Director Achievers",
        imageKey: "mariajose_m",
    },
    mariajose_e: {
        name: "Maria Jose Echeverri",
        role: "Colombia Tech Founder",
        imageKey: "mariajose_e",
    },
    patricio: {
        name: "Patricio Nelson",
        role: "Consultor Senior, Resolucion de Conflictos",
        imageKey: "patricio",
    },
    pablo: { name: "Pablo Benegas", role: "Experto en Negociacion", imageKey: "pablo" },
    francisco: {
        name: "Francisco Ingouville",
        role: "Experto en Negociacion",
        imageKey: "francisco",
    },
    danny: { name: "Danny Bravo", role: "Tribu IA Co-Founder", imageKey: "danny" },
    leonardo: {
        name: "Leonardo Gonzalez",
        role: "AI Research & Development",
        imageKey: "leonardo",
    },
    carlos_a: { name: "Carlos Alarcon", role: "Quix Co-founder & CTO", imageKey: "carlos_a" },
    christian: { name: "Christian Braatz", role: "Software Architect", imageKey: "christian" },
};

// ============================================================
// PROGRAMS
// ============================================================

export const programs: Program[] = [
    {
        id: "inmersion-ejecutiva",
        name: "Inmersion Ejecutiva Presencial",
        tagline: "3 dias que cambian tu empresa",
        description:
            "Tres dias de estrategia, ejecucion y networking con operadores que ya construyeron empresas reales en Latinoamerica. Un punto de encuentro para quienes estan construyendo en serio.",
        level: "ejecutivo",
        audience: "Founders y C-Level exclusivamente",
        format: "presencial",
        duration: "3 dias",
        price: "$6,000 USD",
        nextDate: "Bogota · 28 de Abril 2026",
        city: "Bogota",
        mentors: [
            ALL_MENTORS.andres,
            ALL_MENTORS.dylan,
            ALL_MENTORS.daniel,
            ALL_MENTORS.felipe,
            ALL_MENTORS.mariajose_e,
            ALL_MENTORS.tatiana,
        ],
        modules: [
            {
                name: "Dia 1: Mindset & Direccion",
                description:
                    "Rompes creencias que frenan la expansion",
            },
            {
                name: "Dia 2: Mindset & Growth",
                description:
                    "Construyes motores de crecimiento reales",
            },
            {
                name: "Dia 3: Equipos, Ventas, AI & Marketing",
                description:
                    "Ejecucion tactica con AI, ventas y marketing",
            },
        ],
        keyPoints: [
            "Estrategia, networking de alto nivel y sesiones privadas con quienes escalaron Rappi y Truora",
            "Tu proximo socio esta en la sala — construye relaciones con fundadores y directivos de toda LATAM",
            "Sal con un plan, no con inspiracion — pausa tu operacion, redisena tu estrategia y vuelve con una hoja de ruta ejecutable",
        ],
        includes: [
            "Acceso al programa completo",
            "Certificado ejecutivo",
            "Sesiones privadas con mentores",
            "Acceso de por vida a la comunidad",
            "Templates y herramientas",
            "Networking con fundadores",
        ],
    },
    {
        id: "achievers",
        name: "Achievers",
        tagline: "No te preparamos. Te ponemos a construir.",
        description:
            "Programa intensivo de 8 semanas para personas que quieren dar un salto real en su carrera, su equipo o su producto, aprendiendo a pensar, construir y escalar con AI.",
        level: "abierto",
        audience:
            "Ejecutivos, emprendedores y lideres de negocio",
        format: "virtual",
        duration: "8 semanas",
        price: "$1,500 USD",
        nextDate: "7 de abril 2026",
        mentors: [ALL_MENTORS.andres, ALL_MENTORS.mariajose_m],
        modules: [
            { name: "Semana 0: Bienvenida + Mentalidad Founder", description: "Onboarding y mindset" },
            { name: "Semana 1: Can Do Will Do Mindset", description: "Autoevaluacion y definicion de proyecto" },
            { name: "Semana 2: De la Idea al Problema Real", description: "Priorizacion con AI" },
            { name: "Semana 3: De Herramientas a Sistemas", description: "Mapeo de procesos y workflows inteligentes" },
            { name: "Semana 4: Como Piensan los Sistemas", description: "Logica de modelos AI aplicada a productos" },
            { name: "Semana 5: Automatiza tu Vida Digital", description: "Automatizacion no-code con n8n" },
            { name: "Semana 6: Construye tu MVP AI-Native", description: "Full-stack dev con Lovable + Supabase" },
            { name: "Semana 7: Mide, Escucha y Mejora", description: "Metricas con PostHog" },
            { name: "Semana 8: Comunica tu Impacto", description: "Demo Day y presentaciones finales" },
        ],
        keyPoints: [
            "El programa de alto impacto para lideres que ejecutan, no que asisten",
            "Red de lideres que operan en serio — conecta con ejecutivos de toda la region",
            "Frameworks que se aplican el lunes — cada sesion termina con una accion concreta",
        ],
        includes: [
            "8 semanas de sesiones en vivo de 2 horas",
            "Materiales actualizados y grabaciones",
            "Mentoria grupal semanal",
            "MVP deployado al finalizar",
            "Demo Day",
            "Acceso de por vida a la comunidad",
        ],
    },
    {
        id: "achievers-presencial",
        name: "Achievers Presencial",
        tagline: "Achievers, en persona",
        description:
            "4 dias inmersivos para pensar y ejecutar como un founder en la era de la AI. Sal con un producto deployado, no con un certificado.",
        level: "abierto",
        audience: "Ejecutivos y emprendedores",
        format: "presencial",
        duration: "4 dias",
        price: "$5,000 USD",
        nextDate: "Miami · 6 de mayo 2026",
        city: "Miami",
        mentors: [ALL_MENTORS.andres, ALL_MENTORS.mariajose_m],
        modules: [
            { name: "4 dias de inmersion total", description: "Sin distracciones, sin Zoom. Tu, los mentores y un grupo selecto" },
        ],
        keyPoints: [
            "La misma intensidad del programa, en formato presencial de inmersion",
            "Sin distracciones, sin Zoom — tu, los mentores y un grupo selecto en la misma sala",
            "Relaciones que no se construyen en un chat — networking presencial acelera conexiones",
        ],
        includes: [
            "4 dias de inmersion completa",
            "Acceso a todos los materiales",
            "Networking presencial",
            "Certificado",
            "Comunidad de por vida",
        ],
    },
    {
        id: "sales-machine",
        name: "Sales Machine",
        tagline: "El playbook completo: desde prospeccion fria hasta cierre",
        description:
            "Estructura tu maquina de ventas para que funcione sin depender de un solo closer. Metricas que predicen revenue.",
        level: "abierto",
        audience:
            "Fundadores y equipos comerciales",
        format: "virtual",
        duration: "8 semanas",
        price: "$1,990 USD",
        nextDate: "8 de abril 2026",
        mentors: [
            ALL_MENTORS.santiago,
            ALL_MENTORS.nicolas,
            ALL_MENTORS.natalia_s,
            ALL_MENTORS.felipe,
            ALL_MENTORS.andres,
        ],
        modules: [
            { name: "Fundamentos del Sistema de Ventas", description: "Diagnostico y arquitectura repetible" },
            { name: "Metodo Comercial", description: "Goals, pipeline stages, CRM" },
            { name: "Mindset & Cultura Comercial", description: "Rituales de ejecucion, accountability" },
            { name: "Narrativa y Objeciones", description: "ICP, frameworks de objeciones" },
            { name: "Modelos de Precios", description: "Impacto del pricing, modelos tiered/performance" },
            { name: "Outbound y Prospeccion con IA", description: "Research con AI, multi-channel" },
            { name: "Negociacion de Alto Valor", description: "Multi-stakeholder, high-value deals" },
            { name: "Calibracion y Medicion", description: "KPIs, ajustes semanales con datos" },
        ],
        keyPoints: [
            "Tu pipeline no se llena solo — playbook completo B2B: prospeccion, calificacion, objeciones y cierre",
            "Un proceso que se repite y escala sin depender de un solo closer",
            "Metricas que predicen revenue — mide cada etapa del funnel con datos",
        ],
        includes: [
            "8 semanas de contenido en vivo",
            "Role-plays con feedback directo",
            "Templates de pipeline y CRM",
            "Acceso de por vida",
            "Certificado",
        ],
    },
    {
        id: "ai-for-executives",
        name: "AI for Executives",
        tagline: "Lidera la transformacion digital con criterio ejecutivo en IA",
        description:
            "Programa ejecutivo de inteligencia artificial para C-Level y VPs. Desarrolla estrategia empresarial en IA, gobierna implementaciones y toma decisiones bajo incertidumbre.",
        level: "ejecutivo",
        audience: "C-Level y VPs",
        format: "virtual-en-vivo",
        duration: "8 semanas",
        price: "$3,000 USD",
        nextDate: "26 de mayo 2026",
        mentors: [ALL_MENTORS.cinthya, ALL_MENTORS.dago, ALL_MENTORS.andres],
        modules: [
            { name: "Panorama Ejecutivo", description: "Fundamentos de AI y responsabilidad ejecutiva" },
            { name: "Productividad Ejecutiva Brutal", description: "Automatizacion de tareas diarias" },
            { name: "Productividad Organizacional", description: "Resolucion de problemas reales del negocio" },
            { name: "Entender para no Improvisar", description: "Mecanica y limitaciones de AI" },
            { name: "De Juguete a Palanca de Negocio", description: "Prompting para analisis y estrategia" },
            { name: "Done and Good > Perfect", description: "Estrategia de AI con ROI" },
            { name: "Anatomia del Fallo", description: "Identificacion de riesgos y prevencion de errores" },
            { name: "Escala, Control y Sofisticacion", description: "Roadmap de implementacion" },
        ],
        keyPoints: [
            "Productividad desde semana 1 — aplica IA estrategicamente y multiplica tu rendimiento",
            "Decisiones mas rapidas, mejor informadas con AI",
            "Implementa IA sin depender de tu equipo tecnico — gobierna como ejecutivo, no como developer",
        ],
        includes: [
            "8 sesiones en vivo",
            "Casos interactivos estilo Harvard",
            "Simulacion de decisiones ejecutivas",
            "Roadmap personalizado con business case y ROI",
            "Comunidad de por vida",
            "Certificacion",
            "1 ano de acceso a grabaciones",
        ],
    },
    {
        id: "hardcore-ai",
        name: "Hardcore AI",
        tagline: "Codigo, no prompts",
        description:
            "Construye agentes de IA funcionales con codigo. Cada clase termina con un agente que resuelve un problema real. Para developers que quieren construir, no teorizar.",
        level: "intermedio",
        audience:
            "Developers y builders tecnicos",
        format: "virtual",
        duration: "4 semanas",
        price: "$1,500 USD",
        nextDate: "27 de abril 2026",
        mentors: [
            ALL_MENTORS.jefferson,
            ALL_MENTORS.danny,
            ALL_MENTORS.leonardo,
            ALL_MENTORS.carlos_a,
            ALL_MENTORS.christian,
        ],
        modules: [
            { name: "Introduction & Demo", description: "Overview del programa" },
            { name: "Discovery & Definition", description: "PRD con AI" },
            { name: "Solution Design", description: "Specs tecnicas, MADR docs" },
            { name: "Implementation", description: "AI-Native IDE, coding agents" },
            { name: "Testing con AI", description: "BDD/TDD con AI" },
            { name: "E2E User Testing", description: "Testing completo" },
            { name: "Cloud Infrastructure", description: "IaC, deployments" },
            { name: "Security & Compliance", description: "Estandares de seguridad" },
            { name: "360 Observability", description: "Metricas tecnicas y de negocio" },
            { name: "Demo Day", description: "Presentaciones a founders de 30x y Tribu IA" },
        ],
        keyPoints: [
            "Shipping desde la primera sesion — cada clase termina con un agente funcional",
            "APIs, modelos, infraestructura — domina el stack tecnico completo para AI en produccion",
            "Construye un producto E2E completo durante el programa",
        ],
        includes: [
            "Programa completo de 4 semanas",
            "Certificado",
            "Acceso de por vida",
            "Sesiones bonus con founders de startups de AI",
            "Acceso a comunidad Tribu IA",
            "Clases semanales de Vibe Engineering",
        ],
    },
    {
        id: "ai-for-boards",
        name: "AI for Boards",
        tagline: "IA en la mesa directiva",
        description:
            "Gobernanza de inteligencia artificial para juntas directivas. Frameworks de evaluacion, medicion de ROI e implicaciones legales y estrategicas de adoptar IA a nivel corporativo.",
        level: "ejecutivo",
        audience: "Miembros de juntas directivas y directores no tecnicos",
        format: "presencial",
        duration: "9 horas",
        price: "$5,000 USD",
        nextDate: "Abril 2026",
        city: "Bogota",
        mentors: [ALL_MENTORS.cinthya, ALL_MENTORS.dago, ALL_MENTORS.andres],
        modules: [
            { name: "Panorama Ejecutivo y AI Landscape", description: "Estado del arte de AI" },
            { name: "Fundamentos Tecnicos para Supervision", description: "Lo que un board necesita saber" },
            { name: "Marco de Gobierno de IA", description: "Governance framework" },
            { name: "AI Strategy for Boards", description: "Estrategia de AI para juntas" },
            { name: "Gestion y Monitoreo de Riesgos", description: "Risk management" },
            { name: "El Board como Catalizador de Valor", description: "AI Toolkit para directores" },
        ],
        keyPoints: [
            "Detecta bullshit en presentaciones de IA",
            "Frameworks de evaluacion para directivos — evalua inversiones en IA, mide ROI",
            "Riesgo, regulacion y estrategia — implicaciones legales de adoptar IA a nivel corporativo",
        ],
        includes: [
            "9 horas de programa presencial",
            "Framework de governance de AI",
            "Toolkit para directores",
            "Certificado",
        ],
    },
    {
        id: "ai-sales",
        name: "AI Sales",
        tagline: "Vende con IA o vende menos",
        description:
            "Un sistema que automatiza prospeccion, personaliza outreach y cierra mas deals. Para fundadores y lideres B2B que ya saben que el trabajo manual no escala.",
        level: "abierto",
        audience: "Fundadores y lideres B2B",
        format: "virtual",
        duration: "4 semanas",
        price: "$1,950 USD",
        nextDate: "16 de abril 2026",
        mentors: [ALL_MENTORS.nicolas, ALL_MENTORS.andres],
        modules: [
            { name: "AI Mindset & Top Performer Stack", description: "Mentalidad y herramientas" },
            { name: "Social Selling & Brand Authority", description: "Marca personal con AI" },
            { name: "Outbound: Account Intelligence", description: "Research de cuentas con AI" },
            { name: "Outbound: Automation & Hyper-Personalization", description: "Automatizacion" },
            { name: "Inbound: Conversational AI", description: "AI conversacional" },
            { name: "Inbound: Discovery & Follow-Up", description: "Seguimiento inteligente" },
            { name: "Sales Coaching & Intelligence", description: "Coaching con AI" },
            { name: "RevOps, Forecasting & Autonomous Agents", description: "Agentes autonomos" },
        ],
        keyPoints: [
            "Prospeccion en automatico — usa IA para investigar cuentas y priorizar leads",
            "Mas deals, menos horas — automatiza tareas repetitivas del ciclo de ventas",
            "Integra inteligencia artificial en tu proceso comercial B2B",
        ],
        includes: [
            "4 semanas de contenido en vivo",
            "Herramientas de AI para ventas",
            "Templates de outreach",
            "Acceso de por vida",
        ],
    },
    {
        id: "growth-rockstar",
        name: "Growth Rockstar",
        tagline: "Tu motor de crecimiento, armado",
        description:
            "Construye tu motor de crecimiento completo: adquisicion, activacion, retencion y monetizacion. Frameworks tacticos para Growth Managers ejecutando en alta velocidad.",
        level: "abierto",
        audience: "Growth Managers escalando startups",
        format: "virtual",
        duration: "8 semanas",
        price: "$1,295 USD",
        nextDate: "13 de abril 2026",
        mentors: [ALL_MENTORS.dylan, ALL_MENTORS.andres],
        modules: [
            { name: "Retencion y Engagement", description: "Loops de retencion" },
            { name: "Estrategia de Adquisicion", description: "Canales y CAC" },
            { name: "Monetizacion", description: "Pricing y revenue" },
            { name: "Modelos de Growth", description: "Frameworks de crecimiento" },
            { name: "Psicologia de Usuario", description: "Comportamiento y conversion" },
            { name: "Experimentacion", description: "Diseno y ejecucion de experimentos" },
        ],
        keyPoints: [
            "Construye el sistema de growth que escala tu empresa sin depender de una persona",
            "Experimenta con metodo, no con fe — disena, ejecuta y mide con rigor",
            "Growth es un sistema, no un hack — instala loops que funcionan en automatico",
        ],
        includes: [
            "Acceso de por vida al programa",
            "Certificado",
            "Q&A en vivo",
            "Templates y herramientas",
            "Grabaciones",
            "Casos reales",
            "Red de 120+ operadores LATAM",
        ],
    },
    {
        id: "gtm-strategy",
        name: "GTM Strategy",
        tagline: "Lanza bien o no lances",
        description:
            "Lanza tu producto de 0 a 1. Define ICP, construye tu motor de adquisicion inicial y valida product-market fit antes de escalar prematuramente.",
        level: "abierto",
        audience: "Founders en etapa temprana",
        format: "virtual",
        duration: "4 semanas",
        price: "$850 USD",
        nextDate: "16 de marzo 2026",
        mentors: [ALL_MENTORS.dylan, ALL_MENTORS.andres],
        modules: [
            { name: "Product-Market Fit", description: "Validacion de mercado" },
            { name: "Monetizacion, Pricing & Packaging", description: "Modelo de negocio" },
            { name: "Traccion", description: "Primeras ventas" },
            { name: "Growth Methods", description: "Canal repetible y escalable" },
        ],
        keyPoints: [
            "Disena tu go to market con el framework que uso Rappi para entrar a nuevos mercados",
            "Encuentra tu mercado antes de quemar caja",
            "De lanzamiento a traccion — construye el sistema para pasar de primeras ventas a canal escalable",
        ],
        includes: [
            "4 semanas de contenido",
            "Frameworks de GTM",
            "Templates",
            "Acceso de por vida",
        ],
    },
    {
        id: "product-rockstar",
        name: "Product Rockstar",
        tagline: "Roadmaps que generan revenue",
        description:
            "Lidera roadmaps con impacto. Priorizacion basada en datos, discovery continuo y frameworks para Product Managers gestionando stakeholders y equipos tecnicos.",
        level: "abierto",
        audience: "Product Managers",
        format: "virtual",
        duration: "6 semanas",
        price: "$850 USD",
        nextDate: "23 de marzo 2026",
        mentors: [ALL_MENTORS.ramiro, ALL_MENTORS.dylan],
        modules: [
            { name: "Rockstar PM Process", description: "Proceso de PM de alto impacto" },
            { name: "Problem Divergence", description: "Exploracion de problemas" },
            { name: "Problem Convergence", description: "Priorizacion de problemas" },
            { name: "Solution Divergence", description: "Exploracion de soluciones" },
            { name: "Solution Convergence", description: "Seleccion de solucion" },
            { name: "Delivery Excellence", description: "Ejecucion y lanzamiento" },
        ],
        keyPoints: [
            "Lidera producto con impacto real en el negocio",
            "Prioriza lo que mueve metricas, no lo que pide el stakeholder mas ruidoso",
            "Discovery, delivery, impacto — domina el ciclo completo",
        ],
        includes: [
            "6 semanas de contenido",
            "Frameworks de producto",
            "Templates",
            "Acceso de por vida",
        ],
    },
    {
        id: "xtreme-growth",
        name: "Xtreme Growth",
        tagline: "Escalar rapido, escalar con IA",
        description:
            "Escalamiento agresivo para lideres senior. Integra growth con IA, construye sistemas que soportan 10x y gestiona equipos en hipercrecimiento sostenido.",
        level: "avanzado",
        audience: "VPs, Heads of Growth, founders en etapa de escala",
        format: "virtual",
        duration: "10 semanas",
        price: "$1,450 USD",
        nextDate: "30 de marzo 2026",
        mentors: [ALL_MENTORS.tatiana, ALL_MENTORS.dylan],
        modules: [
            { name: "Acquisition Loops", description: "Loops de adquisicion" },
            { name: "Retencion, Engagement & Resurrection", description: "Retencion avanzada" },
            { name: "Activacion", description: "Onboarding y activacion" },
            { name: "Monetizacion & Pricing en la Era de IA", description: "Pricing con AI" },
            { name: "Experimentacion en la Era de IA", description: "100 experimentos en el tiempo de 10" },
            { name: "Defensibilidad", description: "Moats y ventaja competitiva" },
        ],
        keyPoints: [
            "Tacticas agresivas de crecimiento potenciadas con inteligencia artificial",
            "Velocidad como ventaja competitiva — ejecuta mas rapido que tu competencia",
            "100 experimentos en el tiempo de 10 — multiplica testeo con automatizacion",
        ],
        includes: [
            "10 semanas de contenido",
            "Frameworks avanzados de growth",
            "Acceso de por vida",
        ],
    },
    {
        id: "negociacion",
        name: "Negociacion Estrategica",
        tagline: "Negociar es un sistema, no un talento",
        description:
            "Frameworks de negociacion estrategica para ejecutivos que cierran en mesas grandes. Tecnicas de influencia y persuasion aplicadas a contextos reales.",
        level: "ejecutivo",
        audience: "Ejecutivos cerrando M&A, partnerships y acuerdos de alto riesgo",
        format: "presencial",
        duration: "3 dias",
        price: "$4,000 USD",
        nextDate: "Junio 2026",
        mentors: [
            ALL_MENTORS.francisco,
            ALL_MENTORS.patricio,
            ALL_MENTORS.pablo,
        ],
        modules: [
            { name: "Competir o Colaborar", description: "Estrategia de negociacion" },
            { name: "Anatomia de la Negociacion", description: "Estructura" },
            { name: "Influencia y Persuasion", description: "Tecnicas avanzadas" },
            { name: "Mapeo de Actores", description: "Stakeholder mapping" },
            { name: "Clinica de Casos", description: "Practica con casos reales" },
            { name: "Negociacion con IA", description: "AI como herramienta de negociacion" },
        ],
        keyPoints: [
            "Controla la mesa sin levantar la voz — tecnicas de influencia aplicadas",
            "Gana sin que el otro pierda — disena acuerdos donde ambas partes escalan",
            "Frameworks para M&A, partnerships y acuerdos de alto riesgo",
        ],
        includes: [
            "3 dias presenciales",
            "Framework de negociacion completo",
            "Clinica de casos reales",
            "Certificado",
        ],
    },
    {
        id: "advanced-strategy",
        name: "Advanced Strategy",
        tagline: "Estrategia para los que ya crecieron",
        description:
            "Estrategia ejecutiva para VPs y Heads liderando equipos grandes. Planificacion multi-canal, stack tecnologico avanzado, org design y ejecucion en mercados competitivos a escala.",
        level: "ejecutivo",
        audience: "VPs y Heads liderando equipos grandes",
        format: "virtual",
        duration: "8 semanas",
        price: "$2,500 USD",
        nextDate: "Mayo 2026",
        mentors: [ALL_MENTORS.roman, ALL_MENTORS.dylan],
        modules: [],
        keyPoints: [
            "Piensa a 3 anos, ejecuta esta semana",
            "De operador a estratega — deja de resolver incendios",
            "Liderazgo ejecutivo de crecimiento para el siguiente salto",
        ],
        includes: [
            "8 semanas de contenido",
            "Acceso de por vida",
        ],
    },
    {
        id: "next",
        name: "Next",
        tagline: "El futuro de Latam se construye, no se espera",
        description:
            "Para la siguiente generacion de lideres (13-18 anos) que van a definir la region. No es un programa de inspiracion. Es un espacio para lanzar proyectos reales con mentoria directa.",
        level: "abierto",
        audience: "Jovenes de 13-18 anos en toda Latinoamerica",
        format: "virtual",
        duration: "8 semanas",
        price: "Por confirmar (modelo de becas: por cada cupo pago, se becan 2 high performers)",
        nextDate: "Por confirmar",
        mentors: [ALL_MENTORS.andres],
        modules: [
            { name: "Semana 0: Kick-off", description: "Mindset, Agency & First Principles" },
            { name: "Semana 1: Problema & Equipo", description: "Definicion del proyecto" },
            { name: "Semana 2: Propuesta de Valor", description: "UX/UI design" },
            { name: "Semana 3: Finanzas & Modelos", description: "Business model" },
            { name: "Semana 4: Ventas & Automatizacion", description: "AI tools" },
            { name: "Semana 5: Growth Early Stage", description: "Primeros usuarios" },
            { name: "Semana 6: Marketing Digital", description: "Canales digitales" },
            { name: "Semana 7: Pitch & Storytelling", description: "Presentacion" },
            { name: "Semana 8: Demo Day & Graduacion", description: "Pitch a inversionistas" },
        ],
        keyPoints: [
            "Empieza a construir antes de graduarte",
            "Mentoria directa de quienes ya lo hicieron",
            "Acceso a founders que escalaron companias reales en LATAM",
        ],
        includes: [
            "8 semanas de programa",
            "Herramientas: ChatGPT, N8N, Supabase, Lovable, Eleven Labs",
            "Modelo social: por cada cupo pago, se becan 2 high performers",
        ],
    },
];

export function getProgramById(id: string): Program | undefined {
    return programs.find((p) => p.id === id);
}

export function getProgramByName(name: string): Program | undefined {
    const lower = name.toLowerCase();
    return programs.find(
        (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.id.toLowerCase().includes(lower),
    );
}
