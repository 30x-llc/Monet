"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
    BarChart07,
    CurrencyDollar,
    Home02,
    Settings01,
    Users01,
    File01,
    PieChart01,
} from "@untitledui/icons";
import { SidebarNavigation30x } from "@/components/application/app-navigation/sidebar-navigation/sidebar-30x";
import type { NavItemType } from "@/components/application/app-navigation/config";

const navItems: NavItemType[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: Home02,
    },
    {
        label: "Submissions",
        href: "/dashboard/submissions",
        icon: File01,
    },
    {
        label: "Candidates",
        href: "/dashboard/candidates",
        icon: Users01,
    },
    {
        label: "Sales",
        href: "/dashboard/sales",
        icon: CurrencyDollar,
    },
    {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart07,
    },
    {
        label: "Reports",
        href: "/dashboard/reports",
        icon: PieChart01,
    },
];

const footerItems: NavItemType[] = [
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings01,
    },
];

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-secondary">
            <SidebarNavigation30x
                activeUrl={pathname}
                items={navItems}
                footerItems={footerItems}
                showAccountCard={false}
            />
            <main className="min-h-screen lg:ml-[280px]">
                {children}
            </main>
        </div>
    );
}
