"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Users, CreditCard, ShieldCheck, Activity, 
  Plus, CheckCircle, AlertTriangle, LogOut, RefreshCw, Clock
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscription: {
    status: string;
    expiresAt: string;
    dailyRate: string;
  } | null;
  _count: {
    telegramAccounts: number;
    campaigns: number;
  };
}

interface StatsData {
  totalUsers: number;
  activeSubscriptions: number;
  totalTelegrams: number;
  totalCampaigns: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRechargeDays = async (userId: string, days: number) => {
    try {
      setActionLoading(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, daysToAdd: days }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    try {
      setActionLoading(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white">
      {/* Top Navbar estilo Apple macOS */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-neutral-900">Ott<span className="text-neutral-500 font-semibold">Bot</span></span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900 text-white tracking-wide uppercase">
                  SuperAdmin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchUsers}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-red-600 py-1.5 px-3 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Título y Resumen */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Panel de Control Central
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Supervisa clientes, vigencia de suscripciones y asignación de saldos en tiempo real.
          </p>
        </div>

        {/* Métricas estilo Shopify / Apple Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Clientes</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {stats?.totalUsers ?? "—"}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Membresías Activas</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {stats?.activeSubscriptions ?? "—"}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Cuentas Telegram</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {stats?.totalTelegrams ?? "—"}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Campañas Activas</span>
              <Send className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 tracking-tight">
              {stats?.totalCampaigns ?? "—"}
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios y Membresías */}
        <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Gestión de Clientes</h2>
            <span className="text-xs text-neutral-400">Modelo $1-$2 / día</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/70 text-neutral-500 text-xs font-medium border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3.5">Usuario / Correo</th>
                  <th className="px-6 py-3.5">Rol</th>
                  <th className="px-6 py-3.5">Estado Membresía</th>
                  <th className="px-6 py-3.5">Vencimiento</th>
                  <th className="px-6 py-3.5">Telegrams</th>
                  <th className="px-6 py-3.5 text-right">Acciones de Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => {
                  const expiresAt = u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null;
                  const isExpired = expiresAt ? new Date() > expiresAt : true;
                  const daysLeft = expiresAt
                    ? Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                    : 0;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900">{u.name || "Sin nombre"}</div>
                        <div className="text-xs text-neutral-400">{u.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          u.role === "SUPERADMIN" ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          !isExpired
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "bg-red-50 text-red-600 border border-red-200/50"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${!isExpired ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          {!isExpired ? `${daysLeft} días restantes` : "Expirada"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {expiresAt ? expiresAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Sin fecha"}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-600">
                        {u._count.telegramAccounts} cuenta(s)
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => handleRechargeDays(u.id, 1)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors"
                            title="Añadir 1 día de membresía"
                          >
                            +1 Día ($1)
                          </button>
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => handleRechargeDays(u.id, 7)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors"
                            title="Añadir 7 días de membresía"
                          >
                            +7 Días
                          </button>
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => handleRechargeDays(u.id, 30)}
                            className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 text-xs font-medium rounded-lg transition-colors"
                            title="Añadir 30 días de membresía"
                          >
                            +30 Días
                          </button>
                          <button
                            disabled={actionLoading === u.id}
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              u.isActive ? "text-neutral-400 hover:text-red-600" : "text-emerald-600 bg-emerald-50"
                            }`}
                            title={u.isActive ? "Desactivar cliente" : "Activar cliente"}
                          >
                            {u.isActive ? "Bloquear" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
