import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

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
  title: "Portal SGC – Grupo Falpat SRL",
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
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
