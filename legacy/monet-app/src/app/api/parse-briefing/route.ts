import type { NextRequest } from "next/server";
import { del as blobDel } from "@vercel/blob";

// Parsing PDFs / DOCX / PPTX requires Node APIs and node-only deps.
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/parse-briefing
 *
 * Body: JSON { url, fileName, mimeType? }
 *
 * Pipeline:
 *   1. Client uploaded the file directly to Vercel Blob (no function
 *      body limit there — supports up to 5TB).
 *   2. Server fetches the file from the Blob URL (we own the Blob, the
 *      fetch is internal to Vercel infra so it's fast).
 *   3. Dispatch by extension: PDF → pdf-parse, DOCX → mammoth,
 *      PPTX → JSZip text extraction, plain-text formats → utf-8 read.
 *   4. Return plain text (truncated to 80K chars to keep downstream
 *      Claude prompts sane).
 *   5. Best-effort delete the Blob — we already extracted what we need.
 *
 * The user can drop ANY size of file. The 4.5MB serverless function
 * body limit doesn't apply because we never receive the file directly.
 */
export async function POST(request: NextRequest) {
    let blobUrl: string | undefined;
    try {
        const body = (await request.json().catch(() => null)) as {
            url?: string;
            fileName?: string;
            mimeType?: string;
        } | null;

        if (!body?.url) {
            return Response.json(
                { ok: false, error: "Falta `url` en el body." },
                { status: 400 },
            );
        }
        blobUrl = body.url;

        const fileName = body.fileName || blobUrl.split("/").pop() || "briefing";
        const mimeType = body.mimeType || guessMime(fileName);
        const ext = fileName.toLowerCase().split(".").pop() || "";

        // Pull the file content from Blob.
        const fileRes = await fetch(blobUrl);
        if (!fileRes.ok) {
            return Response.json(
                {
                    ok: false,
                    error: `No pude leer el archivo del Blob: ${fileRes.status}`,
                },
                { status: 502 },
            );
        }
        const buffer = Buffer.from(await fileRes.arrayBuffer());

        let text = "";
        let kind: string;

        if (ext === "pdf" || mimeType === "application/pdf") {
            kind = "pdf";
            text = await parsePdf(buffer);
        } else if (
            ext === "docx" ||
            mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            kind = "docx";
            text = await parseDocx(buffer);
        } else if (
            ext === "pptx" ||
            mimeType ===
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ) {
            kind = "pptx";
            text = await parsePptx(buffer);
        } else if (
            ext === "json" ||
            mimeType === "application/json" ||
            mimeType.startsWith("text/") ||
            ["md", "markdown", "txt", "text", "csv", "tsv", "rtf", "log"].includes(ext)
        ) {
            kind = "text";
            text = buffer.toString("utf-8");
        } else if (mimeType.startsWith("image/")) {
            return Response.json(
                {
                    ok: false,
                    error: `Las imágenes todavía no se parsean automáticamente. Si la imagen tiene texto, transcribilo en "Notas adicionales".`,
                    kind: "image",
                },
                { status: 415 },
            );
        } else {
            return Response.json(
                {
                    ok: false,
                    error: `Formato no soportado: .${ext} (${mimeType}). Convertilo a PDF/DOCX/MD/TXT y reintenta.`,
                    kind: "unsupported",
                },
                { status: 415 },
            );
        }

        const trimmed = text.replace(/ /g, "").replace(/\r\n/g, "\n");
        const capped =
            trimmed.length > 80_000
                ? trimmed.slice(0, 80_000) + "\n\n[…texto truncado a 80K chars…]"
                : trimmed;

        return Response.json({
            ok: true,
            text: capped,
            fileName,
            mimeType,
            charCount: capped.length,
            kind,
        });
    } catch (err) {
        console.error("[parse-briefing]", err);
        return Response.json(
            {
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
        );
    } finally {
        // Best-effort delete the Blob — we already have the text.
        if (blobUrl) {
            blobDel(blobUrl).catch(() => {});
        }
    }
}

function guessMime(name: string): string {
    const ext = name.toLowerCase().split(".").pop() || "";
    const map: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        md: "text/markdown",
        markdown: "text/markdown",
        txt: "text/plain",
        text: "text/plain",
        json: "application/json",
        csv: "text/csv",
        tsv: "text/tab-separated-values",
        log: "text/plain",
    };
    return map[ext] ?? "application/octet-stream";
}

async function parsePdf(buffer: Buffer): Promise<string> {
    // pdf-parse v1 is the Node-friendly classic. v2 broke us with
    // DOMMatrix not being available in Node — pinned to ^1.1.1 in
    // package.json on purpose.
    const mod = await import("pdf-parse");
    type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;
    const pdfParse = (mod.default ?? mod) as unknown as PdfParseFn;
    const result = await pdfParse(buffer);
    return result.text ?? "";
}

async function parseDocx(buffer: Buffer): Promise<string> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
}

async function parsePptx(buffer: Buffer): Promise<string> {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
        .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
        .sort();

    const parts: string[] = [];
    for (let i = 0; i < slideFiles.length; i++) {
        const xml = await zip.files[slideFiles[i]].async("string");
        const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) ?? [];
        const slideText = matches
            .map((m) => m.replace(/<[^>]+>/g, "").trim())
            .filter(Boolean)
            .join("\n");
        if (slideText) parts.push(`--- Slide ${i + 1} ---\n${slideText}`);
    }
    return parts.join("\n\n");
}
