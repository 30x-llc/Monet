"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FORMATS, type ProjectFormat } from "@/lib/slide-types";

interface SlideStageProps {
    children: React.ReactNode;
    format?: ProjectFormat;
    theme?: "dark" | "light";
    className?: string;
}

/**
 * Renders slide content at the native canvas size for the given format
 * and scales to fit its parent. The slide theme (dark/light) is what the
 * CLIENT asked for — it's stored on the deck and the dashboard chrome
 * toggle never touches it. Juan Diego asked for light as the default for
 * every proposal from April 2026 on; we honor deck.theme if set, else light.
 */
export function SlideStage({
    children,
    format = "proposal",
    theme = "light",
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

    const vars = theme === "light" ? LIGHT_VARS : DARK_VARS;
    const stageBg = theme === "light" ? "#ffffff" : "#000000";

    return (
        <div
            ref={wrapRef}
            className={className}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: stageBg,
            }}
        >
            <div
                className={`deck-stage theme-${theme}`}
                style={{
                    ...vars,
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

// Dark theme — kept for clients who explicitly ask for it.
const DARK_VARS = {
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
    "--t-client-logo-filter": "brightness(0) invert(1)",
    "--t-icon-fg": "#E9FF7B",
    "--t-icon-bg": "transparent",
    "--t-accent": "#E9FF7B",
    "--t-accent-fg": "#0a0a0a",
} as React.CSSProperties;

// Light theme — Apple/Linear editorial. The new default for every deck.
const LIGHT_VARS = {
    "--t-canvas": "#ffffff",
    "--t-fg": "#0a0a0a",
    "--t-fg-2": "rgba(10,10,10,0.78)",
    "--t-fg-3": "rgba(10,10,10,0.55)",
    "--t-fg-4": "rgba(10,10,10,0.4)",
    "--t-card-bg": "#fafafa",
    "--t-card-border": "rgba(0,0,0,0.08)",
    "--t-hairline": "rgba(0,0,0,0.1)",
    "--t-overlay-top": "rgba(0,0,0,0.15)",
    "--t-overlay-mid": "rgba(0,0,0,0.05)",
    "--t-overlay-bottom": "rgba(0,0,0,0.65)",
    "--t-pill-bg": "rgba(0,0,0,0.04)",
    "--t-pill-fg": "#0a0a0a",
    "--t-pill-border": "rgba(0,0,0,0.1)",
    // Logo filter: the 30x "light" logo is white-on-transparent; in light
    // mode we invert it to render black-on-white.
    "--t-logo-filter": "brightness(0) invert(0)",
    // Client logo: in light mode keep the original colors; in dark mode
    // force it white so every partner logo sits cohesively on dark slides.
    "--t-client-logo-filter": "none",
    "--t-icon-fg": "#0a0a0a",
    "--t-icon-bg": "rgba(0,0,0,0.04)",
    "--t-accent": "#0a0a0a",
    "--t-accent-fg": "#ffffff",
} as React.CSSProperties;
