"use client";

import {
    CurrencyDollar,
    ShoppingCart01,
    Receipt,
    TrendUp01,
    Download01,
    CalendarPlus01,
} from "@untitledui/icons";
import { Button30x } from "@/components/30x/button-30x";
import { SalesMetricCard } from "@/components/dashboard/sales-metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SalesByProduct } from "@/components/dashboard/sales-by-product";
import { SalesChannelDonut } from "@/components/dashboard/sales-channel-donut";
import { WeeklySalesChart } from "@/components/dashboard/weekly-sales-chart";
import { TopSalesReps } from "@/components/dashboard/top-sales-reps";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import {
    salesMetrics,
    revenueByMonth,
    salesByProduct,
    salesByChannel,
    weeklySales,
    topSalesReps,
    recentTransactions,
    dailyRevenue,
    dailyOrders,
} from "@/lib/sales-mock-data";

export default function SalesReportPage() {
    return (
        <div className="flex flex-col gap-6 p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">
                        Reporte de Ventas
                    </h1>
                    <p className="text-sm text-tertiary">
                        Resumen de rendimiento comercial del último periodo
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button30x variant="light" size="normal" iconLeading={<Download01 />}>
                        Exportar
                    </Button30x>
                    <Button30x variant="accent" size="normal" iconLeading={<CalendarPlus01 />}>
                        Este mes
                    </Button30x>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SalesMetricCard
                    title="Revenue total"
                    value={salesMetrics.totalRevenue}
                    change={salesMetrics.totalRevenueChange}
                    sparklineData={dailyRevenue}
                    icon={CurrencyDollar}
                />
                <SalesMetricCard
                    title="Total órdenes"
                    value={salesMetrics.totalOrders}
                    change={salesMetrics.totalOrdersChange}
                    sparklineData={dailyOrders}
                    icon={ShoppingCart01}
                />
                <SalesMetricCard
                    title="Ticket promedio"
                    value={salesMetrics.avgOrderValue}
                    change={salesMetrics.avgOrderValueChange}
                    sparklineData={dailyRevenue.map((d) => ({ ...d, value: d.value / 60 }))}
                    icon={Receipt}
                />
                <SalesMetricCard
                    title="Conversión"
                    value={salesMetrics.conversionRate}
                    change={salesMetrics.conversionRateChange}
                    sparklineData={dailyOrders.map((d) => ({ ...d, value: d.value / 20 }))}
                    icon={TrendUp01}
                />
            </div>

            {/* Revenue Chart (full width) */}
            <RevenueChart data={revenueByMonth} />

            {/* Middle Row: Weekly Sales + Channel Donut */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <WeeklySalesChart data={weeklySales} />
                <SalesChannelDonut data={salesByChannel} />
            </div>

            {/* Bottom Row: Products + Top Reps */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SalesByProduct data={salesByProduct} />
                <TopSalesReps data={topSalesReps} />
            </div>

            {/* Transactions Table */}
            <RecentTransactions data={recentTransactions} />
        </div>
    );
}
