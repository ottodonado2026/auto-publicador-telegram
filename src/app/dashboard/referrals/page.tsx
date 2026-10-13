"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import {
  Users, Sparkles, Copy, Check, Share2, Wallet,
  Clock, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck,
  Send, ExternalLink, HelpCircle, Award, Flame, Gift, ChevronRight, Zap
} from "lucide-react";

interface ReferralTierInfo {
  code: string;
  name: string;
  badge: string;
  color: string;
  percentage: number;
  perks: string[];
  currentCount: number;
  targetCount: number;
  progressPercent: number;
  nextTierName: string | null;
  neededForNext: number;
}

interface ReferralConfigInfo {
  bronzeMinRefs: number;
  bronzePercent: number;
  silverMinRefs: number;
  silverPercent: number;
  goldMinRefs: number;
  goldPercent: number;
  retentionDays: number;
}

interface ReferralData {
  botCode: string;
  referralLink: string;
  totalReferrals: number;
  totalPendingUSD: number;
  totalReleasedUSD: number;
  walletBalance: number;
  tier?: ReferralTierInfo;
  config?: ReferralConfigInfo;
  referrals: Array<{
    id: string;
    storeName: string | null;
    name: string | null;
    botCode: string | null;
    createdAt: string;
  }>;
  bonuses: Array<{
    id: string;
    amountUSD: number;
    sourceTxAmount: number;
    status: string;
    releaseDate: string;
    createdAt: string;
    referredBusiness: string;
  }>;
}

