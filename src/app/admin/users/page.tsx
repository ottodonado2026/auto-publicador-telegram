"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw, Search, CheckCircle2, Ban, Wallet,
  Copy, Check, ChevronLeft, ChevronRight, ArrowUpRight,
  X, Clock, ShieldAlert, AlertCircle, Sparkles
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

interface ActionModalState {
  isOpen: boolean;
  user: UserData;
  type: "WALLET_PRESET" | "WALLET_CUSTOM" | "DAYS_PRESET" | "TOGGLE_STATUS";
  amountUSD?: number;
  days?: number;
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

  // Modal de Acreditación y Confirmación Elegante
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [customAmountStr, setCustomAmountStr] = useState("7.00");
  const [toast, setToast] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  // Paginación cada 10 usuarios
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const showToast = (type: "ok" | "err", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

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

  // Abrir modales de confirmación antes de ejecutar cualquier acción
  const openWalletPresetConfirm = (u: UserData, amountUSD: number) => {
    setActionModal({
      isOpen: true,
      user: u,
      type: "WALLET_PRESET",
      amountUSD,
    });
  };

  const openWalletCustomModal = (u: UserData) => {
    setCustomAmountStr("7.00");
    setActionModal({
      isOpen: true,
      user: u,
      type: "WALLET_CUSTOM",
      amountUSD: 7.00,
    });
  };

  const openDaysPresetConfirm = (u: UserData, days: number) => {
    setActionModal({
      isOpen: true,
      user: u,
      type: "DAYS_PRESET",
      days,
    });
  };

  const openToggleStatusConfirm = (u: UserData) => {
    setActionModal({
      isOpen: true,
      user: u,
      type: "TOGGLE_STATUS",
    });
  };

  // Ejecutar la acción confirmada
  const handleConfirmModalAction = async () => {
    if (!actionModal) return;
    const { user: u, type } = actionModal;
    const clientLabel = u.storeName || u.name || u.email;

    try {
      setActionLoading(u.id);

      if (type === "WALLET_PRESET" || type === "WALLET_CUSTOM") {
        const finalAmount =
          type === "WALLET_CUSTOM" ? parseFloat(customAmountStr) : Number(actionModal.amountUSD || 0);

        if (isNaN(finalAmount) || finalAmount <= 0) {
          showToast("err", "Por favor ingresa un monto numérico válido mayor a $0.00 USD.");
          setActionLoading(null);
          return;
        }

        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u.id, walletCreditUSD: finalAmount }),
        });

