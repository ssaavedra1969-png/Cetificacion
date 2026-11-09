import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import RootShell from "@/components/RootShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de la Calidad – Grupo Falpat SRL",
  description:
    "Portal de certificación y seguimiento del Sistema de Gestión de Calidad para Grupo Falpat SRL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
          <RootShell>{children}</RootShell>
        </Suspense>
      </body>
    </html>
  );
}
