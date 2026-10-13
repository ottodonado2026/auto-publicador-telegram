"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, Plus, Play, Pause, AlertCircle, Clock, 
  CheckCircle2, Layers, MessageSquare, Activity, 
  RefreshCw, Rocket, XCircle, ShieldCheck
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

  // Disparar emisión manual en tiempo real
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

      // Refrescar datos para mostrar el nuevo log y progreso
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

  if (loading && !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#12151B]" : "bg-[#E9ECF0]"}`}>
        <div className="w-9 h-9 border-3 border-[#229ED9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const membership = data?.membership;
  const campaigns = data?.campaigns || [];
  const sessionUser = data?.user;
  const isExpired = !membership?.hasAccess;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
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
              Renovar Planes
            </Link>
          </div>
        ) : (
          <div className={`mb-8 p-5 rounded-3xl border flex items-center justify-between shadow-md ${
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
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
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

        {/* Lista de Campañas con Barra de Progreso y Acciones */}
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
              Crea tu primer copy con texto formateado, negritas, emojis y enlaces. Podrás ver la vista previa exacta en Telegram antes de publicar.
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
          <div className="space-y-6">
            {campaigns.map((c: any) => {
              const targetCount = Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 1;
              const sentCount = c._count?.logs || 0;
              const progressPercent = Math.min(100, Math.round((sentCount / Math.max(1, targetCount * 5)) * 100));
              const isBroadcasting = broadcastingId === c.id;
              const logs = c.logs || [];

              return (
                <div
                  key={c.id}
                  className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-all ${
                    isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-black tracking-tight">{c.name}</h2>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          c.status === "ACTIVE" 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {c.status === "ACTIVE" ? "Activo" : "Pausado"}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Intervalo: Cada {c.intervalMinutes} minutos • Grupos asignados: {targetCount} ({Array.isArray(c.targetGroupIds) ? c.targetGroupIds.join(", ") : ""})
                      </p>
                    </div>

                    {/* Botones de Control: Emitir Ronda Ahora & Pausar */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBroadcasting || c.status !== "ACTIVE"}
                        onClick={() => handleTriggerBroadcast(c.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                        title="Emitir mensaje a Telegram inmediatamente"
                      >
                        {isBroadcasting ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Emitiendo a Telegram...</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-3.5 h-3.5 text-white animate-bounce" />
                            <span>Publicar Ronda Ahora</span>
                          </>
                        )}
                      </button>

                      <button
                        disabled={actionLoading === c.id}
                        onClick={() => toggleCampaign(c.id, c.status)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
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
                            <span>Activar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mensaje de Feedback de Difusión */}
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
                  <div className={`rounded-2xl p-4 border mb-4 ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-[#F8FAFC] border-neutral-200"
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold flex items-center gap-1.5 text-[#229ED9]">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Progreso de Publicaciones
                      </span>
                      <span className="font-extrabold">
                        {sentCount} envíos registrados
                      </span>
                    </div>

                    <div className={`w-full h-3 rounded-full overflow-hidden ${
                      isDark ? "bg-[#252A34]" : "bg-neutral-200"
                    }`}>
                      <div 
                        className="h-full bg-gradient-to-r from-[#229ED9] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(sentCount > 0 ? 20 : 5, progressPercent)}%` }}
                      />
                    </div>

                    <div className={`flex justify-between items-center text-[11px] mt-2 font-medium ${
                      isDark ? "text-neutral-400" : "text-neutral-500"
                    }`}>
                      <span>Delay de seguridad: 60s entre envíos</span>
                      <span>Modo Granja OttBot Activo</span>
                    </div>
                  </div>

                  {/* Historial en Tiempo Real de Envíos Realizados (Logs) */}
                  {logs.length > 0 && (
                    <div className={`mb-4 p-3.5 rounded-2xl border ${
                      isDark ? "bg-[#15181E] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                    }`}>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider block mb-2 ${
                        isDark ? "text-neutral-400" : "text-neutral-500"
                      }`}>
                        Últimos Envíos en Vivo (Telegram MTProto)
                      </span>
                      <div className="space-y-1.5">
                        {logs.map((log: any) => (
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
                              <span className="text-[10px] text-neutral-400 hidden sm:inline">
                                ({log.targetGroupId})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                log.status === "SENT"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}>
                                {log.status === "SENT" ? "✓ Publicado" : "Error"}
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

                  {/* Extracto del Copy */}
                  <div className={`p-3 rounded-xl border text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto ${
                    isDark 
                      ? "bg-[#171A20] border-[#2D3340] text-neutral-300" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  }`}>
                    {c.messageContent}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
