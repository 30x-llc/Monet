"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarNavigation30x } from "@/components/application/app-navigation/sidebar-navigation/sidebar-30x";
import type { NavItemType } from "@/components/application/app-navigation/config";
import {
    Home01,
    BarChartSquare02,
    Rows01,
    CheckDone01,
    PieChart03,
    Users01,
    LifeBuoy01,
    Settings01,
} from "@untitledui/icons";

const navItems: NavItemType[] = [
    { label: "Home", icon: Home01, href: "/" },
    { label: "Dashboard", icon: BarChartSquare02, href: "/analytics" },
    { label: "Projects", icon: Rows01, href: "/projects" },
    { label: "Tasks", icon: CheckDone01, href: "/tasks", badge: "8" },
    { label: "Reporting", icon: PieChart03, href: "/reporting" },
    { label: "Users", icon: Users01, href: "/users" },
];

const footerItems: NavItemType[] = [
    { label: "Support", icon: LifeBuoy01, href: "/support" },
    { label: "Settings", icon: Settings01, href: "/settings" },
];

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-secondary">
            <SidebarNavigation30x
                activeUrl={pathname}
                items={navItems}
                footerItems={footerItems}
                showAccountCard={true}
            />
            <main className="min-h-screen lg:ml-[280px]">
                {children}
            </main>
        </div>
    );
}
