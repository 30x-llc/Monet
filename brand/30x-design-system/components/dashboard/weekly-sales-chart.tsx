"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";
import { cx } from "@/utils/cx";

interface WeeklySalesChartProps {
    data: { week: string; target: number; actual: number }[];
    className?: string;
}

export function WeeklySalesChart({ data, className }: WeeklySalesChartProps) {
    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">Ventas semanales</h3>
                <p className="text-sm text-tertiary">Actual vs Meta</p>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border-secondary)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--color-border-secondary)" }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            content={<ChartTooltipContent formatter={(v) => `$${Number(v).toLocaleString()}`} />}
                            cursor={{ fill: "var(--color-bg-secondary)", fillOpacity: 0.5 }}
                        />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="target" name="Meta" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
