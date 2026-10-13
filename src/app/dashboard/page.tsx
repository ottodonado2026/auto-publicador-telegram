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
  ChevronLeft, ChevronRight, Moon, Zap, BookOpen, Smartphone
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
    // Sincronización silenciosa en vivo cada 8 segundos
    const pollInterval = setInterval(fetchDashboard, 8000);
    // Reloj en tiempo real (1 segundo) para conteo regresivo de 60s y de descanso
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
  const telegramAccount = data?.telegramAccount;
  const isExpired = !membership?.hasAccess;
  const maxAllowedActive = sessionUser?.subscription?.maxCampaigns || 2;
  const maxGroupsAllowed =
    maxAllowedActive >= 8 ? 9999 : maxAllowedActive >= 5 ? 100 : maxAllowedActive >= 3 ? 50 : 25;
  const todaySentCount = data?.todaySentCount || 0;
  const maxDailyPosts = data?.maxDailyPosts || 100;
  const dailyLimitReached = todaySentCount >= maxDailyPosts;

  // Métricas agregadas
  const totalGroups = activeCampaigns.reduce(
    (acc: number, c: any) => acc + (Array.isArray(c.targetGroupIds) ? new Set(c.targetGroupIds).size : 1),
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
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        telegramAccount?.status === "CONNECTED" || !isExpired
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {telegramAccount?.status === "CONNECTED" ? "CONECTADO" : "GRANJA 24/7 ACTIVA"}
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

                {/* Resumen Diario de Envíos */}
                <div className="flex items-center gap-3 bg-[#090E17]/80 px-4 py-2.5 rounded-2xl border border-[#1E2D45]">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Publicaciones de Hoy
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-emerald-400 font-mono">{todaySentCount}</span>
                      <span className="text-xs text-slate-400 font-bold">/ {maxDailyPosts} máx. hoy</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/10 mx-1" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Campañas Activas
                    </span>
                    <div className="text-sm font-black text-[#38BDF8]">
                      {activeCampaigns.length} de {maxAllowedActive}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Botones Rápidos (Estilo Centro de Control) */}
              <div className="pt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchDashboard}
                  className="px-4 py-2.5 rounded-xl bg-[#162032] hover:bg-[#1E2B42] border border-[#2B3B55] text-xs font-extrabold text-white flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Refrescar</span>
                </button>

                <Link
                  href="/dashboard/guide"
                  className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-extrabold text-amber-400 flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Guía de Uso & Reglas</span>
                </Link>

                <Link
                  href="/dashboard/telegram"
                  className="px-4 py-2.5 rounded-xl bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-xs font-extrabold text-[#38BDF8] flex items-center gap-2 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Sincronizar Grupos / Cuentas TG</span>
                </Link>

                <Link
                  href="/dashboard/campaigns?tab=LIBRARY"
                  className="px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-xs font-extrabold text-purple-300 flex items-center gap-2 transition-all"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Biblioteca de Copys ({allCampaigns.length})</span>
                </Link>

                <Link
                  href="/dashboard/campaigns"
                  className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#10B981] hover:opacity-95 text-xs font-black text-white shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Copy / Campaña</span>
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
              <div className="space-y-6">
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
                      (l: any) => l.status === "SENT" && nowMs - new Date(l.createdAt).getTime() <= currentRoundWindowMs
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

                    // Porcentaje de la barra regresiva (De 100% hacia 0%)
                    const reverseBarPercent = isAutoSendingRound
                      ? Math.max(5, Math.round((groupSecondsLeft / 60) * 100))
                      : Math.min(100, Math.max(6, Math.round((restSecondsLeft / totalRestSec) * 100)));

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

                    return (
                      <div
                        key={c.id}
                        className="rounded-3xl p-5 sm:p-6 bg-[#0E1420] border border-[#233047] shadow-2xl text-white transition-all"
                      >
                        {/* Cabecera de la Campaña con todos los botones alineados en una sola fila */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                                {c.name}
                              </h2>
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Activa 24/7 Nube
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate">
                              Grupos en esta campaña: <strong className="text-white">{targetCount}</strong> ({uniqueTargets.slice(0, 3).join(", ")}{targetCount > 3 ? ` +${targetCount - 3} más` : ""})
                            </p>
                          </div>

                          {/* Fila Única Alineada: Editar + Pausar 24/7 Nube + Ronda Manual */}
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
                              disabled={actionLoading === c.id}
                              onClick={() => toggleCampaign(c.id, c.status)}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-500/40 transition-all cursor-pointer whitespace-nowrap"
                              title="Pausar esta campaña 24/7"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pausar 24/7 Nube</span>
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
                                title="Ejecutar ronda inmediata en todos los grupos de esta campaña"
                              >
                                {isManualBroadcasting ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Publicando ({groupSecondsLeft}s)...</span>
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

                        {/* CAJA CENTRAL DE ESTADO Y BARRA DE PROGRESO (IDÉNTICA AL SISTEMA DE REFERENCIA) */}
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
                                    Emitiendo Ronda en Vivo · ({Math.min(logsInCurrentRound + 1, targetCount)} de {targetCount} grupos en secuencia)
                                  </span>
                                ) : (
                                  <span>
                                    Ronda Completada · Descanso de Seguridad ({targetCount} de {targetCount} enviados)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#38BDF8] mt-1 font-medium">
                                {isAutoSendingRound
                                  ? `Publicando grupo por grupo con pausa antibaneo. Siguiente grupo en ${groupSecondsLeft} segundos.`
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

                          {/* Barra de Progreso Cyan -> Esmeralda en Tiempo Real */}
                          <div className="w-full h-2.5 rounded-full bg-[#06131E] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#10B981] transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                              style={{ width: `${reverseBarPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* 4 CAJAS DE MÉTRICAS INFERIORES (GRUPOS DETECTADOS / ACTIVOS / INTERVALO / ÚLTIMA DIFUSIÓN) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Cupo de Grupos Plan
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
                              {isAutoSendingRound ? `${groupSecondsLeft}s – 60s` : "55s – 90s"}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-[#131B2A] border border-[#223049]">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Última Difusión ({sentCount} envíos)
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

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              {paginatedLogs.map((log: any) => (
                                <div 
                                  key={log.id}
                                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#131B2A] border border-[#223049]"
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-1.5">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      log.status === "SENT" ? "bg-emerald-400" : "bg-red-500"
                                    }`} />
                                    <span className="font-bold text-white truncate text-[11px]" title={log.targetGroupName || log.targetGroupId}>
                                      {log.targetGroupName || log.targetGroupId}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                      ✓
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
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
