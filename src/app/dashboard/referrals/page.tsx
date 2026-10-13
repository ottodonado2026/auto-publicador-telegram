"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Users, Sparkles, Copy, Check, Share2, Wallet,
  Clock, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck,
  Send, ExternalLink, HelpCircle
} from "lucide-react";

interface ReferralData {
  botCode: string;
  referralLink: string;
  totalReferrals: number;
  totalPendingUSD: number;
  totalReleasedUSD: number;
  walletBalance: number;
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

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9]">
              Gana 10% de Cada Recarga
            </span>
          </div>
          <h1 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
            Programa de Referidos & Bonos Semanales
          </h1>
          <p className={`text-xs mt-1 max-w-2xl leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Comparte tu enlace exclusivo con amigos o colegas que vendan por Telegram. Cada vez que ellos recarguen por Binance Pay, ganas el <strong>10%</strong> en bonos que se liberan automáticamente cada semana directo a tu Wallet.
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 ${cardBg}`}>
          <Wallet className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tu Wallet</div>
            <div className={`text-sm font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
              ${data?.walletBalance?.toFixed(2) || "0.00"} USD
            </div>
          </div>
        </div>
      </div>

      {/* TARJETA PRINCIPAL DEL ENLACE DE REFERIDO */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${cardBg}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#229ED9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#229ED9]" />
              <span className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>
                Tu Enlace Personal de Invitación
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              Cualquier persona que se registre mediante este enlace quedará vinculada automáticamente a tu código único <strong>{data?.botCode || "BOT-I..."}</strong> de por vida.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold truncate select-all ${
                isDark ? "bg-[#13161C] border-[#2B303C] text-neutral-200" : "bg-slate-50 border-slate-300 text-slate-800"
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

      {/* METRICAS DE BONOS & REFERIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* TOTAL REFERIDOS */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              Negocios Referidos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
            {data?.totalReferrals || 0}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Registrados con tu código</p>
        </div>

        {/* BONOS PENDIENTES (CICLO SEMANAL) */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500">
              Bonos en Espera (7 Días)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 font-mono text-amber-500`}>
            ${data?.totalPendingUSD?.toFixed(2) || "0.00"} USD
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Se liberan al cumplir la semana</p>
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
          <div className={`text-2xl font-black mt-2 font-mono text-emerald-500`}>
            ${data?.totalReleasedUSD?.toFixed(2) || "0.00"} USD
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Acreditados a tu Wallet disponible</p>
        </div>
      </div>

      {/* TABLA DE HISTORIAL DE BONOS GENERADOS */}
      <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className={`text-base font-black ${isDark ? "text-white" : "text-slate-900"}`}>
              Historial de Comisiones & Bonos
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registro de todas las recargas realizadas por tus invitados y la comisión asignada.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? "border-[#2B303C] text-neutral-400" : "border-slate-200 text-slate-500"}`}>
                <th className="py-3 px-4 font-black">Fecha</th>
                <th className="py-3 px-4 font-black">Negocio Invitado</th>
                <th className="py-3 px-4 font-black text-right">Recarga Binance</th>
                <th className="py-3 px-4 font-black text-right">Comisión 10%</th>
                <th className="py-3 px-4 font-black text-center">Estado</th>
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
                      <td className="py-3 px-4 font-medium text-neutral-400">
                        {new Date(b.createdAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className={`py-3 px-4 font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                        {b.referredBusiness}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-right text-neutral-400">
                        ${b.sourceTxAmount.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-right text-emerald-500">
                        +${b.amountUSD.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isReleased ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Liberado a Wallet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Se libera en {daysLeft}d
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    Aún no tienes comisiones registradas. Comparte tu enlace para empezar a acumular bonos semanales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GUIA DE REGLAS DEL PROGRAMA */}
      <div className={`p-6 rounded-3xl border ${cardBg}`}>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[#229ED9]" />
          <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>
            Condiciones y Funcionamiento del Programa de Bonos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
            <div className="font-black text-[#229ED9] mb-1">1. Enlace & Código Fijo</div>
            Tu código de usuario está incorporado en tu enlace de invitación. Cada persona que cree su cuenta con ese enlace quedará asignada a tu perfil de por vida.
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
            <div className="font-black text-amber-500 mb-1">2. Liberación a los 7 Días</div>
            Cada bono generado entra a un ciclo de protección de 7 días. Transcurrida la semana, el sistema transfiere los fondos automáticamente a tu saldo disponible.
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#13161C] border-[#282E3B] text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
            <div className="font-black text-emerald-500 mb-1">3. Saldo Útil para la Plataforma</div>
            Todo saldo liberado a tu Wallet puede usarse sin restricciones para activar planes de difusión (1d, 7d, 15d, 30d) o agregar cuentas extras de Telegram.
          </div>
        </div>
      </div>
    </div>
  );
}
