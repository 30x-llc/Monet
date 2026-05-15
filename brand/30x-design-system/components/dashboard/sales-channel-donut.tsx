"use client";

import { cx } from "@/utils/cx";

interface ChannelData {
    name: string;
    value: number;
    color: string;
}

interface SalesChannelDonutProps {
    data: ChannelData[];
    className?: string;
}

function DonutChart({ data, size = 180 }: { data: ChannelData[]; size?: number }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90;

    const radius = size / 2;
    const strokeWidth = 28;
    const innerRadius = radius - strokeWidth;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                {data.map((item, index) => {
                    const angle = (item.value / total) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = ((startAngle + angle) * Math.PI) / 180;

                    const x1 = radius + innerRadius * Math.cos(startRad);
                    const y1 = radius + innerRadius * Math.sin(startRad);
                    const x2 = radius + innerRadius * Math.cos(endRad);
                    const y2 = radius + innerRadius * Math.sin(endRad);

                    const outerX1 = radius + radius * Math.cos(startRad);
                    const outerY1 = radius + radius * Math.sin(startRad);
                    const outerX2 = radius + radius * Math.cos(endRad);
                    const outerY2 = radius + radius * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

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
            <div
                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary"
                style={{ width: size - strokeWidth * 2, height: size - strokeWidth * 2 }}
            >
                <div className="text-center">
                    <p className="text-2xl font-semibold text-primary">100%</p>
                    <p className="text-xs text-tertiary">Canales</p>
                </div>
            </div>
        </div>
    );
}

export function SalesChannelDonut({ data, className }: SalesChannelDonutProps) {
    return (
        <div
            className={cx(
                "flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs",
                className
            )}
        >
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">Canales de venta</h3>
                <p className="text-sm text-tertiary">Distribución por canal</p>
            </div>

            <div className="flex items-center justify-center gap-8">
                <DonutChart data={data} />

                <div className="flex flex-col gap-3">
                    {data.map((channel) => (
                        <div key={channel.name} className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ backgroundColor: channel.color }} />
                            <span className="text-sm text-secondary">{channel.name}</span>
                            <span className="ml-auto text-sm font-medium text-primary">{channel.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
