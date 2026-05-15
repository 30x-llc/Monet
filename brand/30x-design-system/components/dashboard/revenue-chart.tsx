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
import { cx } from "@/utils/cx";

interface RevenueChartProps {
    data: { month: string; revenue: number; expenses: number; profit: number }[];
    className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-md font-semibold text-primary">Revenue vs Gastos</h3>
                    <p className="text-sm text-tertiary">Últimos 12 meses</p>
                </div>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-border-secondary)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="month"
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
                            cursor={{ stroke: "var(--color-border-primary)", strokeWidth: 1 }}
                        />
                        <Legend content={<ChartLegendContent />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#colorRevenue)"
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            name="Gastos"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#colorExpenses)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
