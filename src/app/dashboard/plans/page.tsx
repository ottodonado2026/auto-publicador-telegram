"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  CreditCard, CheckCircle2, Clock, 
  ShieldCheck, Send, Tag, Wallet, ArrowUpRight, AlertCircle, History, PlusCircle,
  X, PhoneCall, KeyRound, HelpCircle, Users
} from "lucide-react";

const CLIENT_PLANS = [
  {
    id: "plan-1",
    name: "Pase Express (1 Día)",
    days: 1,
    priceUSD: 1.25,
    dailyEquivalent: 1.25,
    description: "Difusión de 24 horas para promociones relámpago.",
    maxGroups: "25",
    maxDailyPosts: 100,
    maxCampaigns: 2,
    maxTelegramAccounts: 1,
    isPopular: false,
    features: [
      "Hasta 25 grupos de destino",
      "Hasta 2 campañas activas simultáneas",
      "100 publicaciones automáticas / día",
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
    maxGroups: "50",
    maxDailyPosts: 200,
    maxCampaigns: 3,
    maxTelegramAccounts: 1,
    isPopular: true,
    features: [
      "Hasta 50 grupos de destino",
      "Hasta 3 campañas activas en rotación",
      "200 publicaciones automáticas / día",
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
    maxGroups: "100",
    maxDailyPosts: 300,
    maxCampaigns: 5,
    maxTelegramAccounts: 2,
    isPopular: false,
    features: [
      "Hasta 100 grupos de destino",
      "Hasta 5 campañas activas en rotación",
      "300 publicaciones automáticas / día",
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
    maxGroups: "Ilimitados",
    maxDailyPosts: 500,
    maxCampaigns: 8,
    maxTelegramAccounts: 3,
    isPopular: false,
    features: [
      "Grupos de destino Ilimitados",
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

  // Modal de Explicación + Compra + Vinculación de Cuenta Adicional de Telegram
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [modalCode, setModalCode] = useState("");
  const [modalStep, setModalStep] = useState<"INFO" | "PHONE" | "CODE" | "SUCCESS">("INFO");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const handleUnlockExtraAccountInModal = async () => {
    setModalError(null);
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
      // Pasar automáticamente al formulario para vincular el nuevo número de Telegram
      setModalStep("PHONE");
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setPurchasingAddon(false);
    }
  };

  const handleModalSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);
    try {
      const res = await fetch("/api/telegram/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: modalPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar código a Telegram");
      setModalStep("CODE");
    } catch (err: any) {
      setModalError(err.message || "Error al conectar con Telegram");
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);
    try {
      const res = await fetch("/api/telegram/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: modalPhone, phoneCode: modalCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido o expirado");
      await fetchUserData();
      setModalStep("SUCCESS");
    } catch (err: any) {
      setModalError(err.message || "Error al verificar el código");
    } finally {
      setModalLoading(false);
    }
  };

  const walletBalance = Number(sessionUser?.walletBalance || 0);
  const transactions = sessionUser?.walletTransactions || [];
  const linkedAccounts = (sessionUser?.telegramAccounts || []).filter((a: any) => a.status === "CONNECTED");
  const maxAccountsAllowed = sessionUser?.subscription?.maxAccounts || 1;
  const hasFreeAccountSlot = linkedAccounts.length < maxAccountsAllowed;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-6 sm:p-8 max-w-6xl w-full mx-auto">
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
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#229ED9]/20 border border-[#229ED9]/40 text-[11px] font-mono font-black text-sky-300">
                    <span>Tu Código de Recarga: {sessionUser?.botCode || "BOT-I------"}</span>
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
                Proporciona tu código <strong className="font-mono text-sky-300">{sessionUser?.botCode || "BOT-I------"}</strong> al recargar tu <strong>Wallet</strong> para acreditar tu saldo al instante y activar planes de 1, 7, 15 o 30 días con 1 clic.
              </p>

              <a
                href={`https://t.me/OttBotOficial?text=${encodeURIComponent(
                  `Hola, deseo recargar +$${topupAmount}.00 USD de saldo en mi Wallet de OttBot. Mi código único de usuario es ${sessionUser?.botCode || "BOT-I"} (${sessionUser?.email || sessionUser?.phoneNumber}).`
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
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap ${
                  membership?.hasAccess
                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
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
                <span className="text-emerald-500">
                  {linkedAccounts.length} vinculada(s) / Hasta {maxAccountsAllowed} cuenta(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ADD-ON: CUENTA ADICIONAL DE TELEGRAM POR $3.00 USD PAGO ÚNICO (ALINEADO EN UNA SOLA FILA) */}
        <div className={`mb-8 rounded-3xl p-6 border-2 border-dashed flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-md ${
          isDark ? "bg-[#191D24] border-[#229ED9]/40" : "bg-sky-50/60 border-[#229ED9]/40"
        }`}>
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm sm:text-base font-black">
                  ¿Tienes el Pase Express o Semanal y quieres agregar otra Cuenta de Telegram?
                </h3>
                <span className="inline-flex items-center whitespace-nowrap flex-shrink-0 text-[10px] font-black px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 uppercase tracking-wider">
                  ★ Pago Único ($3.00 USD)
                </span>
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Desbloquea <strong>+1 Cuenta Adicional de Telegram</strong> para vincular un segundo o tercer número telefónico en tu mismo panel. Así repartes tus grupos entre varias cuentas propias sin riesgo de saturación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setModalStep("INFO");
                setShowAddonModal(true);
              }}
              className="px-5 py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-[#229ED9]/25 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar +1 Cuenta TG ($3.00 USD)</span>
            </button>
          </div>
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
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#229ED9]/15 text-[#229ED9] whitespace-nowrap">
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
                      <div className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Solo ${plan.dailyEquivalent.toFixed(2)} / día</span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-neutral-500 space-y-0.5">
                      <div>Máx. <strong>{plan.maxGroups} grupos</strong></div>
                      <div><strong>{plan.maxDailyPosts} envíos</strong> / día</div>
                      <div>Hasta <strong>{plan.maxCampaigns} campañas</strong></div>
                      <div><strong>{plan.maxTelegramAccounts} cuenta(s)</strong> TG</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-500 mb-4">
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
                    tx.type === "CREDIT" ? "text-emerald-500" : "text-amber-500"
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
              <span className="text-xs font-black block text-amber-500 mb-1">
                🟡 Binance Pay & Cripto (USDT)
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
                Red: USDT (TRC20 / BEP20) o Binance Pay ID.<br />
                Acreditación inmediata en tu Wallet o Plan.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-black block text-emerald-500 mb-1">
                🟢 Transferencia Local (Nequi / Bancolombia)
              </span>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
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

        {/* MODAL INTERACTIVO: EXPLICACIÓN + COMPRA + VINCULACIÓN DE CUENTA ADICIONAL DE TELEGRAM */}
        {showAddonModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl relative ${
              isDark ? "bg-[#191D24] border-[#2D3340] text-white" : "bg-[#EEF2F7] border-slate-300 text-slate-900"
            }`}>
              <button
                type="button"
                onClick={() => setShowAddonModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center font-bold flex-shrink-0">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black">
                      Adicionar +1 Cuenta de Telegram
                    </h2>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase whitespace-nowrap">
                      $3.00 USD Pago Único
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Cupo actual: <strong>{linkedAccounts.length} vinculada(s)</strong> de <strong>{maxAccountsAllowed} permitida(s)</strong>
                  </p>
                </div>
              </div>

              {modalError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalStep === "INFO" && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                    isDark ? "bg-[#12151B] border-[#2D3340]" : "bg-white border-slate-300"
                  }`}>
                    <div className="font-black text-[#229ED9] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4" />
                      <span>¿Qué significa y cómo te beneficia agregar otra cuenta?</span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Conecta un 2do o 3er número de teléfono:</strong> Puedes vincular otra cuenta personal o comercial de Telegram sin cerrar la primera.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Doble alcance y cero saturación:</strong> El sistema te permite publicar en los grupos de tu Cuenta 1 y de tu Cuenta 2 de forma independiente.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Cupo permanente:</strong> Pagas <strong>$3.00 USD una sola vez</strong> con el saldo de tu Wallet y el cupo extra queda desbloqueado en tu perfil.
                      </span>
                    </div>
                  </div>

                  {/* Lista de cuentas ya vinculadas */}
                  {linkedAccounts.length > 0 && (
                    <div className={`p-3.5 rounded-2xl border text-xs ${
                      isDark ? "bg-[#141820] border-[#2D3340]" : "bg-white border-slate-300"
                    }`}>
                      <span className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-2">
                        Cuentas actualmente vinculadas en tu panel:
                      </span>
                      <div className="space-y-1.5">
                        {linkedAccounts.map((acc: any, idx: number) => (
                          <div key={acc.id} className="flex items-center justify-between font-mono text-xs">
                            <span>#{idx + 1} • {acc.firstName || "Telegram"} ({acc.phoneNumber})</span>
                            <span className="text-[10px] font-black text-emerald-400">● CONECTADA</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={purchasingAddon}
                      onClick={handleUnlockExtraAccountInModal}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {purchasingAddon
                        ? "Desbloqueando cupo..."
                        : `1. Desbloquear +1 Cupo Ahora (-$3.00 USD de mi Wallet)`}
                    </button>

                    {hasFreeAccountSlot && (
                      <button
                        type="button"
                        onClick={() => setModalStep("PHONE")}
                        className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black whitespace-nowrap cursor-pointer"
                      >
                        Vincular Número Ya →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {modalStep === "PHONE" && (
                <form onSubmit={handleModalSendCode} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    ✓ ¡Tienes cupo disponible! Ingresa el nuevo número de teléfono de Telegram que deseas vincular a tu cuenta:
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Nuevo Número de Teléfono (con código de país, ej: +57...)
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="+573001234567"
                        value={modalPhone}
                        onChange={(e) => setModalPhone(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono font-bold ${
                          isDark ? "bg-[#12151B] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep("INFO")}
                      className="px-4 py-3 rounded-xl border border-neutral-600 text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                    >
                      ← Volver
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex-1 py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {modalLoading ? "Enviando código a Telegram..." : "Enviar Código de 5 Dígitos a este Telegram"}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === "CODE" && (
                <form onSubmit={handleModalVerifyCode} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-xs font-bold">
                    Hemos enviado un código oficial de 5 dígitos a la app de Telegram del número <strong>{modalPhone}</strong>.
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Código de Verificación de Telegram
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="12345"
                        value={modalCode}
                        onChange={(e) => setModalCode(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono font-black tracking-widest ${
                          isDark ? "bg-[#12151B] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {modalLoading ? "Verificando y Cifrando Sesión..." : "Confirmar y Conectar Cuenta Adicional"}
                  </button>
                </form>
              )}

              {modalStep === "SUCCESS" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">¡Nueva Cuenta de Telegram Vinculada!</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      El número <strong>{modalPhone}</strong> ya quedó conectado y cifrado en tu panel de OttBot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddonModal(false)}
                    className="w-full py-3 bg-[#229ED9] text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Listo, Cerrar Ventana
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
