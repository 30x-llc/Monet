/**
 * Thin wrapper around the Canva Connect REST API.
 *
 * Only covers the calls v1 of the integration needs:
 *   - exchangeCode → trade the OAuth code for an access/refresh token pair
 *   - importDesign → start a PDF/PPTX import job
 *   - pollImportJob → watch the import until Canva finishes processing
 *   - getUser → who owns the token (for the "Connected as …" label)
 *
 * Docs: https://www.canva.com/developers/docs/connect-api/
 */

import "server-only";
import {
    CANVA_API_BASE,
    CANVA_CLIENT_ID,
    CANVA_CLIENT_SECRET,
    CANVA_REDIRECT_URI,
} from "./config";
import type { TokenRecord } from "./token-store";

export async function exchangeCode(
    code: string,
    codeVerifier: string,
): Promise<TokenRecord> {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
        redirect_uri: CANVA_REDIRECT_URI,
    });
    const basic = Buffer.from(
        `${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch(`${CANVA_API_BASE}/rest/v1/oauth/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva token exchange failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
    };

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
}

export interface ImportJobStatus {
    status: "in_progress" | "success" | "failed";
    design?: { id: string; urls: { edit_url: string; view_url: string } };
    error?: string;
}

/**
 * Kick off a design import from a hosted file URL. Canva fetches the
 * URL server-side, so it must be publicly reachable for the duration
 * of the job (we use Vercel Blob with a short TTL).
 */
