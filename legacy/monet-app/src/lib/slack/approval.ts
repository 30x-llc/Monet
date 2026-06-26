import "server-only";
import { postMessage } from "@/lib/slack/client";

/**
 * Proposal approval via Slack.
 *
 * Posts a finished proposal to the team's approval channel (#propuestas)
 * with Aprobar / Rechazar / Editar buttons. The button clicks land in
 * /api/slack/interactivity, which flips the deck's DB status to
 * `approved` / `rejected`. In-app approval (the /ops dashboard) writes the
 * same status, so Slack and the app stay in sync on one source of truth.
 *
 * Requires: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, and SLACK_PROPOSALS_CHANNEL
 * (a channel id like C0123… or a name like "#propuestas"; the bot must be a
 * member of it).
 */

const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://monet.30x.com";
const APPROVAL_CHANNEL = process.env.SLACK_PROPOSALS_CHANNEL ?? "#propuestas";

export interface ApprovalRequest {
    deckId: string;
    deckTitle: string;
    companyName: string;
    programName?: string;
    requesterName?: string;
}

export async function postProposalForApproval(
    args: ApprovalRequest,
): Promise<{ channel: string; ts: string }> {
    const url = `${PUBLIC_ORIGIN}/?open=${args.deckId}`;
    const meta = [
        args.programName ? `· ${args.programName}` : "",
        args.requesterName ? `\nEnviada por *${args.requesterName}*` : "",
    ].join("");

    const blocks: unknown[] = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*🟡 Propuesta para aprobación*\n*${args.deckTitle}* — ${args.companyName} ${meta}\n<${url}|Abrir y revisar en Monet>`,
            },
        },
        {
            type: "actions",
            block_id: "monet-approval",
            elements: [
                {
                    type: "button",
                    action_id: "monet_approve",
                    style: "primary",
                    text: { type: "plain_text", text: "✅ Aprobar" },
                    value: JSON.stringify({ action: "approve", deckId: args.deckId }),
                },
                {
                    type: "button",
                    action_id: "monet_reject_approval",
                    style: "danger",
                    text: { type: "plain_text", text: "Rechazar" },
                    value: JSON.stringify({ action: "reject", deckId: args.deckId }),
                    confirm: {
                        title: { type: "plain_text", text: "¿Rechazar la propuesta?" },
                        text: { type: "plain_text", text: "Quedará marcada como rechazada." },
                        confirm: { type: "plain_text", text: "Rechazar" },
                        deny: { type: "plain_text", text: "Cancelar" },
                    },
                },
                {
                    type: "button",
                    action_id: "monet_edit",
                    text: { type: "plain_text", text: "✏️ Editar" },
                    url,
                    value: JSON.stringify({ action: "edit", deckId: args.deckId }),
                },
            ],
        },
    ];

    return postMessage({
        channel: APPROVAL_CHANNEL,
        text: `Propuesta para aprobación: ${args.deckTitle} — ${args.companyName}`,
        blocks,
    });
}
