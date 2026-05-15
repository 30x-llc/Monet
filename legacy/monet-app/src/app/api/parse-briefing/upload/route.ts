import type { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { readIdentity } from "@/lib/auth/identity";

export const runtime = "nodejs";

/**
 * POST /api/parse-briefing/upload
 *
 * Issues short-lived upload tokens so the browser can stream the file
 * directly to Vercel Blob instead of through this function. That's the
 * difference between "4.5MB hard limit" and "5TB". Every briefing the
 * salesperson drops — be it a 200MB PPTX or a 60-page PDF — uses this.
 *
 * Auth: must have a valid 30x identity cookie. Anonymous uploads are
 * rejected so we don't pay for arbitrary internet traffic into our Blob.
 */
export async function POST(request: NextRequest) {
    const body = (await request.json()) as HandleUploadBody;
    const identity = await readIdentity();

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                if (!identity) {
                    throw new Error("Identifícate antes de subir un archivo.");
                }
                return {
                    // Omit allowedContentTypes entirely so Blob accepts
                    // any MIME type. (`["*/*"]` is treated as a literal
                    // content-type that never matches, breaking PDF/DOCX/PPTX.)
                    // 250MB ceiling — well past anything reasonable for a
                    // proposal/contract/transcript. Real parsing latency
                    // becomes the bottleneck before file size does.
                    maximumSizeInBytes: 250 * 1024 * 1024,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        userEmail: identity.email,
                        pathname,
                    }),
                };
            },
            // We don't need a webhook — parsing happens in the next call
            // when the client sends the resulting URL to /api/parse-briefing.
            onUploadCompleted: async () => {},
        });
        return Response.json(jsonResponse);
    } catch (err) {
        console.error("[parse-briefing/upload]", err);
        return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 400 },
        );
    }
}
