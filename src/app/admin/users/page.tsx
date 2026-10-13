"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw, Search, CheckCircle2, Ban, Wallet,
  Copy, Check, ChevronLeft, ChevronRight, ArrowUpRight
} from "lucide-react";

interface UserData {
  id: string;
  botCode: string | null;
  email: string;
  phoneNumber: string | null;
  storeName: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  walletBalance: string;
  planName?: string;
  totalGeneratedUSD?: number;
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Paginación cada 10 usuarios
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

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

  const handleCreditWallet = async (userId: string, amountUSD: number) => {
    try {
      setActionLoading(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletCreditUSD: amountUSD }),
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

  const handleCustomWalletPrompt = (u: UserData) => {
    const val = prompt(
      `Ingresa el monto en USD a acreditar en la Wallet de ${u.storeName || u.email} (${u.botCode || "Sin código"}):`,
      "7.00"
    );
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      alert("Por favor ingresa un monto numérico válido mayor a 0.");
      return;
    }
    handleCreditWallet(u.id, num);
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

  const filteredUsers = users.filter(
    (u) =>
      (u.botCode && u.botCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.storeName && u.storeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm))
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="py-6 px-2 sm:px-4 w-full">
      {/* Header Ancho Completo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Gestión de Clientes Registrados
          </h1>
          <p className={`text-xs font-medium mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Directorio completo a ancho total con paginación cada 10 usuarios y acciones rápidas visibles al 100%.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/wallet"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Recargar por Código BOT-I</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchUsers}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-[#151A23] border-[#262F3F] text-slate-200 hover:text-white"
                : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Buscador & Indicador de Paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código BOT-IXXXXXX, negocio, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:border-[#0284C7] ${
              isDark
                ? "bg-[#151A23] border-[#262F3F] text-white placeholder:text-slate-500"
                : "bg-[#F4F6F9] border-slate-300 text-slate-900 placeholder:text-slate-400"
            }`}
          />
        </div>

        <div className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuario(s) • Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Tabla de Ancho Completo Real (Todas las columnas y botones visibles sin cortarse) */}
      <div
        className={`w-full rounded-2xl border shadow-xl overflow-hidden ${
          isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-[#F4F6F9] border-slate-300"
        }`}
      >
        <table className="w-full text-left text-xs table-auto">
          <thead
            className={`font-semibold uppercase tracking-wider text-[10px] border-b ${
              isDark
                ? "bg-[#10141B] text-slate-400 border-[#262F3F]"
                : "bg-[#E8ECF2] text-slate-600 border-slate-300"
            }`}
          >
            <tr>
              <th className="px-3 py-3.5">Código BOT-I</th>
              <th className="px-3 py-3.5">Negocio / Contacto</th>
              <th className="px-3 py-3.5">Plan / Generado</th>
              <th className="px-3 py-3.5">Wallet</th>
              <th className="px-3 py-3.5">Vigencia</th>
              <th className="px-3 py-3.5">Uso</th>
              <th className="px-3 py-3.5 text-right">Acciones Rápidas (Wallet & Días)</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-[#222A38]" : "divide-slate-200"}`}>
            {paginatedUsers.map((u) => {
              const expiresAt = u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null;
              const isExpired = expiresAt ? new Date() > expiresAt : true;
              const daysLeft = expiresAt
                ? Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                : 0;
              const walletNum = Number(u.walletBalance || 0);
              const code = u.botCode || "BOT-I000000";

              return (
                <tr
                  key={u.id}
                  className={`transition-colors ${
                    isDark ? "hover:bg-[#1C222E]/70" : "hover:bg-white/70"
                  }`}
                >
                  {/* Código BOT-I */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code, u.id)}
                      title="Clic para copiar código BOT-I"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0284C7]/15 border border-[#0284C7]/35 text-[#38BDF8] font-mono font-semibold text-xs hover:bg-[#0284C7]/25 transition-all cursor-pointer"
                    >
                      <span>{code}</span>
                      {copiedId === u.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-75" />
                      )}
                    </button>
                  </td>

                  {/* Cliente & Contacto */}
                  <td className="px-3 py-3 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-xs truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {u.storeName || u.name || "Sin nombre"}
                      </span>
                      {u.role === "SUPERADMIN" && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px] font-mono truncate mt-0.5">
                      {u.phoneNumber ? `${u.phoneNumber} • ` : ""}
                      {u.email}
                    </div>
                  </td>

                  {/* Plan & Total Generado */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className={`text-xs font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {daysLeft > 365 ? "Plan Promotor Ilimitado" : u.planName || "Pase Express (1d)"}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-emerald-400 mt-0.5">
                      Generado: ${Number(u.totalGeneratedUSD || 0).toFixed(2)} USD
                    </div>
                  </td>

                  {/* Saldo Wallet */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-semibold text-xs">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>${walletNum.toFixed(2)}</span>
                    </span>
                  </td>

                  {/* Vigencia */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        !isExpired
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${!isExpired ? "bg-emerald-400" : "bg-red-400"}`} />
                      {!isExpired ? (daysLeft > 365 ? "Ilimitado" : `${daysLeft}d activo`) : "Expirado"}
                    </span>
                  </td>

                  {/* Uso TG / Campañas */}
                  <td className="px-3 py-3 whitespace-nowrap font-semibold text-[11px]">
                    <span className="text-[#38BDF8]">{u._count.telegramAccounts} TG</span>
                    <span className="mx-1 text-slate-500">/</span>
                    <span>{u._count.campaigns} Camp.</span>
                  </td>

                  {/* Acciones Compactas Alineadas y 100% Visibles */}
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleCreditWallet(u.id, 1.50)}
                        className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Acreditar $1.50 USD"
                      >
                        +$1.50
                      </button>
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleCreditWallet(u.id, 7)}
                        className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Acreditar $7.00 USD"
                      >
                        +$7
                      </button>
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleCustomWalletPrompt(u)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Acreditar otro monto en USD"
                      >
                        +$ Otro
                      </button>

                      <span className="mx-0.5 text-slate-600">|</span>

                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleRechargeDays(u.id, 1)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors border cursor-pointer ${
                          isDark
                            ? "bg-[#10141B] hover:bg-[#1C222E] text-slate-200 border-[#262F3F]"
                            : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        +1d
                      </button>
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleRechargeDays(u.id, 7)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors border cursor-pointer ${
                          isDark
                            ? "bg-[#10141B] hover:bg-[#1C222E] text-slate-200 border-[#262F3F]"
                            : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        +7d
                      </button>
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleRechargeDays(u.id, 30)}
                        className="px-2 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        +30d
                      </button>
                      <button
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          u.isActive
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            : "text-emerald-400 bg-emerald-500/20"
                        }`}
                        title={u.isActive ? "Suspender cliente" : "Activar cliente"}
                      >
                        {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Controles de Paginación cada 10 usuarios */}
        <div
          className={`px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold ${
            isDark ? "bg-[#10141B] border-[#262F3F] text-slate-400" : "bg-[#E8ECF2] border-slate-300 text-slate-600"
          }`}
        >
          <span>
            Página {currentPage} de {totalPages} ({filteredUsers.length} usuarios registrados — 10 por página)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                isDark ? "bg-[#151A23] border-[#262F3F] text-white" : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                isDark ? "bg-[#151A23] border-[#262F3F] text-white" : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
