"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  LayoutDashboard, PlusCircle, 
  CreditCard, LogOut, Clock, Sun, Moon, BookOpen, Wallet,
  ChevronLeft, ChevronRight, Menu, X, UserCheck
} from "lucide-react";

interface ClientSidebarProps {
  user: any;
  membership: any;
}

export default function ClientSidebar({ user, membership }: ClientSidebarProps) {
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

  const navItems = [
    { name: "Mis Campañas & Envíos", href: "/dashboard", icon: LayoutDashboard },
    { name: "Crear Nuevo Copy", href: "/dashboard/campaigns", icon: PlusCircle },
    { name: "Mi Perfil & Telegram", href: "/dashboard/telegram", icon: UserCheck },
    { name: "Recargar Membresía", href: "/dashboard/plans", icon: CreditCard },
    { name: "Instrucciones de Uso", href: "/dashboard/guide", icon: BookOpen },
  ];

  const hasAccess = membership?.hasAccess;
  const isDark = theme === "dark";
  const walletBalance = Number(user?.walletBalance || 0).toFixed(2);

  return (
    <>
      {/* Barra Superior Móvil (< 1024px) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E2229] border-b border-[#2B303C] px-4 flex items-center justify-between z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-[#171A20] text-neutral-200 border border-[#2B303C] hover:border-[#229ED9] cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-sky-400">
            <img src="/ottbot-logo.png" alt="OttBot Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">
            Ott<span className="text-[#229ED9]">Bot</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/plans"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-xs font-black text-emerald-400"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-mono text-white">${walletBalance}</span>
          </Link>
        </div>
      </div>

      {/* Overlay oscuro cuando el menú móvil está abierto */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
        />
      )}

      {/* Sidebar Fijo (Colapsable en PC y Drawer en Móvil) */}
      <aside
        className={`${
          collapsed ? "lg:w-20" : "lg:w-64"
        } w-64 bg-[#1E2229] border-r border-[#2B303C] flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none transition-all duration-250 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Parte Superior: Brand Header + Wallet + Navegación */}
        <div>
          <div className={`${
            collapsed ? "lg:flex-col lg:justify-center lg:py-3.5 lg:px-2 lg:h-auto lg:gap-2.5" : "h-20 justify-between px-4"
          } flex items-center border-b border-[#2B303C] relative`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_4px_16px_rgba(34,158,217,0.4)] flex-shrink-0 animate-float">
                <img src="/ottbot-logo.png" alt="OttBot Logo" className="w-full h-full object-cover" />
              </div>
              <div className={collapsed ? "lg:hidden" : "block"}>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-base tracking-tight">
                    Ott<span className="text-[#229ED9]">Bot</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 uppercase tracking-wider border border-emerald-800">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">Panel de Cliente</div>
              </div>
            </div>

            {/* Botón Colapsar / Expandir en PC (Debajo del logo cuando está recogido) */}
            <button
              type="button"
              onClick={toggleCollapse}
              title={collapsed ? "Expandir menú lateral" : "Recoger menú lateral"}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-[#171A20] border border-[#2B303C] hover:border-[#229ED9] text-neutral-300 hover:text-white items-center justify-center transition-all cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Botón Cerrar en Móvil */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-[#171A20] text-neutral-400 hover:text-white border border-[#2B303C]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Wallet Rápida (El código BOT-I solo aparece dentro de Mi Perfil & Telegram) */}
          <div className={`${collapsed ? "lg:px-2" : "px-4"} pt-4 pb-1`}>
            <Link
              href="/dashboard/plans"
              onClick={() => setMobileOpen(false)}
              title={`Mi Wallet: $${walletBalance} USD`}
              className={`w-full flex items-center ${
                collapsed ? "lg:flex-col lg:justify-center lg:px-1.5 lg:py-2.5 gap-1" : "justify-between px-3.5 py-3"
              } rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#192524] to-[#171A20] border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/30 transition-all group`}
            >
              <span className="flex items-center gap-2 text-xs font-black text-emerald-400">
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span className={collapsed ? "lg:hidden" : "inline"}>Mi Wallet:</span>
              </span>
              <span className={`font-black text-white font-mono bg-emerald-500/20 rounded-lg border border-emerald-500/30 ${
                collapsed ? "lg:text-[10px] lg:px-1.5 lg:py-0.5 text-xs px-2 py-0.5" : "text-xs px-2 py-0.5"
              }`}>
                ${walletBalance}
              </span>
            </Link>
          </div>

          {/* Links de Navegación del Cliente */}
          <nav className={`${collapsed ? "lg:p-2" : "p-4"} p-4 space-y-1.5`}>
            <div className={`${collapsed ? "lg:hidden" : "block"} px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider`}>
              Gestión de Publicaciones
            </div>
            {navItems.map((item) => {
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

        {/* Info Membresía, Switcher de Tema y Usuario Dinámico */}
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

          <div className={`${collapsed ? "lg:hidden" : "block"} bg-[#171A20] rounded-2xl p-3.5 border border-[#2B303C]`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Membresía</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                hasAccess ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"
              }`}>
                {hasAccess ? "24h Activo" : "Expirado"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
              <Clock className="w-3.5 h-3.5 text-[#229ED9]" />
              <span>{membership?.daysRemaining ?? 1} día(s) restante(s)</span>
            </div>

            <div className="pt-2 border-t border-[#2B303C]/70 text-[11px] text-neutral-400 truncate font-mono">
              {user?.email || "Cargando usuario..."}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`w-full flex items-center ${
              collapsed ? "lg:justify-center lg:px-0 lg:py-2.5" : "gap-2 px-3.5 py-2"
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
