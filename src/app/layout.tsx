import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "OttBot — Publica en Telegram Automáticamente",
  description: "Plataforma SaaS para autopublicación inteligente, difusión masiva en grupos de Telegram con precisión quirúrgica.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
