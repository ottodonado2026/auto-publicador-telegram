"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  Users, RefreshCw, Plus, Clock, ShieldCheck, 
  Search, CheckCircle2, Ban, Wallet, DollarSign, Hash, Copy, Check, AlertCircle
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

  // Recarga por código BOT-IXXXXXX
  const [botCodeInput, setBotCodeInput] = useState("");
  const [amountInput, setAmountInput] = useState("7.00");
  const [rechargingByCode, setRechargingByCode] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  const handleRechargeByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeMsg(null);
    const code = botCodeInput.trim().toUpperCase();
    const numAmount = parseFloat(amountInput);

    if (!code) {
      setRechargeMsg({ type: "err", text: "Ingresa el código BOT-IXXXXXX del usuario." });
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setRechargeMsg({ type: "err", text: "Ingresa un monto válido en USD mayor a 0." });
      return;
    }

    try {
      setRechargingByCode(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botCode: code,
          walletCreditUSD: numAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al recargar por código");
      }

      const u = data.user;
      setRechargeMsg({
        type: "ok",
        text: `¡Acreditado con éxito! +$${numAmount.toFixed(2)} USD agregados a ${u?.storeName || u?.name || u?.email} (${u?.botCode}). Saldo actual: $${Number(u?.walletBalance || 0).toFixed(2)} USD.`,
      });
      setBotCodeInput("");
      fetchUsers();
    } catch (err: any) {
      setRechargeMsg({ type: "err", text: err.message || "Error al acreditar saldo" });
    } finally {
      setRechargingByCode(false);
    }
  };

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
    const val = prompt(`Ingresa el monto en USD a acreditar en la Wallet de ${u.storeName || u.email} (${u.botCode || "Sin código"}):`, "10");
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

  const filteredUsers = users.filter((u) =>
    (u.botCode && u.botCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.storeName && u.storeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phoneNumber && u.phoneNumber.includes(searchTerm))
  );

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestión de Clientes, Wallet & Códigos BOT-I
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
            Administra los usuarios registrados, recarga su Wallet ingresando su código único <code className="font-mono font-bold text-[#229ED9]">BOT-IXXXXXX</code> o directamente en la tabla.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white"
              : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Clientes</span>
        </button>
      </div>

      {/* Tarjeta de Recarga Manual por Código BOT-IXXXXXX */}
      <div className={`mb-7 rounded-3xl p-6 border-2 shadow-lg ${
        isDark
          ? "bg-[#1E2229] border-emerald-500/35"
          : "bg-white border-emerald-500/40"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 mb-1.5">
              <Wallet className="w-3 h-3" />
              Recarga Manual por Código de Usuario
            </span>
            <h2 className="text-base sm:text-lg font-black">
              Acreditar Wallet ingresando el código <span className="font-mono text-[#229ED9]">BOT-IXXXXXX</span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              Escribe el código único del usuario (ej. <span className="font-mono font-bold">BOT-I482910</span>) y el monto en USD a recargar.
            </p>
          </div>

          <form onSubmit={handleRechargeByCode} className="flex-1 max-w-2xl space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5 relative">
                <Hash className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Código: BOT-I482910"
                  value={botCodeInput}
                  onChange={(e) => setBotCodeInput(e.target.value.toUpperCase())}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-mono font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                    isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                  }`}
                />
              </div>

              <div className="sm:col-span-3 relative">
                <span className="text-xs font-black text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  placeholder="Monto USD"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className={`w-full pl-7 pr-9 py-2.5 rounded-xl border text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                  }`}
                />
                <span className="text-[10px] font-bold text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2">USD</span>
              </div>

              <div className="sm:col-span-4">
                <button
                  type="submit"
                  disabled={rechargingByCode}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {rechargingByCode ? "Recargando..." : "⚡ Recargar por Código"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "+$1.25", val: "1.25" },
                { label: "+$3.00", val: "3.00" },
                { label: "+$7.00", val: "7.00" },
                { label: "+$13.50", val: "13.50" },
                { label: "+$24.00", val: "24.00" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setAmountInput(p.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    amountInput === p.val
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : isDark
                      ? "bg-[#171A20] text-neutral-300 border-[#2D3340]"
                      : "bg-neutral-100 text-neutral-700 border-neutral-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {rechargeMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rechargeMsg.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {rechargeMsg.type === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                )}
                <span>{rechargeMsg.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Buscador & Filtros */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código BOT-IXXXXXX, nombre, correo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
              isDark
                ? "bg-[#1E2229] border-[#2D3340] text-white placeholder:text-neutral-500"
                : "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
            }`}
          />
        </div>

        <div className={`text-xs font-bold ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
          {filteredUsers.length} usuario(s) encontrado(s)
        </div>
      </div>

      {/* Tabla Principal Adaptativa Claro/Oscuro */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${
        isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-extrabold uppercase tracking-wider text-[10px] border-b ${
              isDark ? "bg-[#171A20] text-neutral-400 border-[#2D3340]" : "bg-[#F8FAFC] text-neutral-500 border-neutral-200"
            }`}>
              <tr>
                <th className="px-5 py-4">Código BOT-I</th>
                <th className="px-5 py-4">Cliente / Cuenta</th>
                <th className="px-5 py-4">Saldo Wallet</th>
                <th className="px-5 py-4">Estado Vigencia</th>
                <th className="px-5 py-4">Cuentas TG</th>
                <th className="px-5 py-4 text-right">Acreditar Wallet USD</th>
                <th className="px-5 py-4 text-right">Recarga Directa Días</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-[#2D3340]" : "divide-neutral-100"}`}>
              {filteredUsers.map((u) => {
                const expiresAt = u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null;
                const isExpired = expiresAt ? new Date() > expiresAt : true;
                const daysLeft = expiresAt
                  ? Math.max(0, Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : 0;
                const walletNum = Number(u.walletBalance || 0);
                const code = u.botCode || "BOT-I000000";

                return (
                  <tr key={u.id} className={`transition-colors ${
                    isDark ? "hover:bg-[#252A34]/50" : "hover:bg-neutral-50/70"
                  }`}>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBotCodeInput(code);
                            handleCopyCode(code, u.id);
                          }}
                          title="Clic para copiar y rellenar en el recargador superior"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] font-mono font-black text-xs hover:bg-[#229ED9]/25 transition-all cursor-pointer"
                        >
                          <span>{code}</span>
                          {copiedId === u.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-70" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">
                          {u.storeName || u.name || "Sin nombre"}
                        </span>
                        {u.role === "SUPERADMIN" && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-400 text-[11px] font-mono mt-0.5">
                        {u.phoneNumber ? `${u.phoneNumber} • ` : ""}{u.email}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>${walletNum.toFixed(2)} USD</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        !isExpired
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${!isExpired ? "bg-emerald-400" : "bg-red-400"}`} />
                        {!isExpired ? `${daysLeft} día(s)` : "Expirada"}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold">
                      {u._count.telegramAccounts} TG / {u._count.campaigns} Camp.
                    </td>

                    {/* Botones de Recarga de Wallet USD */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleCreditWallet(u.id, 5)}
                          className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-lg transition-colors cursor-pointer"
                          title="Acreditar $5 USD en Wallet"
                        >
                          +$5
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleCreditWallet(u.id, 10)}
                          className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-lg transition-colors cursor-pointer"
                          title="Acreditar $10 USD en Wallet"
                        >
                          +$10
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleCustomWalletPrompt(u)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-colors shadow-sm cursor-pointer"
                          title="Ingresar otro monto en USD"
                        >
                          +$ Otro
                        </button>
                      </div>
                    </td>

                    {/* Botones de Recarga Directa de Días */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 1)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                            isDark
                              ? "bg-[#171A20] hover:bg-[#252A34] text-neutral-200 border-[#2D3340]"
                              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          +1d
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 7)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${
                            isDark
                              ? "bg-[#171A20] hover:bg-[#252A34] text-neutral-200 border-[#2D3340]"
                              : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          +7d
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleRechargeDays(u.id, 30)}
                          className="px-2.5 py-1.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                          +30d
                        </button>
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            u.isActive 
                              ? "text-neutral-400 hover:text-red-500 hover:bg-red-500/10" 
                              : "text-emerald-400 bg-emerald-500/20"
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
