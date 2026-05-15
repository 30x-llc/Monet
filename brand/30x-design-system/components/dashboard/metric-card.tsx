"use client";

import type { FC } from "react";
import { ArrowUp, ArrowDown } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: FC<{ className?: string }>;
    className?: string;
}

export const MetricCard = ({
    title,
    value,
    change,
    changeLabel = "vs. semana pasada",
    icon: Icon,
    className,
}: MetricCardProps) => {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <div
            className={cx(
                "flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-tertiary">{title}</span>
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Icon className="size-5 text-fg-quaternary" />
                    </div>
                )}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold tracking-tight text-primary">{value}</span>
                {change !== undefined && (
                    <div
                        className={cx(
                            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            isPositive && "bg-success-secondary text-success-primary",
                            isNegative && "bg-error-secondary text-error-primary",
                            !isPositive && !isNegative && "bg-secondary text-tertiary"
                        )}
                    >
                        {isPositive && <ArrowUp className="size-3" />}
                        {isNegative && <ArrowDown className="size-3" />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>
            {changeLabel && (
                <span className="text-xs text-quaternary">{changeLabel}</span>
            )}
        </div>
    );
};

interface MetricGridProps {
    children: React.ReactNode;
    className?: string;
}

export const MetricGrid = ({ children, className }: MetricGridProps) => {
    return (
        <div
            className={cx(
                "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
                className
            )}
        >
            {children}
        </div>
    );
};
