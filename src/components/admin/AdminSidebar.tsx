"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  LayoutDashboard, Users, Send, CreditCard, 
  BookOpen, LogOut, Radio, Sun, Moon, ExternalLink, Database,
  ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";

const navigation = [
  { name: "Resumen General", href: "/admin", icon: LayoutDashboard },
  { name: "Gestión de Clientes", href: "/admin/users", icon: Users },
  { name: "Planes de Membresía", href: "/admin/plans", icon: CreditCard },
  { name: "Flota / Granja Telegram", href: "/admin/telegram", icon: Send },
  { name: "Base de Datos de Grupos", href: "/admin/groups", icon: Database },
  { name: "Guía de Operación", href: "/admin/guide", icon: BookOpen },
  { name: "Ver Portal Cliente", href: "/dashboard", icon: ExternalLink },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ottbot_sidebar_collapsed") === "true";
    setCollapsed(saved);
    document.documentElement.classList.toggle("sidebar-collapsed", saved);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("ottbot_sidebar_collapsed", String(next));
    document.documentElement.classList.toggle("sidebar-collapsed", next);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isDark = theme === "dark";

  return (
    <>
      {/* Barra Superior Móvil (< 1024px) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E2229] border-b border-[#2B303C] px-4 flex items-center justify-between z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-[#171A20] text-neutral-200 border border-[#2B303C] hover:border-[#229ED9] cursor-pointer"
            aria-label="Abrir menú admin"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-400">
            <img src="/ottbot-logo.png" alt="OttBot Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">
            Ott<span className="text-[#229ED9]">Bot</span> <span className="text-[10px] text-neutral-400">HQ</span>
          </span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/40 text-xs font-black text-[#229ED9]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Portal Cliente</span>
        </Link>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
        />
      )}

      <aside
        className={`${
          collapsed ? "lg:w-20" : "lg:w-64"
        } w-64 bg-[#1E2229] border-r border-[#2B303C] flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none transition-all duration-250 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <div className={`h-20 flex items-center ${collapsed ? "lg:justify-center lg:px-2" : "justify-between px-4"} border-b border-[#2B303C]`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_4px_16px_rgba(34,158,217,0.4)] flex-shrink-0 animate-float">
                <img src="/ottbot-logo.png" alt="OttBot Logo" className="w-full h-full object-cover" />
              </div>
              <div className={collapsed ? "lg:hidden" : "block"}>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    Ott<span className="text-[#229ED9]">Bot</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2B303C] text-neutral-300 uppercase tracking-wider">
                    HQ
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">Panel Administrativo</div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              title={collapsed ? "Expandir menú lateral" : "Recoger menú lateral"}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-[#171A20] border border-[#2B303C] hover:border-[#229ED9] text-neutral-300 hover:text-white items-center justify-center transition-all cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-[#171A20] text-neutral-400 hover:text-white border border-[#2B303C]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className={`${collapsed ? "lg:p-2" : "p-4"} p-4 space-y-1.5`}>
            <div className={`${collapsed ? "lg:hidden" : "block"} px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider`}>
              Navegación Principal
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={item.name}
                  className={`flex items-center ${
                    collapsed ? "lg:justify-center lg:px-0 lg:py-3" : "gap-3 px-3.5 py-2.5"
                  } gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#229ED9] text-white shadow-[0_4px_12px_rgba(34,158,217,0.3)]"
                      : "text-neutral-400 hover:text-white hover:bg-[#262B34]"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} />
                  <span className={collapsed ? "lg:hidden" : "inline"}>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`${collapsed ? "lg:p-2" : "p-4"} p-4 border-t border-[#2B303C] space-y-2.5`}>
          <button
            onClick={toggleTheme}
            title={`Cambiar tema (${isDark ? "Oscuro" : "Claro"})`}
            className={`w-full flex items-center ${
              collapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "justify-between px-3 py-2"
            } rounded-xl text-xs font-bold bg-[#171A20] text-neutral-300 border border-[#2B303C] hover:border-[#229ED9] transition-all cursor-pointer`}
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span className={collapsed ? "lg:hidden" : "inline"}>Tema: {isDark ? "Oscuro" : "Claro"}</span>
            </span>
            <span className={`${collapsed ? "lg:hidden" : "inline"} text-[10px] px-1.5 py-0.5 rounded bg-[#2B303C] text-neutral-400`}>
              Cambiar
            </span>
          </button>

          <div className={`${collapsed ? "lg:hidden" : "block"} bg-[#171A20] rounded-xl p-3 border border-[#2B303C]/80`}>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Sistema Operativo</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 truncate font-mono">
              ventasysoportestreaming@gmail.com
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`w-full flex items-center ${
              collapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2.5 px-3.5 py-2.5"
            } rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={collapsed ? "lg:hidden" : "inline"}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
