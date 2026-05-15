"use client";

import type { Slide } from "@/lib/slide-types";
import { cx } from "@/utils/cx";
import { SlideStage } from "@/components/slides/slide-stage";
import { SlideRenderer } from "@/components/slides/deck-slides";

export function DeckPreview({
    slides,
    currentIndex,
    onIndexChange,
    clientLogoUrl,
}: {
    slides: Slide[];
    currentIndex: number;
    onIndexChange: (i: number) => void;
    clientLogoUrl?: string;
}) {
    if (slides.length === 0) return null;

    const canPrev = currentIndex > 0;
    const canNext = currentIndex < slides.length - 1;

    return (
        <div className="flex flex-col gap-3">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 bg-black">
                <SlideStage format={undefined}>
                    <SlideRenderer slide={slides[currentIndex]} clientLogoUrl={clientLogoUrl} />
                </SlideStage>

                {canPrev && (
                    <button
                        onClick={() => onIndexChange(currentIndex - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                {canNext && (
                    <button
                        onClick={() => onIndexChange(currentIndex + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}

                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1 text-white/60 text-xs font-medium">
                    {currentIndex + 1} / {slides.length}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {slides.map((slide, i) => (
                    <button
                        key={i}
                        onClick={() => onIndexChange(i)}
                        className={cx(
                            "shrink-0 w-[140px] aspect-video rounded-lg overflow-hidden transition-all ring-2 bg-black",
                            i === currentIndex
                                ? "ring-[#E9FF7B] opacity-100"
                                : "ring-[#222] opacity-60 hover:opacity-90",
                        )}
                    >
                        <div className="w-full h-full pointer-events-none">
                            <SlideStage>
                                <SlideRenderer slide={slide} clientLogoUrl={clientLogoUrl} />
                            </SlideStage>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
