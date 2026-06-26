import type { NextConfig } from "next";

// Static assets under /assets/* are resolved by /api/asset (see its rewrite
// below), which proxies the Vercel Blob store and falls back to a clean
// placeholder when the store is unreachable.
const nextConfig: NextConfig = {
    // Bake the deploy's git SHA into the client bundle so the version
    // detector can compare it against /api/version (read at request time)
    // and toast the user when a new deploy lands. Falls back to "dev"
    // locally where VERCEL_GIT_COMMIT_SHA isn't set.
    env: {
        NEXT_PUBLIC_BUILD_SHA:
            process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    },
    // @sparticuz/chromium ships a Brotli-compressed Chromium binary it
    // extracts at runtime from its own node_modules path. If Turbopack
    // bundles + relocates it, the path breaks and launch fails with
    // "input directory does not exist". Externalizing forces Next to
    // import it from node_modules at runtime on the serverless function.
    serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    // Vercel's file-tracing doesn't see the .br tarballs inside
    // @sparticuz/chromium/bin through pnpm symlinks. Force-include them
    // so the /var/task/ node_modules tree contains the binary at runtime.
    outputFileTracingIncludes: {
        "/api/export/pdf": [
            "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
            "./node_modules/@sparticuz/chromium/bin/**",
        ],
        // /api/export/canva, /api/critique also need Chromium for puppeteer.
        "/api/export/canva": [
            "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
            "./node_modules/@sparticuz/chromium/bin/**",
        ],
        "/api/critique": [
            "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
            "./node_modules/@sparticuz/chromium/bin/**",
            "./private/reference-decks/**",
            "./src/styles/deck.css",
        ],
        "/api/download": [
            "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
            "./node_modules/@sparticuz/chromium/bin/**",
            "./src/styles/deck.css",
        ],
        // private/reference-decks/ is read by /api/generate at runtime to
        // pass multimodal examples to Claude. Force-include it so the
        // serverless bundle can find the PNGs.
        "/api/generate": ["./private/reference-decks/**"],
    },
    async rewrites() {
        // Route /assets/* through our resolver, which proxies the Blob store
        // and falls back to a clean placeholder when an asset is missing
        // (the Blob store currently 403s in every environment). Files present
        // in public/assets/ (e.g. the 30X logos) are served directly — public
        // wins over afterFiles rewrites.
        return [
            {
                source: "/assets/:path*",
                destination: `/api/asset/:path*`,
            },
        ];
    },
};

export default nextConfig;
