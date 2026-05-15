/**
 * Returns the git SHA of the currently-running deployment.
 * The client bakes its own SHA in at build time via NEXT_PUBLIC_BUILD_SHA;
 * polling this endpoint and comparing the two surfaces "new version
 * available" without any cache nonsense — even prerendered HTML can't lie
 * here because this route is uncached and runs on each request.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
    return Response.json(
        { sha },
        {
            headers: {
                "cache-control": "no-store, max-age=0, must-revalidate",
            },
        },
    );
}
