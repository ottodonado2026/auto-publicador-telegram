"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import {
  CreditCard, CheckCircle2, Clock,
  Send, Tag, Wallet, AlertCircle, History, PlusCircle,
  X, PhoneCall, KeyRound, HelpCircle, Copy, Check, ShieldCheck, Sparkles, Loader2
} from "lucide-react";

const BINANCE_UID = "1158258762";
const BINANCE_USERNAME = "streamofi";
const MIN_RECHARGE_USD = 1.25;

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
    description: "Solo $0.90/día. Para catálogos y anuncios continuos.",
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

const STIPULATED_AMOUNTS = [
  { label: "$1.25 (Plan 1 Día)", value: 1.25 },
  { label: "$3.00 (Cuenta Extra)", value: 3.00 },
  { label: "$7.00 (Plan 7 Días)", value: 7.00 },
  { label: "$13.50 (Plan 15 Días)", value: 13.50 },
  { label: "$24.00 (Plan 30 Días)", value: 24.00 },
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
  const [topupAmount, setTopupAmount] = useState<number>(7.00);
  const [topupInputStr, setTopupInputStr] = useState<string>("7.00");

  // Modal de Binance Pay con pasos animados: FORM -> VERIFYING -> SUCCESS
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [binanceStep, setBinanceStep] = useState<"FORM" | "VERIFYING" | "SUCCESS">("FORM");
  const [binanceMode, setBinanceMode] = useState<"WALLET" | "PLAN">("WALLET");
  const [binancePlan, setBinancePlan] = useState<any>(CLIENT_PLANS[1]);
  const [binanceOrderId, setBinanceOrderId] = useState("");
  const [binanceError, setBinanceError] = useState<string | null>(null);
  const [binanceSuccessData, setBinanceSuccessData] = useState<{
    mode: "WALLET" | "PLAN";
    title: string;
    subtitle: string;
    amountPaid: number;
    currency: string;
    orderId: string;
    planName?: string;
    daysAdded?: number;
    newBalance?: number;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const openBinanceModalForWallet = () => {
    setBinanceMode("WALLET");
    setBinanceStep("FORM");
    setBinanceOrderId("");
    setBinanceError(null);
    setBinanceSuccessData(null);
    setShowBinanceModal(true);
  };

  const openBinanceModalForPlan = (plan: any) => {
    setBinanceMode("PLAN");
    setBinancePlan(plan);
    setBinanceStep("FORM");
    setBinanceOrderId("");
    setBinanceError(null);
    setBinanceSuccessData(null);
    setShowBinanceModal(true);
  };

  const parsedTopup = parseFloat(topupInputStr);
  const isAmountTooLow = isNaN(parsedTopup) || parsedTopup < MIN_RECHARGE_USD;

  const handleVerifyBinancePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBinanceError(null);

    if (!binanceOrderId.trim()) {
      setBinanceError("Ingresa el Order ID (ID de la Orden) de tu comprobante de Binance Pay.");
      return;
    }

    if (binanceMode === "WALLET" && isAmountTooLow) {
      setBinanceError(
        `No puedes recargar menos de $${MIN_RECHARGE_USD.toFixed(
          2
        )} USD. Debes recargar exactamente el valor de alguno de los planes o un monto superior.`
      );
      return;
    }

    // Mostrar pantalla animada "Comprobando tu pago..."
    setBinanceStep("VERIFYING");

    try {
      // Pequeña pausa visual mínima para que se aprecie la animación de comprobación
      const [res] = await Promise.all([
        fetch("/api/wallet/binance-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: binanceOrderId.trim(),
            mode: binanceMode,
            planId: binanceMode === "PLAN" ? binancePlan?.id : undefined,
            expectedAmount: binanceMode === "WALLET" ? parsedTopup : binancePlan?.priceUSD,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo verificar el pago en Binance Pay");
      }

      await fetchUserData();

      setBinanceSuccessData({
        mode: data.mode || binanceMode,
        title:
          (data.mode || binanceMode) === "PLAN"
            ? "¡Has Comprado tu Plan Exitosamente!"
            : "¡Recarga Exitosa para tu Wallet!",
        subtitle: data.message,
        amountPaid: Number(data.amountPaid || 0),
        currency: data.currency || "USDT",
        orderId: data.orderId || binanceOrderId.trim(),
        planName: data.planName,
        daysAdded: data.daysAdded,
        newBalance: data.newBalance,
      });

      setFeedback({ message: data.message, isError: false });
      setBinanceOrderId("");
      setBinanceStep("SUCCESS");
    } catch (err: any) {
      setBinanceStep("FORM");
      setBinanceError(err.message || "Error al verificar el Order ID en Binance Pay");
    }
  };

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

      // Mostrar también el modal de éxito de compra de plan
      setBinanceSuccessData({
        mode: "PLAN",
        title: "¡Has Comprado tu Plan Exitosamente!",
        subtitle: data.message,
        amountPaid: plan.priceUSD,
        currency: "USD (Wallet)",
        orderId: `WALLET-${Date.now().toString().slice(-6)}`,
        planName: plan.name,
        daysAdded: plan.days,
      });
      setBinanceStep("SUCCESS");
      setShowBinanceModal(true);
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
            Recarga saldo automáticamente con <strong>Binance Pay</strong> o activa tus planes al instante con 1 clic.
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
                  Valores estipulados de planes:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1.25, 7, 13.5, 24].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTopupAmount(amt);
                        setTopupInputStr(amt.toFixed(2));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        topupAmount === amt
                          ? "bg-[#F3BA2F] text-black shadow-md"
                          : "bg-white/10 text-neutral-300 hover:bg-white/20"
                      }`}
                    >
                      ${amt.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-neutral-300 leading-relaxed max-w-sm">
                Paga a nuestro Binance ID <strong className="font-mono text-yellow-400">{BINANCE_UID}</strong> (Usuario: <strong className="text-yellow-400">{BINANCE_USERNAME}</strong>) e ingresa tu <strong>Order ID</strong> para acreditar tu saldo en segundos.
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openBinanceModalForWallet}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#F3BA2F] hover:bg-[#e5ad24] text-black text-xs font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all whitespace-nowrap cursor-pointer"
                >
                  <span>₿ Recargar con Binance Pay</span>
                </button>
              </div>
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

        {/* ADD-ON: CUENTA ADICIONAL DE TELEGRAM POR $3.00 USD POR CICLO DE PLAN */}
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
                  ¿Quieres agregar otra Cuenta de Telegram con +25 Grupos y +100 Envíos Extra?
                </h3>
                <span className="inline-flex items-center whitespace-nowrap flex-shrink-0 text-[10px] font-black px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 uppercase tracking-wider">
                  ★ $3.00 USD / Ciclo del Plan
                </span>
              </div>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Desbloquea <strong>+1 Cuenta Adicional de Telegram</strong> durante la vigencia de tu plan actual. Cada cuenta extra te suma <strong>+25 grupos independientes</strong> y <strong>+100 publicaciones diarias</strong> (o sube al Plan Quincenal/Mensual que ya incluyen 2 y 3 cuentas).
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
                        <span className="text-xs font-bold text-neutral-400">USD / Ciclo</span>
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

                <div className="space-y-2 pt-3 border-t border-[#2D3340]/40">
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBinanceModalForPlan(plan);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-black bg-[#F3BA2F]/15 hover:bg-[#F3BA2F]/25 text-[#F3BA2F] border border-[#F3BA2F]/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>₿ Pagar Directo con Binance Pay (${plan.priceUSD.toFixed(2)} USDT)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial Reciente de Wallet */}
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

        {/* SECCIÓN DE PAGO AUTOMÁTICO CON BINANCE PAY */}
        <div className={`rounded-3xl p-7 border-2 shadow-xl ${
          isDark ? "bg-[#1B1F27] border-[#F3BA2F]/40" : "bg-white border-[#F3BA2F]/60"
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3BA2F]/20 border border-[#F3BA2F]/40 text-[#F3BA2F] text-[10px] font-black uppercase tracking-wider">
                <span>₿ BINANCE PAY • ACREDITACIÓN AUTOMÁTICA 24/7</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                Recarga tu Wallet o Activa tu Plan al Instante con Binance Pay
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                Envía exactamente el valor del plan (mínimo <strong>$1.25 USDT</strong>) a nuestro Binance ID oficial <strong className="font-mono text-[#F3BA2F]">{BINANCE_UID}</strong> (verifica que el nombre de usuario sea <strong className="font-mono text-emerald-400">{BINANCE_USERNAME}</strong>). Luego ingresa tu <strong>Order ID (ID de Orden)</strong> para comprobar y acreditar tu pago automáticamente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={openBinanceModalForWallet}
                className="px-6 py-3.5 bg-[#F3BA2F] hover:bg-[#e5ad24] text-black text-xs font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Verificar Pago de Binance Pay Ahora</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MODAL INTERACTIVO DE BINANCE PAY (FORM -> VERIFYING -> SUCCESS)       */}
        {/* ===================================================================== */}
        {showBinanceModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className={`w-full max-w-xl rounded-3xl p-6 sm:p-7 border-2 shadow-2xl relative my-8 ${
              isDark ? "bg-[#171B22] border-[#F3BA2F]/50 text-white" : "bg-white border-[#F3BA2F] text-slate-900"
            }`}>
              {binanceStep !== "VERIFYING" && (
                <button
                  type="button"
                  onClick={() => setShowBinanceModal(false)}
                  className="absolute top-5 right-5 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* PASO 1: FORMULARIO DE INSTRUCCIONES Y ORDER ID */}
              {binanceStep === "FORM" && (
                <>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3BA2F] text-black flex items-center justify-center font-black text-2xl shadow-md flex-shrink-0">
                      ₿
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#F3BA2F] block">
                        Verificación Automática en Tiempo Real
                      </span>
                      <h2 className="text-lg sm:text-xl font-black">
                        Pagar con Binance Pay (Cripto)
                      </h2>
                    </div>
                  </div>

                  {/* Selector de Destino del Pago */}
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/25 border border-white/10 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setBinanceMode("WALLET");
                        setBinanceError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        binanceMode === "WALLET"
                          ? "bg-[#F3BA2F] text-black shadow-md"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      💼 Recargar Saldo a mi Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinanceMode("PLAN");
                        setBinanceError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        binanceMode === "PLAN"
                          ? "bg-[#F3BA2F] text-black shadow-md"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      ⚡ Activar un Plan Directo
                    </button>
                  </div>

                  {/* Selección de Monto Estipulado (WALLET) o Plan (PLAN) */}
                  {binanceMode === "WALLET" ? (
                    <div className="mb-5">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2">
                        Selecciona el valor estipulado a recargar (Mínimo $1.25 USD):
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {STIPULATED_AMOUNTS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setTopupAmount(item.value);
                              setTopupInputStr(item.value.toFixed(2));
                              setBinanceError(null);
                            }}
                            className={`px-3 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                              Number(topupInputStr) === item.value
                                ? "bg-[#F3BA2F]/20 border-[#F3BA2F] text-[#F3BA2F]"
                                : isDark
                                ? "bg-[#12151B] border-[#2D3340] text-neutral-300"
                                : "bg-slate-100 border-slate-300 text-slate-700"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <span className="text-xs font-black text-[#F3BA2F] absolute left-3.5 top-1/2 -translate-y-1/2">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="1.25"
                          value={topupInputStr}
                          onChange={(e) => {
                            setTopupInputStr(e.target.value);
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v)) setTopupAmount(v);
                          }}
                          className={`w-full pl-8 pr-16 py-2.5 rounded-xl border text-sm font-mono font-black focus:outline-none ${
                            isAmountTooLow
                              ? "border-red-500 bg-red-500/10 text-red-400"
                              : isDark
                              ? "bg-[#12151B] border-[#2D3340] text-white"
                              : "bg-slate-50 border-slate-300 text-slate-900"
                          }`}
                        />
                        <span className="text-[11px] font-bold text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2">
                          USDT
                        </span>
                      </div>

                      {isAmountTooLow && (
                        <div className="mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>
                            No se permite recargar menos de ${MIN_RECHARGE_USD.toFixed(2)} USD (valor mínimo estipulado en los planes).
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-5">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2">
                        Selecciona el plan que vas a comprar (debes enviar el valor exacto):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CLIENT_PLANS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setBinancePlan(p);
                              setBinanceError(null);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              binancePlan?.id === p.id
                                ? "bg-[#F3BA2F]/20 border-[#F3BA2F] text-white"
                                : isDark
                                ? "bg-[#12151B] border-[#2D3340] text-neutral-400"
                                : "bg-slate-100 border-slate-300 text-slate-700"
                            }`}
                          >
                            <div className="text-[11px] font-black truncate">{p.days} Día(s)</div>
                            <div className="text-sm font-black font-mono text-[#F3BA2F]">
                              ${p.priceUSD.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paso 1: Datos de la cuenta receptora */}
                  <div className={`p-4 rounded-2xl border mb-4 ${
                    isDark ? "bg-[#12151B] border-[#2D3340]" : "bg-slate-50 border-slate-300"
                  }`}>
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#F3BA2F] mb-2.5">
                      Paso 1: Envía el valor exacto en Binance Pay a nuestra cuenta
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? "bg-[#191D24] border-[#2D3340]" : "bg-white border-slate-200"
                      }`}>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block">
                            Binance ID (UID Receptor)
                          </span>
                          <span className="text-base font-black font-mono text-[#F3BA2F]">
                            {BINANCE_UID}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(BINANCE_UID, "uid")}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F3BA2F]/20 hover:bg-[#F3BA2F]/30 text-[#F3BA2F] text-xs font-black flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "uid" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "uid" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? "bg-[#191D24] border-[#2D3340]" : "bg-white border-slate-200"
                      }`}>
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block">
                            Usuario Oficial Receptor
                          </span>
                          <span className="text-base font-black font-mono text-emerald-400">
                            {BINANCE_USERNAME}
                          </span>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                          ✓ Verificado
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-400">
                        Monedas: <strong className="text-white">USDT, USDC o FDUSD</strong>
                      </span>
                      <span className="font-black text-[#F3BA2F]">
                        Monto exacto a enviar: $
                        {binanceMode === "PLAN"
                          ? binancePlan?.priceUSD.toFixed(2)
                          : isAmountTooLow
                          ? MIN_RECHARGE_USD.toFixed(2)
                          : parsedTopup.toFixed(2)}{" "}
                        USDT
                      </span>
                    </div>
                  </div>

                  {/* Paso 2: Instrucciones del Order ID */}
                  <div className={`p-4 rounded-2xl border mb-4 text-xs space-y-1.5 ${
                    isDark ? "bg-[#12151B] border-[#2D3340] text-neutral-300" : "bg-slate-50 border-slate-300 text-slate-700"
                  }`}>
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#229ED9] mb-1">
                      Paso 2: Copia el Order ID (ID de la Orden) de tu comprobante
                    </div>
                    <p>1. Verifica que al enviar a <strong>{BINANCE_UID}</strong> aparezca nuestro usuario <strong className="text-emerald-400">{BINANCE_USERNAME}</strong>.</p>
                    <p>2. Recuerda que <strong>no se permite enviar un monto menor</strong> al valor estipulado del plan.</p>
                    <p>3. En el comprobante de pago de Binance Pay copia el <strong>ID de la orden (Order ID)</strong> (ej: <code className="font-mono text-[#F3BA2F]">459634021363236864</code>) y pégalo aquí abajo.</p>
                  </div>

                  {/* Formulario de Verificación */}
                  <form onSubmit={handleVerifyBinancePayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black mb-1.5">
                        Order ID (ID de la Orden de Binance Pay):
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 459634021363236864"
                        value={binanceOrderId}
                        onChange={(e) => setBinanceOrderId(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-black tracking-wider focus:outline-none focus:ring-2 focus:ring-[#F3BA2F]/40 ${
                          isDark
                            ? "bg-[#12151B] border-[#2D3340] text-white placeholder:text-neutral-500"
                            : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>

                    {binanceError && (
                      <div className="p-3.5 rounded-xl border bg-red-500/15 border-red-500/30 text-red-400 text-xs font-bold flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{binanceError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={binanceMode === "WALLET" && isAmountTooLow}
                      className="w-full py-3.5 px-5 bg-[#F3BA2F] hover:bg-[#e5ad24] text-black text-xs font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {binanceMode === "PLAN"
                          ? `⚡ Comprobar Pago y Activar ${binancePlan?.name} ($${binancePlan?.priceUSD.toFixed(2)})`
                          : `⚡ Comprobar Pago y Acreditar $${isAmountTooLow ? MIN_RECHARGE_USD.toFixed(2) : parsedTopup.toFixed(2)} USD en mi Wallet`}
                      </span>
                    </button>
                  </form>
                </>
              )}

              {/* PASO 2: ANIMACIÓN DE "COMPROBANDO TU PAGO..." */}
              {binanceStep === "VERIFYING" && (
                <div className="py-12 px-4 text-center space-y-5">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-[#F3BA2F]/20 border-t-[#F3BA2F] animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-[#229ED9]/20 border-b-[#229ED9] animate-spin" />
                    <div className="w-14 h-14 rounded-2xl bg-[#F3BA2F] text-black flex items-center justify-center font-black text-3xl shadow-lg">
                      ₿
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3BA2F]/20 text-[#F3BA2F] text-[10px] font-black uppercase tracking-widest">
                      <Loader2 className="w-3 h-3 animate-spin" /> Conectando con Binance Pay
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black">
                      Comprobando tu pago...
                    </h3>
                    <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      Estamos verificando el Order ID <strong className="font-mono text-[#F3BA2F]">{binanceOrderId}</strong> en la cuenta oficial <strong className="text-emerald-400">{BINANCE_USERNAME}</strong> y registrando tu operación en la base de datos.
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 3: ANIMACIÓN DE ÉXITO (RECARGA EXITOSA O PLAN COMPRADO EXITOSAMENTE) */}
              {binanceStep === "SUCCESS" && binanceSuccessData && (
                <div className="py-8 px-2 text-center space-y-5">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                      <CheckCircle2 className="w-11 h-11" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      ✓ PAGO CONFIRMADO Y GUARDADO
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-emerald-400">
                      {binanceSuccessData.title}
                    </h3>
                    <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                      {binanceSuccessData.subtitle}
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border text-left text-xs space-y-2 max-w-md mx-auto ${
                    isDark ? "bg-[#12151B] border-[#2D3340]" : "bg-slate-50 border-slate-300"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Order ID Verificado:</span>
                      <span className="font-mono font-black text-[#F3BA2F]">{binanceSuccessData.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Monto Confirmado:</span>
                      <span className="font-mono font-black text-emerald-400">
                        +${binanceSuccessData.amountPaid.toFixed(2)} {binanceSuccessData.currency}
                      </span>
                    </div>
                    {binanceSuccessData.mode === "PLAN" && binanceSuccessData.planName && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Plan Activado:</span>
                        <span className="font-black text-[#229ED9]">
                          {binanceSuccessData.planName} (+{binanceSuccessData.daysAdded} días)
                        </span>
                      </div>
                    )}
                    {binanceSuccessData.mode === "WALLET" && binanceSuccessData.newBalance !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Nuevo Saldo en Wallet:</span>
                        <span className="font-mono font-black text-white">
                          ${Number(binanceSuccessData.newBalance).toFixed(2)} USD
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {binanceSuccessData.mode === "PLAN" ? (
                      <Link
                        href="/dashboard/campaigns"
                        onClick={() => setShowBinanceModal(false)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all"
                      >
                        🚀 Ir a Mis Campañas Ahora
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBinanceModal(false)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                      >
                        ✓ Usar mi Saldo para Activar un Plan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                      $3.00 USD / Ciclo
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
                        <strong>+25 Grupos y +100 Envíos Extra:</strong> Cada cuenta extra vinculada te permite escanear sus propios grupos independientes y suma +25 grupos y +100 publicaciones diarias durante tu ciclo activo.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Vigencia sincronizada con tu plan:</strong> La cuenta extra permanece activa durante la vigencia de tu plan actual (y se renueva por ciclo junto con tu membresía, o puedes elegir el Plan Quincenal/Mensual que ya incluyen 2 y 3 cuentas).
                      </span>
                    </div>
                  </div>

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
                    onClick={() => {
                      setShowAddonModal(false);
                      setModalPhone("");
                      setModalCode("");
                      setModalStep("INFO");
                    }}
                    className="px-6 py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    Listo, Cerrar
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
