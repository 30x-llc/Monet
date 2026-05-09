"use client";

import type { Slide } from "@/lib/slide-types";
import { SlideRenderer } from "./deck-slides";
import { SlideErrorBoundary } from "./slide-error-boundary";

/**
 * Client-side wrapper that isolates a single slide render in an error
 * boundary. Prevents one bad slide (e.g. intro-mentors without mentors)
 * from unmounting the entire editor tree and killing the browser tab.
 * SSR callers (PDF export) should use SlideRenderer directly — no
 * boundary needed in a one-shot print pipeline.
 */
export function SlideRendererClient({
    slide,
    clientLogoUrl,
    pageIndex,
}: {
    slide: Slide;
    clientLogoUrl?: string;
    pageIndex?: number;
}) {
    return (
        <SlideErrorBoundary slideType={slide?.type} resetKey={slide}>
            <SlideRenderer slide={slide} clientLogoUrl={clientLogoUrl} pageIndex={pageIndex} />
        </SlideErrorBoundary>
    );
}