export async function importDesign(opts: {
    accessToken: string;
    sourceUrl: string;
    title: string;
    mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}): Promise<string> {
    const res = await fetch(`${CANVA_API_BASE}/rest/v1/imports`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: opts.title,
            // Canva's import endpoint takes a URL in the `source` field
            // on recent versions of the Connect API.
            source: { type: "url", url: opts.sourceUrl, mime_type: opts.mimeType },
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva import start failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { job: { id: string } };
    return data.job.id;
}

export async function pollImportJob(
    accessToken: string,
    jobId: string,
): Promise<ImportJobStatus> {
    const res = await fetch(`${CANVA_API_BASE}/rest/v1/imports/${jobId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva import poll failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as {
        job: {
            status: "in_progress" | "success" | "failed";
            error?: { message?: string };
            result?: {
                designs?: Array<{
                    id: string;
                    urls: { edit_url: string; view_url: string };
                }>;
            };
        };
    };

    const job = data.job;
    if (job.status === "failed") {
        return { status: "failed", error: job.error?.message ?? "Import failed" };
    }
    if (job.status === "success") {
        const d = job.result?.designs?.[0];
        if (!d) return { status: "failed", error: "No design returned" };
        return { status: "success", design: d };
    }
    return { status: "in_progress" };
}

export interface CanvaUser {
    id: string;
    displayName?: string;
}

/**
 * Best-effort "who is this?" — used only for the "Connected as Jane"
 * label in the UI. If the API call fails we swallow the error and
 * return null; the connection still works.
 */
export async function getUser(accessToken: string): Promise<CanvaUser | null> {
    try {
        const res = await fetch(`${CANVA_API_BASE}/rest/v1/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
            user?: { user_id?: string; display_name?: string };
        };
        if (!data.user?.user_id) return null;
        return { id: data.user.user_id, displayName: data.user.display_name };
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// AUTOFILL API — the path to true Canva-quality output.
//
// Workflow per slide:
//   1. uploadAssetFromUrl()  — every image (logo, hero, mentor) gets
//      uploaded to Canva and we get back an asset_id.
//   2. createAutofill()       — kick off the autofill job with the
//      template_id + a map of { field_name: { type: text|image, ... } }
//   3. pollAutofill()        — poll until status === "success"; get the
//      design id + edit/view URLs.
//
// Docs: https://www.canva.com/developers/docs/connect-api/api-reference/autofills/
//       https://www.canva.com/developers/docs/connect-api/api-reference/assets/
// ─────────────────────────────────────────────────────────────

export type AutofillField =
    | { type: "text"; text: string }
    | { type: "image"; asset_id: string };

export interface AutofillJobStatus {
    status: "in_progress" | "success" | "failed";
    design?: { id: string; urls: { edit_url: string; view_url: string } };
    error?: string;
}

/**
 * Start an autofill job for a Brand Template. Data field names must
 * match exactly what the designer marked in Canva (case-sensitive,
 * snake_case by 30x convention).
 */
export async function createAutofill(opts: {
    accessToken: string;
    brandTemplateId: string;
    title?: string;
    data: Record<string, AutofillField>;
}): Promise<string> {
    const res = await fetch(`${CANVA_API_BASE}/rest/v1/autofills`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            brand_template_id: opts.brandTemplateId,
            title: opts.title,
            data: opts.data,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva autofill start failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { job: { id: string } };
    return data.job.id;
}

export async function pollAutofill(
    accessToken: string,
    jobId: string,
): Promise<AutofillJobStatus> {
    const res = await fetch(
        `${CANVA_API_BASE}/rest/v1/autofills/${jobId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva autofill poll failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as {
        job: {
            status: "in_progress" | "success" | "failed";
            error?: { message?: string };
            result?: {
                design: {
                    id: string;
                    urls: { edit_url: string; view_url: string };
                };
            };
        };
    };
    const job = data.job;
    if (job.status === "failed") {
        return { status: "failed", error: job.error?.message ?? "Autofill failed" };
    }
    if (job.status === "success") {
        const d = job.result?.design;
        if (!d) return { status: "failed", error: "No design returned" };
        return { status: "success", design: d };
    }
    return { status: "in_progress" };
}

/**
 * Upload an image from a public URL into the user's Canva account so
 * we can reference it as an asset in autofill payloads. Canva's asset
 * upload is a 2-step async process; we wait for the asset to be ready
 * before returning.
 */
export async function uploadAssetFromUrl(opts: {
    accessToken: string;
    sourceUrl: string;
    name?: string;
}): Promise<string> {
    // Step 1: ask Canva to ingest the URL.
    const res = await fetch(`${CANVA_API_BASE}/rest/v1/asset-uploads`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": "application/json",
            // Asset metadata needs to be base64 in this header per Canva docs.
            "Asset-Upload-Metadata": Buffer.from(
                JSON.stringify({ name_base64: Buffer.from(opts.name ?? opts.sourceUrl).toString("base64") }),
            ).toString("base64"),
        },
        body: JSON.stringify({ source: { type: "url", url: opts.sourceUrl } }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Canva asset upload start failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { job: { id: string } };

    // Step 2: poll the upload job.
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1000));
        const poll = await fetch(
            `${CANVA_API_BASE}/rest/v1/asset-uploads/${data.job.id}`,
            { headers: { Authorization: `Bearer ${opts.accessToken}` } },
        );
        if (!poll.ok) continue;
        const polled = (await poll.json()) as {
            job: {
                status: "in_progress" | "success" | "failed";
                asset?: { id: string };
                error?: { message?: string };
            };
        };
        if (polled.job.status === "success" && polled.job.asset?.id) {
            return polled.job.asset.id;
        }
        if (polled.job.status === "failed") {
            throw new Error(
                `Canva asset upload failed: ${polled.job.error?.message ?? "(no message)"}`,
            );
        }
    }
    throw new Error(`Canva asset upload timeout after 60s for ${opts.sourceUrl}`);
}

export interface BrandTemplateSummary {
    id: string;
    title: string;
    thumbnailUrl?: string;
}

/**
 * List the user's Brand Templates — useful while developing to grab
 * template IDs without hunting in the Canva UI.
 */
export async function listBrandTemplates(
    accessToken: string,
): Promise<BrandTemplateSummary[]> {
    const res = await fetch(
        `${CANVA_API_BASE}/rest/v1/brand-templates?limit=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
        items?: Array<{ id: string; title?: string; thumbnail?: { url?: string } }>;
    };
    return (data.items ?? []).map((t) => ({
        id: t.id,
        title: t.title ?? "(sin nombre)",
        thumbnailUrl: t.thumbnail?.url,
    }));
}
