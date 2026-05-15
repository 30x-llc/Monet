/**
 * Multi-slide autofill orchestrator.
 *
 * Given a Deck and a Canva access token, produces one Canva design per
 * slide via Brand Template autofill. Returns each design's edit URL +
 * status so the UI can show progress.
 *
 * Flow:
 *   1. Map every slide to its raw autofill payload (text + image URLs).
 *   2. Collect every distinct image URL across the entire deck.
 *   3. Upload each image ONCE to Canva → cache asset_id by URL. This is
 *      the dedup that turns ~30 image uploads (mentor photos repeat)
 *      into ~10.
 *   4. Substitute image URLs with asset_ids in each payload.
 *   5. For each slide with a configured template, kick off autofill.
 *      Run in parallel with a concurrency cap.
 *   6. Poll until each job completes, collect designs.
 *   7. Return per-slide results (success / fallback / failed).
 *
 * Slides without a template config fall through with `kind: "fallback"`
 * — caller decides whether to render them via the React PDF/PPT path
 * or skip them.
 */

import "server-only";
import type { Deck } from "@/lib/slide-types";
import {
    createAutofill,
    pollAutofill,
    uploadAssetFromUrl,
    type AutofillField,
} from "./client";
import {
    mapDeckToAutofills,
    type RawAutofillData,
    type RawAutofillField,
} from "./autofill-mapper";
import { templateFor } from "./templates-config";

export interface SlideAutofillResult {
    slideIndex: number;
    slideType: string;
    kind: "success" | "fallback" | "failed";
    /** Canva design URL when kind === "success". */
    editUrl?: string;
    viewUrl?: string;
    designId?: string;
    /** Reason — "no template configured" for fallback, error msg for failed. */
    reason?: string;
}

export interface OrchestratorResult {
    results: SlideAutofillResult[];
    totalUploadedAssets: number;
    durationMs: number;
}

const MAX_PARALLEL_AUTOFILLS = 4;
const POLL_TIMEOUT_MS = 120_000;

export async function autofillDeck(
    deck: Deck,
    accessToken: string,
): Promise<OrchestratorResult> {
    const t0 = Date.now();
    const rawPayloads = mapDeckToAutofills(deck);

    // 1. Collect every distinct image URL the deck wants Canva to host.
    const imageUrls = new Set<string>();
    for (const p of rawPayloads) {
        if (!p) continue;
        for (const v of Object.values(p.data)) {
            if (v.type === "image") imageUrls.add(v.sourceUrl);
        }
    }

    // 2. Upload each unique image once → asset_id cache.
    const assetCache = new Map<string, string>();
    const assetUploads = await Promise.allSettled(
        Array.from(imageUrls).map(async (url) => {
            const id = await uploadAssetFromUrl({
                accessToken,
                sourceUrl: url,
                name: url.split("/").pop() || "asset",
            });
            return { url, id };
        }),
    );
    for (const r of assetUploads) {
        if (r.status === "fulfilled") assetCache.set(r.value.url, r.value.id);
    }

    // 3. Convert raw payloads → Canva-ready payloads, dropping any
    //    image whose upload failed (keeps the autofill from rejecting
    //    the whole job for one bad mentor photo).
    function materialize(raw: RawAutofillData): Record<string, AutofillField> {
        const out: Record<string, AutofillField> = {};
        for (const [k, v] of Object.entries(raw)) {
            if (v.type === "text") {
                out[k] = { type: "text", text: v.text };
            } else {
                const assetId = assetCache.get(v.sourceUrl);
                if (assetId) out[k] = { type: "image", asset_id: assetId };
            }
        }
        return out;
    }

    // 4. Run autofills with bounded concurrency.
    const results: SlideAutofillResult[] = [];
    const queue: Array<{ slideIndex: number; slideType: string; raw: RawAutofillData }> = [];
    for (const p of rawPayloads) {
        if (!p) continue;
        const tpl = templateFor(p.slideType);
        if (!tpl) {
            results.push({
                slideIndex: p.slideIndex,
                slideType: p.slideType,
                kind: "fallback",
                reason: "Sin template Canva configurado para este tipo de slide",
            });
            continue;
        }
        queue.push({ slideIndex: p.slideIndex, slideType: p.slideType, raw: p.data });
    }

    // Process the queue with a semaphore.
    const inFlight: Promise<void>[] = [];
    let cursor = 0;
    async function worker(): Promise<void> {
        while (cursor < queue.length) {
            const i = cursor++;
            const { slideIndex, slideType, raw } = queue[i];
            const tpl = templateFor(slideType);
            if (!tpl) continue;
            try {
                const data = materialize(raw);
                const jobId = await createAutofill({
                    accessToken,
                    brandTemplateId: tpl.config.canvaTemplateId,
                    title: `${deck.deckTitle ?? "30x"} · slide ${slideIndex + 1}`,
                    data,
                });
                const status = await waitForAutofill(accessToken, jobId);
                if (status.status === "success" && status.design) {
                    results.push({
                        slideIndex,
                        slideType,
                        kind: "success",
                        designId: status.design.id,
                        editUrl: status.design.urls.edit_url,
                        viewUrl: status.design.urls.view_url,
                    });
                } else {
                    results.push({
                        slideIndex,
                        slideType,
                        kind: "failed",
                        reason: status.error ?? "Autofill no completó",
                    });
                }
            } catch (err) {
                results.push({
                    slideIndex,
                    slideType,
                    kind: "failed",
                    reason: err instanceof Error ? err.message : String(err),
                });
            }
        }
    }
    for (let i = 0; i < MAX_PARALLEL_AUTOFILLS; i++) inFlight.push(worker());
    await Promise.all(inFlight);

    // Sort results back to slide order so the UI lines up.
    results.sort((a, b) => a.slideIndex - b.slideIndex);

    return {
        results,
        totalUploadedAssets: assetCache.size,
        durationMs: Date.now() - t0,
    };
}

async function waitForAutofill(
    accessToken: string,
    jobId: string,
): Promise<{
    status: "success" | "failed";
    design?: { id: string; urls: { edit_url: string; view_url: string } };
    error?: string;
}> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        const s = await pollAutofill(accessToken, jobId);
        if (s.status === "success") return { status: "success", design: s.design };
        if (s.status === "failed") return { status: "failed", error: s.error };
    }
    return { status: "failed", error: `Timeout autofill ${jobId}` };
}
