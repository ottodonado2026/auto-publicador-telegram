"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, Plus, Play, Pause, AlertCircle, Clock, 
  CheckCircle2, Layers, MessageSquare, Activity, 
  RefreshCw, Rocket, XCircle, ShieldCheck, Users, TrendingUp, Edit3
} from "lucide-react";

export default function ClientDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);
  const [campaignPage, setCampaignPage] = useState(1);
  const campaignsPerPage = 12;

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/campaigns");
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
    // Actualizar en tiempo real cada 30s para ver el progreso automático
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCampaign = async (id: string, currentStatus: string) => {
    try {
      setActionLoading(id);
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const res = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerBroadcast = async (campaignId: string) => {
    try {
      setBroadcastingId(campaignId);
      setBroadcastFeedback(null);

      const res = await fetch("/api/campaigns/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Ocurrió un error al emitir a Telegram");
      }

      setBroadcastFeedback({
        id: campaignId,
        message: "¡Ronda de difusión completada exitosamente en Telegram!",
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
  const campaigns = data?.campaigns || [];
  const sessionUser = data?.user;
  const isExpired = !membership?.hasAccess;

  // Métricas agregadas
  const totalGroups = campaigns.reduce((acc: number, c: any) => acc + (Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 1), 0);
  const totalSent = campaigns.reduce((acc: number, c: any) => acc + (c._count?.logs || 0), 0);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
        {/* Skeleton fluido para evitar el pantallazo negro */}
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
                      Tus campañas están temporalmente en pausa. Recarga tus días ($1.25/día o paquete con descuento) para reactivar los envíos automáticos.
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
              <div className={`mb-6 p-5 rounded-3xl border flex items-center justify-between shadow-md ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      Suscripción Activa (Prueba 24h)
                    </span>
                    <span className="text-base font-black">
                      {membership?.daysRemaining} día(s) restantes vigentes
                    </span>
                  </div>
                </div>

                <Link
                  href="/dashboard/plans"
                  className="text-xs font-bold text-[#229ED9] hover:underline"
                >
                  Ver paquetes y tarifas →
                </Link>
              </div>
            )}

            {/* Métricas del Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border shadow-sm ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Campañas Activas</span>
                  <Activity className="w-4 h-4 text-[#229ED9]" />
                </div>
                <div className="text-2xl font-black mt-1">
                  {campaigns.filter((c: any) => c.status === "ACTIVE").length}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-sm ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Grupos Asignados</span>
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
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">Envíos Totales</span>
                  <Rocket className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black mt-1">
                  {totalSent}
                </div>
              </div>
            </div>

            {/* Header de Campañas */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Mis Campañas & Progreso de Envíos
                </h1>
                <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Monitorea el avance de tus publicaciones automáticas en tiempo real.
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
                  title="Refrescar datos"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span className="hidden sm:inline">Refrescar</span>
                </button>

                <Link
                  href="/dashboard/campaigns"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Copy</span>
                </Link>
              </div>
            </div>

            {/* Lista Ejecutiva de Campañas */}
            {campaigns.length === 0 ? (
              <div className={`rounded-3xl border p-12 text-center shadow-lg ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  isDark ? "bg-[#171A20] text-neutral-400" : "bg-neutral-100 text-neutral-400"
                }`}>
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold">Aún no has creado campañas</h3>
                <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}>
                  Crea tu primer copy con texto formateado, negritas, emojis y enlaces.
                </p>
                <Link
                  href="/dashboard/campaigns"
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Diseñar mi Primer Copy</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {campaigns
                  .slice((campaignPage - 1) * campaignsPerPage, campaignPage * campaignsPerPage)
                  .map((c: any) => {
                  const targetCount = Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 1;
                  const sentCount = c._count?.logs || 0;
                  const progressPercent = Math.min(100, Math.round((sentCount / Math.max(1, targetCount * 5)) * 100));
                  const isBroadcasting = broadcastingId === c.id;
                  const logs = c.logs || [];

                  return (
                    <div
                      key={c.id}
                      className={`rounded-3xl p-6 border shadow-xl transition-all ${
                        isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-base sm:text-lg font-black tracking-tight">{c.name}</h2>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              c.status === "ACTIVE" 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-600"
                            }`}>
                              {c.status === "ACTIVE" ? "Activo" : "Pausado"}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                            Intervalo: Cada {c.intervalMinutes} minutos • Grupos asignados: {targetCount} ({Array.isArray(c.targetGroupIds) ? c.targetGroupIds.slice(0, 3).join(", ") : ""}{targetCount > 3 ? ` +${targetCount - 3} más` : ""})
                          </p>
                        </div>

                        {/* Botones de Control: Piloto Automático 24/7, Editar y Pausar */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/campaigns?edit=${c.id}`}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                              isDark
                                ? "bg-[#171A20] hover:bg-[#252A34] text-[#229ED9] border-[#2D3340]"
                                : "bg-neutral-50 hover:bg-neutral-100 text-[#229ED9] border-neutral-300"
                            }`}
                            title="Editar copy, foto o grupos de esta campaña"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </Link>

                          {c.status === "ACTIVE" ? (
                            <button
                              type="button"
                              disabled={isBroadcasting}
                              onClick={() => handleTriggerBroadcast(c.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                              title="La campaña está activa 24/7. Haz clic si deseas forzar una ronda inmediata ahora."
                            >
                              {isBroadcasting ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Emitiendo en Vivo...</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                  <span>Activo 24/7 (Emitir Ahora)</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBroadcasting}
                              onClick={() => handleTriggerBroadcast(c.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-[#229ED9] hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                              title="Disparar una ronda manual de prueba"
                            >
                              <Rocket className="w-3.5 h-3.5 text-white" />
                              <span>Publicar Ronda</span>
                            </button>
                          )}

                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => toggleCampaign(c.id, c.status)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              c.status === "ACTIVE"
                                ? isDark
                                  ? "bg-[#171A20] hover:bg-[#252A34] text-neutral-300 border-[#2D3340]"
                                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            }`}
                          >
                            {c.status === "ACTIVE" ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>Reanudar 24/7</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Feedback de Difusión */}
                      {broadcastFeedback && broadcastFeedback.id === c.id && (
                        <div className={`mb-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                          broadcastFeedback.isError
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        }`}>
                          {broadcastFeedback.isError ? (
                            <XCircle className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span>{broadcastFeedback.message}</span>
                        </div>
                      )}

                      {/* Barra de Progreso en Tiempo Real */}
                      <div className={`rounded-2xl p-4 border mb-3 ${
                        isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-[#F8FAFC] border-neutral-200"
                      }`}>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold flex items-center gap-1.5 text-[#229ED9]">
                            <Activity className="w-4 h-4 animate-pulse" />
                            Progreso de Envíos en Vivo
                          </span>
                          <span className="font-extrabold">
                            {sentCount} envíos registrados
                          </span>
                        </div>

                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${
                          isDark ? "bg-[#252A34]" : "bg-neutral-200"
                        }`}>
                          <div 
                            className="h-full bg-gradient-to-r from-[#229ED9] to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(sentCount > 0 ? 25 : 5, progressPercent)}%` }}
                          />
                        </div>

                        <div className={`flex justify-between items-center text-[10px] mt-2 font-medium ${
                          isDark ? "text-neutral-400" : "text-neutral-500"
                        }`}>
                          <span>Delay antibaneo: 60s entre envíos</span>
                          <span>Próxima ronda: programada automáticamente</span>
                        </div>
                      </div>

                      {/* Historial de Envíos en Vivo (Últimos Registros) */}
                      {logs.length > 0 && (
                        <div className={`p-3 rounded-2xl border ${
                          isDark ? "bg-[#15181E] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                        }`}>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider block mb-2 ${
                            isDark ? "text-neutral-400" : "text-neutral-500"
                          }`}>
                            Últimas Publicaciones Exitosas
                          </span>
                          <div className="space-y-1">
                            {logs.slice(0, 3).map((log: any) => (
                              <div 
                                key={log.id}
                                className={`flex items-center justify-between text-xs p-2 rounded-xl border ${
                                  isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={`w-2 h-2 rounded-full ${
                                    log.status === "SENT" ? "bg-emerald-500" : "bg-red-500"
                                  }`} />
                                  <span className="font-bold truncate">
                                    {log.targetGroupName || log.targetGroupId}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    ✓ Publicado
                                  </span>
                                  <span className="text-[10px] text-neutral-500">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                {Math.ceil(campaigns.length / campaignsPerPage) > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#2D3340]/50">
                    <span className="text-xs text-neutral-400 font-medium">
                      Mostrando {(campaignPage - 1) * campaignsPerPage + 1} - {Math.min(campaignPage * campaignsPerPage, campaigns.length)} de {campaigns.length} campañas
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
                        Página {campaignPage} de {Math.ceil(campaigns.length / campaignsPerPage)}
                      </span>

                      <button
                        type="button"
                        disabled={campaignPage >= Math.ceil(campaigns.length / campaignsPerPage)}
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
