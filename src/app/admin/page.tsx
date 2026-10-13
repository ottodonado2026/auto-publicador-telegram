"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Activity, ShieldCheck, Send, ArrowUpRight, 
  RefreshCw, BookOpen, Wallet, CheckCircle2, AlertCircle, Hash
} from "lucide-react";

interface StatsData {
  totalUsers: number;
  activeSubscriptions: number;
  totalTelegrams: number;
  totalCampaigns: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Recarga rápida por código BOT-IXXXXXX
  const [botCodeInput, setBotCodeInput] = useState("");
  const [amountInput, setAmountInput] = useState("7.00");
  const [recharging, setRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
      setRechargeMsg({ type: "err", text: "Ingresa un monto en USD mayor a 0." });
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
        throw new Error(data.error || "Error al recargar Wallet");
      }

      const u = data.user;
      setRechargeMsg({
        type: "ok",
        text: `¡Recarga exitosa! +$${numAmount.toFixed(2)} USD acreditados a ${u?.storeName || u?.name || u?.email} (${u?.botCode}). Nuevo saldo Wallet: $${Number(u?.walletBalance || 0).toFixed(2)} USD.`,
      });
      setBotCodeInput("");
      fetchStats();
    } catch (err: any) {
      setRechargeMsg({ type: "err", text: err.message || "Error al acreditar saldo" });
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      {/* Header Superior del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Resumen Operativo & Recarga Manual
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Métricas de facturación, recarga de Wallet por código BOT-IXXXXXX y actividad en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-300 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* MÓDULO DESTACADO: RECARGAR WALLET POR CÓDIGO BOT-IXXXXXX */}
      <div className="mb-8 bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/30 shadow-[0_8px_24px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[11px] font-black uppercase tracking-wider mb-2.5 border border-emerald-500/30">
              <Wallet className="w-3.5 h-3.5" />
              Recarga Instantánea de Wallet por Código
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A]">
              Acreditar Saldo USD con Código Único (<span className="font-mono text-[#229ED9]">BOT-IXXXXXX</span>)
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Pídele al cliente su código único que aparece en la sección <strong>Mi Perfil</strong> de su portal (ej. <code className="font-mono font-bold text-neutral-700">BOT-I482910</code>) para recargar su Wallet al instante.
            </p>
          </div>

          <form onSubmit={handleRechargeByCode} className="flex-1 max-w-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 relative">
                <Hash className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ej: BOT-I482910"
                  value={botCodeInput}
                  onChange={(e) => setBotCodeInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-black uppercase tracking-wider text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9]"
                />
              </div>

              <div className="sm:col-span-3 relative">
                <span className="text-xs font-black text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  required
                  placeholder="Monto USD"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-7 pr-10 py-2.5 rounded-xl border border-neutral-300 text-xs font-mono font-black text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <span className="text-[10px] font-bold text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2">USD</span>
              </div>

              <div className="sm:col-span-4">
                <button
                  type="submit"
                  disabled={recharging}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {recharging ? "Acreditando..." : "⚡ Recargar Wallet"}
                </button>
              </div>
            </div>

            {/* Botones rápidos de planes */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-neutral-400 mr-1">Montos rápidos:</span>
              {[
                { label: "+$1.25 (Express)", val: "1.25" },
                { label: "+$3.00 (Cuenta Extra)", val: "3.00" },
                { label: "+$7.00 (Semanal)", val: "7.00" },
                { label: "+$13.50 (Quincenal)", val: "13.50" },
                { label: "+$24.00 (Mensual)", val: "24.00" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setAmountInput(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    amountInput === preset.val
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {rechargeMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  rechargeMsg.type === "ok"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {rechargeMsg.type === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                )}
                <span>{rechargeMsg.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Clientes Totales</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#229ED9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalUsers ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Registrados con código BOT-I
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Membresías Activas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {stats?.activeSubscriptions ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Planes activos 24/7
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cuentas Telegram</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#229ED9] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalTelegrams ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Protocolo MTProto GramJS
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Campañas Globales</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalCampaigns ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Envíos automáticos a grupos
          </div>
        </div>
      </div>

      {/* Módulos de Acceso Rápido y Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-7 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#229ED9] text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-[#229ED9]"></span>
              Paso Prioritario
            </div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Vincular Cuenta de Telegram de Granja
            </h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-lg">
              Conecta la cuenta matriz de Telegram por protocolo MTProto para respaldar los envíos automáticos en grupos las 24 horas.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 font-medium">
              Estado: <span className="text-emerald-600 font-semibold">Operativo</span>
            </div>
            <Link
              href="/admin/telegram"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <span>Configurar Cuenta de Telegram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Manual del SuperAdmin
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Aprende cómo recargar la Wallet por código BOT-IXXXXXX, supervisar sesiones y gestionar planes.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <Link
              href="/admin/guide"
              className="text-xs font-bold text-[#229ED9] hover:underline inline-flex items-center gap-1"
            >
              <span>Abrir Manual Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
