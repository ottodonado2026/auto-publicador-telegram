"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  LayoutDashboard, Send, PlusCircle, 
  CreditCard, LogOut, Clock, Sun, Moon, BookOpen
} from "lucide-react";

interface ClientSidebarProps {
  user: any;
  membership: any;
}

export default function ClientSidebar({ user, membership }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Mis Campañas & Envíos", href: "/dashboard", icon: LayoutDashboard },
    { name: "Crear Nuevo Copy", href: "/dashboard/campaigns", icon: PlusCircle },
    { name: "Vincular mi Telegram", href: "/dashboard/telegram", icon: Send },
    { name: "Recargar Membresía", href: "/dashboard/plans", icon: CreditCard },
    { name: "Instrucciones de Uso", href: "/dashboard/guide", icon: BookOpen },
  ];

  const hasAccess = membership?.hasAccess;
  const isDark = theme === "dark";

  return (
    <aside className="w-64 bg-[#1E2229] border-r border-[#2B303C] flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none">
      {/* Brand Header con Logo Oficial de OttBot */}
      <div>
        <div className="h-20 flex items-center gap-3 px-5 border-b border-[#2B303C]">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_4px_16px_rgba(34,158,217,0.4)] flex-shrink-0 animate-float">
            <img src="/ottbot-logo.png" alt="OttBot Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">Ott<span className="text-[#229ED9]">Bot</span></span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 uppercase tracking-wider border border-emerald-800">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">Panel de Cliente</div>
          </div>
        </div>

        {/* Links de Navegación del Cliente */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Gestión de Publicaciones
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#229ED9] text-white shadow-[0_4px_12px_rgba(34,158,217,0.3)]"
                    : "text-neutral-400 hover:text-white hover:bg-[#262B34]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Info Membresía, Switcher de Tema y Usuario Dinámico */}
      <div className="p-4 border-t border-[#2B303C] space-y-2.5">
        {/* Toggle Tema Claro / Oscuro para el Cliente */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-[#171A20] text-neutral-300 border border-[#2B303C] hover:border-[#229ED9] transition-all"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>Tema: {isDark ? "Oscuro" : "Claro"}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2B303C] text-neutral-400">
            Cambiar
          </span>
        </button>

        <div className="bg-[#171A20] rounded-2xl p-3.5 border border-[#2B303C]">
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

          {/* Correo dinámico del usuario autenticado */}
          <div className="pt-2 border-t border-[#2B303C]/70 text-[11px] text-neutral-400 truncate font-mono">
            {user?.email || "Cargando usuario..."}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
