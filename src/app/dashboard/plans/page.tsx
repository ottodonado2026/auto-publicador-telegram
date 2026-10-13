"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  CreditCard, CheckCircle2, Clock, Sparkles, 
  ShieldCheck, Zap, MessageSquare, Send, Tag
} from "lucide-react";

const CLIENT_PLANS = [
  {
    id: "plan-1",
    name: "Pase Express (1 Día)",
    days: 1,
    priceUSD: 1.25,
    dailyEquivalent: 1.25,
    description: "Difusión de 24 horas para promociones relámpago.",
    maxGroups: 15,
    maxDailyPosts: 45,
    maxTelegramAccounts: 1,
    isPopular: false,
    features: [
      "Hasta 15 grupos de destino",
      "45 publicaciones automáticas / día",
      "1 Cuenta de Telegram vinculada",
      "Intervalo de 60s antibaneo",
      "Soporte para copys con foto y enlaces",
    ],
  },
  {
    id: "plan-2",
    name: "Plan Semanal (7 Días)",
    days: 7,
    priceUSD: 7.00,
    dailyEquivalent: 1.00,
    description: "Tarifa reducida a solo $1.00/día. La opción más elegida.",
    maxGroups: 30,
    maxDailyPosts: 120,
    maxTelegramAccounts: 1,
    isPopular: true,
    features: [
      "Hasta 30 grupos de destino",
      "120 publicaciones automáticas / día",
      "1 Cuenta de Telegram vinculada",
      "Publicación con tu cuenta o Granja OttBot",
      "Ahorro del 20% vs tarifa diaria",
    ],
  },
  {
    id: "plan-3",
    name: "Plan Quincenal (15 Días)",
    days: 15,
    priceUSD: 13.50,
    dailyEquivalent: 0.90,
    description: "Solo $0.90/día. Para tiendas con catálogo continuo.",
    maxGroups: 60,
    maxDailyPosts: 250,
    maxTelegramAccounts: 2,
    isPopular: false,
    features: [
      "Hasta 60 grupos de destino",
      "250 publicaciones automáticas / día",
      "⚡ Soporte hasta 2 Cuentas de Telegram",
      "Rotación inteligente de mensajes",
      "Ahorro del 28%",
    ],
  },
  {
    id: "plan-4",
    name: "Plan Mensual (30 Días)",
    days: 30,
    priceUSD: 24.00,
    dailyEquivalent: 0.80,
    description: "Nuestra tarifa más económica: solo $0.80/día. Alcance masivo.",
    maxGroups: 100,
    maxDailyPosts: 500,
    maxTelegramAccounts: 3,
    isPopular: false,
    features: [
      "Hasta 100 grupos de destino",
      "500 publicaciones automáticas / día",
      "🔥 Soporte hasta 3 Cuentas de Telegram",
      "Rotación entre bots de granja o propios",
      "Ahorro máximo del 36%",
    ],
  },
];

export default function ClientPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(CLIENT_PLANS[1]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user);
          setMembership(data.membership);
        }
      });
  }, []);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Recargar Membresía & Planes
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Extiende tus días de difusión en piloto automático con descuentos por volumen.
          </p>
        </div>

        {/* Estado Actual de la Membresía */}
        <div className={`mb-8 p-6 rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                isDark ? "text-neutral-400" : "text-neutral-500"
              }`}>
                Estado Actual
              </span>
              <span className="text-lg font-black">
                {membership?.daysRemaining ?? 1} Día(s) Restante(s) Vigente(s)
              </span>
            </div>
          </div>

          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
            ✓ Publicaciones en Piloto Automático Habilitadas
          </div>
        </div>

        {/* Cuadrícula de 4 Planes (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CLIENT_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-3xl p-6 sm:p-7 border-2 cursor-pointer transition-all relative ${
                  isSelected
                    ? "border-[#229ED9] shadow-[0_0_30px_rgba(34,158,217,0.25)] scale-[1.01]"
                    : isDark
                    ? "bg-[#1E2229] border-[#2D3340] hover:border-neutral-500"
                    : "bg-white border-neutral-300 hover:border-neutral-400"
                } ${isDark ? "bg-[#1E2229]" : "bg-white"}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black rounded-full shadow-md uppercase tracking-wider">
                    ★ Más Popular
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-black">{plan.name}</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                      {plan.description}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#229ED9]/15 text-[#229ED9]">
                    {plan.days} Días
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border my-4 ${
                  isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                }`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black">${plan.priceUSD.toFixed(2)}</span>
                    <span className="text-xs font-bold text-neutral-400">USD</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Solo ${plan.dailyEquivalent.toFixed(2)} / día</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                    isSelected
                      ? "bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/30"
                      : isDark
                      ? "bg-[#252A34] text-neutral-300"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {isSelected ? "✓ Plan Seleccionado" : "Elegir este Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Métodos de Pago y Confirmación */}
        <div className={`rounded-3xl p-7 border shadow-xl ${
          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
        }`}>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#229ED9] mb-4">
            <CreditCard className="w-4 h-4" />
            <span>Métodos de Pago para Activar: {selectedPlan?.name} (${selectedPlan?.priceUSD.toFixed(2)} USD)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-2xl border ${
              isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-black block text-amber-400 mb-1">
                🟡 Binance Pay & Cripto (USDT)
              </span>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                Red: USDT (TRC20 / BEP20) o Binance Pay ID.<br />
                Acreditación automática en minutos.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-black block text-emerald-400 mb-1">
                🟢 Transferencia Local (Nequi / Bancolombia)
              </span>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                Pago en pesos colombianos al cambio del día.<br />
                Confirmación instantánea por comprobante.
              </p>
            </div>
          </div>

          <div className="text-center">
            <a
              href={`https://t.me/OttBotOficial?text=${encodeURIComponent(
                `Hola, deseo activar el ${selectedPlan?.name} ($${selectedPlan?.priceUSD} USD) para mi cuenta ${sessionUser?.email || sessionUser?.phoneNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Contactar por Telegram para Activar Plan Ahora</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
