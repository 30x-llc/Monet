import { resolveManyPrograms, type ProgramEntry } from "@/lib/proposals/program-catalog";

/**
 * Parsed structure extracted from a free-form Slack intake message
 * like "propuesta para Bavaria, 4 sedes, AI Sales".
 */
export interface SlackIntake {
    /** Free-form raw text the user typed. */
    raw: string;
    /** Detected client / company name (single string). */
    clientName: string | null;
    /** Resolved 30X programs the user referenced. */
    programs: ProgramEntry[];
    /** Anything that wasn't claimed by clientName or programs. */
    hints: string;
    /** Heuristic: was the intent "propuesta" / "deck" / something else. */
    intent: "propuesta" | "deck" | "summary" | "unknown";
}

/**
 * Best-effort parse of an intake message. We optimize for the common
 * patterns Juan Diego and his team write:
 *
 *   "propuesta para Bavaria, 4 sedes, AI Sales"
 *   "Bavaria, Multipliers"
 *   "deck para Mastercard con Sales Machine y Ventas con IA"
 *   "Resumen de programas: Sales Machine, AI Sales, Fundraising School"
 *
 * The parser is intentionally lossy — if it can't find a client name,
 * the generator falls back to the topic/notes flow and the deck is
 * generic (still useful as a draft).
 */
export function parseSlackIntake(raw: string): SlackIntake {
    const text = raw.trim();
    const lower = text.toLowerCase();

    // 1) Intent
    let intent: SlackIntake["intent"] = "unknown";
    if (/\b(propuesta|propose|proposal)\b/.test(lower)) intent = "propuesta";
    else if (/\b(deck|presentaci[oó]n)\b/.test(lower)) intent = "deck";
    else if (/\b(resumen|summary|brief)\b/.test(lower)) intent = "summary";

    // 2) Programs — substring match against the catalog.
    const programs = resolveManyPrograms(text);

    // 3) Client name — heuristic. We look for patterns:
    //    "propuesta para {X}", "deck para {X}", "para {X}".
    //    If none, take the first capitalized token that isn't a program
    //    keyword nor an intent word.
    let clientName: string | null = null;
    const paraMatch =
        text.match(/(?:propuesta|deck|proposal|presentaci[oó]n)\s+para\s+([^,\n]+?)(?:\s+con\s|,|$)/i) ||
        text.match(/\bpara\s+([^,\n]+?)(?:\s+con\s|,|$)/i);
    if (paraMatch) {
        clientName = paraMatch[1].trim();
    } else {
        // Fall back: first capitalized word that's not a program/intent word.
        const programTokens = new Set(
            programs.flatMap((p) => [
                p.slug,
                p.name.toLowerCase(),
                ...p.aliases.map((a) => a.toLowerCase()),
            ]),
        );
        const stopwords = new Set([
            "propuesta",
            "deck",
            "proposal",
            "resumen",
            "summary",
            "brief",
            "para",
            "con",
            "y",
            "and",
            "monet",
            "presentacion",
            "presentación",
            "hola",
        ]);
        const tokens = text.split(/[\s,]+/).filter(Boolean);
        for (const t of tokens) {
            const tl = t.toLowerCase();
            if (programTokens.has(tl) || stopwords.has(tl)) continue;
            if (/^[A-ZÁÉÍÓÚÑ]/.test(t)) {
                clientName = t;
                break;
            }
        }
    }
    // Clean trailing punctuation.
    if (clientName) {
        clientName = clientName.replace(/[,\.;:]+$/, "").trim();
        if (!clientName) clientName = null;
    }

    // 4) Hints — whatever is left after stripping intent/client/programs.
    let hints = text;
    if (clientName) hints = hints.replace(new RegExp(escapeRegex(clientName), "i"), "");
    for (const p of programs) {
        hints = hints.replace(new RegExp(escapeRegex(p.name), "i"), "");
        for (const a of p.aliases) {
            hints = hints.replace(new RegExp(`\\b${escapeRegex(a)}\\b`, "i"), "");
        }
    }
    hints = hints
        .replace(/\b(propuesta|deck|para|con|y|and|resumen)\b/gi, "")
        .replace(/[,;]+/g, ",")
        .replace(/\s+/g, " ")
        .trim();

    return { raw, clientName, programs, hints, intent };
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Render a short human-readable summary of what the parser understood. */
export function describeIntake(intake: SlackIntake): string {
    const parts: string[] = [];
    if (intake.clientName) parts.push(`Cliente: *${intake.clientName}*`);
    if (intake.programs.length > 0) {
        parts.push(`Programas: ${intake.programs.map((p) => p.name).join(", ")}`);
    }
    if (intake.hints) parts.push(`Detalles: ${intake.hints}`);
    if (parts.length === 0) return `No pude detectar cliente ni programas. Voy a generar un deck genérico.`;
    return parts.join(" · ");
}
