"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useTheme } from "@/context/ThemeContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? "bg-[#13161C] text-white" : "bg-[#E9ECF0] text-[#111827]"
    }`}>
      {/* Sidebar fijo inteligente a la izquierda */}
      <AdminSidebar />

      {/* Contenido dinámico con soporte de tema claro/oscuro */}
      <div className={`flex-1 ml-64 min-h-screen flex flex-col transition-colors duration-200 ${
        isDark ? "bg-[#13161C]" : "bg-[#E9ECF0]"
      }`}>
        {children}
      </div>
    </div>
  );
}
