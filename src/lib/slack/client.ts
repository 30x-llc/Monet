/**
 * Thin Slack Web API wrapper. We only need a handful of methods — keep
 * surface area small so we don't pull in the full @slack/web-api
 * dependency (it bloats the serverless bundle).
 */

const SLACK_API = "https://slack.com/api";

function token(): string {
    const t = process.env.SLACK_BOT_TOKEN;
    if (!t) throw new Error("SLACK_BOT_TOKEN not set");
    return t;
}

async function call<T = unknown>(method: string, body: object): Promise<T> {
    const res = await fetch(`${SLACK_API}/${method}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok: boolean; error?: string } & Record<string, unknown>;
    if (!json.ok) {
        throw new Error(`slack.${method} failed: ${json.error ?? "unknown"}`);
    }
    return json as T;
}

export interface PostMessageOpts {
    channel: string;
    text: string;
    blocks?: unknown[];
    thread_ts?: string;
    /** Marks the message as ephemeral and visible only to this user. */
    user?: string;
}

export async function postMessage(opts: PostMessageOpts): Promise<{ ts: string; channel: string }> {
    const data = await call<{ ts: string; channel: string }>("chat.postMessage", opts);
    return { ts: data.ts, channel: data.channel };
}

export async function updateMessage(opts: {
    channel: string;
    ts: string;
    text: string;
    blocks?: unknown[];
}): Promise<void> {
    await call("chat.update", opts);
}

export async function openDM(userId: string): Promise<string> {
    const data = await call<{ channel: { id: string } }>("conversations.open", { users: userId });
    return data.channel.id;
}

export async function uploadFile(opts: {
    channel: string;
    filename: string;
    title?: string;
    initial_comment?: string;
    thread_ts?: string;
    fileBuffer: Buffer;
}): Promise<void> {
    // Slack's modern flow: get upload URL → PUT bytes → completeUpload.
    const length = opts.fileBuffer.length;
    const up = await call<{ upload_url: string; file_id: string }>("files.getUploadURLExternal", {
        filename: opts.filename,
        length,
    });
    const putRes = await fetch(up.upload_url, {
        method: "POST",
        body: new Uint8Array(opts.fileBuffer),
    });
    if (!putRes.ok) {
        throw new Error(`upload PUT failed: ${putRes.status}`);
    }
    await call("files.completeUploadExternal", {
        files: [{ id: up.file_id, title: opts.title ?? opts.filename }],
        channel_id: opts.channel,
        initial_comment: opts.initial_comment,
        thread_ts: opts.thread_ts,
    });
}

/** Construct a deep link back to a Slack message permalink. */
export async function getPermalink(channel: string, ts: string): Promise<string | null> {
    try {
        const data = await call<{ permalink: string }>("chat.getPermalink", {
            channel,
            message_ts: ts,
        });
        return data.permalink;
    } catch {
        return null;
    }
}
