"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import {
  CreditCard, CheckCircle2, Clock,
  Tag, Wallet, AlertCircle, History, PlusCircle,
  X, PhoneCall, KeyRound, HelpCircle, Copy, Check, ShieldCheck, ArrowRight, ArrowLeft, Loader2
} from "lucide-react";

const BINANCE_UID = "1158258762";
const BINANCE_USERNAME = "streamofi";
const MIN_RECHARGE_USD = 1.50;

// Icono Oficial Vectorial de Binance
function BinanceIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 126.61 126.61" fill="currentColor" className={className} aria-hidden="true">
      <path d="M38.73 53.2l24.59-24.58 24.6 24.6 14.3-14.31L63.32 0 24.43 38.89l14.3 14.31zM0 63.31l14.3-14.3 14.31 14.3-14.31 14.3L0 63.31zm38.73 10.11l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.9-38.88 14.3-14.31zm59.17-10.12l14.31-14.3 14.3 14.3-14.3 14.3-14.31-14.3z" />
      <path d="M77.83 63.3L63.32 48.78 52.59 59.51l-1.24 1.23-2.54 2.54 14.51 14.52 14.51-14.5z" />
    </svg>
  );
}

const CLIENT_PLANS = [
  {
    id: "plan-1",
    name: "Pase Express (1 Día)",
    shortName: "1 Día",
    days: 1,
    priceUSD: 1.50,
    dailyEquivalent: 1.50,
    description: "Difusión continua durante 24 horas para anuncios rápidos.",
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
    shortName: "7 Días",
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
      "Ahorro del 33% vs tarifa diaria",
    ],
  },
  {
    id: "plan-3",
    name: "Plan Quincenal (15 Días)",
    shortName: "15 Días",
    days: 15,
    priceUSD: 13.50,
    dailyEquivalent: 0.90,
    description: "Solo $0.90/día. Ideal para campañas y anuncios permanentes.",
    maxGroups: "100",
    maxDailyPosts: 300,
    maxCampaigns: 5,
    maxTelegramAccounts: 2,
    isPopular: false,
    features: [
      "Hasta 100 grupos de destino",
      "Hasta 5 campañas activas en rotación",
      "300 publicaciones automáticas / día",
      "Incluye hasta 2 Cuentas de Telegram",
      "Ahorro del 40% vs tarifa diaria",
    ],
  },
  {
    id: "plan-4",
    name: "Plan Mensual (30 Días)",
    shortName: "30 Días",
    days: 30,
    priceUSD: 24.00,
    dailyEquivalent: 0.80,
    description: "Nuestra tarifa más económica: solo $0.80/día. Alcance total.",
    maxGroups: "Ilimitados",
    maxDailyPosts: 500,
    maxCampaigns: 8,
    maxTelegramAccounts: 3,
    isPopular: false,
    features: [
      "Grupos de destino Ilimitados",
      "Hasta 8 campañas activas en rotación",
      "500 publicaciones automáticas / día",
      "Incluye hasta 3 Cuentas de Telegram",
      "Ahorro máximo del 47%",
    ],
  },
];

