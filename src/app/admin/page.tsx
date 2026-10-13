"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
  Users, Activity, ShieldCheck, Send, ArrowUpRight,
  RefreshCw, BookOpen, DollarSign, TrendingUp, Globe,
  Wallet, Layers, CheckCircle2, Eye, Award, Calendar
} from "lucide-react";

const ADMIN_CURRENCIES = [
  { code: "USD", symbol: "$", name: "USD - Dólares", rate: 1, decimals: 2 },
  { code: "COP", symbol: "$", name: "COP - Pesos Colombianos", rate: 4150, decimals: 0 },
  { code: "EUR", symbol: "€", name: "EUR - Euros", rate: 0.92, decimals: 2 },
  { code: "MXN", symbol: "$", name: "MXN - Pesos Mexicanos", rate: 19.8, decimals: 2 },
  { code: "ARS", symbol: "$", name: "ARS - Pesos Argentinos", rate: 1180, decimals: 0 },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [telegramAccounts, setTelegramAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencyCode, setCurrencyCode] = useState("USD");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setStats(data.stats || null);
      setUsers(data.users || []);
      setTelegramAccounts(data.telegramAccounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const curr = ADMIN_CURRENCIES.find((c) => c.code === currencyCode) || ADMIN_CURRENCIES[0];

  const formatMoney = (usdVal: number) => {
    const val = Number(usdVal || 0) * curr.rate;
    const formatted =
      curr.decimals === 0 ? Math.round(val).toLocaleString("es-CO") : val.toFixed(2);
    return `${curr.symbol}${formatted} ${curr.code}`;
  };

  const farmAccounts = telegramAccounts.filter((a) => a.isSystemAccount);
  const clientAccounts = telegramAccounts.filter((a) => !a.isSystemAccount);

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto space-y-7">
      {/* HEADER SUPERIOR CON SELECTOR DE MONEDA (USD / COP / EUR) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-[10px] font-black uppercase tracking-wider mb-2">
            <span>Panel Principal SuperAdmin • Datos 100% Reales en Vivo</span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isDark ? "text-white" : "text-[#0F172A]"
            }`}
          >
            Resumen General, Reporte de Ventas & Analítica
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Control financiero en tiempo real, visitas a tu Landing Page, registros de clientes, ingresos por membresía y estado de tu granja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Moneda USD / COP */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className={`text-[11px] font-black ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
              Moneda:
            </span>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className={`text-xs font-black rounded-lg px-2 py-1 cursor-pointer focus:outline-none ${
                isDark ? "bg-[#13161C] text-emerald-400" : "bg-white text-emerald-700"
              }`}
            >
              {ADMIN_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "bg-[#1B1F27] border-[#2B313F] text-neutral-200 hover:text-white"
                : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white shadow-xs"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </div>

      {/* BLOQUE 1: REPORTE FINANCIERO DE VENTAS REALES (HOY, AYER, ESTE MES, MES PASADO, TOTAL) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
            <TrendingUp className="w-4 h-4" />
            Reporte de Ventas e Ingresos Reales ({curr.code})
          </h2>
          <Link
            href="/admin/wallet"
            className="text-xs font-black text-[#229ED9] hover:underline flex items-center gap-1"
          >
            <span>Ir a Recargar Wallet por Código BOT-I</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Generado Hoy",
              val: stats?.revenue?.todayUSD ?? 0,
              sub: "Ingresos acreditados hoy",
              accent: "text-emerald-400",
            },
            {
              label: "Generado Ayer",
              val: stats?.revenue?.yesterdayUSD ?? 0,
              sub: "Cierre del día anterior",
              accent: isDark ? "text-white" : "text-slate-900",
            },
            {
              label: "Generado Este Mes",
              val: stats?.revenue?.thisMonthUSD ?? 0,
              sub: "Acumulado del mes actual",
              accent: "text-[#229ED9]",
            },
            {
              label: "Generado Mes Pasado",
              val: stats?.revenue?.lastMonthUSD ?? 0,
              sub: "Total facturado mes anterior",
              accent: isDark ? "text-neutral-200" : "text-slate-800",
            },
            {
              label: "Total Histórico Generado",
              val: stats?.revenue?.totalUSD ?? 0,
              sub: "Ingresos globales reales",
              accent: "text-emerald-400",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border shadow-md ${
                isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
              }`}
            >
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                {item.label}
              </div>
              <div className={`text-xl sm:text-2xl font-black font-mono mt-2 ${item.accent}`}>
                {formatMoney(item.val)}
              </div>
              {currencyCode !== "USD" && (
                <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                  (${Number(item.val || 0).toFixed(2)} USD)
                </div>
              )}
              <div className="text-[11px] text-neutral-400 mt-1.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOQUE 2: TRÁFICO DE LA LANDING PAGE & REGISTROS DE USUARIOS REALES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Visitas Reales a la Landing Page */}
        <div
          className={`rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                  Visitas Reales a tu Landing Page
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Cuántas personas han entrado a ver tu página comercial
                </p>
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-xs font-black hover:bg-[#229ED9]/25 transition-all flex items-center gap-1"
            >
              <span>Ver Landing</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Hoy", val: stats?.landingVisits?.today ?? 0 },
              { label: "Ayer", val: stats?.landingVisits?.yesterday ?? 0 },
              { label: "Este Mes", val: stats?.landingVisits?.thisMonth ?? 0 },
              { label: "Mes Pasado", val: stats?.landingVisits?.lastMonth ?? 0 },
              { label: "Total Visitas", val: stats?.landingVisits?.total ?? 0 },
            ].map((v, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border text-center ${
                  isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-neutral-400">{v.label}</div>
                <div className="text-xl font-black font-mono text-[#229ED9] mt-1">{v.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Usuarios Registrados por Fecha + Estado General */}
        <div
          className={`rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                  Nuevos Usuarios Registrados & Membresías
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Clientes registrados hoy, ayer, este mes y el mes pasado
                </p>
              </div>
            </div>

            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black hover:bg-emerald-500/25 transition-all flex items-center gap-1"
            >
              <span>Ver Clientes ({stats?.totalUsers ?? 0})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Reg. Hoy", val: stats?.registrations?.today ?? 0, color: "text-emerald-400" },
              { label: "Reg. Ayer", val: stats?.registrations?.yesterday ?? 0, color: isDark ? "text-white" : "text-slate-900" },
              { label: "Este Mes", val: stats?.registrations?.thisMonth ?? 0, color: "text-[#229ED9]" },
              { label: "Mes Pasado", val: stats?.registrations?.lastMonth ?? 0, color: isDark ? "text-neutral-300" : "text-slate-700" },
              { label: "Activos 24/7", val: stats?.activeSubscriptions ?? 0, color: "text-emerald-400" },
            ].map((r, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border text-center ${
                  isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-neutral-400">{r.label}</div>
                <div className={`text-xl font-black font-mono mt-1 ${r.color}`}>{r.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE 3: CUÁNTO HAS GENERADO DE CADA MEMBRESÍA + CUÁNTO HA GENERADO CADA USUARIO */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Ingresos por cada Tipo de Membresía */}
        <div
          className={`xl:col-span-5 rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                Generado por Tipo de Membresía
              </h3>
              <p className="text-[11px] text-neutral-400">
                Desglose real de ventas por cada plan y cuentas adicionales
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                name: "Pase Express (1 Día • $1.25 USD)",
                count: stats?.planBreakdown?.express1d?.count ?? 0,
                rev: stats?.planBreakdown?.express1d?.revenueUSD ?? 0,
              },
              {
                name: "Plan Semanal (7 Días • $7.00 USD)",
                count: stats?.planBreakdown?.semanal7d?.count ?? 0,
                rev: stats?.planBreakdown?.semanal7d?.revenueUSD ?? 0,
              },
              {
                name: "Plan Quincenal PRO (15 Días • $13.50 USD)",
                count: stats?.planBreakdown?.quincenal15d?.count ?? 0,
                rev: stats?.planBreakdown?.quincenal15d?.revenueUSD ?? 0,
              },
              {
                name: "Plan Mensual Élite (30 Días • $24.00 USD)",
                count: stats?.planBreakdown?.mensual30d?.count ?? 0,
                rev: stats?.planBreakdown?.mensual30d?.revenueUSD ?? 0,
              },
              {
                name: "Cuentas Adicionales TG (+$3.00 USD)",
                count: stats?.planBreakdown?.extraAccounts?.count ?? 0,
                rev: stats?.planBreakdown?.extraAccounts?.revenueUSD ?? 0,
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <div className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}>{p.name}</div>
                  <div className="text-[11px] text-neutral-400">{p.count} activación(es) registrada(s)</div>
                </div>
                <div className="text-right font-mono font-black text-emerald-400">
                  {formatMoney(p.rev)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cuánto ha generado cada usuario registrado */}
        <div
          className={`xl:col-span-7 rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                Ingresos Generados por Cada Usuario
              </h3>
              <p className="text-[11px] text-neutral-400">
                Cuánto te ha generado cada cliente, su membresía actual y su saldo en Wallet
              </p>
            </div>
            <Link href="/admin/users" className="text-xs font-black text-[#229ED9] hover:underline">
              Ver Todos →
            </Link>
          </div>

          <div className="space-y-2.5">
            {users.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2.5 py-1 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/35 text-[#229ED9] font-mono font-black text-[11px]">
                    {u.botCode || "BOT-I"}
                  </span>
                  <div className="min-w-0">
                    <div className={`font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {u.storeName || u.name || "Cliente"}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {u.planName} • {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-neutral-400 block">Wallet Actual</span>
                    <span className="font-mono font-bold text-sky-400">
                      ${Number(u.walletBalance || 0).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-neutral-500/20">
                    <span className="text-[10px] font-bold text-neutral-400 block">Generado por Usuario</span>
                    <span className="font-mono font-black text-emerald-400">
                      {formatMoney(u.totalGeneratedUSD || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE 4: MIS CUENTAS VINCULADAS (GRANJA & CLIENTES) + MANUAL DEL SUPERADMIN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cuentas de Telegram Vinculadas */}
        <div
          className={`lg:col-span-8 rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                  Cuentas de Telegram Vinculadas ({telegramAccounts.length} Totales)
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {farmAccounts.length} cuenta(s) en tu Flota/Granja • {clientAccounts.length} cuenta(s) propias de clientes • {stats?.totalMessagesSent ?? 0} envíos totales reales
                </p>
              </div>
            </div>

            <Link
              href="/admin/telegram"
              className="px-3.5 py-2 rounded-xl bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center gap-1.5"
            >
              <span>Administrar Granja</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {telegramAccounts.map((acc) => (
              <div
                key={acc.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  isDark ? "bg-[#13161C] border-[#282E3B]" : "bg-white border-slate-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-black truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {acc.firstName || "Telegram"} {acc.username ? `(@${acc.username})` : ""}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        acc.isSystemAccount
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-sky-500/20 text-[#229ED9] border border-[#229ED9]/30"
                      }`}
                    >
                      {acc.isSystemAccount ? "MI GRANJA" : "CLIENTE"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 mt-0.5 truncate">
                    {acc.phoneNumber} • {acc.user?.storeName || acc.user?.email}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                    acc.status === "CONNECTED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  ● {acc.status === "CONNECTED" ? "Conectada" : acc.status}
                </span>
              </div>
            ))}

            {telegramAccounts.length === 0 && !loading && (
              <div className="col-span-2 p-6 text-center text-xs text-neutral-400">
                No hay cuentas de Telegram vinculadas todavía.
              </div>
            )}
          </div>
        </div>

        {/* Manual del SuperAdmin */}
        <div
          className={`lg:col-span-4 rounded-3xl p-6 border shadow-lg flex flex-col justify-between ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div>
            <div className="w-11 h-11 rounded-2xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
              Manual Operativo del SuperAdmin
            </h3>
            <p className={`text-xs mt-2 leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              Guía completa sobre cómo operar tu Granja MTProto, recargar Wallets mediante el código único <code className="font-mono text-[#229ED9]">BOT-IXXXXXX</code>, supervisar el cobro automático diario de Wallet y promocionar OttBot en los grupos recolectados.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-500/20 flex items-center justify-between">
            <Link
              href="/admin/guide"
              className="w-full py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black text-center flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Abrir Manual del SuperAdmin</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
