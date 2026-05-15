import { upload } from "@vercel/blob/client";

/**
 * Streams a single image file directly from the browser to Vercel Blob
 * via the /api/upload-image token route. Returns the public URL the
 * caller can drop into clientLogoUrl, backgroundImage, etc.
 *
 * Throws on size/MIME violations or auth failure — let the caller
 * surface a toast.
 */
export async function uploadImage(file: File): Promise<string> {
    const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "image";
    const blob = await upload(`uploads/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload-image",
    });
    return blob.url;
}
