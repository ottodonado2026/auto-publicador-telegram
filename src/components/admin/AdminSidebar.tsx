"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard, Users, Send, CreditCard,
  BookOpen, LogOut, Radio, Sun, Moon, Database,
  ChevronLeft, ChevronRight, Menu, X, Wallet,
  CreditCard as PayIcon, Activity, Bell, CheckCheck, Award
} from "lucide-react";

const navigation = [
  { name: "Resumen General", href: "/admin", icon: LayoutDashboard },
  { name: "Recargar Wallet (BOT-I)", href: "/admin/wallet", icon: Wallet },
  { name: "Gestión de Clientes", href: "/admin/users", icon: Users },
  { name: "Campañas en Vivo", href: "/admin/campaigns", icon: Activity },
  { name: "Flota / Granja Telegram", href: "/admin/telegram", icon: Send },
  { name: "Base de Datos de Grupos", href: "/admin/groups", icon: Database },
  { name: "Pagos / Binance Pay", href: "/admin/payments", icon: PayIcon },
  { name: "Control de Referidos & Rangos", href: "/admin/referrals", icon: Award },
  { name: "Guía de Operación", href: "/admin/guide", icon: BookOpen },
  { name: "Planes de Membresía", href: "/admin/plans", icon: CreditCard },
];

interface AdminNotification {
  id: string;
  type: "NEW_USER" | "WALLET_RECHARGE";
  message: string;
  detail: string;
  timestamp: string;
  read: boolean;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sistema de notificaciones en tiempo real
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [latestNotif, setLatestNotif] = useState<AdminNotification | null>(null);
  const prevUsersCountRef = useRef<number | null>(null);
  const prevWalletTxCountRef = useRef<number | null>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  // Polling cada 20s para detectar nuevos usuarios y recargas
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) return;
        const data = await res.json();
        const users: any[] = data.users || [];
        const txs: any[] = data.recentWalletTransactions || [];

        const now = new Date().toISOString();

        // Detectar nuevos usuarios
        if (prevUsersCountRef.current !== null && users.length > prevUsersCountRef.current) {
          const newCount = users.length - prevUsersCountRef.current;
          const newest = users[0];
          const notif: AdminNotification = {
            id: `user-${Date.now()}`,
            type: "NEW_USER",
            message: `🎉 ¡${newCount} nuevo${newCount > 1 ? "s" : ""} usuario${newCount > 1 ? "s" : ""} registrado${newCount > 1 ? "s" : ""}!`,
            detail: newest ? `${newest.storeName || newest.name || newest.email} (${newest.botCode || "N/A"})` : "",
            timestamp: now,
            read: false,
          };
          setNotifications(prev => [notif, ...prev.slice(0, 19)]);
          setLatestNotif(notif);
          setShowNotifModal(true);
          setTimeout(() => setShowNotifModal(false), 6000);
        }
        prevUsersCountRef.current = users.length;

        // Detectar nuevas recargas
        if (prevWalletTxCountRef.current !== null && txs.length > prevWalletTxCountRef.current) {
          const newTxCount = txs.length - prevWalletTxCountRef.current;
          const newestTx = txs[0];
          if (newestTx?.type === "CREDIT") {
            const notif: AdminNotification = {
              id: `wallet-${Date.now()}`,
              type: "WALLET_RECHARGE",
              message: `💰 Recarga recibida: +$${Number(newestTx.amount || 0).toFixed(2)} USD`,
              detail: newestTx.user ? `${newestTx.user.storeName || newestTx.user.name || newestTx.user.email} (${newestTx.user.botCode})` : "",
              timestamp: now,
              read: false,
            };
            setNotifications(prev => [notif, ...prev.slice(0, 19)]);
            setLatestNotif(notif);
            setShowNotifModal(true);
            setTimeout(() => setShowNotifModal(false), 6000);
          }
        }
        prevWalletTxCountRef.current = txs.length;

      } catch (err) {
        // silencioso
      }
    };

    checkForUpdates(); // carga inicial
    const interval = setInterval(checkForUpdates, 20000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const isDark = theme === "dark";

  return (
    <>
      {/* Toast Modal de Notificación (aparece esquina superior derecha) */}
      {showNotifModal && latestNotif && (
        <div
          className="fixed top-5 right-5 z-[9999] max-w-xs w-full animate-in slide-in-from-right-5"
          style={{ animation: "slideInRight 0.3s ease-out" }}
        >
          <div className={`rounded-2xl p-4 border-2 shadow-2xl ${
            latestNotif.type === "NEW_USER"
              ? "bg-[#1B2230] border-[#229ED9]/60"
              : "bg-[#1B2A1C] border-emerald-500/60"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                latestNotif.type === "NEW_USER" ? "bg-[#229ED9]/20" : "bg-emerald-500/20"
              }`}>
                {latestNotif.type === "NEW_USER" ? "🎉" : "💰"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white">{latestNotif.message}</div>
                {latestNotif.detail && (
                  <div className="text-[11px] text-neutral-300 mt-0.5 truncate">{latestNotif.detail}</div>
                )}
                <div className="text-[10px] text-neutral-500 mt-1">Ahora mismo</div>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="text-neutral-500 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Superior Móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1E2229] border-b border-[#2B303C] px-4 flex items-center justify-between z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-[#171A20] text-neutral-200 border border-[#2B303C] hover:border-[#229ED9] cursor-pointer"
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

        <div className="flex items-center gap-2">
          {/* Campana de Notificaciones (móvil) */}
          <div className="relative" ref={notifPanelRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 rounded-xl bg-[#171A20] border border-[#2B303C] text-neutral-300 hover:text-white hover:border-[#229ED9] cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          <Link
            href="/admin/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-black text-emerald-400"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Recargar BOT-I</span>
          </Link>
        </div>
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
          <div className={`${
            collapsed ? "lg:flex-col lg:justify-center lg:py-3.5 lg:px-2 lg:h-auto lg:gap-2.5" : "h-20 justify-between px-4"
          } flex items-center border-b border-[#2B303C]`}>
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

            {/* Campana de Notificaciones (desktop) */}
            <div className={`relative ${collapsed ? "lg:hidden" : "block"}`} ref={notifPanelRef}>
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-1.5 rounded-lg bg-[#171A20] border border-[#2B303C] text-neutral-400 hover:text-white hover:border-[#229ED9] transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de Notificaciones */}
              {showNotifPanel && (
                <div className="absolute top-10 right-0 w-80 bg-[#1E2229] border border-[#2B313F] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#2B313F]">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-[#229ED9]" />
                      Notificaciones ({unreadCount} sin leer)
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-[#229ED9] hover:underline flex items-center gap-1 cursor-pointer">
                        <CheckCheck className="w-3 h-3" /> Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-neutral-500">
                        Sin notificaciones aún. Se actualizará automáticamente.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-[#2B313F]/50 ${notif.read ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-base flex-shrink-0">
                              {notif.type === "NEW_USER" ? "🎉" : "💰"}
                            </span>
                            <div className="min-w-0">
                              <div className={`text-xs font-black ${notif.read ? "text-neutral-400" : "text-white"}`}>
                                {notif.message}
                              </div>
                              {notif.detail && (
                                <div className="text-[11px] text-neutral-400 mt-0.5 truncate">{notif.detail}</div>
                              )}
                              <div className="text-[10px] text-neutral-600 mt-0.5">
                                {new Date(notif.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
