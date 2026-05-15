import type { TallySubmission, SubmissionMetrics, SubmissionsByRole, SubmissionsByArea, SubmissionTrend } from "@/types/tally";
import { ROLES, AREAS, SOFT_SKILLS, TOOLS, AI_TOOLS } from "@/types/tally";

// Seeded random number generator for consistent SSR/client data
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }

    nextRange(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pick<T>(arr: readonly T[]): T {
        return arr[this.nextInt(arr.length)];
    }
}

const rng = new SeededRandom(12345);

// Helper to generate random items from array
const randomItems = <T>(arr: readonly T[], min: number, max: number): T[] => {
    const count = rng.nextRange(min, max);
    const shuffled = [...arr].sort(() => 0.5 - rng.next());
    return shuffled.slice(0, count);
};

// Helper to generate random date within range
const randomDate = (start: Date, end: Date): string => {
    const date = new Date(start.getTime() + rng.next() * (end.getTime() - start.getTime()));
    return date.toISOString();
};

// First names (Latin American)
const FIRST_NAMES = [
    "María", "José", "Carlos", "Ana", "Juan", "Laura", "Miguel", "Carmen",
    "Francisco", "Patricia", "Roberto", "Sofía", "Fernando", "Gabriela", "Ricardo",
    "Alejandra", "Eduardo", "Valeria", "Diego", "Daniela", "Andrés", "Camila",
    "Sebastián", "Isabella", "Martín", "Lucía", "Felipe", "Natalia", "Pablo", "Andrea"
];

// Last names (Latin American)
const LAST_NAMES = [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz",
    "Morales", "Reyes", "Ortiz", "Gutiérrez", "Chávez", "Mendoza", "Ruiz", "Vargas",
    "Castro", "Ramos", "Herrera", "Medina", "Aguilar", "Jiménez", "Vega"
];

// Companies (Real LATAM companies)
const COMPANIES = [
    "Mercado Libre", "Nubank", "Rappi", "Kavak", "Clip", "Konfío", "Clara", "Ualá",
    "Bitso", "Cornershop", "NotCo", "Platzi", "Loft", "QuintoAndar", "Creditas",
    "Olist", "EBANX", "Wildlife Studios", "VTEX", "Loggi", "Gympass", "iFood",
    "Globant", "MercadoPago", "Banbif", "Interbank", "BCP", "BBVA", "Scotiabank", "Cencosud"
];

// Locations
const LOCATIONS = [
    "Ciudad de México", "Buenos Aires", "São Paulo", "Lima", "Bogotá", "Santiago",
    "Monterrey", "Guadalajara", "Medellín", "Querétaro", "Quito", "Panamá",
    "San José", "Montevideo", "Caracas", "Santo Domingo"
];

// Generate a single mock submission
const generateMockSubmission = (index: number): TallySubmission => {
    const firstName = rng.pick(FIRST_NAMES);
    const lastName = rng.pick(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${rng.pick(COMPANIES).toLowerCase().replace(/\s/g, "")}.com`;
    const statuses = ["new", "reviewing", "interviewed", "accepted", "rejected"] as const;
    const status = statuses[rng.nextInt(5)];
    const positions = ["Director de Finanzas", "Gerente General", "VP de Operaciones", "Head of Growth", "Country Manager", "Director Comercial", "CFO", "COO"];
    const startDates = ["Inmediato", "2 semanas", "1 mes", "2 meses", "Negociable"];
    const sources = ["LinkedIn", "Referido", "30x Network", "Evento", "Búsqueda directa", "Otro"];

    return {
        id: `sub_30x_${index}`,
        submittedAt: randomDate(new Date("2024-01-01"), new Date("2024-12-31")),
        firstName,
        lastName,
        location: rng.pick(LOCATIONS),
        phone: `+52 ${rng.nextRange(100, 999)} ${rng.nextRange(100, 999)} ${rng.nextRange(1000, 9999)}`,
        email,
        linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        targetRole: rng.pick(ROLES),
        currentCompany: rng.pick(COMPANIES),
        currentPosition: positions[rng.nextInt(8)],
        area: rng.pick(AREAS),
        yearsExperience: rng.nextRange(5, 25),
        cvUrl: `https://drive.google.com/file/d/cv_${index}/view`,
        softSkills: randomItems(SOFT_SKILLS, 3, 6) as string[],
        tools: randomItems(TOOLS, 4, 8) as string[],
        aiTools: randomItems(AI_TOOLS, 2, 5) as string[],
        references: [
            {
                name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
                email: `ref1@${rng.pick(COMPANIES).toLowerCase().replace(/\s/g, "")}.com`,
                position: "CEO",
                company: rng.pick(COMPANIES),
                relationship: "Jefe directo"
            },
            {
                name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
                email: `ref2@${rng.pick(COMPANIES).toLowerCase().replace(/\s/g, "")}.com`,
                position: "CFO",
                company: rng.pick(COMPANIES),
                relationship: "Colega"
            },
        ],
        salaryExpectation: `$${rng.nextRange(80, 130)}k - $${rng.nextRange(130, 180)}k USD/año`,
        startDate: startDates[rng.nextInt(5)],
        referralSource: sources[rng.nextInt(6)],
        additionalComments: rng.next() > 0.7 ? "Interesado en roles con equity y proyección regional." : undefined,
        status,
        score: status === "new" ? undefined : rng.nextRange(60, 100),
        notes: status !== "new" ? "Perfil interesante, agendar llamada." : undefined,
    };
};

// Generate mock submissions
export const mockSubmissions: TallySubmission[] = Array.from({ length: 47 }, (_, i) => generateMockSubmission(i));

// Generate metrics - using fixed date for SSR consistency
const METRICS_BASE_DATE = new Date("2024-12-15");
export const mockMetrics: SubmissionMetrics = {
    totalSubmissions: mockSubmissions.length,
    newThisWeek: mockSubmissions.filter(s => {
        const submittedDate = new Date(s.submittedAt);
        const oneWeekAgo = new Date(METRICS_BASE_DATE);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return submittedDate >= oneWeekAgo;
    }).length,
    averageScore: Math.round(mockSubmissions.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / mockSubmissions.filter(s => s.score).length),
    conversionRate: Math.round((mockSubmissions.filter(s => s.status === "accepted").length / mockSubmissions.length) * 100),
};

// Generate submissions by role
export const mockSubmissionsByRole: SubmissionsByRole[] = ROLES.map(role => {
    const count = mockSubmissions.filter(s => s.targetRole === role).length;
    return {
        role,
        count,
        percentage: Math.round((count / mockSubmissions.length) * 100),
    };
}).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

// Generate submissions by area
export const mockSubmissionsByArea: SubmissionsByArea[] = AREAS.map(area => {
    const count = mockSubmissions.filter(s => s.area === area).length;
    return {
        area,
        count,
        percentage: Math.round((count / mockSubmissions.length) * 100),
    };
}).filter(a => a.count > 0).sort((a, b) => b.count - a.count);

// Generate submission trends (last 30 days) - using fixed base date for SSR consistency
const BASE_DATE = new Date("2024-12-15");
export const mockSubmissionTrends: SubmissionTrend[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(BASE_DATE);
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];
    return {
        date: dateStr,
        count: rng.nextRange(1, 6),
    };
});
