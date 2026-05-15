"use client";

import { Button30x } from "@/components/30x/button-30x";

interface CountryData {
    name: string;
    flag: string;
    percentage: number;
}

const countries: CountryData[] = [
    { name: "United States", flag: "🇺🇸", percentage: 50 },
    { name: "India", flag: "🇮🇳", percentage: 30 },
    { name: "United Kingdom", flag: "🇬🇧", percentage: 26 },
    { name: "Australia", flag: "🇦🇺", percentage: 18 },
    { name: "Canada", flag: "🇨🇦", percentage: 12 },
];

// Location markers on the map
interface MapMarker {
    x: number; // percentage from left
    y: number; // percentage from top
    label?: string;
    sublabel?: string;
    showTooltip?: boolean;
}

const markers: MapMarker[] = [
    { x: 20, y: 35, label: "San Francisco", sublabel: "untitledui.com/pricing" },
    { x: 25, y: 28 },
    { x: 48, y: 25 },
    { x: 50, y: 32 },
    { x: 52, y: 40 },
    { x: 72, y: 35 },
    { x: 75, y: 45 },
    { x: 85, y: 75, label: "Melbourne, AUS", sublabel: "untitledui.com/pricing", showTooltip: true },
    { x: 78, y: 55 },
];

function LocationMarker({ marker }: { marker: MapMarker }) {
    return (
        <div
            className="absolute"
            style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: "translate(-50%, -50%)",
            }}
        >
            {/* Tooltip */}
            {marker.showTooltip && marker.label && (
                <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-secondary bg-primary px-4 py-3 shadow-lg">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">🇦🇺</span>
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-xs font-semibold text-primary">{marker.label}</span>
                            <span className="text-xs text-tertiary">{marker.sublabel}</span>
                        </div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-primary" />
                </div>
            )}

            {/* Marker circles */}
            <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute -inset-4 animate-pulse rounded-full bg-brand-500 opacity-10" />
                {/* Middle ring */}
                <div className="absolute -inset-2 rounded-full bg-brand-500 opacity-20" />
                {/* Inner dot */}
                <div className="relative size-2 rounded-full bg-brand-500" />
            </div>

            {/* Cursor pointer for active marker */}
            {marker.showTooltip && (
                <div className="absolute left-full top-full">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                            d="M3 2L3 14L7 10L12 15L17 3L3 2Z"
                            fill="white"
                            stroke="black"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}

function CountryProgress({ country }: { country: CountryData }) {
    return (
        <div className="flex items-start gap-4">
            <span className="text-2xl">{country.flag}</span>
            <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium text-secondary">{country.name}</span>
                <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="relative h-2 flex-1 rounded-full bg-quaternary">
                        <div
                            className="absolute left-0 top-0 h-2 rounded-full bg-brand-600"
                            style={{ width: `${country.percentage}%` }}
                        />
                    </div>
                    <span className="text-sm font-medium text-secondary">{country.percentage}%</span>
                </div>
            </div>
        </div>
    );
}

export function ActiveUsersMap() {
    return (
        <div className="flex flex-col gap-5 overflow-hidden rounded-xl border border-secondary bg-primary p-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-primary">Active users right now</h3>
                <Button30x variant="accent" size="small">
                    Real-time report
                </Button30x>
            </div>

            {/* Divider */}
            <div className="h-px bg-secondary" />

            {/* Map and Data */}
            <div className="flex gap-16">
                {/* World Map */}
                <div className="relative h-[344px] w-[720px] flex-shrink-0">
                    {/* SVG World Map - Simplified dot grid representation */}
                    <svg viewBox="0 0 720 344" className="h-full w-full">
                        {/* Background dots grid to represent continents */}
                        <defs>
                            <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" fill="#e5e5e5" />
                            </pattern>
                        </defs>

                        {/* North America */}
                        <ellipse cx="150" cy="120" rx="100" ry="80" fill="url(#dots)" opacity="0.7" />

                        {/* South America */}
                        <ellipse cx="200" cy="250" rx="50" ry="70" fill="url(#dots)" opacity="0.7" />

                        {/* Europe */}
                        <ellipse cx="380" cy="100" rx="60" ry="50" fill="url(#dots)" opacity="0.7" />

                        {/* Africa */}
                        <ellipse cx="400" cy="200" rx="50" ry="70" fill="url(#dots)" opacity="0.7" />

                        {/* Asia */}
                        <ellipse cx="520" cy="130" rx="120" ry="80" fill="url(#dots)" opacity="0.7" />

                        {/* Australia */}
                        <ellipse cx="620" cy="260" rx="50" ry="40" fill="url(#dots)" opacity="0.7" />
                    </svg>

                    {/* Location Markers */}
                    {markers.map((marker, index) => (
                        <LocationMarker key={index} marker={marker} />
                    ))}
                </div>

                {/* Sidebar with active users count and countries */}
                <div className="flex flex-1 flex-col gap-5">
                    {/* Active users count */}
                    <h2 className="text-4xl font-semibold tracking-tight text-primary">10.8k</h2>

                    {/* Country breakdown */}
                    <div className="flex flex-col gap-3">
                        {countries.map((country) => (
                            <CountryProgress key={country.name} country={country} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