export default function ReferralsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Simulador de ganancias
  const [simGuests, setSimGuests] = useState(5);
  const [simPlanPrice, setSimPlanPrice] = useState(13.5);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.authenticated) {
        setSessionUser(json.user);
        setMembership(json.membership);
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchReferrals();
  }, []);

  const handleCopyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!data?.referralLink) return;
    const text = `¡Hola! Te recomiendo OttBot PRO para autopublicar tus productos y servicios en grupos de Telegram en piloto automático 24/7. Regístrate aquí y prueba 24 horas gratis: ${data.referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTelegram = () => {
    if (!data?.referralLink) return;
    const text = `¡Hola! Te recomiendo OttBot PRO para autopublicar en grupos de Telegram automáticamente 24/7: ${data.referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const cardBg = isDark
    ? "bg-[#1E2229] border-[#2D3340]"
    : "bg-white border-slate-300 shadow-sm";

  // Calcular porcentaje simulado según invitados
  const config = data?.config || {
    bronzeMinRefs: 1,
    bronzePercent: 10,
    silverMinRefs: 5,
    silverPercent: 15,
    goldMinRefs: 15,
    goldPercent: 20,
    retentionDays: 7,
  };

  const simPercent =
    simGuests >= config.goldMinRefs
      ? config.goldPercent
      : simGuests >= config.silverMinRefs
      ? config.silverPercent
      : config.bronzePercent;

  const simMonthlyBonus = (simGuests * simPlanPrice * (simPercent / 100)).toFixed(2);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#0F1319] text-slate-100" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      {/* SIDEBAR DE CLIENTE */}
      <ClientSidebar user={sessionUser} membership={membership} />

      {/* CONTENIDO PRINCIPAL CON MARGEN ml-64 PARA EL SIDEBAR */}
      <main className="flex-1 ml-64 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-7">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                isDark
                  ? "bg-[#229ED9]/15 border-[#229ED9]/30 text-[#229ED9]"
                  : "bg-sky-100 border-sky-300 text-sky-800"
              }`}>
                ¡Haz que tu bot sea 100% GRATIS!
              </span>
            </div>
            <h1 className={`text-2xl sm:text-[28px] font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              Programa de Referidos & Niveles de Afiliado
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-700 font-medium"}`}>
              Invita a colegas que vendan por Telegram. Con cada recarga que ellos hagan por Binance Pay acumulas comisiones del <strong>10% al 20%</strong> en tu Wallet. ¡Con solo 5 amigos activos tu membresía mensual se paga completamente sola!
            </p>
          </div>

          <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${cardBg}`}>
            <Wallet className="w-5 h-5 text-emerald-500" />
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                Tu Wallet
              </div>
              <div className={`text-base font-black font-mono ${isDark ? "text-white" : "text-slate-950"}`}>
                ${data?.walletBalance?.toFixed(2) || "0.00"} USD
              </div>
            </div>
          </div>
        </div>

        {/* BANNER DE RANGO ACTUAL & PROGRESO DEL USUARIO */}
        {data?.tier && (
          <div className={`p-6 sm:p-7 rounded-3xl border-2 relative overflow-hidden shadow-md ${
            data.tier.code === "GOLD"
              ? isDark
                ? "bg-gradient-to-r from-amber-950/40 via-[#1E2229] to-[#1E2229] border-amber-500/40"
                : "bg-gradient-to-r from-amber-50 via-white to-amber-50/60 border-amber-400"
              : data.tier.code === "SILVER"
              ? isDark
                ? "bg-gradient-to-r from-slate-800/40 via-[#1E2229] to-[#1E2229] border-slate-400/40"
                : "bg-gradient-to-r from-slate-100 via-white to-sky-50 border-slate-400"
              : isDark
              ? "bg-gradient-to-r from-orange-950/30 via-[#1E2229] to-[#1E2229] border-orange-500/30"
              : "bg-gradient-to-r from-orange-50 via-white to-amber-50 border-amber-300"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                    Tu Rango Actual en la Plataforma
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase border ${
                    data.tier.code === "GOLD"
                      ? isDark
                        ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                        : "bg-amber-100 text-amber-900 border-amber-400"
                      : data.tier.code === "SILVER"
                      ? isDark
                        ? "bg-slate-400/20 text-slate-300 border-slate-400/30"
                        : "bg-slate-200 text-slate-900 border-slate-400"
                      : isDark
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}>
                    {data.tier.badge}
                  </span>
                </div>

                <h2 className={`text-xl font-black mt-2 ${isDark ? "text-white" : "text-slate-950"}`}>
                  Recibes el <span className="text-emerald-500 font-mono text-2xl font-black">+{data.tier.percentage}%</span> de cada pago que hagan tus invitados
                </h2>

                <p className={`text-xs sm:text-sm mt-1 max-w-xl font-medium ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                  {data.tier.neededForNext > 0
                    ? `Tienes ${data.totalReferrals} referidos activos. Te faltan solo ${data.tier.neededForNext} para ascender a ${data.tier.nextTierName}.`
                    : "¡Felicidades! Has alcanzado el rango máximo de Embajador VIP con la comisión más alta."}
                </p>
              </div>

              {/* Barra de progreso */}
              <div className="w-full md:w-72 flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isDark ? "text-neutral-400" : "text-slate-600 font-bold"}>Progreso de Rango</span>
                  <span className="font-mono text-[#229ED9] font-black">{data.tier.progressPercent}%</span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                  isDark ? "bg-neutral-800 border-neutral-700" : "bg-slate-200 border-slate-300"
                }`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#229ED9] to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(8, data.tier.progressPercent)}%` }}
                  />
                </div>
                <div className={`text-[11px] font-bold flex items-center justify-between ${
                  isDark ? "text-neutral-400" : "text-slate-600"
                }`}>
                  <span>{data.totalReferrals} referidos</span>
                  <span>Meta: {data.tier.targetCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TARJETA PRINCIPAL DEL ENLACE DE REFERIDO */}
        <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden ${cardBg}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#229ED9]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#229ED9]" />
                <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tu Enlace Personal de Invitación
                </span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-700 font-medium"}`}>
                Cualquier persona que se registre mediante este enlace quedará vinculada automáticamente a tu código único <strong className="text-[#229ED9] font-mono">{data?.botCode || "BOT-I..."}</strong> de por vida.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <div className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold truncate select-all ${
                  isDark ? "bg-[#13161C] border-[#2B303C] text-neutral-200" : "bg-slate-50 border-slate-300 text-slate-900"
                }`}>
                  {data?.referralLink || "Generando enlace..."}
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 bg-[#229ED9] hover:bg-[#1C8CC4] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "¡Copiado!" : "Copiar Enlace"}</span>
                </button>
              </div>
            </div>

            {/* BOTONES DE COMPARTIR RÁPIDO */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir en WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-4 rounded-xl bg-[#229ED9] hover:bg-sky-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Compartir en Telegram</span>
              </button>
            </div>
          </div>
        </div>

        {/* ESTRUCTURA VISUAL DE LOS 3 NIVELES Y BENEFICIOS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-purple-500" />
            <h2 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
              Estructura de Niveles & Beneficios Exclusivos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* BRONCE */}
            <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
              data?.tier?.code === "BRONZE"
                ? isDark
                  ? "bg-[#1E2229] border-orange-500 ring-2 ring-orange-500/30"
                  : "bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340]"
                : "bg-white border-slate-300 shadow-sm"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-black ${isDark ? "text-orange-400" : "text-amber-800"}`}>
                    🥉 Nivel Bronce
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-orange-400/15 text-orange-400 border-orange-400/30"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}>
                    {config.bronzeMinRefs} a {config.silverMinRefs - 1} amigos
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-emerald-500 mb-1">
                  {config.bronzePercent}%
                </div>
                <div className={`text-[11px] font-bold mb-4 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  comisión por cada recarga
                </div>

                <ul className="space-y-2.5 text-xs font-semibold">
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Comisión fija en cada pago de tus invitados</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Liberación semanal directa a tu Wallet</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Enlace con código único vitalicio</span>
                  </li>
                </ul>
              </div>

              <div className={`mt-5 pt-4 border-t text-[11px] font-bold ${
                isDark ? "border-neutral-700/20 text-neutral-400" : "border-slate-200 text-slate-600"
              }`}>
                Requisito: {config.bronzeMinRefs} referido activo
              </div>
            </div>

            {/* PLATA */}
            <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all relative ${
              data?.tier?.code === "SILVER"
                ? isDark
                  ? "bg-[#1E2229] border-slate-300 ring-2 ring-slate-300/40"
                  : "bg-white border-[#229ED9] ring-2 ring-[#229ED9]/30 shadow-md"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340]"
                : "bg-white border-slate-300 shadow-sm"
            }`}>
              <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                ¡Tu Bot Gratis!
              </span>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}>
                    🥈 Nivel Plata
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-slate-400/15 text-slate-300 border-slate-400/30"
                      : "bg-slate-100 text-slate-800 border-slate-300"
                  }`}>
                    {config.silverMinRefs} a {config.goldMinRefs - 1} amigos
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-emerald-500 mb-1">
                  {config.silverPercent}%
                </div>
                <div className={`text-[11px] font-bold mb-4 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  comisión por cada recarga
                </div>

                <ul className="space-y-2.5 text-xs font-semibold">
                  <li className={`flex items-start gap-2 font-black ${isDark ? "text-[#38BDF8]" : "text-sky-700"}`}>
                    <Gift className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#229ED9]" />
                    <span>Desbloqueo de 1 Cuenta de Telegram Extra de regalo</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Tu plan mensual queda 100% cubierto con 5 amigos</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Notificaciones prioritarias de comisiones</span>
                  </li>
                </ul>
              </div>

              <div className={`mt-5 pt-4 border-t text-[11px] font-bold ${
                isDark ? "border-neutral-700/20 text-[#229ED9]" : "border-slate-200 text-[#0284C7]"
              }`}>
                Requisito: {config.silverMinRefs} referidos activos
              </div>
            </div>

            {/* ORO EMBAJADOR */}
            <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
              data?.tier?.code === "GOLD"
                ? isDark
                  ? "bg-[#1E2229] border-amber-400 ring-2 ring-amber-400/40"
                  : "bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340]"
                : "bg-white border-slate-300 shadow-sm"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-black ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                    🥇 Oro Embajador
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}>
                    {config.goldMinRefs}+ amigos VIP
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-amber-500 mb-1">
                  {config.goldPercent}%
                </div>
                <div className={`text-[11px] font-bold mb-4 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  comisión máxima de la plataforma
                </div>

                <ul className="space-y-2.5 text-xs font-semibold">
                  <li className={`flex items-start gap-2 font-black ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                    <Award className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Insignia exclusiva de Embajador VIP en tu perfil</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Canal directo y prioritario con la administración</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isDark ? "text-neutral-300" : "text-slate-800"}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Capacidad de activar planes para revender a tus clientes</span>
                  </li>
                </ul>
              </div>

              <div className={`mt-5 pt-4 border-t text-[11px] font-bold ${
                isDark ? "border-neutral-700/20 text-amber-400" : "border-slate-200 text-amber-700"
              }`}>
                Requisito: {config.goldMinRefs} referidos activos
              </div>
            </div>
          </div>
        </div>

        {/* SIMULADOR DE GANANCIAS */}
        <div className={`p-6 sm:p-7 rounded-3xl border ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                  Simulador: Calcula tus Ganancias Mensuales
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-600 font-medium"}`}>
                Descubre cuánto saldo acumularás en tu billetera según el número de personas que invites.
              </p>
            </div>

            <div className="text-right">
              <span className={`text-[11px] font-bold block ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                Ganancia mensual estimada:
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-500">
                +${simMonthlyBonus} USD
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-neutral-400" : "text-slate-700 font-black"}`}>
                Número de Amigos Invitados: <span className="text-[#229ED9]">{simGuests} personas</span>
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={simGuests}
                onChange={(e) => setSimGuests(parseInt(e.target.value))}
                className="w-full accent-[#229ED9] cursor-pointer"
              />
              <div className={`flex justify-between text-[11px] font-bold mt-1 ${isDark ? "text-neutral-500" : "text-slate-600"}`}>
                <span>1 amigo</span>
                <span>15 amigos (Oro)</span>
                <span>30 amigos</span>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-neutral-400" : "text-slate-700 font-black"}`}>
                Plan que contratan: <span className="text-emerald-500 font-mono font-black">${simPlanPrice} USD</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSimPlanPrice(7.0)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simPlanPrice === 7.0
                      ? "bg-[#229ED9] text-white border-[#229ED9] shadow-sm"
                      : isDark
                      ? "bg-neutral-800/40 text-neutral-300 border-neutral-700/50"
                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  Semanal ($7)
                </button>
                <button
                  type="button"
                  onClick={() => setSimPlanPrice(13.5)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simPlanPrice === 13.5
                      ? "bg-[#229ED9] text-white border-[#229ED9] shadow-sm"
                      : isDark
                      ? "bg-neutral-800/40 text-neutral-300 border-neutral-700/50"
                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  15 Días ($13.5)
                </button>
                <button
                  type="button"
                  onClick={() => setSimPlanPrice(25.0)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    simPlanPrice === 25.0
                      ? "bg-[#229ED9] text-white border-[#229ED9] shadow-sm"
                      : isDark
                      ? "bg-neutral-800/40 text-neutral-300 border-neutral-700/50"
                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  Mensual ($25)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* METRICAS DE BONOS & REFERIDOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* TOTAL REFERIDOS */}
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                Amigos Vinculados
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black mt-2 font-mono ${isDark ? "text-white" : "text-slate-950"}`}>
              {data?.totalReferrals || 0}
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? "text-neutral-500" : "text-slate-600 font-medium"}`}>
              Registrados con tu código
            </p>
          </div>

          {/* BONOS PENDIENTES (CICLO SEMANAL) */}
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
                Bonos en Espera ({config.retentionDays} Días)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black mt-2 font-mono text-amber-500">
              ${data?.totalPendingUSD?.toFixed(2) || "0.00"} USD
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? "text-neutral-500" : "text-slate-600 font-medium"}`}>
              Se liberan al cumplir la semana
            </p>
          </div>

          {/* BONOS LIBERADOS A WALLET */}
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500">
                Bonos Liberados
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black mt-2 font-mono text-emerald-500">
              ${data?.totalReleasedUSD?.toFixed(2) || "0.00"} USD
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? "text-neutral-500" : "text-slate-600 font-medium"}`}>
              Acreditados a tu Wallet disponible
            </p>
          </div>
        </div>

        {/* TABLA DE HISTORIAL DE BONOS GENERADOS */}
        <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
          <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                Historial de Comisiones & Bonos
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-600 font-medium"}`}>
                Registro de todas las recargas realizadas por tus invitados y la comisión asignada.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${isDark ? "border-[#2B303C] text-neutral-400 bg-[#171A20]" : "border-slate-300 text-slate-700 bg-slate-100"}`}>
                  <th className="py-3.5 px-4 font-black">Fecha</th>
                  <th className="py-3.5 px-4 font-black">Negocio Invitado</th>
                  <th className="py-3.5 px-4 font-black text-right">Recarga Binance</th>
                  <th className="py-3.5 px-4 font-black text-right">Comisión Asignada</th>
                  <th className="py-3.5 px-4 font-black text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {data?.bonuses && data.bonuses.length > 0 ? (
                  data.bonuses.map((b) => {
                    const isReleased = b.status === "RELEASED";
                    const relDate = new Date(b.releaseDate);
                    const daysLeft = Math.max(0, Math.ceil((relDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={b.id} className={isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}>
                        <td className={`py-3.5 px-4 font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                          {new Date(b.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className={`py-3.5 px-4 font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                          {b.referredBusiness}
                        </td>
                        <td className={`py-3.5 px-4 font-mono font-bold text-right ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                          ${b.sourceTxAmount.toFixed(2)} USD
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-right text-emerald-500">
                          +${b.amountUSD.toFixed(2)} USD
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isReleased ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Liberado a Wallet
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                              <Clock className="w-3 h-3" /> Se libera en {daysLeft}d
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className={`py-8 text-center font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      Aún no tienes comisiones registradas. Comparte tu enlace para empezar a acumular bonos semanales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GUIA DE REGLAS DEL PROGRAMA */}
        <div className={`p-6 sm:p-7 rounded-3xl border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-[#229ED9]" />
            <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-950"}`}>
              Condiciones y Funcionamiento del Programa de Bonos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-300 text-slate-800"}`}>
              <div className="font-black text-[#229ED9] mb-1">1. Enlace & Código Fijo</div>
              Tu código de usuario está incorporado en tu enlace de invitación. Cada persona que cree su cuenta con ese enlace quedará asignada a tu perfil de por vida.
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-300 text-slate-800"}`}>
              <div className="font-black text-amber-600 mb-1">2. Liberación Semanal</div>
              Cada bono generado entra a un ciclo de protección de {config.retentionDays} días. Transcurrida la semana, el sistema transfiere los fondos automáticamente a tu saldo disponible en Wallet.
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-300 text-slate-800"}`}>
              <div className="font-black text-emerald-600 mb-1">3. Saldo Útil para la Plataforma</div>
              Todo saldo liberado a tu Wallet puede usarse sin restricciones para activar planes de difusión (1d, 7d, 15d, 30d) o agregar cuentas extras de Telegram.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
