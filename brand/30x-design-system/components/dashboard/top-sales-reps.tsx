"use client";

import { ArrowUp, ArrowDown } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";

interface SalesRep {
    id: string;
    name: string;
    initials: string;
    deals: number;
    revenue: number;
    conversionRate: number;
    trend: "up" | "down";
}

interface TopSalesRepsProps {
    data: SalesRep[];
    className?: string;
}

export function TopSalesReps({ data, className }: TopSalesRepsProps) {
    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">Top vendedores</h3>
                <p className="text-sm text-tertiary">Rendimiento del equipo este mes</p>
            </div>

            <div className="flex flex-col divide-y divide-secondary">
                {data.map((rep) => (
                    <div key={rep.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <Avatar initials={rep.initials} size="sm" />
                        <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium text-primary">{rep.name}</span>
                            <span className="text-xs text-tertiary">{rep.deals} deals cerrados</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-semibold text-primary">
                                ${rep.revenue.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-0.5">
                                {rep.trend === "up" ? (
                                    <ArrowUp className="size-3 text-success-primary" />
                                ) : (
                                    <ArrowDown className="size-3 text-error-primary" />
                                )}
                                <span
                                    className={cx(
                                        "text-xs font-medium",
                                        rep.trend === "up" ? "text-success-primary" : "text-error-primary"
                                    )}
                                >
                                    {rep.conversionRate}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
