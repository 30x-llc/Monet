import type { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { readIdentity } from "@/lib/auth/identity";

export const runtime = "nodejs";

/**
 * POST /api/upload-image
 *
 * Token endpoint that lets the browser stream image files directly to
 * Vercel Blob (logo, hero, slide image overrides — anything the
 * salesperson wants to swap in for the auto-research pick). 25MB ceiling
 * is plenty for 8K JPEGs and PNG-24 logos; reject anything bigger so we
 * don't pay for accidental video uploads. Auth-gated by the same
 * identity cookie used everywhere else.
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
                    throw new Error("Identifícate antes de subir una imagen.");
                }
                return {
                    allowedContentTypes: [
                        "image/png",
                        "image/jpeg",
                        "image/webp",
                        "image/svg+xml",
                        "image/gif",
                        "image/avif",
                    ],
                    maximumSizeInBytes: 25 * 1024 * 1024,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        userEmail: identity.email,
                        pathname,
                    }),
                };
            },
            onUploadCompleted: async () => {},
        });
        return Response.json(jsonResponse);
    } catch (err) {
        console.error("[upload-image]", err);
        return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 400 },
        );
    }
}
