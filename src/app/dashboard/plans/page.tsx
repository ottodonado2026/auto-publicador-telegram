"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  CreditCard, CheckCircle2, Clock, Sparkles, 
  ShieldCheck, Zap, Send, Tag, Wallet, ArrowUpRight, AlertCircle, History, PlusCircle
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
    maxDailyPosts: 50,
    maxCampaigns: 2,
    maxTelegramAccounts: 1,
    isPopular: false,
    features: [
      "Hasta 15 grupos de destino",
      "Hasta 2 campañas activas simultáneas",
      "50 publicaciones automáticas / día",
      "1 Cuenta de Telegram vinculada",
      "Intervalo de 60s antibaneo",
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
    maxDailyPosts: 150,
    maxCampaigns: 3,
    maxTelegramAccounts: 1,
    isPopular: true,
    features: [
      "Hasta 30 grupos de destino",
      "Hasta 3 campañas activas en rotación",
      "150 publicaciones automáticas / día",
      "1 Cuenta de Telegram o Granja OttBot",
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
    maxCampaigns: 5,
    maxTelegramAccounts: 2,
    isPopular: false,
    features: [
      "Hasta 60 grupos de destino",
      "Hasta 5 campañas activas en rotación",
      "250 publicaciones automáticas / día",
      "⚡ Soporte hasta 2 Cuentas de Telegram",
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
    maxCampaigns: 8,
    maxTelegramAccounts: 3,
    isPopular: false,
    features: [
      "Hasta 100 grupos de destino",
      "Hasta 8 campañas activas en rotación",
      "500 publicaciones automáticas / día",
      "🔥 Soporte hasta 3 Cuentas de Telegram",
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
  const [purchasing, setPurchasing] = useState(false);
  const [purchasingAddon, setPurchasingAddon] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(10);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setSessionUser(data.user);
        setMembership(data.membership);
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handlePayWithWallet = async (plan: any) => {
    setFeedback(null);
    setPurchasing(true);

    try {
      const res = await fetch("/api/wallet/purchase-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al activar plan con Wallet");
      }

      setFeedback({ message: data.message, isError: false });
      await fetchUserData();
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyExtraAccount = async () => {
    setFeedback(null);
    setPurchasingAddon(true);

    try {
      const res = await fetch("/api/wallet/purchase-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonType: "EXTRA_ACCOUNT" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al comprar cuenta adicional");
      }

      setFeedback({ message: data.message, isError: false });
      await fetchUserData();
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setPurchasingAddon(false);
    }
  };

  const walletBalance = Number(sessionUser?.walletBalance || 0);
  const transactions = sessionUser?.walletTransactions || [];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Mi Billetera (Wallet) & Planes de Membresía
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Recarga saldo en tu Wallet para activar planes al instante con 1 clic o desbloquear cuentas adicionales de Telegram.
          </p>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-md ${
            feedback.isError
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
          }`}>
            {feedback.isError ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SECCIÓN SUPERIOR: BILLETERA VIRTUAL (WALLET) + ESTADO ACTUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Tarjeta de Wallet */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#192332] via-[#1E2229] to-emerald-950/40 border border-emerald-500/30 shadow-xl text-white flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    Saldo Disponible en Billetera
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                      ${walletBalance.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">USD</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[11px] text-neutral-300 font-semibold mb-1">
                  ¿Deseas recargar saldo a favor?
                </span>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        topupAmount === amt
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-white/10 text-neutral-300 hover:bg-white/20"
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-neutral-300 leading-relaxed max-w-md">
                Con saldo en tu <strong>Wallet</strong> puedes activar planes de 1, 7, 15 o 30 días de forma automática sin esperar validación manual.
              </p>

              <a
                href={`https://t.me/OttBotOficial?text=${encodeURIComponent(
                  `Hola, deseo recargar +$${topupAmount}.00 USD de saldo en mi Wallet de OttBot para la cuenta ${sessionUser?.email || sessionUser?.phoneNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all whitespace-nowrap"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Recargar +${topupAmount} USD a mi Wallet</span>
              </a>
            </div>
          </div>

          {/* Tarjeta de Vigencia Actual */}
          <div className={`lg:col-span-5 rounded-3xl p-6 sm:p-7 border shadow-xl flex flex-col justify-between ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#229ED9]">
                  Suscripción en Curso
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  membership?.hasAccess
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {membership?.hasAccess ? "Activa 24/7" : "Expirada"}
                </span>
              </div>

              <div className="flex items-center gap-3.5 my-2">
                <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">
                    {membership?.daysRemaining ?? 0} Día(s) Restante(s)
                  </div>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                    Tus días nuevos se suman a los actuales.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs mt-4 ${
              isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-700"
            }`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span>Campañas activas permitidas:</span>
                <span className="text-[#229ED9]">Hasta {sessionUser?.subscription?.maxCampaigns || 2} activas</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Cuentas Telegram:</span>
                <span className="text-emerald-400">Hasta {sessionUser?.subscription?.maxAccounts || 1} cuenta(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ADD-ON: CUENTA ADICIONAL DE TELEGRAM POR $3.00 USD PAGO ÚNICO */}
        <div className={`mb-8 rounded-3xl p-6 border-2 border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md ${
          isDark ? "bg-[#191D24] border-[#229ED9]/40" : "bg-sky-50/60 border-[#229ED9]/40"
        }`}>
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">
                  ¿Tienes el Pase Express o Semanal y quieres agregar otra Cuenta de Telegram?
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                  Pago Único
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Desbloquea <strong>+1 Cuenta Adicional de Telegram</strong> por solo <strong>$3.00 USD</strong>. Puedes usarla para publicar directamente desde tus números personales o alternar con nuestra Granja OttBot.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={purchasingAddon}
            onClick={handleBuyExtraAccount}
            className="px-5 py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-[#229ED9]/25 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {purchasingAddon ? "Activando..." : "Adicionar +1 Cuenta TG ($3.00 USD)"}
          </button>
        </div>

        {/* Cuadrícula de 4 Planes (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CLIENT_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            const canAffordWithWallet = walletBalance >= plan.priceUSD;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-3xl p-6 sm:p-7 border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "border-[#229ED9] shadow-[0_0_30px_rgba(34,158,217,0.25)]"
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

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-black">{plan.name}</h3>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        {plan.description}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#229ED9]/15 text-[#229ED9]">
                      +{plan.days} Días
                    </span>
                  </div>

                  <div className={`p-4 rounded-2xl border my-4 flex items-center justify-between ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black">${plan.priceUSD.toFixed(2)}</span>
                        <span className="text-xs font-bold text-neutral-400">USD</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Solo ${plan.dailyEquivalent.toFixed(2)} / día</span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-neutral-400 space-y-0.5">
                      <div>Máx. <strong>{plan.maxGroups} grupos</strong></div>
                      <div><strong>{plan.maxDailyPosts} envíos</strong> / día</div>
                      <div>Hasta <strong>{plan.maxCampaigns} campañas</strong></div>
                      <div><strong>{plan.maxTelegramAccounts} cuenta(s)</strong> TG</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#2D3340]/40">
                  <button
                    type="button"
                    disabled={purchasing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayWithWallet(plan);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      canAffordWithWallet
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                        : isDark
                        ? "bg-[#252A34] hover:bg-[#2D3340] text-neutral-300 border border-[#363D4A]"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>
                      {purchasing && selectedPlan.id === plan.id
                        ? "Procesando..."
                        : canAffordWithWallet
                        ? `Activar al Instante con mi Wallet (-$${plan.priceUSD.toFixed(2)})`
                        : `Pagar con Wallet (Saldo: $${walletBalance.toFixed(2)} USD)`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial Reciente de Wallet (si existe) */}
        {transactions.length > 0 && (
          <div className={`mb-8 rounded-3xl p-6 border shadow-lg ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-4">
              <History className="w-4 h-4" />
              <span>Movimientos Recientes de tu Wallet</span>
            </div>
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <div>
                    <span className="font-bold block">{tx.description}</span>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`font-mono font-black text-sm ${
                    tx.type === "CREDIT" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"}${Number(tx.amount).toFixed(2)} USD
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métodos de Pago Directos */}
        <div className={`rounded-3xl p-7 border shadow-xl ${
          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
        }`}>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#229ED9] mb-4">
            <CreditCard className="w-4 h-4" />
            <span>Recarga de Wallet o Pago Directo: {selectedPlan?.name} (${selectedPlan?.priceUSD.toFixed(2)} USD)</span>
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
                Acreditación inmediata en tu Wallet o Plan.
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
                `Hola, deseo activar el ${selectedPlan?.name} ($${selectedPlan?.priceUSD} USD) o recargar mi Wallet para la cuenta ${sessionUser?.email || sessionUser?.phoneNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Contactar Soporte para Recargar Wallet / Activar Plan</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
