import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { VersionDetector } from "@/components/app/version-detector";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Monet — by 30X",
    description: "El AI designer de 30X. Propuestas, decks y documentos comerciales.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${inter.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col bg-primary text-primary">
                {children}
                <VersionDetector />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
