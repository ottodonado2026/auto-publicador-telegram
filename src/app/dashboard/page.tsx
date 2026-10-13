"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Plus, Pause, AlertCircle, Clock, 
  CheckCircle2, MessageSquare, Activity, 
  RefreshCw, Rocket, XCircle, Users, Edit3, Timer, BookmarkCheck,
  ChevronLeft, ChevronRight, Moon, Zap
} from "lucide-react";

function formatRestCountdown(nextRunAt: string | null, intervalMinutes: number, nowMs: number) {
  if (!nextRunAt) {
    return `${intervalMinutes}m 00s`;
  }
  const targetMs = new Date(nextRunAt).getTime();
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  if (diffSec === 0) {
    return "Iniciando ronda...";
  }
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }
  return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

export default function ClientDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);
  const [broadcastStartMs, setBroadcastStartMs] = useState<Record<string, number>>({});
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);
  const [campaignPage, setCampaignPage] = useState(1);
  // Paginación independiente cada 5 grupos para "Últimos Grupos donde se Publicó" en cada campaña
  const [logPageByCampaign, setLogPageByCampaign] = useState<Record<string, number>>({});
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const campaignsPerPage = 12;
  const logsPerPage = 5;

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
    // Sincronización silenciosa en vivo cada 8 segundos para reflejar cada grupo publicado sin recargar la página
    const pollInterval = setInterval(fetchDashboard, 8000);
    // Reloj en tiempo real (1 segundo) para la barra de conteo regresivo (59s, 58s, 57s... y descanso)
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
        message: result.message || "¡Ronda de difusión completada exitosamente en Telegram!",
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

  const membership = data?.membership;
  const allCampaigns = data?.campaigns || [];
  const activeCampaigns = allCampaigns.filter((c: any) => c.status === "ACTIVE");
  const pausedCampaigns = allCampaigns.filter((c: any) => c.status !== "ACTIVE");
  const sessionUser = data?.user;
  const isExpired = !membership?.hasAccess;
  const maxAllowedActive = sessionUser?.subscription?.maxCampaigns || 2;
  const todaySentCount = data?.todaySentCount || 0;
  const maxDailyPosts = data?.maxDailyPosts || 100;
  const dailyLimitReached = todaySentCount >= maxDailyPosts;

  // Métricas agregadas
  const totalGroups = activeCampaigns.reduce(
    (acc: number, c: any) => acc + (Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 1),
    0
  );
  const totalSent = allCampaigns.reduce((acc: number, c: any) => acc + (c._count?.logs || 0), 0);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {loading && !data ? (
          <div className="space-y-6">
            <div className="h-16 rounded-3xl bg-neutral-700/20 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
              <div className="h-24 rounded-2xl bg-neutral-700/20 animate-pulse" />
            </div>
            <div className="h-64 rounded-3xl bg-neutral-700/20 animate-pulse" />
          </div>
        ) : (
          <>
            {/* Banner de Membresía */}
            {isExpired ? (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
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
            ) : (
              <div className={`mb-6 p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Suscripción en Piloto Automático 24/7
                    </span>
                    <span className="text-sm sm:text-base font-black">
                      {membership?.daysRemaining} día(s) restantes • Cupo: {activeCampaigns.length} de {maxAllowedActive} campañas activas
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {pausedCampaigns.length > 0 && (
                    <Link
                      href="/dashboard/campaigns?tab=LIBRARY"
                      className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 hover:bg-[#229ED9]/25 transition-all"
                    >
                      Mis Copys en Biblioteca ({allCampaigns.length})
                    </Link>
                  )}
                  <Link
                    href="/dashboard/plans"
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Ampliar plan →
                  </Link>
                </div>
              </div>
            )}

            {/* Métricas del Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border shadow-sm ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Campañas Activas (En Vivo)</span>
                  <Activity className="w-4 h-4 text-[#229ED9]" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black">{activeCampaigns.length}</span>
                  <span className="text-xs text-neutral-400 font-bold">/ {maxAllowedActive} permitidas</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-sm ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Grupos Asignados Hoy</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black mt-1">
                  {totalGroups}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-sm ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Publicaciones Hoy / Plan</span>
                  <Rocket className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black">{todaySentCount}</span>
                    <span className="text-xs text-emerald-400 font-bold">/ {maxDailyPosts} hoy</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-semibold">
                    Total: {totalSent}
                  </span>
                </div>
              </div>
            </div>

            {/* Header de Campañas Activas */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Mis Campañas Activas & Envíos en Vivo
                </h1>
                <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  El conteo regresivo y las últimas publicaciones se actualizan automáticamente en vivo sin necesidad de recargar la página.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDashboard}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark 
                      ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:text-white" 
                      : "bg-white border-neutral-300 text-neutral-700 hover:text-black"
                  }`}
                  title="Sincronizar ahora"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span className="hidden sm:inline">Sincronizar</span>
                </button>

                <Link
                  href="/dashboard/campaigns"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear / Ver Copys ({allCampaigns.length})</span>
                </Link>
              </div>
            </div>

            {/* Lista de Campañas ACTIVAS */}
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
              <div className="space-y-5">
                {activeCampaigns
                  .slice((campaignPage - 1) * campaignsPerPage, campaignPage * campaignsPerPage)
                  .map((c: any) => {
                    const uniqueTargets = Array.isArray(c.targetGroupIds)
                      ? Array.from(new Set(c.targetGroupIds))
                      : [];
                    const targetCount = Math.max(1, uniqueTargets.length);
                    const sentCount = c._count?.logs || 0;
                    const logs: any[] = c.logs || [];

                    // Determinar si la campaña está EMITIENDO EN VIVO (intervalo 60s -> 0s) o EN DESCANSO (60m / 120m -> 00m 00s)
                    const latestLogMs = logs[0]?.createdAt ? new Date(logs[0].createdAt).getTime() : 0;
                    const secSinceLatestLog = latestLogMs > 0 ? Math.floor((nowMs - latestLogMs) / 1000) : 999999;

                    // Contar cuántos logs pertenecen a la ronda actual (últimos targetCount minutos)
                    const currentRoundWindowMs = targetCount * 65 * 1000;
                    const logsInCurrentRound = logs.filter(
                      (l: any) => nowMs - new Date(l.createdAt).getTime() <= currentRoundWindowMs
                    ).length;

                    const isManualBroadcasting = broadcastingId === c.id;
                    const isAutoSendingRound =
                      isManualBroadcasting ||
                      (secSinceLatestLog >= 0 && secSinceLatestLog < 65 && logsInCurrentRound < targetCount);

                    // Cálculo del conteo regresivo de 60s -> 0s entre grupo y grupo cuando está emitiendo
                    const manualElapsedSec = broadcastStartMs[c.id]
                      ? Math.floor((nowMs - broadcastStartMs[c.id]) / 1000)
                      : 0;
                    const activeCycleSecUsed =
                      secSinceLatestLog < 65 ? secSinceLatestLog : manualElapsedSec % 60;
                    const groupSecondsLeft = Math.max(1, 60 - (activeCycleSecUsed % 60));

                    // Cálculo del descanso entre rondas (60 min / 120 min -> 00m 00s)
                    const totalRestSec = (c.intervalMinutes || 60) * 60;
                    const nextRunTargetMs = c.nextRunAt ? new Date(c.nextRunAt).getTime() : nowMs + totalRestSec * 1000;
                    const restSecondsLeft = Math.max(0, Math.floor((nextRunTargetMs - nowMs) / 1000));
                    const restCountdownText = formatRestCountdown(c.nextRunAt, c.intervalMinutes || 60, nowMs);

                    // Porcentaje de la barra regresiva (De 100% hacia 0% de adelante hacia atrás)
                    const reverseBarPercent = isAutoSendingRound
                      ? Math.max(4, Math.round((groupSecondsLeft / 60) * 100))
                      : Math.min(100, Math.max(4, Math.round((restSecondsLeft / totalRestSec) * 100)));

                    // Paginación de "Últimos Grupos donde se Publicó" (5 grupos por página)
                    const currentLogPage = logPageByCampaign[c.id] || 1;
                    const totalLogPages = Math.max(1, Math.ceil(logs.length / logsPerPage));
                    const safeLogPage = Math.min(currentLogPage, totalLogPages);
                    const paginatedLogs = logs.slice(
                      (safeLogPage - 1) * logsPerPage,
                      safeLogPage * logsPerPage
                    );

                    return (
                      <div
                        key={c.id}
                        className={`rounded-3xl p-5 sm:p-6 border shadow-xl transition-all ${
                          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
                        }`}
                      >
                        {/* Cabecera de la Campaña con todos los botones alineados en una sola fila */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                                {c.name}
                              </h2>
                              {isAutoSendingRound ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Publicando en Vivo ({Math.min(logsInCurrentRound + 1, targetCount)}/{targetCount} grupos)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <Moon className="w-3 h-3 text-amber-400" />
                                  En Descanso ({c.intervalMinutes} min)
                                </span>
                              )}
                            </div>
                            <p className={`text-xs mt-1 truncate ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                              Grupos seleccionados: <strong>{targetCount}</strong> ({uniqueTargets.slice(0, 3).join(", ")}{targetCount > 3 ? ` +${targetCount - 3} más` : ""})
                            </p>
                          </div>

                          {/* Fila Única Alineada: Reloj + Editar + Adelantar Ronda + Pausar */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0">
                            {/* Reloj Regresivo Compacto */}
                            <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-mono font-black whitespace-nowrap ${
                              isAutoSendingRound
                                ? isDark
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                                  : "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : isDark
                                ? "bg-[#15181E] border-amber-500/30 text-amber-400"
                                : "bg-amber-50 border-amber-300 text-amber-700"
                            }`}>
                              <Timer className="w-3.5 h-3.5 flex-shrink-0 animate-spin" style={{ animationDuration: "8s" }} />
                              <div>
                                <span className="text-[9px] uppercase block font-sans font-bold text-neutral-400 leading-none">
                                  {isAutoSendingRound ? "Siguiente grupo:" : "En Descanso:"}
                                </span>
                                <span>{isAutoSendingRound ? `${groupSecondsLeft}s` : restCountdownText}</span>
                              </div>
                            </div>

                            {/* Botón Editar */}
                            <Link
                              href={`/dashboard/campaigns?edit=${c.id}`}
                              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                                isDark
                                  ? "bg-[#171A20] hover:bg-[#252A34] text-[#229ED9] border-[#2D3340]"
                                  : "bg-neutral-50 hover:bg-neutral-100 text-[#229ED9] border-neutral-300"
                              }`}
                              title="Editar copy, foto o seleccionar grupos"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </Link>

                            {/* Botón Adelantar Ronda (o Ronda Extra +$1 USD si agotó límite diario) */}
                            {dailyLimitReached ? (
                              <button
                                type="button"
                                disabled={isManualBroadcasting}
                                onClick={() => handleTriggerBroadcast(c.id, true)}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                title="Lanzar una ronda extra hoy por $1.00 USD desde tu Wallet"
                              >
                                <Zap className="w-3.5 h-3.5 text-white" />
                                <span>+1 Ronda Extra ($1)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isManualBroadcasting}
                                onClick={() => handleTriggerBroadcast(c.id, false)}
                                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                title="Emitir ronda ahora mismo"
                              >
                                {isManualBroadcasting ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Emitiendo ({groupSecondsLeft}s)...</span>
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="w-3.5 h-3.5 text-white" />
                                    <span>Adelantar Ronda</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Botón Pausar (Alineado en la misma fila horizontal) */}
                            <button
                              type="button"
                              disabled={actionLoading === c.id}
                              onClick={() => toggleCampaign(c.id, c.status)}
                              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                                isDark
                                  ? "bg-[#171A20] hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 text-neutral-300 border-[#2D3340]"
                                  : "bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-700 border-neutral-300"
                              }`}
                              title="Pausar esta campaña"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pausar</span>
                            </button>
                          </div>
                        </div>

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

                        {/* Barra de Progreso en Conteo Regresivo (De Adelante hacia Atrás: 100% -> 0%) */}
                        <div className={`rounded-2xl p-4 border mb-3 ${
                          isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-[#F8FAFC] border-neutral-200"
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-2">
                            <span className="font-bold flex items-center gap-1.5 text-[#229ED9]">
                              <Activity className="w-4 h-4 animate-pulse" />
                              {isAutoSendingRound ? (
                                <span>
                                  Publicando en grupos — Próximo grupo en:{" "}
                                  <strong className="text-emerald-400 font-mono text-sm">{groupSecondsLeft}s</strong> (60s → 0s)
                                </span>
                              ) : (
                                <span>
                                  Campaña en Descanso ({c.intervalMinutes} min) — Próxima ronda en:{" "}
                                  <strong className="text-amber-400 font-mono text-sm">{restCountdownText}</strong>
                                </span>
                              )}
                            </span>

                            <span className="font-extrabold text-emerald-400 font-mono text-xs">
                              {sentCount} envíos ({reverseBarPercent}% restante del ciclo)
                            </span>
                          </div>

                          {/* Barra que disminuye en vivo de 100% a 0% */}
                          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 ${
                            isDark ? "bg-[#252A34]" : "bg-neutral-200"
                          }`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                                isAutoSendingRound
                                  ? "bg-gradient-to-r from-emerald-500 via-[#229ED9] to-sky-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                  : "bg-gradient-to-r from-[#229ED9] to-amber-500"
                              }`}
                              style={{ width: `${reverseBarPercent}%` }}
                            />
                          </div>

                          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] mt-3 pt-2.5 border-t font-semibold ${
                            isDark ? "border-[#2D3340] text-neutral-400" : "border-neutral-200 text-neutral-600"
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span>
                                Intervalo entre grupos:{" "}
                                <strong className="text-emerald-400 font-mono">
                                  {isAutoSendingRound ? `${groupSecondsLeft}s / 60s` : "60s → 0s (Antibaneo)"}
                                </strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>
                                Ciclo de descanso: <strong>Cada {c.intervalMinutes} min</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:justify-end">
                              <span className="w-2 h-2 rounded-full bg-[#229ED9]" />
                              <span>
                                Estado:{" "}
                                <strong className={isAutoSendingRound ? "text-emerald-400" : "text-amber-400"}>
                                  {isAutoSendingRound ? "Emitiendo ronda..." : `Descansando (${restCountdownText})`}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Últimos Grupos donde se Publicó — Paginado cada 5 grupos */}
                        {logs.length > 0 && (
                          <div className={`p-3.5 rounded-2xl border ${
                            isDark ? "bg-[#15181E] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                isDark ? "text-neutral-400" : "text-neutral-500"
                              }`}>
                                Últimos Grupos donde se Publicó (Mostrando {(safeLogPage - 1) * logsPerPage + 1}-{Math.min(safeLogPage * logsPerPage, logs.length)} de {logs.length})
                              </span>

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
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer ${
                                      isDark
                                        ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:border-[#229ED9]"
                                        : "bg-white border-neutral-300 text-neutral-700"
                                    }`}
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                    <span>Anterior</span>
                                  </button>

                                  <span className="text-[10px] font-black px-1.5 text-[#229ED9]">
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
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer ${
                                      isDark
                                        ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:border-[#229ED9]"
                                        : "bg-white border-neutral-300 text-neutral-700"
                                    }`}
                                  >
                                    <span>Siguiente</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              {paginatedLogs.map((log: any) => (
                                <div 
                                  key={log.id}
                                  className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${
                                    isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-1.5">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      log.status === "SENT" ? "bg-emerald-500" : "bg-red-500"
                                    }`} />
                                    <span className="font-bold truncate text-[11px]" title={log.targetGroupName || log.targetGroupId}>
                                      {log.targetGroupName || log.targetGroupId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                      ✓
                                    </span>
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Controles de Paginación de Campañas (12 por página) */}
                {Math.ceil(activeCampaigns.length / campaignsPerPage) > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#2D3340]/50">
                    <span className="text-xs text-neutral-400 font-medium">
                      Mostrando {(campaignPage - 1) * campaignsPerPage + 1} - {Math.min(campaignPage * campaignsPerPage, activeCampaigns.length)} de {activeCampaigns.length} campañas activas
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={campaignPage === 1}
                        onClick={() => setCampaignPage(campaignPage - 1)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-neutral-300" : "bg-white border-neutral-300 text-neutral-700"
                        }`}
                      >
                        ← Anterior
                      </button>

                      <span className="text-xs font-black px-2 text-[#229ED9]">
                        Página {campaignPage} de {Math.ceil(activeCampaigns.length / campaignsPerPage)}
                      </span>

                      <button
                        type="button"
                        disabled={campaignPage >= Math.ceil(activeCampaigns.length / campaignsPerPage)}
                        onClick={() => setCampaignPage(campaignPage + 1)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 cursor-pointer ${
                          isDark ? "bg-[#1E2229] border-[#2D3340] text-neutral-300" : "bg-white border-neutral-300 text-neutral-700"
                        }`}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
