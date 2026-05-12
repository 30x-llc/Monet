/**
 * Server-side brand asset processor.
 *
 * Takes raw URLs to a client's logo and hero image (typically scraped
 * from the company's own website via Exa research) and produces two
 * "Plantilla Monet ready" derivatives:
 *
 *   1. logo → white-on-transparent PNG, cropped to its visible bbox.
 *      Drop-in replacement for the locked Aeroméxico logo slot on
 *      cover + closing lockup. White silhouette reads on any dark hero.
 *
 *   2. hero → duotone JPEG mapping luminance to a warm-amber → near-
 *      black gradient. Matches the editorial dark cover treatment of
 *      the original template so the headline white text stays legible.
 *
 * Both derivatives are uploaded to Vercel Blob with stable public URLs
 * the Canva `upload-asset-from-url` endpoint can fetch. Returns the
 * pair of URLs so the orchestrator can pass them downstream.
 *
 * Sharp is used for the pixel math. It's bundled with Next.js's image
 * optimizer so no extra dep is needed — but we still declare it in
 * package.json for clarity. Vercel Blob writes require BLOB_READ_WRITE_
 * TOKEN to be set (Marketplace integration).
 */

import "server-only";
import sharp from "sharp";
import { put } from "@vercel/blob";

export interface BrandAssetSet {
    /** Vercel Blob URL — white-on-transparent PNG of the logo. */
    logoWhiteUrl: string;
    /** Vercel Blob URL — duotone JPEG of the hero. */
    heroDuotoneUrl: string;
}

export interface BrandAssetInput {
    clientName: string;
    /** Source URL for the company logo (full-color, any format). */
    logoUrl?: string;
    /** Source URL for the hero photo (any format, ideally landscape). */
    heroImageUrl?: string;
}

/**
 * Duotone palette for the cover hero. Tuned to be cinematic without
 * fighting the white headline + body text. Default is a warm amber
 * gradient that reads as Bavaria-adjacent but works for most B2B
 * partners. Override via env or per-client later.
 */
const DEFAULT_DUOTONE_DARK: [number, number, number] = [6, 8, 14];
const DEFAULT_DUOTONE_BRIGHT: [number, number, number] = [165, 95, 50];
const DUOTONE_DARKEN = 0.75;

/**
 * Process a single logo image into the white-on-transparent silhouette
 * used in the Plantilla Monet cover + closing lockup. Returns a PNG
 * buffer cropped to its visible bounding box (no transparent padding).
 */
export async function logoToWhiteTransparent(input: Buffer): Promise<Buffer> {
    // 1. Pull raw RGB pixels from whatever the source format is.
    const raw = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data, info } = raw;
    const px = info.width * info.height;

    // 2. Build a 4-channel buffer: every pixel is solid white, alpha
    //    is the original "darkness" of that pixel (255 - min(r,g,b)).
    const out = Buffer.alloc(px * 4);
    for (let i = 0; i < px; i++) {
        const r = data[i * 3];
        const g = data[i * 3 + 1];
        const b = data[i * 3 + 2];
        out[i * 4] = 255;
        out[i * 4 + 1] = 255;
        out[i * 4 + 2] = 255;
        out[i * 4 + 3] = 255 - Math.min(r, g, b);
    }

    // 3. Re-wrap as a Sharp image and trim transparent margins.
    return sharp(out, {
        raw: { width: info.width, height: info.height, channels: 4 },
    })
        .trim({ threshold: 10 })
        .png()
        .toBuffer();
}

/**
 * Process a hero image into a darkened duotone JPEG. Maps each pixel's
 * luminance through a two-color gradient and multiplies the result by
 * `DUOTONE_DARKEN` so the cover text stays readable.
 */
export async function heroToDuotone(
    input: Buffer,
    palette: { dark: [number, number, number]; bright: [number, number, number] } = {
        dark: DEFAULT_DUOTONE_DARK,
        bright: DEFAULT_DUOTONE_BRIGHT,
    },
): Promise<Buffer> {
    // 1. Resize down to a sane max width to keep upload size + Canva
    //    fetch latency under control. 2400 wide is enough for 1920px
    //    rendering at high DPI.
    const raw = await sharp(input)
        .resize({ width: 2400, withoutEnlargement: true })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { data, info } = raw;
    const px = info.width * info.height;

    // 2. Apply the duotone math per pixel.
    const out = Buffer.alloc(px * 3);
    for (let i = 0; i < px; i++) {
        const r = data[i * 3];
        const g = data[i * 3 + 1];
        const b = data[i * 3 + 2];
        // ITU-R BT.601 luma — same as YCbCr's Y component, the
        // perceptually-weighted greyscale used by every photo editor.
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        out[i * 3] = Math.round(
            (palette.dark[0] * (1 - lum) + palette.bright[0] * lum) * DUOTONE_DARKEN,
        );
        out[i * 3 + 1] = Math.round(
            (palette.dark[1] * (1 - lum) + palette.bright[1] * lum) * DUOTONE_DARKEN,
        );
        out[i * 3 + 2] = Math.round(
            (palette.dark[2] * (1 - lum) + palette.bright[2] * lum) * DUOTONE_DARKEN,
        );
    }

    return sharp(out, {
        raw: { width: info.width, height: info.height, channels: 3 },
    })
        .jpeg({ quality: 88 })
        .toBuffer();
}

/**
 * End-to-end: download source URLs, process both assets, upload to
 * Vercel Blob, return the stable public URLs. Failures bubble up — the
 * caller decides whether to fall back to a default brand kit.
 */
export async function prepareBrandAssets(input: BrandAssetInput): Promise<BrandAssetSet> {
    if (!input.logoUrl) throw new Error("logoUrl is required");
    if (!input.heroImageUrl) throw new Error("heroImageUrl is required");

    const slug = slugify(input.clientName);

    const [logoSrc, heroSrc] = await Promise.all([
        fetchAsBuffer(input.logoUrl),
        fetchAsBuffer(input.heroImageUrl),
    ]);

    const [logoBuf, heroBuf] = await Promise.all([
        logoToWhiteTransparent(logoSrc),
        heroToDuotone(heroSrc),
    ]);

    const stamp = Date.now();
    const [logoBlob, heroBlob] = await Promise.all([
        put(`brand-assets/${slug}-${stamp}-logo.png`, logoBuf, {
            access: "public",
            contentType: "image/png",
            allowOverwrite: false,
        }),
        put(`brand-assets/${slug}-${stamp}-hero.jpg`, heroBuf, {
            access: "public",
            contentType: "image/jpeg",
            allowOverwrite: false,
        }),
    ]);

    return {
        logoWhiteUrl: logoBlob.url,
        heroDuotoneUrl: heroBlob.url,
    };
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url, {
        headers: {
            // Some company CDNs reject default fetch UAs (e.g. bavaria.co
            // returns 403 to "node" — pretend to be a real browser).
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
    });
    if (!res.ok) {
        throw new Error(`Asset fetch ${url} returned ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "client";
}
