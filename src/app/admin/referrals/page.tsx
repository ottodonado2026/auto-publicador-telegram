"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useTheme } from "@/context/ThemeContext";
import {
  Users, Award, Sparkles, TrendingUp, DollarSign,
  ShieldCheck, Clock, CheckCircle2, AlertCircle, Save,
  RefreshCw, ChevronRight, Layers, ArrowUpRight, Flame
} from "lucide-react";

interface ReferralConfigData {
  bronzeMinRefs: number;
  bronzePercent: number;
  silverMinRefs: number;
  silverPercent: number;
  goldMinRefs: number;
  goldPercent: number;
  retentionDays: number;
  isActive: boolean;
}

interface TopAffiliate {
  id: string;
  botCode: string | null;
  name: string | null;
  storeName: string | null;
  email: string | null;
  phoneNumber: string | null;
  totalRefs: number;
  totalEarnedUSD: number;
  totalReleasedUSD: number;
  totalPendingUSD: number;
  tier: {
    code: string;
    name: string;
    badge: string;
    percentage: number;
  };
}

interface RecentBonus {
  id: string;
  amountUSD: number;
  sourceTxAmount: number;
  status: string;
  releaseDate: string;
  createdAt: string;
  referrerName: string;
  referrerCode: string | null;
  referredName: string;
  referredCode: string | null;
}

