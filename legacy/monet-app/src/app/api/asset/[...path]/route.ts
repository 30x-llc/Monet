import type { NextRequest } from "next/server";

/**
 * Static-asset resolver with graceful fallback.
 *
 * The 30X design assets (mentor photos, program logos, brand backgrounds)
 * live in a Vercel Blob store. When that store is unreachable (403/404/down)
 * — as it currently is in every environment — a raw <img src="/assets/...">
 * renders a broken-image icon, which looks broken in the PDF/SSR render where
 * onError never fires.
 *
 * This route proxies /assets/* to the Blob store and, on any failure, returns
 * a clean placeholder instead of an error: an initials avatar for mentor
 * photos, an empty (invisible) SVG for everything else. If BLOB_BASE_URL is
 * later pointed at a working store, real assets flow through automatically.
 */

const BLOB_BASE_URL =
    process.env.BLOB_BASE_URL ||
    "https://hn1w2duxxggnvpal.public.blob.vercel-storage.com";

function emptySvg(): Response {
    return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', {
        status: 200,
        headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300" },
    });
}

function initialsAvatar(rel: string): Response {
    const file = rel.split("/").pop() ?? "";
    const base = file.replace(/\.[a-z0-9]+$/i, "").replace(/-\d+$/, "");
    const words = base.split(/[-_]/).filter(Boolean);
    const initials = ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "30X";

    // Deterministic dark gradient from the name so each mentor gets a distinct
    // but on-brand (dark, minimal) card instead of a flat block.
    let h = 0;
    for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const c1 = `hsl(${hue} 18% 16%)`;
    const c2 = `hsl(${(hue + 40) % 360} 22% 9%)`;
    const id = `g${hue}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="${id}v" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.18"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#${id})"/>
  <rect width="400" height="400" fill="url(#${id}v)"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="150" font-weight="600" letter-spacing="-4" fill="#E9FF7B">${initials}</text>
</svg>`;
    return new Response(svg, {
        status: 200,
        headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300" },
    });
}

export async function GET(
    _req: NextRequest,
    ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
    const { path } = await ctx.params;
    const rel = (path ?? []).join("/");

    try {
        const upstream = await fetch(`${BLOB_BASE_URL}/assets/${rel}`, {
            headers: { "user-agent": "Mozilla/5.0 (Monet asset proxy)" },
            signal: AbortSignal.timeout(4_000),
        });
        if (upstream.ok) {
            return new Response(upstream.body, {
                status: 200,
                headers: {
                    "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
                    "cache-control": "public, max-age=86400, immutable",
                },
            });
        }
    } catch {
        // fall through to placeholder
    }

    // Mentor portraits get a branded initials avatar so the mentor grid
    // doesn't show empty/broken slots; everything else stays invisible.
    if (rel.startsWith("mentors-real/")) return initialsAvatar(rel);
    return emptySvg();
}
