"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { cx } from "@/utils/cx";

interface DistributionItem {
    name: string;
    value: number;
    percentage: number;
}

interface DistributionChartProps {
    data: DistributionItem[];
    title: string;
    className?: string;
}

const COLORS = [
    "var(--color-brand-600)",
    "var(--color-brand-500)",
    "var(--color-brand-400)",
    "var(--color-brand-300)",
    "var(--color-gray-400)",
    "var(--color-gray-300)",
    "var(--color-gray-200)",
];

export const DistributionChart = ({ data, title, className }: DistributionChartProps) => {
    return (
        <div
            className={cx(
                "flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <h3 className="text-md font-semibold text-primary">{title}</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border-secondary)"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--color-border-secondary)" }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                        />
                        <Tooltip
                            content={<ChartTooltipContent />}
                            cursor={{ fill: "var(--color-bg-secondary)", fillOpacity: 0.5 }}
                        />
                        <Bar dataKey="value" name="Candidatos" radius={[0, 4, 4, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Simple list version for smaller datasets
interface DistributionListProps {
    data: DistributionItem[];
    title: string;
    className?: string;
}

export const DistributionList = ({ data, title, className }: DistributionListProps) => {
    const maxValue = Math.max(...data.map((d) => d.value));

    return (
        <div
            className={cx(
                "flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <h3 className="text-md font-semibold text-primary">{title}</h3>
            <div className="flex flex-col gap-3">
                {data.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-secondary">{item.name}</span>
                            <span className="text-sm font-medium text-primary">
                                {item.value} ({item.percentage}%)
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-tertiary">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: COLORS[index % COLORS.length],
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