const STIPULATED_AMOUNTS = [
  { label: "$1.50", desc: "1 Día", value: 1.50 },
  { label: "$3.00", desc: "Cuenta Extra", value: 3.00 },
  { label: "$7.00", desc: "7 Días", value: 7.00 },
  { label: "$13.50", desc: "15 Días", value: 13.50 },
  { label: "$24.00", desc: "30 Días", value: 24.00 },
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
  const [customAmountStr, setCustomAmountStr] = useState<string>("7.00");

  // Modal de Binance Pay en 2 pasos compactos sin scroll:
  // STEP_1_SEND -> STEP_2_VERIFY -> VERIFYING -> SUCCESS
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [binanceStep, setBinanceStep] = useState<"STEP_1_SEND" | "STEP_2_VERIFY" | "VERIFYING" | "SUCCESS">("STEP_1_SEND");
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

  // Modal de Cuenta Adicional de Telegram
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

  const selectPresetAmount = (amt: number) => {
    setTopupAmount(amt);
    setCustomAmountStr(amt.toFixed(2));
  };

  const handleCustomAmountInput = (raw: string) => {
    setCustomAmountStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      setTopupAmount(parsed);
    } else {
      setTopupAmount(0);
    }
  };

  const isAmountBelowMin = isNaN(topupAmount) || topupAmount < MIN_RECHARGE_USD;

  // Abre el modal de Binance Pay conservando exactamente el monto que el cliente seleccionó o escribió
  const openBinanceModalForWallet = (customAmount?: number) => {
    if (customAmount !== undefined) {
      const validAmt = customAmount >= MIN_RECHARGE_USD ? customAmount : MIN_RECHARGE_USD;
      setTopupAmount(validAmt);
      setCustomAmountStr(validAmt.toFixed(2));
    }
    setBinanceMode("WALLET");
    setBinanceStep("STEP_1_SEND");
    setBinanceOrderId("");
    setBinanceError(null);
    setBinanceSuccessData(null);
    setShowBinanceModal(true);
  };

  // Abre el modal de Binance Pay directamente con el plan elegido y su valor exacto
  const openBinanceModalForPlan = (plan: any) => {
    setBinanceMode("PLAN");
    setBinancePlan(plan);
    setBinanceStep("STEP_1_SEND");
    setBinanceOrderId("");
    setBinanceError(null);
    setBinanceSuccessData(null);
    setShowBinanceModal(true);
  };

  // Monto exacto actual según la pestaña activa
  const exactUSDTAmount =
    binanceMode === "PLAN"
      ? Number(binancePlan?.priceUSD || 1.50).toFixed(2)
      : Number(isAmountBelowMin ? MIN_RECHARGE_USD : topupAmount).toFixed(2);

  const handleVerifyBinancePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBinanceError(null);

    if (!binanceOrderId.trim()) {
      setBinanceError("Ingresa el Order ID (ID de la Orden) de tu comprobante de Binance Pay.");
      return;
    }

    if (binanceMode === "WALLET" && topupAmount < MIN_RECHARGE_USD) {
      setBinanceError(
        `No se permite recargar menos de $${MIN_RECHARGE_USD.toFixed(2)} USDT.`
      );
      return;
    }

    setBinanceStep("VERIFYING");

    try {
      const [res] = await Promise.all([
        fetch("/api/wallet/binance-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: binanceOrderId.trim(),
            mode: binanceMode,
            planId: binanceMode === "PLAN" ? binancePlan?.id : undefined,
            expectedAmount: binanceMode === "WALLET" ? topupAmount : binancePlan?.priceUSD,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
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
        currency: "USDT",
        orderId: data.orderId || binanceOrderId.trim(),
        planName: data.planName,
        daysAdded: data.daysAdded,
        newBalance: data.newBalance,
      });

      setFeedback({ message: data.message, isError: false });
      setBinanceOrderId("");
      setBinanceStep("SUCCESS");
    } catch (err: any) {
      setBinanceStep("STEP_2_VERIFY");
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
      isDark ? "bg-[#0F1319] text-slate-100" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-6 sm:p-8 max-w-6xl w-full mx-auto">
        {/* Encabezado Principal */}
        <div className="mb-7">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">
            Mi Billetera (Wallet) & Planes de Membresía
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Recarga saldo automáticamente con <strong>Binance Pay (USDT)</strong> o activa tus planes al instante.
          </p>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.isError
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}>
            {feedback.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SECCIÓN SUPERIOR: BILLETERA VIRTUAL (WALLET) + VIGENCIA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Tarjeta de Wallet */}
          <div className={`lg:col-span-7 rounded-2xl p-6 border flex flex-col justify-between ${
            isDark
              ? "bg-[#151A23] border-[#262F3F]"
              : "bg-white border-slate-300"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-500/15">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Saldo Disponible en Wallet
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-bold font-mono tracking-tight">
                      ${walletBalance.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">USD</span>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-[11px] font-mono text-slate-300">
                    <span>Código ID: {sessionUser?.botCode || "BOT-I------"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Monto a recargar (Mínimo $1.50 USD):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1.50, 7.00, 13.50, 24.00].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => selectPresetAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                        topupAmount === amt && !isAmountBelowMin
                          ? "bg-[#FCD535] text-[#1E2329] border-[#FCD535]"
                          : isDark
                          ? "bg-[#1C222E] text-slate-300 border-[#2D3648] hover:border-slate-500"
                          : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      +${amt.toFixed(2)}
                    </button>
                  ))}
                </div>

                {/* Campo Libre en Dólares (USD / USDT) */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Otro valor:</span>
                  <div className="relative">
                    <span className="text-xs font-mono font-semibold text-[#FCD535] absolute left-2 top-1/2 -translate-y-1/2">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="1.50"
                      placeholder="1.50"
                      value={customAmountStr}
                      onChange={(e) => handleCustomAmountInput(e.target.value)}
                      className={`w-24 pl-5 pr-2 py-1 rounded-lg text-xs font-mono font-bold border focus:outline-none focus:border-[#FCD535] ${
                        isAmountBelowMin
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : isDark
                          ? "bg-[#10141B] border-[#2D3648] text-white"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">USD</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className={`text-xs leading-relaxed max-w-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Envía <strong className="font-mono text-[#FCD535]">${(isAmountBelowMin ? MIN_RECHARGE_USD : topupAmount).toFixed(2)} USDT</strong> a nuestro Binance UID <strong className="font-mono text-slate-200">{BINANCE_UID}</strong> (<strong className="text-emerald-400">{BINANCE_USERNAME}</strong>) y acredita tu saldo en segundos.
              </div>

              <button
                type="button"
                disabled={isAmountBelowMin}
                onClick={() => openBinanceModalForWallet(topupAmount)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FCD535] hover:bg-[#F0B90B] text-[#1E2329] text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40"
              >
                <BinanceIcon className="w-4 h-4 text-[#1E2329]" />
                <span>Recargar ${(isAmountBelowMin ? MIN_RECHARGE_USD : topupAmount).toFixed(2)} con Binance Pay</span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Vigencia Actual */}
          <div className={`lg:col-span-5 rounded-2xl p-6 border flex flex-col justify-between ${
            isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-300"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38BDF8]">
                  Estado de tu Suscripción
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                  membership?.hasAccess
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}>
                  {membership?.hasAccess ? "Activa 24/7" : "Expirada"}
                </span>
              </div>

              <div className="flex items-center gap-3.5 my-2">
                <div className="w-11 h-11 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 text-[#38BDF8] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {membership?.daysRemaining ?? 0} Día(s) Restante(s)
                  </div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Los días nuevos se acumulan a tu vigencia actual.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs mt-4 space-y-1.5 ${
              isDark ? "bg-[#10141B] border-[#222A38] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-400">Campañas permitidas:</span>
                <span className="font-semibold text-[#38BDF8]">Hasta {sessionUser?.subscription?.maxCampaigns || 2} activas</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-400">Cuentas Telegram:</span>
                <span className="font-semibold text-emerald-400">
                  {linkedAccounts.length} vinculada(s) / {maxAccountsAllowed} permitida(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN CUENTA ADICIONAL DE TELEGRAM ($3.00 USD / CICLO) */}
        <div className={`mb-8 rounded-2xl p-5 sm:p-6 border flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
          isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-300"
        }`}>
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 text-[#38BDF8] flex items-center justify-center flex-shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-sm sm:text-base font-bold">
                  ¿Necesitas conectar otra Cuenta de Telegram con +25 Grupos y +100 Envíos/día?
                </h3>
                <span className="inline-flex items-center whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  $3.00 USD / Ciclo
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Agrega un número adicional de Telegram durante tu ciclo activo. Cada cuenta extra suma <strong>+25 grupos independientes</strong> y <strong>+100 publicaciones diarias</strong>.
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
              className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Cuenta TG ($3.00 USD)</span>
            </button>
          </div>
        </div>

        {/* CUADRÍCULA DE 4 PLANES (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CLIENT_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            const canAffordWithWallet = walletBalance >= plan.priceUSD;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-2xl p-6 border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-[#0284C7] ring-1 ring-[#0284C7]/40"
                    : isDark
                    ? "border-[#262F3F] hover:border-slate-600"
                    : "border-slate-300 hover:border-slate-400"
                } ${isDark ? "bg-[#151A23]" : "bg-white"}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 right-5 px-3 py-0.5 bg-[#0284C7] text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                    Más Elegido
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {plan.description}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#0284C7]/15 text-[#38BDF8] whitespace-nowrap">
                      +{plan.days} {plan.days === 1 ? "Día" : "Días"}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border my-4 flex items-center justify-between ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold font-mono">${plan.priceUSD.toFixed(2)}</span>
                        <span className="text-xs font-medium text-slate-400">USD / Ciclo</span>
                      </div>
                      <div className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Equivale a ${plan.dailyEquivalent.toFixed(2)} / día</span>
                      </div>
                    </div>

                    <div className={`text-right text-[11px] space-y-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      <div>Máx. <strong className="text-slate-200">{plan.maxGroups} grupos</strong></div>
                      <div><strong className="text-slate-200">{plan.maxDailyPosts} envíos</strong> / día</div>
                      <div>Hasta <strong className="text-slate-200">{plan.maxCampaigns} campañas</strong></div>
                      <div><strong className="text-slate-200">{plan.maxTelegramAccounts} cuenta(s)</strong> TG</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className={isDark ? "text-slate-300" : "text-slate-700"}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-500/15">
                  <button
                    type="button"
                    disabled={purchasing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayWithWallet(plan);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      canAffordWithWallet
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : isDark
                        ? "bg-[#1C222E] hover:bg-[#252D3D] text-slate-300 border border-[#2D3648]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>
                      {purchasing && selectedPlan.id === plan.id
                        ? "Procesando..."
                        : canAffordWithWallet
                        ? `Activar con mi Wallet (-$${plan.priceUSD.toFixed(2)} USD)`
                        : `Pagar con Wallet (Disponible: $${walletBalance.toFixed(2)} USD)`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openBinanceModalForPlan(plan);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#FCD535] hover:bg-[#F0B90B] text-[#1E2329] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BinanceIcon className="w-4 h-4 text-[#1E2329]" />
                    <span>Pagar con Binance Pay (${plan.priceUSD.toFixed(2)} USDT)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial Reciente de Wallet */}
        {transactions.length > 0 && (
          <div className={`mb-8 rounded-2xl p-6 border ${
            isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-300"
          }`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-4">
              <History className="w-4 h-4" />
              <span>Movimientos Recientes de tu Wallet</span>
            </div>
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{tx.description}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-sm ${
                    tx.type === "CREDIT" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"}${Number(tx.amount).toFixed(2)} USD
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL DE BINANCE PAY EN 2 PASOS COMPACTOS (SIN SCROLL EN PC)          */}
        {/* ===================================================================== */}
        {showBinanceModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl relative ${
              isDark ? "bg-[#151A23] border-[#2A3446] text-slate-100" : "bg-white border-slate-300 text-slate-900"
            }`}>
              {/* Encabezado limpio con botón X separado */}
              {(binanceStep === "STEP_1_SEND" || binanceStep === "STEP_2_VERIFY") && (
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD535] text-[#1E2329] flex items-center justify-center flex-shrink-0">
                      <BinanceIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold">
                          Binance Pay • Pago en USDT
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FCD535]/15 text-[#FCD535] border border-[#FCD535]/30">
                          {binanceStep === "STEP_1_SEND" ? "Paso 1 de 2" : "Paso 2 de 2"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Acreditación automática verificando tu Order ID
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBinanceModal(false)}
                    className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* PASO 1 DE 2: DATOS EXACTOS DE ENVÍO Y COPIA DE MONTO/UID */}
              {binanceStep === "STEP_1_SEND" && (
                <div className="space-y-4">
                  {/* Selector de Modalidad (Recargar Wallet vs Activar Plan Directo) */}
                  <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                    isDark ? "bg-[#0F1319] border-[#222A38]" : "bg-slate-100 border-slate-200"
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setBinanceMode("WALLET");
                        setBinanceError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        binanceMode === "WALLET"
                          ? "bg-[#FCD535] text-[#1E2329]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Recargar mi Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinanceMode("PLAN");
                        setBinanceError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        binanceMode === "PLAN"
                          ? "bg-[#FCD535] text-[#1E2329]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Activar Plan Directo
                    </button>
                  </div>

                  {/* Selector rápido de valores estipulados + Campo Libre en USD */}
                  {binanceMode === "WALLET" ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="block text-[11px] font-semibold text-slate-400">
                          Monto a recargar en tu Wallet (mínimo $1.50 USD):
                        </span>
                        {isAmountBelowMin && (
                          <span className="text-[10px] text-red-400 font-semibold">
                            Mínimo $1.50 USD
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {STIPULATED_AMOUNTS.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => selectPresetAmount(item.value)}
                            className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                              topupAmount === item.value && !isAmountBelowMin
                                ? "bg-[#FCD535]/15 border-[#FCD535] text-[#FCD535]"
                                : isDark
                                ? "bg-[#10141B] border-[#222A38] text-slate-300 hover:border-slate-600"
                                : "bg-slate-50 border-slate-300 text-slate-700"
                            }`}
                          >
                            <div className="text-xs font-bold font-mono">{item.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Campo libre para que el usuario ingrese el monto que desee (>= $1.50 USD) */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          O escribe otro valor:
                        </span>
                        <div className="relative flex-1">
                          <span className="text-xs font-mono font-semibold text-[#FCD535] absolute left-3 top-1/2 -translate-y-1/2">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.50"
                            min="1.50"
                            placeholder="Ej: 15.00"
                            value={customAmountStr}
                            onChange={(e) => handleCustomAmountInput(e.target.value)}
                            className={`w-full pl-7 pr-12 py-1.5 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-[#FCD535] ${
                              isAmountBelowMin
                                ? "border-red-500 bg-red-500/10 text-red-400"
                                : isDark
                                ? "bg-[#10141B] border-[#2D3648] text-white"
                                : "bg-slate-50 border-slate-300 text-slate-900"
                            }`}
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                            USD
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Elige el plan a activar con tu pago:
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {CLIENT_PLANS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setBinancePlan(p)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              binancePlan?.id === p.id
                                ? "bg-[#FCD535]/15 border-[#FCD535] text-[#FCD535]"
                                : isDark
                                ? "bg-[#10141B] border-[#222A38] text-slate-300 hover:border-slate-600"
                                : "bg-slate-50 border-slate-300 text-slate-700"
                            }`}
                          >
                            <div className="text-[11px] font-semibold">{p.shortName}</div>
                            <div className="text-sm font-bold font-mono mt-0.5">
                              ${p.priceUSD.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Datos exactos para copiar y pegar en Binance Pay */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Moneda aceptada en Binance Pay:</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded">
                        Solo USDT
                      </span>
                    </div>

                    {/* Fila 1: UID Receptor + Usuario */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-200"
                      }`}>
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">
                            Binance ID (UID)
                          </span>
                          <span className="text-sm font-bold font-mono text-[#FCD535]">
                            {BINANCE_UID}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(BINANCE_UID, "uid")}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FCD535]/15 hover:bg-[#FCD535]/25 text-[#FCD535] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedField === "uid" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "uid" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? "bg-[#151A23] border-[#262F3F]" : "bg-white border-slate-200"
                      }`}>
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">
                            Usuario Receptor
                          </span>
                          <span className="text-sm font-bold font-mono text-emerald-400">
                            {BINANCE_USERNAME}
                          </span>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold">
                          ✓ Oficial
                        </span>
                      </div>
                    </div>

                    {/* Fila 2: Monto Exacto a Enviar con Botón de Copiar Valor */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDark ? "bg-[#151A23] border-[#FCD535]/40" : "bg-white border-amber-400"
                    }`}>
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">
                          Valor exacto a enviar (no se permite enviar menos):
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-lg font-bold font-mono text-[#FCD535]">
                            {exactUSDTAmount}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">USDT</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(exactUSDTAmount, "amount")}
                        className="px-3 py-1.5 rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-[#1E2329] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedField === "amount" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "amount" ? "¡Monto Copiado!" : `Copiar ${exactUSDTAmount}`}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={binanceMode === "WALLET" && isAmountBelowMin}
                    onClick={() => {
                      if (binanceMode === "WALLET" && isAmountBelowMin) return;
                      setBinanceError(null);
                      setBinanceStep("STEP_2_VERIFY");
                    }}
                    className="w-full py-3 px-4 bg-[#FCD535] hover:bg-[#F0B90B] disabled:opacity-40 text-[#1E2329] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ya envié los {exactUSDTAmount} USDT → Ingresar mi Order ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* PASO 2 DE 2: INGRESAR ORDER ID Y VERIFICAR */}
              {binanceStep === "STEP_2_VERIFY" && (
                <form onSubmit={handleVerifyBinancePayment} className="space-y-4">
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <span className="text-slate-400 block">Operación seleccionada:</span>
                      <span className="font-semibold text-white">
                        {binanceMode === "PLAN"
                          ? `Activar ${binancePlan?.name}`
                          : "Recarga de Saldo en Wallet"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Valor requerido:</span>
                      <span className="font-mono font-bold text-[#FCD535]">{exactUSDTAmount} USDT</span>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isDark ? "bg-[#10141B] border-[#222A38] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <div className="font-semibold text-[#38BDF8]">
                      ¿Dónde encuentro mi Order ID (ID de la Orden)?
                    </div>
                    <p>1. En el comprobante de tu envío a <strong className="text-emerald-400">{BINANCE_USERNAME}</strong> ({BINANCE_UID}), busca el campo <strong>ID de la orden (Order ID)</strong>.</p>
                    <p>2. Es un número de ~18 dígitos (ejemplo: <code className="font-mono text-[#FCD535]">459634021363236864</code>). Cópialo y pégalo abajo:</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Order ID de tu pago en Binance Pay:
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Pega aquí los 18 dígitos de tu Order ID"
                      value={binanceOrderId}
                      onChange={(e) => setBinanceOrderId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-semibold focus:outline-none focus:border-[#FCD535] ${
                        isDark
                          ? "bg-[#10141B] border-[#262F3F] text-white placeholder:text-slate-500"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>

                  {binanceError && (
                    <div className="p-3 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{binanceError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBinanceError(null);
                        setBinanceStep("STEP_1_SEND");
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? "bg-[#10141B] border-[#262F3F] text-slate-300 hover:text-white"
                          : "bg-slate-100 border-slate-300 text-slate-700"
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Paso 1</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-[#FCD535] hover:bg-[#F0B90B] text-[#1E2329] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {binanceMode === "PLAN"
                          ? `Comprobar Pago y Activar ${binancePlan?.shortName}`
                          : `Comprobar Pago y Acreditar $${exactUSDTAmount} USDT`}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* ANIMACIÓN DE "COMPROBANDO TU PAGO..." */}
              {binanceStep === "VERIFYING" && (
                <div className="py-10 px-4 text-center space-y-4">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-[#FCD535]/20 border-t-[#FCD535] animate-spin" />
                    <div className="w-12 h-12 rounded-xl bg-[#FCD535] text-[#1E2329] flex items-center justify-center">
                      <BinanceIcon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FCD535]/15 text-[#FCD535] text-[11px] font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verificando con Binance Pay
                    </span>
                    <h3 className="text-lg font-bold">
                      Comprobando tu pago...
                    </h3>
                    <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Confirmando el Order ID <strong className="font-mono text-[#FCD535]">{binanceOrderId}</strong> en la cuenta <strong className="text-emerald-400">{BINANCE_USERNAME}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* ANIMACIÓN DE ÉXITO */}
              {binanceStep === "SUCCESS" && binanceSuccessData && (
                <div className="py-6 px-2 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                      Operación Confirmada
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-emerald-400">
                      {binanceSuccessData.title}
                    </h3>
                    <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {binanceSuccessData.subtitle}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-left text-xs space-y-2 max-w-md mx-auto ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Order ID Verificado:</span>
                      <span className="font-mono font-semibold text-[#FCD535]">{binanceSuccessData.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monto Confirmado:</span>
                      <span className="font-mono font-semibold text-emerald-400">
                        +${binanceSuccessData.amountPaid.toFixed(2)} {binanceSuccessData.currency}
                      </span>
                    </div>
                    {binanceSuccessData.mode === "PLAN" && binanceSuccessData.planName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Plan Activado:</span>
                        <span className="font-semibold text-[#38BDF8]">
                          {binanceSuccessData.planName} (+{binanceSuccessData.daysAdded} días)
                        </span>
                      </div>
                    )}
                    {binanceSuccessData.mode === "WALLET" && binanceSuccessData.newBalance !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nuevo Saldo en Wallet:</span>
                        <span className="font-mono font-semibold text-white">
                          ${Number(binanceSuccessData.newBalance).toFixed(2)} USD
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    {binanceSuccessData.mode === "PLAN" ? (
                      <Link
                        href="/dashboard/campaigns"
                        onClick={() => setShowBinanceModal(false)}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        Ir a Mis Campañas Ahora →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBinanceModal(false)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Listo, Usar mi Saldo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL ELEGANTE: ADICIONAR +1 CUENTA DE TELEGRAM (SIN BOTONES CHILLONES) */}
        {/* ===================================================================== */}
        {showAddonModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl relative ${
              isDark ? "bg-[#151A23] border-[#2A3446] text-slate-100" : "bg-white border-slate-300 text-slate-900"
            }`}>
              {/* Header limpio con el botón X a la derecha sin montarse sobre el badge */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 text-[#38BDF8] flex items-center justify-center flex-shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold">
                        Adicionar +1 Cuenta de Telegram
                      </h2>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#0284C7]/15 text-[#38BDF8] border border-[#0284C7]/30 whitespace-nowrap">
                        Valor: $3.00 USD / Ciclo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cuentas conectadas: <strong>{linkedAccounts.length}</strong> de <strong>{maxAccountsAllowed} permitida(s)</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddonModal(false)}
                  className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalStep === "INFO" && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                    isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5 text-xs">
                      <HelpCircle className="w-4 h-4" />
                      <span>Beneficios y condiciones de una cuenta adicional</span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Conecta otro número de teléfono:</strong> Vincula una cuenta secundaria de Telegram sin desconectar tu número principal.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>+25 Grupos y +100 Envíos Diarios:</strong> Cada cuenta extra escanea sus propios grupos y amplía tu capacidad diaria en +25 grupos y +100 publicaciones.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Sincronizada con tu ciclo activo:</strong> Permanece activa durante la vigencia de tu plan actual (o elige los planes Quincenal/Mensual que ya incluyen 2 y 3 cuentas).
                      </span>
                    </div>
                  </div>

                  {linkedAccounts.length > 0 && (
                    <div className={`p-3.5 rounded-xl border text-xs ${
                      isDark ? "bg-[#10141B] border-[#222A38]" : "bg-slate-50 border-slate-200"
                    }`}>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                        Cuentas vinculadas actualmente:
                      </span>
                      <div className="space-y-1.5">
                        {linkedAccounts.map((acc: any, idx: number) => (
                          <div key={acc.id} className="flex items-center justify-between font-mono text-xs">
                            <span>#{idx + 1} • {acc.firstName || "Telegram"} ({acc.phoneNumber})</span>
                            <span className="text-[10px] font-semibold text-emerald-400">● Conectada</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={purchasingAddon}
                      onClick={handleUnlockExtraAccountInModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {purchasingAddon
                        ? "Desbloqueando cupo..."
                        : "Desbloquear +1 Cupo con mi Wallet (-$3.00 USD)"}
                    </button>

                    {hasFreeAccountSlot && (
                      <button
                        type="button"
                        onClick={() => setModalStep("PHONE")}
                        className={`w-full sm:w-auto py-2.5 px-4 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isDark
                            ? "bg-[#1C222E] hover:bg-[#252D3D] border-[#2E384D] text-slate-200"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                        }`}
                      >
                        Vincular Número Ya →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {modalStep === "PHONE" && (
                <form onSubmit={handleModalSendCode} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                    ✓ Cupo disponible. Ingresa el número de teléfono de Telegram que deseas vincular:
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Número de Teléfono (con código de país, ej: +57...)
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="+573001234567"
                        value={modalPhone}
                        onChange={(e) => setModalPhone(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono font-semibold ${
                          isDark ? "bg-[#10141B] border-[#262F3F] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setModalStep("INFO")}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        isDark ? "bg-[#10141B] border-[#262F3F] text-slate-300 hover:text-white" : "bg-slate-100 border-slate-300 text-slate-700"
                      }`}
                    >
                      ← Volver
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex-1 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {modalLoading ? "Enviando código..." : "Enviar Código de 5 Dígitos a Telegram"}
                    </button>
                  </div>
                </form>
              )}

              {modalStep === "CODE" && (
                <form onSubmit={handleModalVerifyCode} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 text-[#38BDF8] text-xs font-medium">
                    Enviamos un código oficial de 5 dígitos a la app de Telegram del número <strong>{modalPhone}</strong>.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Código de Verificación de Telegram
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="12345"
                        value={modalCode}
                        onChange={(e) => setModalCode(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono font-bold tracking-widest ${
                          isDark ? "bg-[#10141B] border-[#262F3F] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {modalLoading ? "Verificando sesión..." : "Confirmar y Conectar Cuenta"}
                  </button>
                </form>
              )}

              {modalStep === "SUCCESS" && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">¡Cuenta de Telegram Vinculada!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      El número <strong>{modalPhone}</strong> ya quedó activo en tu panel de OttBot.
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
                    className="px-6 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-xl cursor-pointer"
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
