"use client";

import { useState } from "react";
import { Button30x } from "@/components/30x/button-30x";

interface TrafficSource {
    name: string;
    value: number;
    color: string;
}

const trafficSources: TrafficSource[] = [
    { name: "Direct", value: 38, color: "#7f56d9" },
    { name: "Organic search", value: 22, color: "#9e77ed" },
    { name: "Referral", value: 16, color: "#b692f6" },
    { name: "Social", value: 14, color: "#d6bbfb" },
    { name: "Email", value: 6, color: "#e9d7fe" },
    { name: "Other", value: 4, color: "#f4ebff" },
];

// Mock data for bar chart
const barChartData = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 80 },
    { label: "Mar", value: 72 },
    { label: "Apr", value: 90 },
    { label: "May", value: 85 },
    { label: "Jun", value: 95 },
    { label: "Jul", value: 78 },
    { label: "Aug", value: 88 },
];

function DonutChart({ data, size = 160 }: { data: TrafficSource[]; size?: number }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top

    const radius = size / 2;
    const strokeWidth = 24;
    const innerRadius = radius - strokeWidth;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                {data.map((item, index) => {
                    const angle = (item.value / total) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    // Calculate arc path
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = ((startAngle + angle) * Math.PI) / 180;

                    const x1 = radius + innerRadius * Math.cos(startRad);
                    const y1 = radius + innerRadius * Math.sin(startRad);
                    const x2 = radius + innerRadius * Math.cos(endRad);
                    const y2 = radius + innerRadius * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    const outerX1 = radius + radius * Math.cos(startRad);
                    const outerY1 = radius + radius * Math.sin(startRad);
                    const outerX2 = radius + radius * Math.cos(endRad);
                    const outerY2 = radius + radius * Math.sin(endRad);

                    const path = [
                        `M ${x1} ${y1}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
                        `L ${outerX2} ${outerY2}`,
                        `A ${radius} ${radius} 0 ${largeArc} 0 ${outerX1} ${outerY1}`,
                        `Z`,
                    ].join(" ");

                    return <path key={index} d={path} fill={item.color} />;
                })}
            </svg>
            {/* Center hole */}
            <div
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary"
                style={{ width: size - strokeWidth * 2, height: size - strokeWidth * 2 }}
            >
                <div className="text-center">
                    <p className="text-2xl font-semibold text-primary">100%</p>
                    <p className="text-xs text-tertiary">Total</p>
                </div>
            </div>
        </div>
    );
}

function BarChart({ data }: { data: typeof barChartData }) {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
        <div className="flex h-[200px] items-end gap-3">
            {data.map((item, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full flex-1">
                        <div
                            className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-brand-600 transition-all"
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-tertiary">{item.label}</span>
                </div>
            ))}
        </div>
    );
}

function LegendItem({ source }: { source: TrafficSource }) {
    return (
        <div className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: source.color }} />
            <span className="text-sm text-secondary">{source.name}</span>
            <span className="ml-auto text-sm font-medium text-primary">{source.value}%</span>
        </div>
    );
}

export function TrafficSourcesChart() {
    const [selectedTab, setSelectedTab] = useState<"sources" | "channels">("sources");

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Traffic by Source - Bar Chart Card */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-md font-semibold text-primary">Traffic by source</h3>
                        <p className="text-sm text-tertiary">Monthly traffic breakdown</p>
                    </div>
                    <Button30x variant="accent" size="small">
                        View all
                    </Button30x>
                </div>

                {/* Divider */}
                <div className="h-px bg-secondary" />

                {/* Bar Chart */}
                <BarChart data={barChartData} />

                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-brand-600" />
                        <span className="text-sm text-tertiary">Sessions</span>
                    </div>
                </div>
            </div>

            {/* Traffic Sources - Donut Chart Card */}
            <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-md font-semibold text-primary">Traffic sources</h3>
                        <p className="text-sm text-tertiary">Where your visitors come from</p>
                    </div>
                    <Button30x variant="accent" size="small">
                        View report
                    </Button30x>
                </div>

                {/* Divider */}
                <div className="h-px bg-secondary" />

                {/* Chart and Legend */}
                <div className="flex items-center gap-8">
                    {/* Donut Chart */}
                    <DonutChart data={trafficSources} />

                    {/* Legend */}
                    <div className="flex flex-1 flex-col gap-3">
                        {trafficSources.map((source) => (
                            <LegendItem key={source.name} source={source} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
