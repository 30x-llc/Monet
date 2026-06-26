/**
 * Pure types + constants — safe to import from client components.
 * Anything DB-actual (sql, ensureSchema) lives in schema.ts behind
 * "server-only".
 */

export type DeckStatus =
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "sent"
    | "won"
    | "lost"
    | "archived";

export const DECK_STATUSES: DeckStatus[] = [
    "draft",
    "pending_approval",
    "approved",
    "rejected",
    "sent",
    "won",
    "lost",
    "archived",
];

export const DECK_STATUS_LABELS: Record<DeckStatus, string> = {
    draft: "Borrador",
    pending_approval: "En aprobación",
    approved: "Aprobada",
    rejected: "Rechazada",
    sent: "Enviado",
    won: "Ganado",
    lost: "Perdido",
    archived: "Archivado",
};
