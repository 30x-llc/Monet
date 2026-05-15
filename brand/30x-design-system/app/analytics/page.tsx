"use client";

import { Download01, BarChart01, Calendar, FilterLines, ChevronDown } from "@untitledui/icons";
import { Button30x } from "@/components/30x/button-30x";
import { AnalyticsMetricCard } from "@/components/analytics/metric-card";
import { ActiveUsersMap } from "@/components/analytics/active-users-map";
import { TrafficSourcesChart } from "@/components/analytics/traffic-sources-chart";
import { useState } from "react";

const timeFilters = ["12 months", "30 days", "7 days", "24 hours"];

export default function AnalyticsPage() {
    const [selectedTimeFilter, setSelectedTimeFilter] = useState("12 months");

    return (
        <div className="flex flex-col gap-6 pb-12 pt-8">
            {/* Header Section */}
            <div className="flex flex-col gap-5 px-8">
                {/* Page Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-[320px] flex-1 flex-col gap-0.5">
                        <h1 className="text-xl font-semibold leading-[30px] text-primary">
                            Welcome back, Olivia
                        </h1>
                        <p className="text-md leading-6 text-tertiary">
                            Measure your advertising ROI and track and report website traffic.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button30x variant="light" size="normal" iconLeading={<Download01 />}>
                            Export
                        </Button30x>
                        <Button30x variant="accent" size="normal">
                            Insights
                        </Button30x>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                    {/* Time Period Tabs */}
                    <div className="flex items-center gap-0.5 rounded-lg border border-secondary bg-secondary p-0.5">
                        {timeFilters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setSelectedTimeFilter(filter)}
                                className={`flex h-9 items-center justify-center rounded-md px-2.5 text-sm font-semibold transition-all ${
                                    selectedTimeFilter === filter
                                        ? "border border-primary bg-primary text-secondary shadow-xs"
                                        : "text-quaternary hover:text-secondary"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Date Picker and Filters */}
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-placeholder shadow-xs">
                            <Calendar className="size-5 text-quaternary" />
                            <span>Jan 8, 2027 – Jan 8, 2028</span>
                        </button>
                        <button className="flex items-center gap-1 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-secondary shadow-xs">
                            <FilterLines className="size-5" />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Section */}
            <div className="px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <AnalyticsMetricCard
                        title="Users"
                        value="20.8k"
                        change={12}
                        changeType="positive"
                        comparisonText="vs last month"
                    />
                    <AnalyticsMetricCard
                        title="Sessions"
                        value="26.4k"
                        change={-2}
                        changeType="negative"
                        comparisonText="vs last month"
                    />
                    <AnalyticsMetricCard
                        title="Session duration"
                        value="3m 52s"
                        change={2}
                        changeType="positive"
                        comparisonText="vs last month"
                    />
                </div>
            </div>

            {/* Active Users Map Section */}
            <div className="px-8">
                <ActiveUsersMap />
            </div>

            {/* Traffic Sources Section */}
            <div className="px-8">
                <TrafficSourcesChart />
            </div>
        </div>
    );
}
