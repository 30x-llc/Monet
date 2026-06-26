import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Image proxy for cross-origin partner logos.
 *
 * Browsers block third-party SVGs and other images via Opaque Response
 * Blocking (ORB) when used as <img src> or background-image with
 * inconsistent or missing CORS / content-type headers. We hit this with
 * partner brand logos pulled from the live web (aeromexico.com,
 * bavaria.com, etc). Routing them through our same-origin proxy
 * sidesteps ORB entirely. Cached aggressively because logos rarely
 * change.
 */
// Empty 1x1 transparent SVG. Returned (HTTP 200) whenever the upstream logo
// can't be fetched, so a dead/blocked logo URL renders as nothing instead of a
// broken-image icon. An SVG with no painted content stays invisible even under
// the deck's `filter: brightness(0) invert(1)` (which would turn an opaque
// raster placeholder into a white block). Critical for the PDF/SSR render path,
// where React's onError handler never runs (static markup).
const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
function transparentPixel(): Response {
    return new Response(EMPTY_SVG, {
        status: 200,
        headers: {
            "content-type": "image/svg+xml",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
        },
    });
}

export async function GET(request: NextRequest) {
    const src = new URL(request.url).searchParams.get("url");
    if (!src) return transparentPixel();

    let target: URL;
    try {
        target = new URL(src);
    } catch {
        return new Response("invalid url", { status: 400 });
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
        return new Response("unsupported protocol", { status: 400 });
    }

    try {
        const upstream = await fetch(target.toString(), {
            // Pretend to be a real browser request — some CDNs (LinkedIn,
            // Twitter) reject empty or fetch-style UAs.
            headers: {
                "user-agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
                accept: "image/svg+xml,image/*,*/*;q=0.8",
            },
            // Fail fast: a dead/slow logo CDN must not stall the headless PDF
            // render (page.setContent waits for every <img> to load). On
            // timeout we fall through to the transparent pixel.
            signal: AbortSignal.timeout(3_500),
        });
        if (!upstream.ok) {
            return transparentPixel();
        }
        const contentType =
            upstream.headers.get("content-type") ?? "application/octet-stream";
        return new Response(upstream.body, {
            status: 200,
            headers: {
                "content-type": contentType,
                // Same-origin so no ORB. Cache for a day on the edge,
                // a week in the browser. Logo URLs rarely change.
                "cache-control": "public, max-age=604800, s-maxage=86400, immutable",
                "access-control-allow-origin": "*",
            },
        });
    } catch {
        return transparentPixel();
    }
}
