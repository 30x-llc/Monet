import type { NextRequest } from "next/server";
import { isCanvaOAuthEnabled } from "@/lib/canva/config";
import { readSessionId } from "@/lib/session/session";
import { getFreshAccessToken } from "@/lib/canva/token-store";
import { autofillDeck } from "@/lib/canva/orchestrator";
import {
    configuredTemplateCount,
    listConfiguredTemplates,
} from "@/lib/canva/templates-config";
import type { Deck } from "@/lib/slide-types";

// Autofill is upload-heavy + multi-poll: budget like the PDF route.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/export/canva-autofill { deck }
 *
 * Per-slide returns:
 *   { ok: true, results: SlideAutofillResult[], totalUploadedAssets, durationMs, configured }
 *
 * Auth gates (in order):
 *   503 — Canva OAuth not enabled in this environment
 *   401 — user hasn't OAuth'd to Canva (returns connectUrl)
 *   503 — no Brand Templates configured yet (returns configured: 0)
 *
 * On success the UI receives an array — one entry per slide. Slides
 * without a configured template come back as `kind: "fallback"` so
 * the UI can mix Canva-rendered slides with React-rendered slides
 * gracefully during the rollout phase.
 */
export async function POST(request: NextRequest) {
    if (!isCanvaOAuthEnabled()) {
        return Response.json(
            {
                ok: false,
                error: "Canva OAuth no habilitado. Configura CANVA_CLIENT_ID + CANVA_CLIENT_SECRET + CANVA_OAUTH_ENABLED=true.",
            },
            { status: 503 },
        );
    }

    const sessionId = await readSessionId();
    if (!sessionId) {
        return Response.json(
            {
                ok: false,
                needsAuth: true,
                connectUrl:
                    "/api/canva/connect?returnTo=" +
                    encodeURIComponent(request.headers.get("referer") || "/"),
            },
            { status: 401 },
        );
    }

    const accessToken = await getFreshAccessToken(sessionId);
    if (!accessToken) {
        return Response.json(
            {
                ok: false,
                needsAuth: true,
                connectUrl:
                    "/api/canva/connect?returnTo=" +
                    encodeURIComponent(request.headers.get("referer") || "/"),
            },
            { status: 401 },
        );
    }

    const configured = configuredTemplateCount();
    if (configured === 0) {
        return Response.json(
            {
                ok: false,
                error: "Sin Brand Templates configurados — pide a Juan Diego que diseñe los templates en Canva y te pase los IDs.",
                configured: 0,
            },
            { status: 503 },
        );
    }

    try {
        const deck: Deck = await request.json();
        if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
            return Response.json(
                { ok: false, error: "Deck vacío o inválido" },
                { status: 400 },
            );
        }

        const result = await autofillDeck(deck, accessToken);
        return Response.json({
            ok: true,
            results: result.results,
            totalUploadedAssets: result.totalUploadedAssets,
            durationMs: result.durationMs,
            configured,
        });
    } catch (err) {
        console.error("[export/canva-autofill]", err);
        return Response.json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        );
    }
}

/**
 * GET /api/export/canva-autofill — diagnostic. Returns which templates
 * are configured (no auth required). Useful for the UI to know whether
 * to show the "Abrir en Canva" button as primary or fallback.
 */
export async function GET() {
    const items = listConfiguredTemplates().map(({ key, config }) => ({
        key,
        displayName: config.displayName,
        slideTypes: config.slideTypes,
        templateId: config.canvaTemplateId,
    }));
    return Response.json({
        configured: items.length,
        oauthEnabled: isCanvaOAuthEnabled(),
        templates: items,
    });
}
