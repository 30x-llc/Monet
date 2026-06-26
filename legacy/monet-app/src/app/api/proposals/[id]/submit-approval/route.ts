import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/proposals/:id/submit-approval
 *
 * Posts the proposal to the Slack approval channel (#propuestas) with
 * Aprobar / Rechazar buttons and flips the deck's status to
 * `pending_approval`. The deck must already exist in the DB (the in-app
 * editor mirrors every save to the server, and the Slack generator upserts).
 */
export async function POST(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
    const { id } = await ctx.params;

    if (!process.env.SLACK_BOT_TOKEN) {
        return NextResponse.json(
            { ok: false, error: "Slack no configurado (falta SLACK_BOT_TOKEN)" },
            { status: 503 },
        );
    }

    try {
        const { ensureSchema } = await import("@/lib/db/schema");
        const { getDeck, setDeckStatus } = await import("@/lib/db/decks");
        const { postProposalForApproval } = await import("@/lib/slack/approval");

        await ensureSchema();
        const row = await getDeck(id);
        if (!row) {
            return NextResponse.json({ ok: false, error: "Propuesta no encontrada" }, { status: 404 });
        }

        const posted = await postProposalForApproval({
            deckId: id,
            deckTitle: row.deckTitle,
            companyName: row.companyName,
            programName: row.programName ?? undefined,
            requesterName: row.userName,
        });

        await setDeckStatus(id, "pending_approval");

        return NextResponse.json({ ok: true, channel: posted.channel, ts: posted.ts });
    } catch (err) {
        console.error("[submit-approval]", err);
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}
