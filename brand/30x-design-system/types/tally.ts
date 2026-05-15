// Tally Form Submission Types for 30x Recruitment Form
// Form ID: 2EvZZp

export interface TallyReference {
    name: string;
    email: string;
    position: string;
    company: string;
    relationship: string;
}

export interface TallySubmission {
    id: string;
    submittedAt: string;

    // Basic Info (Page 1)
    firstName: string;
    lastName: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    targetRole: string; // "CEO", "CFO", "CMO", etc.

    // Professional Profile (Page 2)
    currentCompany: string;
    currentPosition: string;
    area: string; // "Finanzas", "Marketing", "Operaciones", etc.
    yearsExperience: number;
    cvUrl?: string;

    // Skills & Tools (Page 3)
    softSkills: string[]; // Liderazgo, Comunicación, Pensamiento estratégico, etc.
    tools: string[]; // Excel, Power BI, Salesforce, etc.
    aiTools: string[]; // ChatGPT, Claude, Midjourney, etc.

    // References (Page 4)
    references: TallyReference[];

    // Final Questions (Page 5)
    salaryExpectation: string;
    startDate: string;
    referralSource: string;
    additionalComments?: string;

    // Metadata
    status: "new" | "reviewing" | "interviewed" | "accepted" | "rejected";
    score?: number;
    notes?: string;
}

export interface TallyWebhookPayload {
    eventId: string;
    eventType: "FORM_RESPONSE";
    createdAt: string;
    data: {
        responseId: string;
        submissionId: string;
        respondentId: string;
        formId: string;
        formName: string;
        createdAt: string;
        fields: TallyField[];
    };
}

export interface TallyField {
    key: string;
    label: string;
    type: string;
    value: string | string[] | number | null;
    options?: TallyFieldOption[];
}

export interface TallyFieldOption {
    id: string;
    text: string;
}

// Analytics Types
export interface SubmissionMetrics {
    totalSubmissions: number;
    newThisWeek: number;
    averageScore: number;
    conversionRate: number;
}

export interface SubmissionsByRole {
    role: string;
    count: number;
    percentage: number;
}

export interface SubmissionsByArea {
    area: string;
    count: number;
    percentage: number;
}

export interface SubmissionTrend {
    date: string;
    count: number;
}

// Mock data generator helper
export const ROLES = ["CEO", "CFO", "CMO", "COO", "CTO", "VP", "Director", "Gerente General"] as const;
export const AREAS = ["Finanzas", "Marketing", "Operaciones", "Tecnología", "Recursos Humanos", "Comercial", "Legal"] as const;
export const SOFT_SKILLS = [
    "Liderazgo",
    "Comunicación",
    "Pensamiento estratégico",
    "Trabajo en equipo",
    "Resolución de problemas",
    "Adaptabilidad",
    "Negociación",
    "Gestión del tiempo",
    "Inteligencia emocional",
    "Toma de decisiones",
    "Creatividad",
] as const;
export const TOOLS = [
    "Excel",
    "Power BI",
    "Tableau",
    "Salesforce",
    "HubSpot",
    "SAP",
    "Oracle",
    "Google Analytics",
    "Notion",
    "Slack",
    "Monday.com",
    "Asana",
] as const;
export const AI_TOOLS = [
    "ChatGPT",
    "Claude",
    "Midjourney",
    "DALL-E",
    "Copilot",
    "Jasper",
    "Grammarly",
    "Notion AI",
] as const;
