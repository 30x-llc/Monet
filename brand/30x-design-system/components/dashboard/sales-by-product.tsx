"use client";

import { cx } from "@/utils/cx";

interface ProductSale {
    name: string;
    revenue: number;
    units: number;
    percentage: number;
}

interface SalesByProductProps {
    data: ProductSale[];
    className?: string;
}

const BAR_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

export function SalesByProduct({ data, className }: SalesByProductProps) {
    const maxRevenue = Math.max(...data.map((d) => d.revenue));

    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">Ventas por producto</h3>
                <p className="text-sm text-tertiary">Revenue generado por producto</p>
            </div>

            <div className="flex flex-col gap-4">
                {data.map((product, i) => (
                    <div key={product.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                                />
                                <span className="text-sm font-medium text-secondary">{product.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-tertiary">{product.units} ventas</span>
                                <span className="text-sm font-semibold text-primary">
                                    ${product.revenue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-tertiary">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(product.revenue / maxRevenue) * 100}%`,
                                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
