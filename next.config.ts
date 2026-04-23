import type { NextConfig } from "next";

// All static assets under /assets/* live in Vercel Blob in production.
// In dev, Next.js serves them from public/assets/ directly. The rewrite
// only applies at build time on Vercel — locally, the public dir wins.
const BLOB_BASE_URL =
    process.env.BLOB_BASE_URL ||
    "https://hn1w2duxxggnvpal.public.blob.vercel-storage.com"; // 30x-design-assets store

const nextConfig: NextConfig = {
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
