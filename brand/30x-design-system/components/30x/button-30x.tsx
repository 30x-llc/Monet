"use client";

import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

type Button30xVariant = "light" | "dark" | "accent";
type Button30xSize = "normal" | "small";

interface Button30xProps {
    children: ReactNode;
    variant?: Button30xVariant;
    size?: Button30xSize;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    className?: string;
    iconLeading?: ReactNode;
    iconTrailing?: ReactNode;
    type?: "button" | "submit" | "reset";
}

/**
 * 30x Brand Button Component
 *
 * Variants:
 * - light: White background (#FFFFFF), dark text (#0A0A0A)
 * - dark: Dark background (#262626), white text
 * - accent: Yellow-green background (#E9FF7B), dark text (#0A0A0A)
 *
 * Sizes:
 * - normal: 40px height
 * - small: 24px height
 *
 * Features:
 * - 8px border radius with squircle shape
 * - Spring transition on hover
 */
export const Button30x = ({
    children,
    variant = "dark",
    size = "normal",
    onClick,
    href,
    disabled = false,
    className,
    iconLeading,
    iconTrailing,
    type = "button",
}: Button30xProps) => {
    const baseStyles = cx(
        // Base styles - Inter Semibold, 16px, letter-spacing -0.3px, line-height 1.6
        "inline-flex items-center justify-center font-semibold text-base tracking-[-0.3px] leading-[1.6] transition-all duration-200 ease-out",
        // Squircle border-radius
        "rounded-lg",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Focus state
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E9FF7B]",
    );

    const variantStyles: Record<Button30xVariant, string> = {
        light: cx(
            "bg-white text-[#0A0A0A]",
            "hover:brightness-90 active:brightness-85",
            "ring-1 ring-black/10",
        ),
        dark: cx(
            "bg-[#262626] text-white",
            "hover:brightness-150 active:brightness-125",
            "ring-1 ring-black/10",
        ),
        accent: cx(
            "bg-[#E9FF7B] text-[#0A0A0A]",
            "hover:brightness-90 active:brightness-85",
            "ring-1 ring-black/10",
        ),
    };

    const sizeStyles: Record<Button30xSize, string> = {
        normal: "h-10 px-5 gap-2",       // 40px height
        small: "h-[34px] px-4 gap-1.5",  // 34px height
    };

    const iconSizeStyles: Record<Button30xSize, string> = {
        normal: "size-[18px]", // 18x18px
        small: "size-[14px]",  // 14x14px
    };

    const combinedStyles = cx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
    );

    const content = (
        <>
            {iconLeading && (
                <span className={cx("shrink-0 [&>svg]:size-full", iconSizeStyles[size])}>
                    {iconLeading}
                </span>
            )}
            <span>{children}</span>
            {iconTrailing && (
                <span className={cx("shrink-0 [&>svg]:size-full", iconSizeStyles[size])}>
                    {iconTrailing}
                </span>
            )}
        </>
    );

    if (href && !disabled) {
        return (
            <a href={href} className={combinedStyles}>
                {content}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedStyles}
        >
            {content}
        </button>
    );
};

/**
 * Button group for multiple 30x buttons
 */
interface Button30xGroupProps {
    children: ReactNode;
    className?: string;
}

export const Button30xGroup = ({ children, className }: Button30xGroupProps) => {
    return (
        <div className={cx("inline-flex items-center gap-2", className)}>
            {children}
        </div>
    );
};
