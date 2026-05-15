"use client";

import { ArrowUp, ArrowDown, DotsVertical } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface AnalyticsMetricCardProps {
    title: string;
    value: string;
    change: number;
    changeType: "positive" | "negative";
    comparisonText: string;
    className?: string;
}

// Simple sparkline chart component
function SparklineChart({ type }: { type: "positive" | "negative" }) {
    const isPositive = type === "positive";
    const color = isPositive ? "#22c55e" : "#ef4444";
    const bgColor = isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

    // Generate smooth curve path data
    const points = isPositive
        ? [
              { x: 0, y: 45 },
              { x: 15, y: 40 },
              { x: 30, y: 48 },
              { x: 45, y: 35 },
              { x: 60, y: 42 },
              { x: 75, y: 30 },
              { x: 90, y: 38 },
              { x: 105, y: 20 },
          ]
        : [
              { x: 0, y: 20 },
              { x: 15, y: 28 },
              { x: 30, y: 22 },
              { x: 45, y: 35 },
              { x: 60, y: 30 },
              { x: 75, y: 40 },
              { x: 90, y: 32 },
              { x: 105, y: 45 },
          ];

    // Create smooth curve using quadratic bezier
    const linePath = points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        const prev = points[i - 1];
        const cpX = (prev.x + point.x) / 2;
        return `${path} Q ${cpX} ${prev.y} ${point.x} ${point.y}`;
    }, "");

    // Create area path (line path + close to bottom)
    const areaPath = `${linePath} L 105 56 L 0 56 Z`;

    const lastPoint = points[points.length - 1];

    return (
        <div className="relative h-14 w-28">
            <svg viewBox="0 0 112 56" fill="none" className="h-full w-full">
                {/* Area fill */}
                <path d={areaPath} fill={bgColor} />
                {/* Line */}
                <path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            {/* Marker dot */}
            <div
                className="absolute"
                style={{
                    left: `${(lastPoint.x / 112) * 100}%`,
                    top: `${(lastPoint.y / 56) * 100}%`,
                    transform: "translate(-50%, -50%)",
                }}
            >
                {/* Outer ring */}
                <div
                    className="absolute -inset-2 rounded-full opacity-20"
                    style={{ borderWidth: 2, borderColor: color }}
                />
                {/* Inner dot */}
                <div
                    className="size-2.5 rounded-full border-2 bg-primary"
                    style={{ borderColor: color }}
                />
            </div>
        </div>
    );
}

export function AnalyticsMetricCard({
    title,
    value,
    change,
    changeType,
    comparisonText,
    className,
}: AnalyticsMetricCardProps) {
    const isPositive = changeType === "positive";

    return (
        <div
            className={cx(
                "relative flex min-w-[312px] flex-1 flex-col gap-5 rounded-xl border border-secondary bg-primary p-5 shadow-xs",
                className
            )}
        >
            {/* Title */}
            <p className="text-md font-semibold leading-6 text-primary">{title}</p>

            {/* Value and Chart */}
            <div className="flex items-end justify-between gap-4">
                {/* Number and Change */}
                <div className="flex flex-1 flex-col gap-3">
                    <p className="text-[30px] font-semibold leading-[38px] text-primary">{value}</p>
                    <div className="flex items-center gap-2">
                        {/* Change indicator */}
                        <div className="flex items-center gap-0.5">
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
                        </div>
                        <span className="truncate text-sm font-medium text-tertiary">
                            {comparisonText}
                        </span>
                    </div>
                </div>

                {/* Sparkline Chart */}
                <SparklineChart type={changeType} />
            </div>

            {/* Menu button */}
            <button className="absolute right-5 top-5">
                <DotsVertical className="size-5 text-quaternary" />
            </button>
        </div>
    );
}
