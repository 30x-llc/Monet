"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FORMATS, type ProjectFormat } from "@/lib/slide-types";

interface SlideStageProps {
    children: React.ReactNode;
    format?: ProjectFormat;
    className?: string;
}

/**
 * Renders slide content at the native canvas size for the given format
 * and scales to fit its parent. Slides always render with the client's
 * design — they are deliverables, not dashboard chrome, so the editor
 * theme toggle must never reach them.
 */
export function SlideStage({
    children,
    format = "proposal",
    className,
}: SlideStageProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const spec = FORMATS[format];
    const W = spec.width;
    const H = spec.height;

    useLayoutEffect(() => {
        if (!wrapRef.current) return;
        const el = wrapRef.current;
        const apply = () => {
            const rect = el.getBoundingClientRect();
            const s = Math.min(rect.width / W, rect.height / H);
            setScale(s);
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => ro.disconnect();
    }, [W, H]);

    return (
        <div
            ref={wrapRef}
            className={className}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000000",
            }}
        >
            <div
                className="deck-stage theme-dark"
                style={{
                    ...SLIDE_VARS,
                    width: W,
                    height: H,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background: "var(--t-canvas)",
                    color: "var(--t-fg)",
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Client design tokens — frozen. Never derive these from the dashboard
// theme; slides are deliverables and must look identical regardless of
// editor preferences.
const SLIDE_VARS = {
    "--t-canvas": "#000000",
    "--t-fg": "#ffffff",
    "--t-fg-2": "rgba(255,255,255,0.82)",
    "--t-fg-3": "rgba(255,255,255,0.6)",
    "--t-fg-4": "rgba(255,255,255,0.45)",
    "--t-card-bg": "#0A0A0A",
    "--t-card-border": "#222222",
    "--t-hairline": "rgba(255,255,255,0.14)",
    "--t-overlay-top": "rgba(0,0,0,0.45)",
    "--t-overlay-mid": "rgba(0,0,0,0.15)",
    "--t-overlay-bottom": "rgba(0,0,0,0.85)",
    "--t-pill-bg": "transparent",
    "--t-pill-fg": "#E9FF7B",
    "--t-pill-border": "#E9FF7B",
    "--t-logo-filter": "none",
    "--t-icon-fg": "#E9FF7B",
    "--t-icon-bg": "transparent",
} as React.CSSProperties;
