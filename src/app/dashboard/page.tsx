"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Plus, Pause, AlertCircle, Clock, 
  CheckCircle2, MessageSquare, Activity, 
  RefreshCw, Rocket, XCircle, Users, Edit3, BookmarkCheck,
  ChevronLeft, ChevronRight, Zap, BookOpen, Smartphone, BarChart3, MousePointerClick, Layers, ShieldCheck
} from "lucide-react";

function formatRestCountdown(nextRunAt: string | null, intervalMinutes: number, nowMs: number) {
  if (!nextRunAt) {
    return `${intervalMinutes}m 00s`;
  }
  const targetMs = new Date(nextRunAt).getTime();
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  if (diffSec === 0) {
    return "00m 00s";
  }
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hrs > 0) {
    return `${hrs * 60 + mins}m ${String(secs).padStart(2, "0")}s`;
  }
  return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"CAMPAIGNS" | "METRICS">("CAMPAIGNS");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);
  const [broadcastStartMs, setBroadcastStartMs] = useState<Record<string, number>>({});
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);
  const [campaignPage, setCampaignPage] = useState(1);
  // Paginación independiente cada 5 grupos para "Últimos Grupos donde se Publicó" en cada campaña
  const [logPageByCampaign, setLogPageByCampaign] = useState<Record<string, number>>({});
  const [metricsGroupPage, setMetricsGroupPage] = useState(1);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const campaignsPerPage = 12;
  const logsPerPage = 5;
  const metricsPerPage = 10;

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Sincronización silenciosa en vivo cada 6 segundos para reflejar cada grupo publicado
    const pollInterval = setInterval(fetchDashboard, 6000);
    // Reloj en tiempo real (1 segundo) para que la barra baje exactamente de 60s a 0s
    const clockInterval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const toggleCampaign = async (id: string, currentStatus: string) => {
    try {
      setActionLoading(id);
      setBroadcastFeedback(null);
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) {
        setBroadcastFeedback({
          id,
          message: result.error || "No se pudo cambiar el estado",
          isError: true,
        });
      } else {
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerBroadcast = async (campaignId: string, isPaidExtraRound = false) => {
    try {
      setBroadcastingId(campaignId);
      setBroadcastStartMs((prev) => ({ ...prev, [campaignId]: Date.now() }));
      setBroadcastFeedback(null);

      const res = await fetch("/api/campaigns/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, isPaidExtraRound }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Ocurrió un error al emitir a Telegram");
      }

      setBroadcastFeedback({
        id: campaignId,
        message: result.message || "¡Secuencia de difusión en vivo iniciada!",
      });

      await fetchDashboard();
    } catch (err: any) {
      setBroadcastFeedback({
        id: campaignId,
        message: err.message || "Error al emitir en los grupos",
        isError: true,
      });
    } finally {
      setBroadcastingId(null);
    }
  };

  // Eliminar con 1 clic un grupo que haya arrojado error en la campaña para evitar bloqueos
  const handleRemoveErroredGroup = async (campaign: any, groupToRemove: string) => {
    try {
      setActionLoading(campaign.id);
      const currentTargets: string[] = Array.isArray(campaign.targetGroupIds)
        ? campaign.targetGroupIds
        : [];
      const updatedTargets = currentTargets.filter(
        (g) => g.toLowerCase() !== groupToRemove.toLowerCase()
      );

      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaign.id,
          targetGroupIds: updatedTargets,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "No se pudo quitar el grupo con error");
      }
      setBroadcastFeedback({
        id: campaign.id,
        message: `✅ Grupo "${groupToRemove}" eliminado de la campaña para proteger tu cuenta y la Granja contra bloqueos.`,
        isError: false,
      });
      await fetchDashboard();
    } catch (err: any) {
      setBroadcastFeedback({
        id: campaign.id,
        message: err.message || "Error al eliminar el grupo",
        isError: true,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const membership = data?.membership;
  const allCampaigns = data?.campaigns || [];
  const activeCampaigns = allCampaigns.filter((c: any) => c.status === "ACTIVE");
  const pausedCampaigns = allCampaigns.filter((c: any) => c.status !== "ACTIVE");
  const sessionUser = data?.user;
  const telegramAccount = data?.telegramAccount;
  const isExpired = !membership?.hasAccess;

  // Límites reales según el plan activo del usuario
  const maxAllowedActive = sessionUser?.subscription?.maxCampaigns || 2;
  const planName =
    maxAllowedActive >= 50
      ? "Promotor Ilimitado 24/7"
      : maxAllowedActive >= 8
      ? "Plan Mensual"
      : maxAllowedActive >= 5
      ? "Plan Quincenal"
      : maxAllowedActive >= 3
      ? "Plan Semanal"
      : "Pase Express";
  const maxGroupsAllowed =
    maxAllowedActive >= 50 ? 9999 : maxAllowedActive >= 8 ? 100 : maxAllowedActive >= 5 ? 60 : maxAllowedActive >= 3 ? 50 : 25;
  const maxDailyPosts =
    data?.maxDailyPosts || (maxAllowedActive >= 50 ? 99999 : maxAllowedActive >= 8 ? 500 : maxAllowedActive >= 5 ? 300 : maxAllowedActive >= 3 ? 200 : 100);

  const todaySentCount = Math.min(data?.todaySentCount || 0, maxDailyPosts);
  const dailyLimitReached = (data?.rawTodaySentCount || 0) >= maxDailyPosts;
  const groupBreakdown: any[] = data?.groupBreakdown || [];

  // División automática de publicaciones diarias entre las campañas activas
  const activeCountForSplit = Math.max(1, activeCampaigns.length);
  const postsPerActiveCampaign = Math.floor(maxDailyPosts / activeCountForSplit);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {loading && !data ? (
          <div className="space-y-6">
            <div className="h-28 rounded-3xl bg-neutral-700/20 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
            </div>
            <div className="h-64 rounded-3xl bg-neutral-700/20 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Banner de Membresía Vencida (si aplica) */}
            {isExpired && (
              <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5 text-red-400">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold">Membresía Vencida — Envíos Pausados</h3>
                    <p className="text-xs text-red-300 mt-0.5">
                      Tus campañas están temporalmente en pausa. Recarga tu Wallet o activa un plan ($1.25/día o paquete con descuento) para reanudar los envíos.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/plans"
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
                >
                  Recargar Membresía
                </Link>
              </div>
            )}

            {/* CABECERA ESTILO CENTRO DE CONTROL AUTO-PUBLICADOR */}
            <div className="mb-6 rounded-3xl p-6 bg-gradient-to-br from-[#0D131F] via-[#131B2B] to-[#0E1724] border border-[#24324A] shadow-2xl text-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center shadow-[0_0_25px_rgba(14,165,233,0.4)] flex-shrink-0">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        Auto-Publicador en Grupos de Telegram
                      </h1>
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {telegramAccount?.status === "CONNECTED" ? "CONECTADO" : "GRANJA 24/7 ACTIVA"}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 uppercase">
                        {planName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      Cuenta:{" "}
                      <strong className="text-[#38BDF8]">
                        {telegramAccount?.firstName || sessionUser?.storeName || sessionUser?.name || "OttBot Cloud"}
                      </strong>{" "}
                      ({telegramAccount?.phoneNumber || sessionUser?.phoneNumber || "Nube 24/7"})
                      {telegramAccount?.username ? ` · @${telegramAccount.username}` : ""} •{" "}
                      <span className="text-emerald-400 font-bold">
                        {membership?.daysRemaining ?? 0} día(s) de vigencia
                      </span>
                    </p>
                  </div>
                </div>

                {/* Resumen Diario 100% Real según el Plan Activo y Estado de Wallet */}
                <div className="flex flex-wrap items-center gap-4 bg-[#090E17]/80 px-4 py-2.5 rounded-2xl border border-[#1E2D45]">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Publicaciones Reales Hoy
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-emerald-400 font-mono">{todaySentCount}</span>
                      <span className="text-xs text-slate-400 font-bold">/ {maxDailyPosts} meta hoy</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Campañas Activas
                    </span>
                    <div className="text-sm font-black text-[#38BDF8]">
                      {activeCampaigns.length} de {maxAllowedActive} ({postsPerActiveCampaign} envíos c/u)
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Estado Ciclo / Auto-Wallet
                    </span>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      {dailyLimitReached ? (
                        <span className="text-emerald-400">✅ Ciclo Hoy Completado</span>
                      ) : (
                        <span className="text-amber-400">
                          🔄 Auto-Wallet: ${Number(sessionUser?.walletBalance || 0).toFixed(2)} USD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra Informativa de Ciclo y Renovación Automática por Wallet */}
              <div className="mt-4 p-3 rounded-2xl bg-[#090E17]/70 border border-[#1E2D45] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    {dailyLimitReached ? (
                      <strong className="text-emerald-400">
                        ✅ ¡Campañas y Grupos Completados Hoy! Has cumplido tus {maxDailyPosts} publicaciones del día.
                      </strong>
                    ) : (
                      <>
                        Tus campañas activas están cumpliendo su ciclo diario ({todaySentCount}/{maxDailyPosts} envíos hoy).{" "}
                        <span className="text-slate-400">
                          No se pausarán hasta cumplir el ciclo del día.
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#38BDF8]">
                  {Number(sessionUser?.walletBalance || 0) >= 1.25
                    ? `🔄 Cobro Automático Activo (Saldo Wallet: $${Number(sessionUser?.walletBalance || 0).toFixed(2)} USD)`
                    : "⚠️ Saldo Wallet $0.00: Recarga para continuar automáticamente al vencer"}
                </span>
              </div>

              {/* Barra de Botones Rápidos + Selector de Pestañas */}
              <div className="pt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveView("CAMPAIGNS")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
                    activeView === "CAMPAIGNS"
                      ? "bg-[#0EA5E9] text-white border-[#38BDF8] shadow-lg shadow-[#0EA5E9]/25"
                      : "bg-[#162032] hover:bg-[#1E2B42] border-[#2B3B55] text-slate-200"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Campañas en Vivo ({activeCampaigns.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView("METRICS")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
                    activeView === "METRICS"
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/25"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Grupos Publicados Hoy ({groupBreakdown.length})</span>
                </button>

                <Link
                  href="/dashboard/guide"
                  className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-extrabold text-amber-400 flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Guía & División de Planes</span>
                </Link>

                <Link
                  href="/dashboard/telegram"
                  className="px-4 py-2.5 rounded-xl bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-xs font-extrabold text-[#38BDF8] flex items-center gap-2 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mi Perfil & Telegram</span>
                </Link>

                <Link
                  href="/dashboard/campaigns"
                  className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#10B981] hover:opacity-95 text-xs font-black text-white shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear / Ver Copys ({allCampaigns.length})</span>
                </Link>
              </div>
            </div>

            {/* VISTA 2: PANEL DE MÉTRICAS REALES POR GRUPO Y REPARTO DE CAMPAÑAS */}
            {activeView === "METRICS" ? (
              <div className="space-y-6">
                {/* Tarjeta Explicativa del Reparto Actual del Usuario */}
                <div className="rounded-3xl p-6 bg-[#0E1420] border border-[#233047] shadow-2xl text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8] block">
                        Control Real de tu Plan ({planName})
                      </span>
                      <h2 className="text-lg sm:text-xl font-black mt-0.5">
                        Distribución de tus {maxDailyPosts} Publicaciones Diarias y {maxGroupsAllowed >= 9999 ? "Grupos Ilimitados" : `${maxGroupsAllowed} Grupos`}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView("CAMPAIGNS")}
                      className="px-4 py-2 rounded-xl bg-[#162032] border border-[#293B58] text-xs font-bold text-[#38BDF8] hover:bg-[#1E2C44] cursor-pointer self-start sm:self-center"
                    >
                      ← Volver a Campañas en Vivo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
                    <div className="p-4 rounded-2xl bg-[#131B2A] border border-[#223049]">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Envíos Reales Hoy
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                        {todaySentCount} / {maxDailyPosts}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Restantes hoy: <strong>{Math.max(0, maxDailyPosts - todaySentCount)} envíos</strong>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#131B2A] border border-[#223049]">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Reparto por Campaña Activa
                      </span>
                      <span className="text-2xl font-black text-[#38BDF8] font-mono mt-1 block">
                        {postsPerActiveCampaign} envíos c/u
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Divididos entre tus <strong>{activeCampaigns.length || 1} campaña(s)</strong>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#131B2A] border border-[#223049]">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        Grupos Publicados Hoy
                      </span>
                      <span className="text-2xl font-black text-white font-mono mt-1 block">
                        {groupBreakdown.length} grupos
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Cupo de tu plan: <strong>Hasta {maxGroupsAllowed >= 9999 ? "Ilimitados" : maxGroupsAllowed}</strong>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#131B2A] border border-emerald-500/30">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-400 block">
                        Estado del Ciclo Diario
                      </span>
                      <span className="text-lg font-black text-emerald-400 mt-1 block">
                        {dailyLimitReached ? "✅ Ciclo Completado" : "🔄 En Ejecución"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Wallet: <strong>${Number(sessionUser?.walletBalance || 0).toFixed(2)} USD</strong>
                      </span>
                    </div>
                  </div>

                  {/* Desglose por cada campaña activa */}
                  {activeCampaigns.length > 0 && (
                    <div className="mt-5 p-4 rounded-2xl bg-[#0B101B] border border-[#1E2A40]">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
                        Estado de cumplimiento hoy por cada campaña activa:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeCampaigns.map((camp: any, idx: number) => {
                          const gCount = Math.min(
                            maxGroupsAllowed,
                            Array.isArray(camp.targetGroupIds) ? new Set(camp.targetGroupIds).size : 1
                          );
                          const campSentToday = camp.sentToday || 0;
                          const campCompleted = camp.isDailyCycleCompleted || dailyLimitReached;
                          return (
                            <div
                              key={camp.id}
                              className="p-3.5 rounded-xl bg-[#131B2A] border border-[#223049] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-black text-white block">
                                  Campaña #{idx + 1}: {camp.name}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">
                                  {gCount} grupos asignados • {campSentToday} de {postsPerActiveCampaign} enviados hoy
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-lg font-mono font-black ${
                                  campCompleted
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-[#38BDF8]/15 text-[#38BDF8]"
                                }`}
                              >
                                {campCompleted ? "✅ Completada Hoy" : `${campSentToday}/${postsPerActiveCampaign}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla de Publicaciones Realizadas Hoy en Cada Grupo */}
                <div className="rounded-3xl p-6 bg-[#0E1420] border border-[#233047] shadow-2xl text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black">
                        Registro Real de Publicaciones por Grupo (Hoy)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Conteo exacto de envíos reales confirmados por Telegram en cada grupo durante el día de hoy.
                      </p>
                    </div>

                    {Math.ceil(groupBreakdown.length / metricsPerPage) > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={metricsGroupPage <= 1}
                          onClick={() => setMetricsGroupPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl bg-[#131B2A] border border-[#293B58] text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                          ← Anterior
                        </button>
                        <span className="text-xs font-black text-[#38BDF8]">
                          Pág. {metricsGroupPage}/{Math.ceil(groupBreakdown.length / metricsPerPage)}
                        </span>
                        <button
                          type="button"
                          disabled={metricsGroupPage >= Math.ceil(groupBreakdown.length / metricsPerPage)}
                          onClick={() => setMetricsGroupPage((p) => p + 1)}
                          className="px-3 py-1.5 rounded-xl bg-[#131B2A] border border-[#293B58] text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </div>

                  {groupBreakdown.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#131B2A] border border-[#223049] text-center text-xs text-slate-400">
                      Aún no se registran envíos hoy desde las 00:00. En cuanto avance la ronda actual aparecerá el conteo real grupo por grupo.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#223049] text-[10px] font-extrabold uppercase text-slate-400">
                            <th className="py-3 px-4">Grupo / Canal de Telegram</th>
                            <th className="py-3 px-4">Enlace / ID</th>
                            <th className="py-3 px-4 text-center">Publicaciones Reales Hoy</th>
                            <th className="py-3 px-4 text-center">Estado en el Ciclo</th>
                            <th className="py-3 px-4 text-right">Último Envío Real</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2A40]">
                          {groupBreakdown
                            .slice((metricsGroupPage - 1) * metricsPerPage, metricsGroupPage * metricsPerPage)
                            .map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[#131B2A]/70 transition-colors">
                                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>{item.groupName}</span>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-400">
                                  {item.groupId}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black">
                                    {item.sentToday} publicaciones
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-1 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] font-bold">
                                    {dailyLimitReached ? "✅ Grupo Completado Hoy" : "● Activo en Ciclo"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-300">
                                  {new Date(item.lastSentAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* VISTA 1: LISTA DE CAMPAÑAS ACTIVAS EN VIVO */
              <>
                {activeCampaigns.length === 0 ? (
                  <div className={`rounded-3xl border p-12 text-center shadow-lg ${
                    isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
                  }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isDark ? "bg-[#171A20] text-[#229ED9]" : "bg-neutral-100 text-[#229ED9]"
                    }`}>
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold">
                      {pausedCampaigns.length > 0
                        ? `Tienes ${pausedCampaigns.length} copy(s) guardado(s) en pausa`
                        : "Aún no tienes campañas activas"}
                    </h3>
                    <p className={`text-xs mt-1 max-w-md mx-auto leading-relaxed ${
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      {pausedCampaigns.length > 0
                        ? "Ve a tu Biblioteca de Copys Guardados y haz clic en 'Activar en Mis Campañas' para poner a rodar los anuncios que prefieras."
                        : "Crea tu primer copy con texto formateado, negritas, emojis y enlaces para iniciar el piloto automático."}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <Link
                        href="/dashboard/campaigns"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                        <span>Ir a Mis Copys & Activar Campaña</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeCampaigns
                      .slice((campaignPage - 1) * campaignsPerPage, campaignPage * campaignsPerPage)
                      .map((c: any) => {
                        const rawUniqueTargets = Array.isArray(c.targetGroupIds)
                          ? Array.from(new Set(c.targetGroupIds))
                          : [];
                        // Limitar visual y operativamente al tope real del plan (ej. 25 en Express)
                        const uniqueTargets = rawUniqueTargets.slice(0, maxGroupsAllowed);
                        const targetCount = Math.max(1, uniqueTargets.length);
                        const sentCount = c._count?.logs || 0;
                        const logs: any[] = c.logs || [];
                        const campSentToday = c.sentToday || 0;
                        const isCampCycleCompleted = Boolean(c.isDailyCycleCompleted || dailyLimitReached);
                        const isMidCycleLocked = campSentToday > 0 && !isCampCycleCompleted;

                        // Determinar si la campaña está EMITIENDO EN VIVO (intervalo real de 60s -> 0s) o EN DESCANSO (60m / 120m -> 00m 00s)
                        const latestLogMs = logs[0]?.createdAt ? new Date(logs[0].createdAt).getTime() : 0;
                        const secSinceLatestLog = latestLogMs > 0 ? Math.max(0, Math.floor((nowMs - latestLogMs) / 1000)) : 999999;

                        // Contar cuántos logs pertenecen a la ronda actual (ventana de targetCount * 65s)
                        const currentRoundWindowMs = targetCount * 65 * 1000;
                        const logsInCurrentRound = logs.filter(
                          (l: any) => l.status === "SENT" && nowMs - new Date(l.createdAt).getTime() <= currentRoundWindowMs
                        ).length;

                        const isManualBroadcasting = broadcastingId === c.id;
                        const isAutoSendingRound =
                          isManualBroadcasting ||
                          (secSinceLatestLog >= 0 && secSinceLatestLog <= 62 && logsInCurrentRound < targetCount);

                        // Conteo regresivo exacto de 60s hasta 0s (llega hasta 0s y 0% al final de la barra antes del siguiente grupo)
                        const manualElapsedSec = broadcastStartMs[c.id]
                          ? Math.max(0, Math.floor((nowMs - broadcastStartMs[c.id]) / 1000))
                          : 0;
                        const activeCycleSecUsed =
                          secSinceLatestLog <= 62 ? Math.min(60, secSinceLatestLog) : manualElapsedSec % 61;
                        const groupSecondsLeft = Math.max(0, 60 - activeCycleSecUsed);

                        // Cálculo del descanso entre rondas (60 min / 120 min -> 00m 00s)
                        const totalRestSec = (c.intervalMinutes || 60) * 60;
                        const nextRunTargetMs = c.nextRunAt ? new Date(c.nextRunAt).getTime() : nowMs + totalRestSec * 1000;
                        const restSecondsLeft = Math.max(0, Math.floor((nextRunTargetMs - nowMs) / 1000));
                        const restCountdownText = formatRestCountdown(c.nextRunAt, c.intervalMinutes || 60, nowMs);

                        // Porcentaje exacto de la barra regresiva (llega de 100% hasta 0% sin detenerse a mitad de camino)
                        const reverseBarPercent = isAutoSendingRound
                          ? Math.round((groupSecondsLeft / 60) * 100)
                          : Math.min(100, Math.max(0, Math.round((restSecondsLeft / totalRestSec) * 100)));

                        // Paginación de "Últimos Grupos donde se Publicó" (5 grupos por página)
                        const currentLogPage = logPageByCampaign[c.id] || 1;
                        const totalLogPages = Math.max(1, Math.ceil(logs.length / logsPerPage));
                        const safeLogPage = Math.min(currentLogPage, totalLogPages);
                        const paginatedLogs = logs.slice(
                          (safeLogPage - 1) * logsPerPage,
                          safeLogPage * logsPerPage
                        );

                        const lastBroadcastFormatted = logs[0]?.createdAt
                          ? new Date(logs[0].createdAt).toLocaleString()
                          : "En espera de ciclo";

                        // Detectar grupos con error (status === "FAILED") que aún estén dentro de los grupos asignados a esta campaña
                        const failedLogsMap = new Map<string, { groupId: string; groupName: string; errorMessage: string }>();
                        for (const log of logs) {
                          if (log.status === "FAILED" && log.targetGroupId) {
                            const stillInCampaign = uniqueTargets.some(
                              (t: any) => String(t).toLowerCase() === String(log.targetGroupId).toLowerCase()
                            );
                            if (stillInCampaign && !failedLogsMap.has(log.targetGroupId)) {
                              failedLogsMap.set(log.targetGroupId, {
                                groupId: log.targetGroupId,
                                groupName: log.targetGroupName || log.targetGroupId,
                                errorMessage:
                                  log.errorMessage ||
                                  "El grupo no permite publicar mensajes o requiere permisos especiales.",
                              });
                            }
                          }
                        }
                        const activeFailedGroups = Array.from(failedLogsMap.values());

                        return (
                          <div
                            key={c.id}
                            className="rounded-3xl p-5 sm:p-6 bg-[#0E1420] border border-[#233047] shadow-2xl text-white transition-all"
                          >
                            {/* Cabecera de la Campaña con todos los botones alineados en una sola fila (Sin texto feo debajo) */}
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                                    {c.name}
                                  </h2>
                                  {isCampCycleCompleted ? (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                      ✅ Campaña Completada Hoy • Grupos Completados
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                      Activa 24/7 Nube
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                                    Hoy: {campSentToday} / {postsPerActiveCampaign >= 90000 ? "Ilimitados" : `${postsPerActiveCampaign} envíos`}
                                  </span>
                                </div>
                              </div>

                              {/* Fila Única Alineada: Editar + Pausar (sólo cuando cumpla el ciclo) + Ronda Manual */}
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-shrink-0">
                                <Link
                                  href={`/dashboard/campaigns?edit=${c.id}`}
                                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold rounded-xl bg-[#162032] hover:bg-[#1E2C44] text-[#38BDF8] border border-[#293B58] transition-all whitespace-nowrap"
                                  title="Editar copy, foto o seleccionar grupos"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar Copy / Grupos</span>
                                </Link>

                                <button
                                  type="button"
                                  disabled={actionLoading === c.id || isMidCycleLocked}
                                  onClick={() => toggleCampaign(c.id, c.status)}
                                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold rounded-xl border transition-all whitespace-nowrap ${
                                    isMidCycleLocked
                                      ? "bg-slate-800/60 text-slate-400 border-slate-700 cursor-not-allowed opacity-75"
                                      : "bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border-rose-500/40 cursor-pointer"
                                  }`}
                                  title={
                                    isMidCycleLocked
                                      ? "Esta campaña está cumpliendo su ciclo de hoy; se podrá pausar cuando complete sus publicaciones diarias"
                                      : "Pausar esta campaña 24/7"
                                  }
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>{isMidCycleLocked ? "Cumpliendo Ciclo Hoy" : "Pausar 24/7 Nube"}</span>
                                </button>

                                {dailyLimitReached ? (
                                  <button
                                    type="button"
                                    disabled={isManualBroadcasting}
                                    onClick={() => handleTriggerBroadcast(c.id, true)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    title="Lanzar una ronda extra hoy por $1.00 USD desde tu Wallet"
                                  >
                                    <Zap className="w-3.5 h-3.5 text-white" />
                                    <span>+1 Ronda Extra ($1 USD)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isManualBroadcasting}
                                    onClick={() => handleTriggerBroadcast(c.id, false)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#10B981] hover:opacity-95 text-white shadow-lg shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                    title="Ejecutar ronda inmediata en los grupos de esta campaña"
                                  >
                                    {isManualBroadcasting ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Iniciando Ronda...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Rocket className="w-3.5 h-3.5 text-white" />
                                        <span>Ronda Manual ({targetCount} Grupos)</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* ALERTA DE SEGURIDAD ANTI-BANEO: GRUPOS CON ERROR DETECTADOS */}
                            {activeFailedGroups.length > 0 && (
                              <div className="mb-4 p-4 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-2.5">
                                <div className="flex items-start gap-2.5 text-red-400">
                                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide">
                                      ⚠️ Atención Anti-Bloqueo: {activeFailedGroups.length} grupo(s) con error de publicación detectado
                                    </h4>
                                    <p className="text-xs text-red-200/90 mt-0.5 leading-relaxed">
                                      El sistema detectó que el siguiente grupo rechaza publicaciones (sin permisos de escritura, enlace inválido o restricción). <strong>Debes eliminarlo de tu campaña</strong> para evitar bloqueos en tu cuenta de Telegram o en los bots de nuestra Granja:
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  {activeFailedGroups.map((fg) => (
                                    <div
                                      key={fg.groupId}
                                      className="p-2.5 rounded-xl bg-black/40 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="min-w-0">
                                        <span className="font-black text-red-300 font-mono">{fg.groupName}</span>
                                        <span className="text-slate-400 block sm:inline sm:ml-2 text-[11px]">
                                          • Motivo: {fg.errorMessage}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={actionLoading === c.id}
                                        onClick={() => handleRemoveErroredGroup(c, fg.groupId)}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-black whitespace-nowrap cursor-pointer transition-all self-start sm:self-center"
                                      >
                                        🗑️ Eliminar Grupo de la Campaña
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Feedback de Difusión */}
                            {broadcastFeedback && broadcastFeedback.id === c.id && (
                              <div className={`mb-4 p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border ${
                                broadcastFeedback.isError
                                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              }`}>
                                <div className="flex items-center gap-2">
                                  {broadcastFeedback.isError ? (
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                  )}
                                  <span>{broadcastFeedback.message}</span>
                                </div>

                                {broadcastFeedback.isError && broadcastFeedback.message.includes("Ronda Extra") && (
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerBroadcast(c.id, true)}
                                    className="px-3 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-black hover:bg-amber-400 whitespace-nowrap cursor-pointer"
                                  >
                                    Comprar +1 Ronda ($1.00 USD)
                                  </button>
                                )}
                              </div>
                            )}

                            {/* CAJA CENTRAL DE ESTADO Y BARRA DE PROGRESO (60s -> 0s HASTA EL FINAL DE LA BARRA) */}
                            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#091E2E] via-[#0B2535] to-[#0A2629] border border-cyan-500/40 shadow-inner mb-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-black text-white">
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                      isAutoSendingRound ? "bg-emerald-400 animate-ping" : "bg-[#38BDF8]"
                                    }`} />
                                    <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] text-xs">
                                      {isAutoSendingRound ? "▶" : "⏸"}
                                    </span>
                                    {isAutoSendingRound ? (
                                      <span>
                                        Emitiendo Ronda en Vivo · ({Math.min(logsInCurrentRound, targetCount)} de {targetCount} enviados en esta ronda)
                                      </span>
                                    ) : (
                                      <span>
                                        Ronda Completada · Descanso de Seguridad ({targetCount} de {targetCount} enviados)
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#38BDF8] mt-1 font-medium">
                                    {isAutoSendingRound
                                      ? groupSecondsLeft === 0
                                        ? "⚡ ¡Publicando en el siguiente grupo ahora mismo y reiniciando barra a 60s!"
                                        : `Conteo regresivo antibaneo en curso: la barra baja de 60s a 0s (${groupSecondsLeft}s restantes) para publicar en el siguiente grupo.`
                                      : "Todos los grupos recibieron publicidad con éxito. Pausa anti-ban antes de la siguiente ronda."}
                                  </p>
                                </div>

                                {/* Píldora Derecha de Conteo Regresivo en Vivo */}
                                <div className="px-4 py-2 rounded-xl bg-[#071824] border border-emerald-500/40 flex items-center gap-2 text-xs sm:text-sm font-mono font-black text-emerald-400 whitespace-nowrap self-start sm:self-center shadow-md">
                                  <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] text-[10px]">
                                    {isAutoSendingRound ? "⏱" : "⏸"}
                                  </span>
                                  <span>
                                    {isAutoSendingRound
                                      ? `Siguiente grupo: ${groupSecondsLeft}s`
                                      : `Descanso: ${restCountdownText}`}
                                  </span>
                                </div>
                              </div>

                              {/* Barra de Progreso Cyan -> Esmeralda que llega hasta 0% y vuelve a empezar */}
                              <div className="w-full h-3 rounded-full bg-[#06131E] overflow-hidden p-0.5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#10B981] transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                  style={{ width: `${reverseBarPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* 4 CAJAS DE MÉTRICAS INFERIORES CON DATOS REALES DEL PLAN */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                              <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Cupo Grupos ({planName})
                                </span>
                                <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
                                  {maxGroupsAllowed >= 9999 ? "Ilimitados" : maxGroupsAllowed}
                                </span>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Grupos Activos
                                </span>
                                <span className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 block">
                                  {targetCount} de {maxGroupsAllowed >= 9999 ? targetCount : maxGroupsAllowed}
                                </span>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Intervalo Anti-Ban
                                </span>
                                <span className="text-lg sm:text-xl font-black text-[#38BDF8] mt-0.5 block font-mono">
                                  {isAutoSendingRound ? `${groupSecondsLeft}s / 60s` : "60s por grupo"}
                                </span>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Última Difusión
                                </span>
                                <span className="text-xs sm:text-sm font-black text-white mt-1.5 block truncate">
                                  {lastBroadcastFormatted}
                                </span>
                              </div>
                            </div>

                            {/* Últimos Grupos donde se Publicó — Paginado cada 5 grupos */}
                            {logs.length > 0 && (
                              <div className="p-3.5 rounded-2xl bg-[#0B101B] border border-[#1E2A40]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Últimos Grupos donde se Publicó (Mostrando {(safeLogPage - 1) * logsPerPage + 1}-{Math.min(safeLogPage * logsPerPage, logs.length)} de {logs.length})
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveView("METRICS")}
                                      className="text-[10px] font-black text-emerald-400 hover:underline mr-2 cursor-pointer"
                                    >
                                      Ver conteo por grupo →
                                    </button>

                                    {/* Paginación de 5 en 5 grupos */}
                                    {totalLogPages > 1 && (
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={safeLogPage <= 1}
                                          onClick={() =>
                                            setLogPageByCampaign((prev) => ({
                                              ...prev,
                                              [c.id]: Math.max(1, safeLogPage - 1),
                                            }))
                                          }
                                          className="px-2.5 py-1 rounded-lg border border-[#293B58] bg-[#131B2A] text-slate-300 hover:border-[#38BDF8] text-[10px] font-black flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                                        >
                                          <ChevronLeft className="w-3 h-3" />
                                          <span>Anterior</span>
                                        </button>

                                        <span className="text-[10px] font-black px-1.5 text-[#38BDF8]">
                                          Pág. {safeLogPage}/{totalLogPages}
                                        </span>

                                        <button
                                          type="button"
                                          disabled={safeLogPage >= totalLogPages}
                                          onClick={() =>
                                            setLogPageByCampaign((prev) => ({
                                              ...prev,
                                              [c.id]: Math.min(totalLogPages, safeLogPage + 1),
                                            }))
                                          }
                                          className="px-2.5 py-1 rounded-lg border border-[#293B58] bg-[#131B2A] text-slate-300 hover:border-[#38BDF8] text-[10px] font-black flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                                        >
                                          <span>Siguiente</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  {paginatedLogs.map((log: any) => {
                                    const isFailed = log.status === "FAILED";
                                    return (
                                      <div 
                                        key={log.id}
                                        className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                                          isFailed
                                            ? "bg-red-950/30 border-red-500/40"
                                            : "bg-[#131B2A] border border-[#223049]"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate pr-1.5">
                                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            isFailed ? "bg-red-500 animate-pulse" : "bg-emerald-400"
                                          }`} />
                                          <span className="font-bold text-white truncate text-[11px]" title={log.errorMessage || log.targetGroupName || log.targetGroupId}>
                                            {log.targetGroupName || log.targetGroupId}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {isFailed ? (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveErroredGroup(c, log.targetGroupId)}
                                              title="Eliminar este grupo con error para evitar bloqueos"
                                              className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                                            >
                                              ⚠️ Quitar
                                            </button>
                                          ) : (
                                            <>
                                              <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                                ✓
                                              </span>
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
