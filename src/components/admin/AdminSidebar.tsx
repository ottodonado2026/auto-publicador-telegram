"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Send, CreditCard, 
  BookOpen, LogOut, Radio
} from "lucide-react";

const navigation = [
  { name: "Resumen General", href: "/admin", icon: LayoutDashboard },
  { name: "Gestión de Clientes", href: "/admin/users", icon: Users },
  { name: "Planes de Membresía", href: "/admin/plans", icon: CreditCard },
  { name: "Flota / Granja Telegram", href: "/admin/telegram", icon: Send },
  { name: "Guía de Operación", href: "/admin/guide", icon: BookOpen },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2B303C] text-neutral-300 uppercase tracking-wider">
                HQ
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-medium">Panel Administrativo</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Navegación Principal
          </div>
          {navigation.map((item) => {
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

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-[#2B303C] space-y-3">
        <div className="bg-[#171A1F] rounded-xl p-3 border border-[#2B303C]/80">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Sistema Operativo</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 truncate">
            ventasysoportestreaming@gmail.com
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
