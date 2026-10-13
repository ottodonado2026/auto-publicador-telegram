"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientSidebar from "@/components/ClientSidebar";
import { 
  Send, Plus, Play, Pause, AlertCircle, Clock, 
  CheckCircle2, Layers, MessageSquare, Activity, ExternalLink, RefreshCw
} from "lucide-react";

export default function ClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/campaigns");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#E9ECF0] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#229ED9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const membership = data?.membership;
  const campaigns = data?.campaigns || [];
  const telegram = data?.telegramAccount;
  const isExpired = !membership?.hasAccess;

  return (
    <div className="min-h-screen bg-[#E9ECF0] text-[#111827] flex">
      <ClientSidebar user={data?.user} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
        {/* Banner de Membresía */}
        {isExpired ? (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 text-red-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Membresía Vencida — Envíos Pausados</h3>
                <p className="text-xs text-red-600/90 mt-0.5">
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
          <div className="mb-8 p-5 bg-white border border-neutral-300/80 rounded-2xl flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Suscripción Activa
                </span>
                <span className="text-base font-extrabold text-[#0F172A]">
                  {membership?.daysRemaining} días restantes vigentes
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
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Mis Campañas & Progreso de Envíos
            </h1>
            <p className="text-xs text-neutral-500 font-semibold mt-1">
              Monitorea el avance de tus publicaciones automáticas en tiempo real.
            </p>
          </div>

          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Copy</span>
          </Link>
        </div>

        {/* Lista de Campañas con Barra de Progreso en Vivo */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-300 p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Aún no has creado campañas</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Crea tu primer copy con texto formateado, negritas, emojis y enlaces. Podrás ver la vista previa exacta en Telegram antes de publicar.
            </p>
            <Link
              href="/dashboard/campaigns"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Diseñar mi Primer Copy</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {campaigns.map((c: any) => {
              const targetCount = Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 1;
              const sentCount = c._count?.logs || 0;
              const progressPercent = Math.min(100, Math.round((sentCount / Math.max(1, targetCount * 5)) * 100));

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-6 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-neutral-900">{c.name}</h2>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          c.status === "ACTIVE" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-neutral-100 text-neutral-600"
                        }`}>
                          {c.status === "ACTIVE" ? "Activo" : "Pausado"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Intervalo: Cada {c.intervalMinutes} minutos • Grupos asignados: {targetCount}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={actionLoading === c.id}
                        onClick={() => toggleCampaign(c.id, c.status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          c.status === "ACTIVE"
                            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300"
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

                  {/* Barra de Progreso en Tiempo Real */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-neutral-200 mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#229ED9] animate-pulse" />
                        Progreso de Publicaciones
                      </span>
                      <span className="font-extrabold text-neutral-900">
                        {sentCount} envíos registrados
                      </span>
                    </div>

                    <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#229ED9] to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-2 font-medium">
                      <span>Delay de seguridad: 60s entre envíos</span>
                      <span>Descanso entre rondas activo</span>
                    </div>
                  </div>

                  {/* Extracto del Copy */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
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