export default function AdminReferralsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [config, setConfig] = useState<ReferralConfigData>({
    bronzeMinRefs: 1,
    bronzePercent: 10,
    silverMinRefs: 5,
    silverPercent: 15,
    goldMinRefs: 15,
    goldPercent: 20,
    retentionDays: 7,
    isActive: true,
  });

  const [stats, setStats] = useState({
    totalAffiliates: 0,
    totalReferredUsers: 0,
    globalPendingUSD: 0,
    globalReleasedUSD: 0,
    globalTotalBonusesUSD: 0,
  });

  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [recentBonuses, setRecentBonuses] = useState<RecentBonus[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/admin/referrals");
      if (!res.ok) throw new Error("Error al consultar datos de referidos");
      const json = await res.json();
      setConfig(json.config);
      setStats(json.stats);
      setTopAffiliates(json.topAffiliates || []);
      setRecentBonuses(json.recentBonuses || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar configuración");

      setSuccessMsg("¡Reglas y porcentajes actualizados con éxito!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const cardBg = isDark
    ? "bg-[#1E2229] border-[#2D3340]"
    : "bg-white border-neutral-300 shadow-sm";

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#13151A] text-white" : "bg-neutral-50 text-neutral-900"}`}>
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-x-hidden">
        {/* ENCABEZADO */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-400">
                Sistema de Crecimiento Viral
              </span>
            </div>
            <h1 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-neutral-900"}`}>
              Control de Referidos & Niveles de Afiliados
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Administra las comisiones por rangos (Bronce, Plata, Oro Embajador), los días de retención semanal de bonos y supervisa a los mejores promotores de tu plataforma.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
              isDark
                ? "bg-[#1E2229] border-[#2D3340] hover:bg-[#252A33] text-neutral-300"
                : "bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-700"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* FEEDBACK ALERTS */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MÉTRICAS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-bold">Clientes Invitados</span>
              <Users className="w-4 h-4 text-[#229ED9]" />
            </div>
            <div className="text-2xl font-black mt-2">{stats.totalReferredUsers}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Registrados mediante enlaces de referidos
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-bold">Afiliados Promotores</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black mt-2">{stats.totalAffiliates}</div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Clientes que tienen al menos 1 referido
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-bold">Bonos en Espera (7 Días)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              ${stats.globalPendingUSD.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Retención de seguridad activa
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-bold">Bonos Liberados en Wallets</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              ${stats.globalReleasedUSD.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Saldo acreditado para consumo interno
            </div>
          </div>
        </div>

        {/* CONFIGURADOR DE NIVELES & REGLAS */}
        <div className={`rounded-3xl p-6 sm:p-7 border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black">Configuración de Reglas, Rangos & Comisiones</h2>
          </div>
          <p className={`text-xs mb-6 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Personaliza el número de referidos requeridos para cada rango y el porcentaje (%) de bonificación acreditado en su Wallet tras recargar.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* RANGO BRONCE */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-amber-600/30" : "bg-amber-50/50 border-amber-300"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-amber-500 flex items-center gap-1.5">
                    🥉 Rango Bronce
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500">
                    Nivel Inicial
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.bronzeMinRefs}
                      onChange={(e) => setConfig({ ...config, bronzeMinRefs: parseInt(e.target.value) || 1 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Comisión por Pago (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        max={100}
                        value={config.bronzePercent}
                        onChange={(e) => setConfig({ ...config, bronzePercent: parseFloat(e.target.value) || 10 })}
                        className={`w-full px-3 py-2 pr-7 rounded-xl text-xs font-bold border ${
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RANGO PLATA */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-slate-500/30" : "bg-slate-50/50 border-slate-300"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-slate-400 flex items-center gap-1.5">
                    🥈 Rango Plata
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/15 text-slate-400">
                    Nivel Intermedio
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.silverMinRefs}
                      onChange={(e) => setConfig({ ...config, silverMinRefs: parseInt(e.target.value) || 5 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Comisión por Pago (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        max={100}
                        value={config.silverPercent}
                        onChange={(e) => setConfig({ ...config, silverPercent: parseFloat(e.target.value) || 15 })}
                        className={`w-full px-3 py-2 pr-7 rounded-xl text-xs font-bold border ${
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RANGO ORO EMBAJADOR */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-amber-400/40" : "bg-amber-100/30 border-amber-400"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                    🥇 Oro Embajador
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-400">
                    Nivel VIP Máximo
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.goldMinRefs}
                      onChange={(e) => setConfig({ ...config, goldMinRefs: parseInt(e.target.value) || 15 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Comisión por Pago (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={1}
                        max={100}
                        value={config.goldPercent}
                        onChange={(e) => setConfig({ ...config, goldPercent: parseFloat(e.target.value) || 20 })}
                        className={`w-full px-3 py-2 pr-7 rounded-xl text-xs font-bold border ${
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REGLAS COMPLEMENTARIAS: DÍAS DE RETENCIÓN */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-300"
            }`}>
              <div>
                <h4 className="text-xs font-black">Ciclo Semanal de Retención de Bonos (Días de Enfriamiento)</h4>
                <p className={`text-[11px] mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Tiempo que el saldo permanece en estado "PENDING" antes de liberarse a la Wallet del usuario para asegurar la integridad de la transacción.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-28">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={config.retentionDays}
                    onChange={(e) => setConfig({ ...config, retentionDays: parseInt(e.target.value) || 7 })}
                    className={`w-full px-3 py-2 pr-10 rounded-xl text-xs font-bold border text-center ${
                      isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-black"
                    }`}
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] font-bold text-neutral-400">días</span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Guardando..." : "Guardar Reglas"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* TABLA DE TOP AFILIADOS & PROMOTORES */}
        <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
          <div className="p-6 border-b border-neutral-700/20 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black">Tabla de Clientes Promotores & Embajadores</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Ranking ordenado por mayor cantidad de usuarios invitados que han traído a la plataforma.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#229ED9]/15 text-[#229ED9]">
              {topAffiliates.length} Afiliados Registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b text-[11px] font-black uppercase tracking-wider ${
                isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-400" : "bg-neutral-100 border-neutral-300 text-neutral-600"
              }`}>
                <tr>
                  <th className="px-6 py-3.5">Cliente / Negocio</th>
                  <th className="px-6 py-3.5">Código Bot</th>
                  <th className="px-6 py-3.5 text-center">Rango Actual</th>
                  <th className="px-6 py-3.5 text-center">Referidos</th>
                  <th className="px-6 py-3.5 text-right">Bonos en Espera</th>
                  <th className="px-6 py-3.5 text-right">Total Liberado</th>
                  <th className="px-6 py-3.5 text-right">Total Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/15">
                {topAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500 font-medium">
                      No hay afiliados registrados con referidos aún.
                    </td>
                  </tr>
                ) : (
                  topAffiliates.map((aff) => (
                    <tr key={aff.id} className={isDark ? "hover:bg-[#252A33]/50" : "hover:bg-neutral-50"}>
                      <td className="px-6 py-4 font-bold">
                        <div>{aff.storeName || aff.name || "Sin nombre"}</div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          {aff.phoneNumber || aff.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-[#229ED9]">
                        {aff.botCode || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                          aff.tier.code === "GOLD"
                            ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                            : aff.tier.code === "SILVER"
                            ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                            : "bg-amber-600/20 text-amber-500 border border-amber-600/30"
                        }`}>
                          {aff.tier.badge} ({aff.tier.percentage}%)
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-black">
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-400">
                          {aff.totalRefs} amigos
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold text-amber-400">
                        ${aff.totalPendingUSD.toFixed(2)} USD
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                        ${aff.totalReleasedUSD.toFixed(2)} USD
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-black text-white">
                        ${aff.totalEarnedUSD.toFixed(2)} USD
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* HISTORIAL RECIENTE DE BONIFICACIONES */}
        <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
          <div className="p-6 border-b border-neutral-700/20 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black">Últimas Bonificaciones de Referidos Generadas</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Registro cronológico de pagos de Binance Pay que han generado comisiones automáticas.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400">
              {recentBonuses.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b text-[11px] font-black uppercase tracking-wider ${
                isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-400" : "bg-neutral-100 border-neutral-300 text-neutral-600"
              }`}>
                <tr>
                  <th className="px-6 py-3.5">Fecha</th>
                  <th className="px-6 py-3.5">Beneficiario (Promotor)</th>
                  <th className="px-6 py-3.5">Cliente que Pagó</th>
                  <th className="px-6 py-3.5 text-right">Monto Pagado en Binance</th>
                  <th className="px-6 py-3.5 text-right">Comisión Wallet</th>
                  <th className="px-6 py-3.5 text-center">Estado</th>
                  <th className="px-6 py-3.5 text-center">Fecha de Liberación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/15">
                {recentBonuses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500 font-medium">
                      Aún no se han generado bonificaciones por recargas de referidos.
                    </td>
                  </tr>
                ) : (
                  recentBonuses.map((b) => {
                    const isPending = b.status === "PENDING";
                    return (
                      <tr key={b.id} className={isDark ? "hover:bg-[#252A33]/50" : "hover:bg-neutral-50"}>
                        <td className="px-6 py-4 font-mono text-[11px] text-neutral-400">
                          {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="px-6 py-4 font-bold">
                          <div>{b.referrerName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{b.referrerCode}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div>{b.referredName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{b.referredCode}</div>
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-bold">
                          ${b.sourceTxAmount.toFixed(2)} USDT
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">
                          +${b.amountUSD.toFixed(2)} USD
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPending
                              ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                              : "bg-emerald-400/15 text-emerald-400 border border-emerald-400/30"
                          }`}>
                            {isPending ? "En Espera (7d)" : "Liberado"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center font-mono text-[11px] text-neutral-400">
                          {new Date(b.releaseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
