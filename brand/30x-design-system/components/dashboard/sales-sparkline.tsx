"use client";

import { cx } from "@/utils/cx";

interface SparklineProps {
    data: { day: number; value: number }[];
    type: "positive" | "negative";
    className?: string;
}

export function SalesSparkline({ data, type, className }: SparklineProps) {
    const isPositive = type === "positive";
    const strokeColor = isPositive ? "#22c55e" : "#ef4444";
    const fillColor = isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 112;
    const height = 56;
    const padding = 4;

    const points = values.map((v, i) => ({
        x: padding + (i / (values.length - 1)) * (width - padding * 2),
        y: padding + (1 - (v - min) / range) * (height - padding * 2),
    }));

    // Smooth curve using quadratic bezier
    const linePath = points.reduce((path, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        const prev = points[i - 1];
        const cpX = (prev.x + point.x) / 2;
        return `${path} Q ${cpX} ${prev.y} ${point.x} ${point.y}`;
    }, "");

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    const lastPoint = points[points.length - 1];

    return (
        <div className={cx("relative h-14 w-28", className)}>
            <svg viewBox={`0 0 ${width} ${height}`} fill="none" className="h-full w-full">
                <path d={areaPath} fill={fillColor} />
                <path d={linePath} stroke={strokeColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            {/* End-point marker */}
            <div
                className="absolute"
                style={{
                    left: `${(lastPoint.x / width) * 100}%`,
                    top: `${(lastPoint.y / height) * 100}%`,
                    transform: "translate(-50%, -50%)",
                }}
            >
                <div
                    className="absolute -inset-2 rounded-full opacity-20"
                    style={{ borderWidth: 2, borderColor: strokeColor }}
                />
                <div
                    className="size-2.5 rounded-full border-2 bg-primary"
                    style={{ borderColor: strokeColor }}
                />
            </div>
        </div>
    );
}
