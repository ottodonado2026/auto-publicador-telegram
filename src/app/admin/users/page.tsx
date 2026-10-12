"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, RefreshCw, Plus, Clock, ShieldCheck, 
  AlertTriangle, Search, Filter, CheckCircle2, Ban
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Gestión de Clientes & Membresías
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Administra los usuarios registrados, recarga días de servicio y supervisa los cobros diarios.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-300 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Clientes</span>
        </button>
      </div>

      {/* Buscador & Filtros */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por correo o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
          />
        </div>

        <div className="text-xs text-neutral-500 font-semibold">
          {filteredUsers.length} usuario(s) encontrado(s)
        </div>
      </div>

      {/* Tabla Principal Blanca que resalta sobre el gris */}
      <div className="bg-white rounded-2xl border border-neutral-300/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-neutral-500 font-bold uppercase tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Cliente / Correo</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado Vigencia</th>
                <th className="px-6 py-4">Fecha de Corte</th>
                <th className="px-6 py-4">Telegrams</th>
                <th className="px-6 py-4 text-right">Recarga de Días ($1-$2/día)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => {
                const expiresAt = u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null;
                const isExpired = expiresAt ? new Date() > expiresAt : true;
                const daysLeft = expiresAt
                  ? Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;

                return (
                  <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 text-sm">{u.name || "Sin nombre"}</div>
                      <div className="text-neutral-400 text-xs mt-0.5">{u.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        u.role === "SUPERADMIN" 
                          ? "bg-purple-100 text-purple-800 border border-purple-200" 
                          : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        !isExpired
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${!isExpired ? "bg-emerald-500" : "bg-red-500"}`} />
                        {!isExpired ? `${daysLeft} días restantes` : "Expirada"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-neutral-600 font-medium">
                      {expiresAt 
                        ? expiresAt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
                        : "Sin fecha"}
                    </td>

                    <td className="px-6 py-4 font-semibold text-neutral-700">
                      {u._count.telegramAccounts} cuenta(s)
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 1)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition-colors border border-neutral-300"
                          title="Añadir 1 día de membresía"
                        >
                          +1 Día ($1)
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 7)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition-colors border border-neutral-300"
                          title="Añadir 7 días de membresía"
                        >
                          +7 Días
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 30)}
                          className="px-2.5 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                          title="Añadir 30 días de membresía"
                        >
                          +30 Días
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                            u.isActive 
                              ? "text-neutral-400 hover:text-red-600 hover:bg-red-50" 
                              : "text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                          }`}
                          title={u.isActive ? "Suspender cliente" : "Activar cliente"}
                        >
                          {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
    </div>
  );
}
