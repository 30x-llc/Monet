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
export async function GET(request: NextRequest) {
    const src = new URL(request.url).searchParams.get("url");
    if (!src) return new Response("missing url", { status: 400 });

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
            // 10s upper bound — slow logo CDNs are not worth waiting for
            signal: AbortSignal.timeout(10_000),
        });
        if (!upstream.ok) {
            return new Response(`upstream ${upstream.status}`, {
                status: 502,
            });
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
    } catch (err) {
        return new Response(
            `proxy failed: ${err instanceof Error ? err.message : String(err)}`,
            { status: 502 },
        );
    }
}
