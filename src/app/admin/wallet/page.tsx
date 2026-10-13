"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  Wallet, Hash, CheckCircle2, AlertCircle, RefreshCw, Search,
  Copy, Check, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight
} from "lucide-react";

export default function AdminWalletRechargePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [botCodeInput, setBotCodeInput] = useState("");
  const [amountInput, setAmountInput] = useState("7.00");
  const [recharging, setRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTransactions(data.recentWalletTransactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
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
      setRecharging(true);
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
        throw new Error(data.error || "Error al recargar Wallet por código");
      }

      const u = data.user;
      setRechargeMsg({
        type: "ok",
        text: `¡Recarga exitosa! +$${numAmount.toFixed(2)} USD acreditados a ${
          u?.storeName || u?.name || u?.email
        } (${u?.botCode}). Nuevo saldo disponible en su Wallet: $${Number(
          u?.walletBalance || 0
        ).toFixed(2)} USD.`,
      });
      setBotCodeInput("");
      fetchWalletData();
    } catch (err: any) {
      setRechargeMsg({ type: "err", text: err.message || "Error al acreditar saldo" });
    } finally {
      setRecharging(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.botCode && u.botCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.storeName && u.storeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm))
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Recargar Wallet por Código Único (BOT-IXXXXXX)
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Módulo exclusivo para acreditar saldo en USD a la billetera de cualquier usuario usando su código de perfil.
          </p>
        </div>

        <button
          onClick={fetchWalletData}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white"
              : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white shadow-xs"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Saldos</span>
        </button>
      </div>

      {/* TARJETA PRINCIPAL DE RECARGA POR CÓDIGO BOT-IXXXXXX */}
      <div
        className={`mb-8 rounded-3xl p-6 sm:p-8 border-2 shadow-xl ${
          isDark
            ? "bg-[#1B1F27] border-emerald-500/40"
            : "bg-[#F4F6F9] border-emerald-500/40"
        }`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          <div className="xl:col-span-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
              <Wallet className="w-3.5 h-3.5" />
              Acreditación Directa de Billetera
            </span>
            <h2 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
              Ingresa el Código <span className="font-mono text-[#229ED9]">BOT-IXXXXXX</span>
            </h2>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              El cliente encuentra su código único dentro de la sección <strong>Mi Perfil & Telegram</strong> de su portal. También puedes hacer clic sobre cualquier código de la lista inferior para rellenarlo automáticamente.
            </p>
          </div>

          <form onSubmit={handleRechargeByCode} className="xl:col-span-7 space-y-3">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="relative flex-shrink-0 w-full sm:w-52">
                <Hash className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej: BOT-I129849"
                  value={botCodeInput}
                  onChange={(e) => setBotCodeInput(e.target.value.toUpperCase())}
                  className={`w-full pl-9 pr-3 py-3 rounded-xl border text-xs font-mono font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                    isDark
                      ? "bg-[#13161C] border-[#2D3340] text-white placeholder:text-neutral-500"
                      : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>

              <div className="relative flex-shrink-0 w-full sm:w-36">
                <span className="text-xs font-black text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  placeholder="Monto USD"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className={`w-full pl-7 pr-10 py-3 rounded-xl border text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                    isDark
                      ? "bg-[#13161C] border-[#2D3340] text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <span className="text-[10px] font-bold text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2">
                  USD
                </span>
              </div>

              <button
                type="submit"
                disabled={recharging}
                className="flex-shrink-0 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {recharging ? "Acreditando..." : "⚡ Acreditar Saldo Ahora"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold mr-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                Montos de planes:
              </span>
              {[
                { label: "+$1.50 (Express 1d)", val: "1.50" },
                { label: "+$3.00 (Cuenta Extra)", val: "3.00" },
                { label: "+$7.00 (Semanal 7d)", val: "7.00" },
                { label: "+$13.50 (Quincenal 15d)", val: "13.50" },
                { label: "+$24.00 (Mensual 30d)", val: "24.00" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setAmountInput(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    amountInput === preset.val
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : isDark
                      ? "bg-[#13161C] text-neutral-300 border-[#2D3340] hover:border-emerald-500/40"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {rechargeMsg && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rechargeMsg.type === "ok"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/15 border-red-500/30 text-red-400"
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

      {/* GRID INFERIOR: DIRECTORIO DE CÓDIGOS BOT-I (PAGINADO CADA 10) + HISTORIAL REAL DE WALLET */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Directorio de Clientes con su Código BOT-I */}
        <div
          className={`xl:col-span-7 rounded-3xl p-6 border shadow-xl ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className={`text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                Directorio de Códigos de Usuario ({filteredUsers.length})
              </h3>
              <p className={`text-[11px] ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                Haz clic en cualquier código <code className="font-mono text-[#229ED9]">BOT-I</code> para seleccionarlo arriba.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar código, nombre o correo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? "bg-[#13161C] border-[#2D3340] text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            {currentUsers.map((u) => {
              const code = u.botCode || "BOT-I000000";
              return (
                <div
                  key={u.id}
                  onClick={() => setBotCodeInput(code)}
                  className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all ${
                    botCodeInput === code
                      ? "bg-[#229ED9]/15 border-[#229ED9]"
                      : isDark
                      ? "bg-[#13161C] border-[#282E3B] hover:border-[#229ED9]/50"
                      : "bg-white border-slate-200 hover:border-[#229ED9]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBotCodeInput(code);
                        navigator.clipboard.writeText(code);
                        setCopiedId(u.id);
                        setTimeout(() => setCopiedId(null), 1800);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/35 text-[#229ED9] font-mono font-black text-xs flex-shrink-0 cursor-pointer"
                    >
                      <span>{code}</span>
                      {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>

                    <div className="min-w-0">
                      <div className={`text-xs font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {u.storeName || u.name || "Usuario"}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {u.email} {u.phoneNumber ? `• ${u.phoneNumber}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs">
                      Wallet: ${Number(u.walletBalance || 0).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación cada 10 usuarios */}
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-neutral-500/20 flex items-center justify-between text-xs font-bold">
              <span className={isDark ? "text-neutral-400" : "text-slate-500"}>
                Página {page} de {totalPages} ({filteredUsers.length} usuarios)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                    isDark ? "bg-[#13161C] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                    isDark ? "bg-[#13161C] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"
                  }`}
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial Real de Movimientos de Wallet */}
        <div
          className={`xl:col-span-5 rounded-3xl p-6 border shadow-xl ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <h3 className={`text-base font-black mb-1 ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Últimos Movimientos Reales de Wallet
          </h3>
          <p className={`text-[11px] mb-4 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            Registro en tiempo real de recargas acreditadas y compras de planes.
          </p>

          <div className="space-y-2.5">
            {transactions.slice(0, 10).map((tx) => {
              const isCredit = tx.type === "CREDIT";
              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-sky-500/15 text-[#229ED9]"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {tx.user?.storeName || tx.user?.name || tx.user?.email || "Cliente"}{" "}
                        {tx.user?.botCode && (
                          <span className="font-mono text-[10px] text-[#229ED9]">({tx.user.botCode})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">{tx.description}</div>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-black whitespace-nowrap ${
                      isCredit ? "text-emerald-400" : "text-sky-400"
                    }`}
                  >
                    {isCredit ? "+" : "-"}${Number(tx.amount || 0).toFixed(2)} USD
                  </span>
                </div>
              );
            })}

            {transactions.length === 0 && !loading && (
              <div className="p-8 text-center text-xs text-neutral-400">
                Aún no hay transacciones registradas en la Wallet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
