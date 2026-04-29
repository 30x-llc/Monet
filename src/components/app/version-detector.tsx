"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

const POLL_INTERVAL_MS = 30_000;

/**
 * Polls /api/version every 30s and toasts the user when the runtime SHA
 * differs from the bundle SHA baked at build. Click → reload. The user
 * can dismiss the toast (in case they don't want to interrupt what
 * they're doing) — it'll come back on the next poll.
 */
export function VersionDetector() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [reloading, setReloading] = useState(false);

    const checkVersion = useCallback(async () => {
        try {
            const res = await fetch("/api/version", {
                cache: "no-store",
                headers: { "cache-control": "no-cache" },
            });
            if (!res.ok) return;
            const { sha } = await res.json();
            const bakedSha = process.env.NEXT_PUBLIC_BUILD_SHA;
            if (
                sha &&
                bakedSha &&
                sha !== bakedSha &&
                bakedSha !== "dev" &&
                sha !== "dev"
            ) {
                setUpdateAvailable(true);
            }
        } catch {
            /* offline / network blip — try again next tick */
        }
    }, []);

    useEffect(() => {
        // Skip in local dev where SHA is "dev" and would never match.
        if (process.env.NEXT_PUBLIC_BUILD_SHA === "dev") return;
        const tick = () => {
            checkVersion();
        };
        // Check on focus too — most users have the tab in the background.
        const onFocus = () => tick();
        const interval = window.setInterval(tick, POLL_INTERVAL_MS);
        window.addEventListener("focus", onFocus);
        // First check after a short delay so we don't compete with initial paint.
        const initialTimer = window.setTimeout(tick, 4000);
        return () => {
            window.clearInterval(interval);
            window.clearTimeout(initialTimer);
            window.removeEventListener("focus", onFocus);
        };
    }, [checkVersion]);

    const onReload = useCallback(() => {
        setReloading(true);
        // Force a hard reload so static chunks revalidate against the
        // origin instead of using the disk cache.
        window.location.reload();
    }, []);

    const onDismiss = useCallback(() => {
        setDismissed(true);
        // Re-show on next poll if still stale.
        window.setTimeout(() => setDismissed(false), POLL_INTERVAL_MS);
    }, []);

    const visible = updateAvailable && !dismissed;

    return (
        <AnimatePresence>
            {visible ? (
                <motion.div
                    key="version-toast"
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-5 right-5 z-50"
                >
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3 pl-3.5 pr-1.5 py-1.5 rounded-full bg-[#0a0a0a] text-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.4)] border border-white/[0.06]"
                    >
                        <span className="flex items-center gap-2 text-[12.5px] font-medium tracking-[-0.005em]">
                            <span
                                aria-hidden="true"
                                className="w-1.5 h-1.5 rounded-full bg-[#E9FF7B]"
                                style={{
                                    animation:
                                        "deck-cursor-blink 1.4s ease-in-out infinite",
                                }}
                            />
                            Nueva versión disponible
                        </span>
                        <button
                            type="button"
                            onClick={onReload}
                            disabled={reloading}
                            className="h-7 px-3 rounded-full bg-[#E9FF7B] text-[#0a0a0a] text-[11.5px] font-semibold tracking-[-0.005em] hover:brightness-95 active:brightness-90 disabled:opacity-70 transition-[filter,opacity] duration-150"
                            style={{
                                transitionTimingFunction: "var(--ease-out)",
                            }}
                        >
                            {reloading ? "Actualizando…" : "Actualizar"}
                        </button>
                        <button
                            type="button"
                            onClick={onDismiss}
                            aria-label="Descartar"
                            className="h-7 w-7 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-[color,background-color] duration-150 flex items-center justify-center"
                            style={{
                                transitionTimingFunction: "var(--ease-out)",
                            }}
                        >
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4 4L12 12M12 4L4 12"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
