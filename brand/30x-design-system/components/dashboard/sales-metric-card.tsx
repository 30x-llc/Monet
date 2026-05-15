"use client";

import type { FC } from "react";
import { ArrowUp, ArrowDown } from "@untitledui/icons";
import { SalesSparkline } from "./sales-sparkline";
import { cx } from "@/utils/cx";

interface SalesMetricCardProps {
    title: string;
    value: string;
    change: number;
    sparklineData: { day: number; value: number }[];
    icon?: FC<{ className?: string }>;
    className?: string;
}

export function SalesMetricCard({
    title,
    value,
    change,
    sparklineData,
    icon: Icon,
    className,
}: SalesMetricCardProps) {
    const isPositive = change > 0;

    return (
        <div
            className={cx(
                "relative flex min-w-0 flex-1 flex-col gap-5 rounded-xl border border-secondary bg-primary p-5 shadow-xs",
                className
            )}
        >
            {/* Title row */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-tertiary">{title}</p>
                {Icon && (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                        <Icon className="size-5 text-fg-quaternary" />
                    </div>
                )}
            </div>

            {/* Value + Chart */}
            <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-[30px] font-semibold leading-[38px] tracking-tight text-primary">
                        {value}
                    </p>
                    <div className="flex items-center gap-1">
                        {isPositive ? (
                            <ArrowUp className="size-4 text-success-primary" />
                        ) : (
                            <ArrowDown className="size-4 text-error-primary" />
                        )}
                        <span
                            className={cx(
                                "text-sm font-medium",
                                isPositive ? "text-success-primary" : "text-error-primary"
                            )}
                        >
                            {Math.abs(change)}%
                        </span>
                        <span className="text-sm text-tertiary">vs mes anterior</span>
                    </div>
                </div>

                <SalesSparkline
                    data={sparklineData}
                    type={isPositive ? "positive" : "negative"}
                />
            </div>
        </div>
    );
}
