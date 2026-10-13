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

  // Selector de tablas independientes: "PROMOTERS" vs "BONUSES"
  const [activeTableTab, setActiveTableTab] = useState<"PROMOTERS" | "BONUSES">("PROMOTERS");

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
    : "bg-white border-slate-300 shadow-sm";

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#13151A] text-white" : "bg-[#F1F5F9] text-slate-900"}`}>
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-x-hidden">
        {/* ENCABEZADO CON BOTONES DE TABLAS INDEPENDIENTES Y REFRESCAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isDark ? "bg-purple-500/15 border-purple-500/30 text-purple-400" : "bg-purple-100 border-purple-300 text-purple-800"
              }`}>
                Sistema de Crecimiento Viral
              </span>
            </div>
            <h1 className={`text-2xl sm:text-[28px] font-black mt-1 ${isDark ? "text-white" : "text-slate-950"}`}>
              Control de Referidos & Niveles de Afiliados
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              Administra las comisiones por rangos (Bronce, Plata, Oro Embajador), los días de retención semanal de bonos y supervisa a los mejores promotores de tu plataforma.
            </p>
          </div>

          {/* BOTONES ALINEADOS: SELECTOR DE TABLAS + REFRESCAR */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-slate-300 shadow-xs"
            }`}>
              <button
                type="button"
                onClick={() => setActiveTableTab("PROMOTERS")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTableTab === "PROMOTERS"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tabla de Clientes Promotores ({topAffiliates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTableTab("BONUSES")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTableTab === "BONUSES"
                    ? "bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/30"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Últimas Bonificaciones ({recentBonuses.length})</span>
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? "bg-[#1E2229] border-[#2D3340] hover:bg-[#252A33] text-neutral-300"
                  : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-xs"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MÉTRICAS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className={`flex items-center justify-between text-xs font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              <span>Clientes Invitados</span>
              <Users className="w-4 h-4 text-[#229ED9]" />
            </div>
            <div className={`text-2xl font-black mt-2 font-mono ${isDark ? "text-white" : "text-slate-950"}`}>
              {stats.totalReferredUsers}
            </div>
            <div className={`text-[11px] mt-1 font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
              Registrados mediante enlaces de referidos
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className={`flex items-center justify-between text-xs font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              <span>Afiliados Promotores</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className={`text-2xl font-black mt-2 font-mono ${isDark ? "text-white" : "text-slate-950"}`}>
              {stats.totalAffiliates}
            </div>
            <div className={`text-[11px] mt-1 font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
              Clientes que tienen al menos 1 referido
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-xs font-bold text-amber-500">
              <span>Bonos en Espera ({config.retentionDays} Días)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-500 font-mono mt-2">
              ${stats.globalPendingUSD.toFixed(2)} USD
            </div>
            <div className={`text-[11px] mt-1 font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
              Retención de seguridad activa
            </div>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
              <span>Bonos Liberados en Wallets</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-500 font-mono mt-2">
              ${stats.globalReleasedUSD.toFixed(2)} USD
            </div>
            <div className={`text-[11px] mt-1 font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
              Saldo acreditado para consumo interno
            </div>
          </div>
        </div>

        {/* CONFIGURADOR DE NIVELES & REGLAS */}
        <div className={`rounded-3xl p-6 sm:p-7 border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-500" />
            <h2 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-950"}`}>
              Configuración de Reglas, Rangos & Comisiones
            </h2>
          </div>
          <p className={`text-xs sm:text-sm mb-6 font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Personaliza el número de referidos requeridos para cada rango y el porcentaje (%) de bonificación acreditado en su Wallet tras recargar.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* RANGO BRONCE */}
              <div className={`p-5 rounded-2xl border-2 ${
                isDark ? "bg-[#171A20] border-amber-600/30" : "bg-amber-50/60 border-amber-300"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black flex items-center gap-1.5 ${isDark ? "text-amber-500" : "text-amber-900"}`}>
                    🥉 Rango Bronce
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDark ? "bg-amber-500/15 text-amber-500 border-amber-500/30" : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}>
                    Nivel Inicial
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.bronzeMinRefs}
                      onChange={(e) => setConfig({ ...config, bronzeMinRefs: parseInt(e.target.value) || 1 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
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
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RANGO PLATA */}
              <div className={`p-5 rounded-2xl border-2 ${
                isDark ? "bg-[#171A20] border-slate-500/30" : "bg-slate-50 border-slate-300"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-900"}`}>
                    🥈 Rango Plata
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDark ? "bg-slate-500/15 text-slate-300 border-slate-500/30" : "bg-slate-200 text-slate-800 border-slate-300"
                  }`}>
                    Nivel Intermedio
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.silverMinRefs}
                      onChange={(e) => setConfig({ ...config, silverMinRefs: parseInt(e.target.value) || 5 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
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
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RANGO ORO EMBAJADOR */}
              <div className={`p-5 rounded-2xl border-2 ${
                isDark ? "bg-[#171A20] border-amber-400/40" : "bg-amber-100/40 border-amber-400"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black flex items-center gap-1.5 ${isDark ? "text-amber-400" : "text-amber-900"}`}>
                    🥇 Oro Embajador
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDark ? "bg-amber-400/20 text-amber-400 border-amber-400/30" : "bg-amber-100 text-amber-900 border-amber-400"
                  }`}>
                    Nivel VIP Máximo
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
                      Mínimo de Referidos Activos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.goldMinRefs}
                      onChange={(e) => setConfig({ ...config, goldMinRefs: parseInt(e.target.value) || 15 })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                        isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold mb-1 ${isDark ? "text-neutral-400" : "text-slate-700"}`}>
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
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
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
              isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-slate-50 border-slate-300"
            }`}>
              <div>
                <h4 className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  Ciclo Semanal de Retención de Bonos (Días de Enfriamiento)
                </h4>
                <p className={`text-[11px] mt-0.5 font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
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
                      isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-slate-300 text-black"
                    }`}
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] font-bold text-neutral-400">días</span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Guardando..." : "Guardar Reglas"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* TABLA INDEPENDIENTE 1: TABLA DE CLIENTES PROMOTORES & EMBAJADORES */}
        {activeTableTab === "PROMOTERS" && (
          <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? "border-neutral-700/20" : "border-slate-200"
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                    Tabla de Clientes Promotores & Embajadores
                  </h3>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Ranking ordenado por mayor cantidad de usuarios invitados que han traído a la plataforma.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                isDark ? "bg-purple-500/15 text-purple-400" : "bg-purple-100 text-purple-800"
              }`}>
                {topAffiliates.length} Afiliados Registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b text-[11px] font-black uppercase tracking-wider ${
                  isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-400" : "bg-slate-100 border-slate-300 text-slate-700"
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
                <tbody className="divide-y divide-neutral-700/15 dark:divide-neutral-700/15 divide-slate-200">
                  {topAffiliates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`px-6 py-8 text-center font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                        No hay afiliados registrados con referidos aún.
                      </td>
                    </tr>
                  ) : (
                    topAffiliates.map((aff) => (
                      <tr key={aff.id} className={isDark ? "hover:bg-[#252A33]/50" : "hover:bg-slate-50"}>
                        <td className="px-6 py-4 font-bold">
                          <div className={isDark ? "text-white" : "text-slate-900"}>{aff.storeName || aff.name || "Sin nombre"}</div>
                          <div className={`text-[10px] font-normal ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                            {aff.phoneNumber || aff.email}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-[#229ED9]">
                          {aff.botCode || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            aff.tier.code === "GOLD"
                              ? isDark
                                ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                                : "bg-amber-100 text-amber-900 border-amber-400"
                              : aff.tier.code === "SILVER"
                              ? isDark
                                ? "bg-slate-400/20 text-slate-300 border-slate-400/30"
                                : "bg-slate-200 text-slate-900 border-slate-400"
                              : isDark
                              ? "bg-amber-600/20 text-amber-500 border-amber-600/30"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}>
                            {aff.tier.badge} ({aff.tier.percentage}%)
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center font-black">
                          <span className={`px-2.5 py-1 rounded-xl ${
                            isDark ? "bg-purple-500/15 text-purple-400" : "bg-purple-100 text-purple-800"
                          }`}>
                            {aff.totalRefs} amigos
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-bold text-amber-500">
                          ${aff.totalPendingUSD.toFixed(2)} USD
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-500">
                          ${aff.totalReleasedUSD.toFixed(2)} USD
                        </td>

                        <td className={`px-6 py-4 text-right font-mono font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                          ${aff.totalEarnedUSD.toFixed(2)} USD
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA INDEPENDIENTE 2: ÚLTIMAS BONIFICACIONES GENERADAS */}
        {activeTableTab === "BONUSES" && (
          <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? "border-neutral-700/20" : "border-slate-200"
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                    Últimas Bonificaciones de Referidos Generadas
                  </h3>
                </div>
                <p className={`text-xs mt-0.5 font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Registro cronológico de pagos de Binance Pay que han generado comisiones automáticas.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-800"
              }`}>
                {recentBonuses.length} Registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b text-[11px] font-black uppercase tracking-wider ${
                  isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-400" : "bg-slate-100 border-slate-300 text-slate-700"
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
                <tbody className="divide-y divide-neutral-700/15 dark:divide-neutral-700/15 divide-slate-200">
                  {recentBonuses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`px-6 py-8 text-center font-medium ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                        Aún no se han generado bonificaciones por recargas de referidos.
                      </td>
                    </tr>
                  ) : (
                    recentBonuses.map((b) => {
                      const isPending = b.status === "PENDING";
                      return (
                        <tr key={b.id} className={isDark ? "hover:bg-[#252A33]/50" : "hover:bg-slate-50"}>
                          <td className={`px-6 py-4 font-mono text-[11px] ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                            {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          <td className="px-6 py-4 font-bold">
                            <div className={isDark ? "text-white" : "text-slate-900"}>{b.referrerName}</div>
                            <div className="text-[10px] text-[#229ED9] font-mono">{b.referrerCode}</div>
                          </td>

                          <td className="px-6 py-4">
                            <div className={isDark ? "text-white" : "text-slate-900"}>{b.referredName}</div>
                            <div className={`text-[10px] font-mono ${isDark ? "text-neutral-500" : "text-slate-500"}`}>{b.referredCode}</div>
                          </td>

                          <td className="px-6 py-4 text-right font-mono font-bold">
                            ${b.sourceTxAmount.toFixed(2)} USDT
                          </td>

                          <td className="px-6 py-4 text-right font-mono font-black text-emerald-500">
                            +${b.amountUSD.toFixed(2)} USD
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isPending
                                ? isDark
                                  ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                                  : "bg-amber-100 text-amber-800 border-amber-300"
                                : isDark
                                ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/30"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}>
                              {isPending ? `En Espera (${config.retentionDays}d)` : "Liberado"}
                            </span>
                          </td>

                          <td className={`px-6 py-4 text-center font-mono text-[11px] ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
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
        )}
      </main>
    </div>
  );
}
