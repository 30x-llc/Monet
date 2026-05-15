"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";
import type { SubmissionTrend } from "@/types/tally";
import { cx } from "@/utils/cx";

interface TrendChartProps {
    data: SubmissionTrend[];
    title?: string;
    className?: string;
}

export const TrendChart = ({ data, title = "Submissions por día", className }: TrendChartProps) => {
    // Format dates for display
    const formattedData = data.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
        }),
    }));

    return (
        <div
            className={cx(
                "flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-primary">{title}</h3>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#262626" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#262626" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border-secondary)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--color-border-secondary)" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            content={<ChartTooltipContent />}
                            cursor={{ stroke: "var(--color-border-primary)", strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Submissions"
                            stroke="#262626"
                            strokeWidth={2}
                            fill="url(#colorSubmissions)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
