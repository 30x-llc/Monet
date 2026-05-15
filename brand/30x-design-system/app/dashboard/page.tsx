"use client";

import { Users01, File01, TrendUp01, Target01, Download01, Plus } from "@untitledui/icons";
import { MetricCard, MetricGrid } from "@/components/dashboard/metric-card";
import { SubmissionsTable } from "@/components/dashboard/submissions-table";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DistributionList } from "@/components/dashboard/distribution-chart";
import { Button30x } from "@/components/30x/button-30x";
import {
    mockSubmissions,
    mockMetrics,
    mockSubmissionsByRole,
    mockSubmissionsByArea,
    mockSubmissionTrends,
} from "@/lib/mock-data";

export default function DashboardPage() {
    // Transform data for charts
    const roleData = mockSubmissionsByRole.map((r) => ({
        name: r.role,
        value: r.count,
        percentage: r.percentage,
    }));

    const areaData = mockSubmissionsByArea.map((a) => ({
        name: a.area,
        value: a.count,
        percentage: a.percentage,
    }));

    return (
        <div className="flex flex-col gap-6 p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">
                        Dashboard
                    </h1>
                    <p className="text-sm text-tertiary">
                        Analiza las submissions del formulario de reclutamiento 30x
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button30x variant="light" size="normal" iconLeading={<Download01 />}>
                        Exportar
                    </Button30x>
                    <Button30x variant="accent" size="normal" iconLeading={<Plus />}>
                        Nueva campaña
                    </Button30x>
                </div>
            </div>

            {/* Metrics */}
            <MetricGrid>
                <MetricCard
                    title="Total submissions"
                    value={mockMetrics.totalSubmissions}
                    change={12}
                    icon={File01}
                />
                <MetricCard
                    title="Nuevos esta semana"
                    value={mockMetrics.newThisWeek}
                    change={8}
                    icon={Users01}
                />
                <MetricCard
                    title="Score promedio"
                    value={`${mockMetrics.averageScore}%`}
                    change={-3}
                    icon={Target01}
                />
                <MetricCard
                    title="Tasa de conversión"
                    value={`${mockMetrics.conversionRate}%`}
                    change={5}
                    icon={TrendUp01}
                />
            </MetricGrid>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <TrendChart
                    data={mockSubmissionTrends}
                    title="Submissions (últimos 30 días)"
                    className="lg:col-span-2"
                />
                <DistributionList
                    data={roleData}
                    title="Por rol objetivo"
                />
            </div>

            {/* Distribution Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DistributionList
                    data={areaData}
                    title="Por área"
                />
                <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                    <h3 className="text-md font-semibold text-primary">Estado de candidatos</h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { label: "Nuevos", count: mockSubmissions.filter(s => s.status === "new").length, color: "bg-blue-500" },
                            { label: "En revisión", count: mockSubmissions.filter(s => s.status === "reviewing").length, color: "bg-warning-solid" },
                            { label: "Entrevistados", count: mockSubmissions.filter(s => s.status === "interviewed").length, color: "bg-purple-500" },
                            { label: "Aceptados", count: mockSubmissions.filter(s => s.status === "accepted").length, color: "bg-success-solid" },
                            { label: "Rechazados", count: mockSubmissions.filter(s => s.status === "rejected").length, color: "bg-error-solid" },
                        ].map((status) => (
                            <div key={status.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-secondary">{status.label}</span>
                                </div>
                                <span className="text-sm font-medium text-primary">{status.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <SubmissionsTable submissions={mockSubmissions.slice(0, 10)} />
        </div>
    );
}
