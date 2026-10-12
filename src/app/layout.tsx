import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OttBot — Plataforma SaaS de Autopublicación en Telegram",
  description: "Automatización, difusión inteligente y autopublicación en grupos de Telegram con precisión quirúrgica.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
        {children}
      </body>
    </html>
  );
}
