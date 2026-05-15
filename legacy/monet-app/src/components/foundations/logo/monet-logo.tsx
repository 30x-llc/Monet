"use client";

import { cx } from "@/utils/cx";

type MonetVariant = "dark" | "light" | "accent";

interface MonetLogoProps {
    className?: string;
    variant?: MonetVariant;
    /** Show the "by 30X" subtitle under the wordmark. */
    sublabel?: boolean;
}

/**
 * Monet wordmark — the AI designer of 30X.
 *
 * Typographic mark (Inter Extrabold) so the brand stays consistent with the
 * rest of the 30X family without forking a custom font. The final letter
 * picks up the 30X lime accent in the `accent` variant — visual rhyme with
 * the X in the 30X mark — so the family feels coherent at a glance.
 */
export const MonetLogo = ({ className, variant = "dark", sublabel = false }: MonetLogoProps) => {
    const colors = {
        dark: { main: "#010101", tail: "#010101" },
        light: { main: "#F2F2F2", tail: "#F2F2F2" },
        accent: { main: "#F2F2F2", tail: "#E9FF7B" },
    } as const;
    const { main, tail } = colors[variant];

    return (
        <span className={cx("inline-flex flex-col items-start leading-none", className)}>
            <span
                className="font-extrabold tracking-[-0.04em] text-[20px] leading-none select-none"
                aria-label="Monet"
            >
                <span style={{ color: main }}>Mone</span>
                <span style={{ color: tail }}>t</span>
            </span>
            {sublabel ? (
                <span
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] opacity-70"
                    style={{ color: main }}
                >
                    <span className="h-px w-3 bg-current opacity-30" />
                    by 30X
                    <span className="h-px w-3 bg-current opacity-30" />
                </span>
            ) : null}
        </span>
    );
};

/**
 * Compact Monet mark — just the "M" in a rounded square. Pairs with
 * Logo30xCompact in size and shape.
 */
export const MonetLogoCompact = ({ className, variant = "dark" }: MonetLogoProps) => {
    const surface = variant === "dark" ? "bg-white text-[#010101]" : variant === "accent" ? "bg-[#262626] text-[#E9FF7B]" : "bg-[#262626] text-[#F2F2F2]";
    return (
        <span
            className={cx(
                "inline-flex h-8 w-8 items-center justify-center rounded-lg font-extrabold tracking-[-0.04em] text-[18px] leading-none select-none",
                surface,
                className,
            )}
            aria-label="Monet"
        >
            M
        </span>
    );
};
