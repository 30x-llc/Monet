import type { NextConfig } from "next";

// All static assets under /assets/* live in Vercel Blob in production.
// In dev, Next.js serves them from public/assets/ directly. The rewrite
// only applies at build time on Vercel — locally, the public dir wins.
const BLOB_BASE_URL =
    process.env.BLOB_BASE_URL ||
    "https://hn1w2duxxggnvpal.public.blob.vercel-storage.com"; // 30x-design-assets store

const nextConfig: NextConfig = {
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
    },
    async rewrites() {
        return [
            {
                source: "/assets/:path*",
                destination: `${BLOB_BASE_URL}/assets/:path*`,
            },
        ];
    },
};

export default nextConfig;
