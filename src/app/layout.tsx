import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "30x Deck Engine",
    description:
        "Generador de presentaciones comerciales de 30x, la red ejecutiva mas grande de Latinoamerica",
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
            </body>
        </html>
    );
}
