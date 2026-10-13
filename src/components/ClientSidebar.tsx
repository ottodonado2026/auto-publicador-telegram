"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Send, PlusCircle, MessageSquare, 
  CreditCard, LogOut, CheckCircle2, AlertCircle, Clock
} from "lucide-react";

interface ClientSidebarProps {
  user: any;
  membership: any;
}

export default function ClientSidebar({ user, membership }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
  ];

  const hasAccess = membership?.hasAccess;

  return (
    <aside className="w-64 bg-[#1E2229] border-r border-[#2B303C] flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#2B303C]">
          <div className="w-9 h-9 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(34,158,217,0.35)] animate-float">
            <Send className="w-4 h-4 -rotate-12 translate-x-[-1px] translate-y-[-1px] fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Ott<span className="text-[#229ED9]">Bot</span></span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 uppercase tracking-wider border border-emerald-800">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">Panel de Cliente</div>
          </div>
        </div>

        {/* Links de Navegación */}
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

      {/* Info Membresía & Usuario */}
      <div className="p-4 border-t border-[#2B303C] space-y-3">
        <div className="bg-[#171A1F] rounded-2xl p-3.5 border border-[#2B303C]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Estado Membresía</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              hasAccess ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"
            }`}>
              {hasAccess ? "Activo" : "Expirado"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-[#229ED9]" />
            <span>{membership?.daysRemaining ?? 0} días restantes</span>
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