        if (!res.ok) throw new Error("Error al acreditar saldo en Wallet");
        showToast("ok", `+$${finalAmount.toFixed(2)} USD acreditados exitosamente a ${clientLabel} (${u.botCode || "Cliente"}).`);
      } else if (type === "DAYS_PRESET") {
        const days = Number(actionModal.days || 1);
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u.id, daysToAdd: days }),
        });

        if (!res.ok) throw new Error("Error al agregar días de membresía");
        showToast("ok", `+${days} día(s) de membresía activados exitosamente a ${clientLabel}.`);
      } else if (type === "TOGGLE_STATUS") {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u.id, isActive: !u.isActive }),
        });

        if (!res.ok) throw new Error("Error al actualizar estado del cliente");
        showToast(
          "ok",
          u.isActive
            ? `La cuenta de ${clientLabel} ha sido suspendida temporalmente.`
            : `La cuenta de ${clientLabel} ha sido reactivada con éxito.`
        );
      }

      setActionModal(null);
      await fetchUsers();
    } catch (err: any) {
      showToast("err", err.message || "Error al procesar la operación");
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
      {/* Notificación flotante de éxito / error */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold transition-all ${
            toast.type === "ok"
              ? isDark
                ? "bg-[#15221B] border-emerald-500/40 text-emerald-300"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
              : isDark
              ? "bg-[#261619] border-red-500/40 text-red-300"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-[#0F172A]"
            }`}
          >
            Gestión de Clientes, Planes & Billetera
          </h1>
          <p className={`text-xs font-medium mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Directorio completo a ancho total con paginación cada 10 usuarios, código BOT-I, plan activo y confirmación segura antes de acreditar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/wallet"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold rounded-xl hover:bg-emerald-600/25 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Recargar por Código BOT-I</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={fetchUsers}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-[#151A23] border-[#262F3F] text-slate-200 hover:text-white"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Buscador y Contador de Paginación */}
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
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0284C7] ${
              isDark
                ? "bg-[#151A23] border-[#262F3F] text-white placeholder:text-slate-500"
                : "bg-white border-slate-300 text-slate-900 shadow-xs"
            }`}
          />
        </div>

        <div className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuario(s) • Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Tabla a Ancho Completo Sin Recortes */}
      <div
        className={`w-full rounded-2xl border shadow-xl overflow-hidden ${
          isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-300"
        }`}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? "border-[#262F3F] text-slate-400 bg-[#10141B]"
                    : "border-slate-300 text-slate-700 bg-slate-100"
                }`}
              >
                <th className="py-3.5 px-3">Código BOT-I</th>
                <th className="py-3.5 px-3">Negocio / Contacto</th>
                <th className="py-3.5 px-3">Plan & Generado</th>
                <th className="py-3.5 px-3 text-center">Wallet</th>
                <th className="py-3.5 px-3 text-center">Estado</th>
                <th className="py-3.5 px-3 text-center">Uso</th>
                <th className="py-3.5 px-3 text-right">Acciones Rápidas (Con Confirmación)</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-[#222A38]" : "divide-slate-200"}`}>
              {paginatedUsers.map((u) => {
                const sub = u.subscription;
                const expiresAt = sub ? new Date(sub.expiresAt) : null;
                const now = new Date();
                const isExpired = !expiresAt || now > expiresAt;
                const daysLeft = expiresAt
                  ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;
                const walletBal = Number(u.walletBalance || 0);
                const generatedUSD = Number(u.totalGeneratedUSD || 0);
                const code = u.botCode || "BOT-I000000";

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Columna 1: Código BOT-I */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code, u.id)}
                        title="Copiar código de usuario"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-black text-[11px] transition-all cursor-pointer ${
                          isDark
                            ? "bg-[#0284C7]/15 border-[#0284C7]/30 text-[#38BDF8] hover:bg-[#0284C7]/25"
                            : "bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100"
                        }`}
                      >
                        <span>{code}</span>
                        {copiedId === u.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-80" />
                        )}
                      </button>
                    </td>

                    {/* Columna 2: Negocio / Contacto */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-xs ${isDark ? "text-white" : "text-slate-950"}`}>
                          {u.storeName || u.name || "Sin nombre"}
                        </span>
                        {u.role === "SUPERADMIN" && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-mono truncate max-w-[200px] ${
                        isDark ? "text-slate-400" : "text-slate-600 font-semibold"
                      }`}>
                        {u.phoneNumber ? `${u.phoneNumber} • ` : ""}
                        {u.email}
                      </div>
                    </td>

                    {/* Columna 3: Plan Actual & Total Generado */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className={`font-bold text-xs ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                        {u.planName || "Trial Inicial (1d)"}
                      </div>
                      <div className={`text-[11px] font-mono font-bold mt-0.5 ${
                        isDark ? "text-emerald-400" : "text-emerald-700"
                      }`}>
                        Generado: ${generatedUSD.toFixed(2)} USD
                      </div>
                    </td>

                    {/* Columna 4: Saldo en Wallet */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-black text-xs ${
                        isDark
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-emerald-50 border-emerald-300 text-emerald-900"
                      }`}>
                        <Wallet className="w-3 h-3" />
                        <span>${walletBal.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* Columna 5: Estado & Vigencia */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          !u.isActive
                            ? "bg-red-500/15 text-red-500 border border-red-500/30"
                            : isExpired
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !u.isActive ? "bg-red-500" : isExpired ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        {!u.isActive
                          ? "Bloqueado"
                          : isExpired
                          ? "Expirado"
                          : daysLeft > 365
                          ? "Ilimitado"
                          : `${daysLeft}d activo`}
                      </span>
                    </td>

                    {/* Columna 6: TG / Campañas */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="text-[11px] font-bold">
                        <span className={isDark ? "text-[#38BDF8]" : "text-sky-700"}>{u._count.telegramAccounts} TG</span>
                        <span className="mx-1 text-slate-400">/</span>
                        <span className={isDark ? "text-slate-300" : "text-slate-800"}>{u._count.campaigns} Camp.</span>
                      </div>
                    </td>

                    {/* Columna 7: Acciones Rápidas Con Modal de Confirmación */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openWalletPresetConfirm(u, 1.50)}
                          className={`px-2 py-1 border text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                          title="Acreditar $1.50 USD (con confirmación)"
                        >
                          +$1.50
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openWalletPresetConfirm(u, 7.00)}
                          className={`px-2 py-1 border text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                          title="Acreditar $7.00 USD (con confirmación)"
                        >
                          +$7
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openWalletCustomModal(u)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                          title="Abrir modal elegante para acreditar otro monto en USD"
                        >
                          +$ Otro
                        </button>

                        <span className="mx-0.5 text-slate-400">|</span>

                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openDaysPresetConfirm(u, 1)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors border cursor-pointer ${
                            isDark
                              ? "bg-[#10141B] hover:bg-[#1C222E] text-slate-200 border-[#262F3F]"
                              : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300"
                          }`}
                          title="Sumar +1 día (con confirmación)"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openDaysPresetConfirm(u, 7)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors border cursor-pointer ${
                            isDark
                              ? "bg-[#10141B] hover:bg-[#1C222E] text-slate-200 border-[#262F3F]"
                              : "bg-white hover:bg-slate-100 text-slate-900 border-slate-300"
                          }`}
                          title="Sumar +7 días (con confirmación)"
                        >
                          +7d
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openDaysPresetConfirm(u, 30)}
                          className="px-2 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                          title="Sumar +30 días (con confirmación)"
                        >
                          +30d
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => openToggleStatusConfirm(u)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            u.isActive
                              ? "text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                              : "text-emerald-500 bg-emerald-500/20"
                          }`}
                          title={u.isActive ? "Suspender cliente" : "Reactivar cliente"}
                        >
                          {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No se encontraron usuarios con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación cada 10 usuarios */}
        <div
          className={`px-4 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold ${
            isDark ? "bg-[#10141B] border-[#262F3F] text-slate-400" : "bg-slate-100 border-slate-300 text-slate-700"
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
                isDark ? "bg-[#151A23] border-[#262F3F] text-white" : "bg-white border-slate-300 text-slate-900"
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
                isDark ? "bg-[#151A23] border-[#262F3F] text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL ELEGANTE DE ACREDITACIÓN & CONFIRMACIÓN SEGURA                  */}
      {/* ===================================================================== */}
      {actionModal && actionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative transition-all ${
              isDark
                ? "bg-[#151A23] border-[#2A3446] text-white"
                : "bg-white border-slate-300 text-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
            }`}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                    actionModal.type === "TOGGLE_STATUS"
                      ? "bg-red-500/15 border-red-500/30 text-red-500"
                      : actionModal.type === "DAYS_PRESET"
                      ? "bg-[#0284C7]/15 border-[#0284C7]/30 text-[#38BDF8]"
                      : "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                  }`}
                >
                  {actionModal.type === "TOGGLE_STATUS" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : actionModal.type === "DAYS_PRESET" ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Wallet className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                    {actionModal.type === "WALLET_CUSTOM"
                      ? "Acreditar Saldo a Wallet"
                      : actionModal.type === "WALLET_PRESET"
                      ? "Confirmar Acreditación de Saldo"
                      : actionModal.type === "DAYS_PRESET"
                      ? "Confirmar Días de Membresía"
                      : actionModal.user.isActive
                      ? "Confirmar Suspensión"
                      : "Confirmar Reactivación"}
                  </h3>
                  <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Verificación de seguridad antes de aplicar cambios
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Información del Cliente Seleccionado */}
            <div
              className={`p-3.5 rounded-2xl border mb-4 flex items-center justify-between gap-3 ${
                isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-300"
              }`}
            >
              <div className="min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}>
                  Cliente Seleccionado:
                </span>
                <div className={`text-sm font-black truncate ${isDark ? "text-white" : "text-slate-950"}`}>
                  {actionModal.user.storeName || actionModal.user.name || "Sin nombre"}
                </div>
                <div className={`text-[11px] font-mono truncate ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                  {actionModal.user.email}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                    isDark
                      ? "bg-[#0284C7]/15 border-[#0284C7]/30 text-[#38BDF8]"
                      : "bg-sky-50 border-sky-300 text-sky-950"
                  }`}
                >
                  {actionModal.user.botCode || "BOT-I------"}
                </span>
                <div className={`text-[11px] font-mono font-bold mt-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                  Actual: ${Number(actionModal.user.walletBalance || 0).toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* Contenido según el tipo de acción */}
            {actionModal.type === "WALLET_CUSTOM" && (
              <div className="space-y-3.5 mb-5">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                    Selecciona un valor rápido o escribe el monto en USD:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {["1.50", "3.00", "7.00", "13.50", "24.00", "35.00", "50.00", "100.00"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCustomAmountStr(val)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-mono font-black transition-all cursor-pointer ${
                          customAmountStr === val
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                            : isDark
                            ? "bg-[#10141B] border-[#262F3F] text-slate-300 hover:border-slate-500"
                            : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        +${val}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className={`text-base font-mono font-black absolute left-4 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-emerald-400" : "text-slate-950"
                    }`}>
                      $
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0.50"
                      autoFocus
                      value={customAmountStr}
                      onChange={(e) => setCustomAmountStr(e.target.value)}
                      placeholder="7.00"
                      className={`w-full pl-9 pr-14 py-3 rounded-2xl border text-lg font-mono font-black focus:outline-none focus:border-emerald-500 ${
                        isDark
                          ? "bg-[#10141B] border-[#2A3446] text-white"
                          : "bg-white border-slate-300 text-slate-950 shadow-xs"
                      }`}
                    />
                    <span className={`text-xs font-mono font-black absolute right-4 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-slate-400" : "text-slate-700"
                    }`}>
                      USD
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  }`}
                >
                  <span className="font-bold">Nuevo saldo tras acreditar:</span>
                  <span className="font-mono font-black text-sm">
                    ${(Number(actionModal.user.walletBalance || 0) + (parseFloat(customAmountStr) || 0)).toFixed(2)} USD
                  </span>
                </div>
              </div>
            )}

            {actionModal.type === "WALLET_PRESET" && (
              <div
                className={`p-4 rounded-2xl border mb-5 text-center space-y-1.5 ${
                  isDark
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-emerald-50 border-emerald-300"
                }`}
              >
                <div className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                  ¿Estás seguro de acreditar este saldo a la Wallet?
                </div>
                <div className={`text-3xl font-black font-mono ${isDark ? "text-emerald-400" : "text-emerald-800"}`}>
                  +${Number(actionModal.amountUSD || 0).toFixed(2)} USD
                </div>
                <div className={`text-[11px] font-mono font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                  Nuevo saldo en su Wallet: $
                  {(Number(actionModal.user.walletBalance || 0) + Number(actionModal.amountUSD || 0)).toFixed(2)} USD
                </div>
              </div>
            )}

            {actionModal.type === "DAYS_PRESET" && (
              <div
                className={`p-4 rounded-2xl border mb-5 text-center space-y-1.5 ${
                  isDark
                    ? "bg-[#0284C7]/10 border-[#0284C7]/30"
                    : "bg-sky-50 border-sky-300"
                }`}
              >
                <div className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                  ¿Estás seguro de adicionar días a su membresía activa?
                </div>
                <div className={`text-3xl font-black font-mono ${isDark ? "text-[#38BDF8]" : "text-sky-900"}`}>
                  +{actionModal.days} {actionModal.days === 1 ? "Día" : "Días"}
                </div>
                <div className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                  Se acumularán inmediatamente a su fecha de vencimiento.
                </div>
              </div>
            )}

            {actionModal.type === "TOGGLE_STATUS" && (
              <div
                className={`p-4 rounded-2xl border mb-5 text-center space-y-1.5 ${
                  actionModal.user.isActive
                    ? isDark
                      ? "bg-red-500/10 border-red-500/30 text-red-300"
                      : "bg-red-50 border-red-300 text-red-950"
                    : isDark
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-emerald-50 border-emerald-300 text-emerald-950"
                }`}
              >
                <div className="text-sm font-black">
                  {actionModal.user.isActive
                    ? "¿Deseas suspender el acceso de este cliente?"
                    : "¿Deseas reactivar el acceso de este cliente?"}
                </div>
                <p className="text-xs opacity-90">
                  {actionModal.user.isActive
                    ? "Sus campañas programadas se detendrán hasta que vuelvas a activarlo."
                    : "El cliente podrá volver a entrar a su panel y ejecutar sus campañas."}
                </p>
              </div>
            )}

            {/* Botones de Cancelar y Confirmar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? "bg-[#10141B] border-[#262F3F] text-slate-300 hover:text-white"
                    : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                }`}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={actionLoading === actionModal.user.id}
                onClick={handleConfirmModalAction}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  actionModal.type === "TOGGLE_STATUS" && actionModal.user.isActive
                    ? "bg-red-600 hover:bg-red-500"
                    : actionModal.type === "DAYS_PRESET"
                    ? "bg-[#0284C7] hover:bg-[#0369A1]"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {actionLoading === actionModal.user.id
                    ? "Procesando..."
                    : actionModal.type === "WALLET_CUSTOM"
                    ? `Sí, Acreditar $${(parseFloat(customAmountStr) || 0).toFixed(2)}`
                    : actionModal.type === "WALLET_PRESET"
                    ? `Sí, Acreditar $${Number(actionModal.amountUSD || 0).toFixed(2)}`
                    : actionModal.type === "DAYS_PRESET"
                    ? `Sí, Sumar +${actionModal.days}d`
                    : actionModal.user.isActive
                    ? "Sí, Suspender"
                    : "Sí, Reactivar"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
