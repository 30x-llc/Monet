import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { IdentityGate } from "@/components/app/identity-gate";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "30x Design",
    description:
        "Sistema de diseño y generación de propuestas comerciales de 30x, la red ejecutiva más grande de Latinoamérica",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${inter.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col bg-primary text-primary">
                <IdentityGate>{children}</IdentityGate>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
