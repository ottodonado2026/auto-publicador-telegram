"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Activity, CheckCircle2, AlertCircle, Clock, Play, Pause,
  Users, Flame
} from "lucide-react";

interface CampaignLog {
  id: string;
  targetGroupName: string | null;
  targetGroupId: string;
  status: string;
  createdAt: string;
  errorMessage: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  messageText: string;
  createdAt: string;
  targetGroups: string[];
  _count: { logs: number };
  recentLogs?: CampaignLog[];
}

interface ClientWithCampaigns {
  id: string;
  botCode: string | null;
  email: string;
  storeName: string | null;
  name: string | null;
  phoneNumber: string | null;
  subscription: { status: string; expiresAt: string } | null;
  _count: { campaigns: number; telegramAccounts: number };
  campaigns?: Campaign[];
}

export default function AdminCampaignsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [clients, setClients] = useState<ClientWithCampaigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      const data = await res.json();
      setClients(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClientCampaigns = async (userId: string) => {
    try {
      const res = await fetch(`/api/campaigns?userId=${userId}&admin=true`);
      if (!res.ok) return;
      const data = await res.json();
      setClients(prev => prev.map(c =>
        c.id === userId ? { ...c, campaigns: data.campaigns || [] } : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Auto-refresh cada 30s para ver cambios en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (expandedClient) fetchClientCampaigns(expandedClient);
    }, 30000);
    return () => clearInterval(interval);
  }, [expandedClient]);

  const handleToggleClient = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      setExpandedCampaign(null);
    } else {
      setExpandedClient(clientId);
      setExpandedCampaign(null);
      await fetchClientCampaigns(clientId);
    }
  };

  const filtered = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.botCode?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.storeName?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const cardBg = isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300";

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE" || status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (status === "PAUSED" || status === "paused") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-red-500/15 text-red-400 border-red-500/30";
  };

  const getLogStatus = (status: string) => {
    if (status === "SUCCESS") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
    if (status === "FAILED") return <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
  };

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Monitoreo de Campañas por Cliente
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Verifica en tiempo real las campañas activas de cada cliente, sus publicaciones y el estado de entrega. Se actualiza automáticamente cada 30s.
          </p>
        </div>
        <button
          onClick={fetchClients}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white" : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Clientes Registrados", value: clients.length, icon: <Users className="w-5 h-5" />, color: "text-[#229ED9]" },
          { label: "Clientes con Plan Activo", value: clients.filter(c => c.subscription?.status === "ACTIVE").length, icon: <Activity className="w-5 h-5" />, color: "text-emerald-400" },
          { label: "Total Campañas", value: clients.reduce((s, c) => s + c._count.campaigns, 0), icon: <Flame className="w-5 h-5" />, color: "text-amber-400" },
          { label: "Cuentas TG Vinculadas", value: clients.reduce((s, c) => s + c._count.telegramAccounts, 0), icon: <Play className="w-5 h-5" />, color: "text-purple-400" },
        ].map((m, i) => (
          <div key={i} className={`rounded-2xl p-4 border ${cardBg}`}>
            <div className={`${m.color} mb-1`}>{m.icon}</div>
            <div className={`text-xl font-black font-mono ${m.color}`}>{m.value}</div>
            <div className={`text-[11px] font-bold mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por BOT-I, nombre o correo..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
              isDark ? "bg-[#1B1F27] border-[#2D3340] text-white placeholder:text-neutral-500" : "bg-[#F4F6F9] border-slate-300 text-slate-900"
            }`}
          />
        </div>
        <div className={`text-xs font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
          {filtered.length} cliente(s) • Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Lista de Clientes Expandible */}
      <div className="space-y-3">
        {paginated.map((client) => {
          const isExpanded = expandedClient === client.id;
          const expiresAt = client.subscription?.expiresAt ? new Date(client.subscription.expiresAt) : null;
          const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : 0;
          const isActive = client.subscription?.status === "ACTIVE" && daysLeft > 0;

          return (
            <div key={client.id} className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${cardBg}`}>
              {/* Fila del Cliente */}
              <button
                onClick={() => handleToggleClient(client.id)}
                className={`w-full px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                  isExpanded ? isDark ? "bg-[#229ED9]/10" : "bg-sky-50/70" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                    isActive ? "bg-emerald-500/20 text-emerald-400" : isDark ? "bg-[#13161C] text-neutral-400" : "bg-slate-200 text-slate-500"
                  }`}>
                    {isActive ? <Activity className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`font-black text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                      {client.storeName || client.name || "Sin nombre"}
                    </div>
                    <div className={`font-mono text-[11px] ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                      {client.botCode || "N/A"} • {client.email}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
                    {isActive ? `${daysLeft}d activo` : "Expirado"}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${isDark ? "bg-[#229ED9]/15 text-[#229ED9] border-[#229ED9]/30" : "bg-sky-100 text-sky-700 border-sky-300"}`}>
                    {client._count.campaigns} campañas
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${isDark ? "bg-purple-500/15 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-700 border-purple-300"}`}>
                    {client._count.telegramAccounts} TG
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""} ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
                </div>
              </button>

              {/* Panel Expandido de Campañas */}
              {isExpanded && (
                <div className={`border-t px-5 py-5 ${isDark ? "border-[#2B313F] bg-[#13161C]/50" : "border-slate-200 bg-slate-50/60"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                      Campañas de {client.storeName || client.name}
                    </h3>
                    <button
                      onClick={() => fetchClientCampaigns(client.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl border cursor-pointer ${
                        isDark ? "bg-[#1B1F27] border-[#2D3340] text-neutral-300 hover:text-white" : "bg-white border-slate-300 text-slate-700"
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" /> Refrescar
                    </button>
                  </div>

                  {!client.campaigns ? (
                    <div className={`text-center text-xs py-6 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                      Cargando campañas...
                    </div>
                  ) : client.campaigns.length === 0 ? (
                    <div className={`text-center text-xs py-6 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                      Este cliente no tiene campañas creadas.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {client.campaigns.map((campaign) => {
                        const isCampExpanded = expandedCampaign === campaign.id;
                        return (
                          <div key={campaign.id} className={`rounded-2xl border ${isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-white border-slate-200"}`}>
                            <button
                              onClick={() => setExpandedCampaign(isCampExpanded ? null : campaign.id)}
                              className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(campaign.status)}`}>
                                  {campaign.status === "ACTIVE" || campaign.status === "active" ? (
                                    <><Activity className="w-3 h-3" /> Activa</>
                                  ) : (
                                    <><Pause className="w-3 h-3" /> Pausada</>
                                  )}
                                </span>
                                <span className={`font-black text-xs ${isDark ? "text-white" : "text-slate-900"}`}>
                                  {campaign.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                                  {campaign.targetGroups?.length || 0} grupos • {campaign._count.logs} logs
                                </span>
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCampExpanded ? "rotate-90" : ""} ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
                              </div>
                            </button>

                            {/* Detalle del Copy y Logs recientes */}
                            {isCampExpanded && (
                              <div className={`border-t px-4 py-3 ${isDark ? "border-[#2B313F]" : "border-slate-200"}`}>
                                <div className={`text-[11px] font-mono p-3 rounded-xl mb-3 border leading-relaxed line-clamp-4 ${
                                  isDark ? "bg-[#13161C] border-[#2D3340] text-neutral-300" : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}>
                                  {campaign.messageText || "Sin mensaje configurado"}
                                </div>

                                {campaign.recentLogs && campaign.recentLogs.length > 0 && (
                                  <div>
                                    <div className={`text-[10px] font-black uppercase tracking-wider mb-2 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                                      Últimas Publicaciones
                                    </div>
                                    <div className="space-y-1.5">
                                      {campaign.recentLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className={`flex items-center gap-2.5 text-[11px] p-2.5 rounded-xl border ${
                                          isDark ? "bg-[#13161C] border-[#2D3340]" : "bg-slate-50 border-slate-200"
                                        }`}>
                                          {getLogStatus(log.status)}
                                          <span className={`font-bold flex-1 truncate ${isDark ? "text-neutral-200" : "text-slate-700"}`}>
                                            {log.targetGroupName || log.targetGroupId}
                                          </span>
                                          {log.status === "FAILED" && log.errorMessage && (
                                            <span className="text-red-400 text-[10px] font-semibold truncate max-w-[120px]">
                                              {log.errorMessage}
                                            </span>
                                          )}
                                          <span className={`font-mono text-[10px] flex-shrink-0 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                                            {new Date(log.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {paginated.length === 0 && !loading && (
          <div className={`rounded-3xl p-12 text-center text-xs border ${cardBg}`}>
            <span className={isDark ? "text-neutral-500" : "text-slate-400"}>No se encontraron clientes.</span>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className={`mt-6 flex items-center justify-between text-xs font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
          <span>Página {currentPage} de {totalPages} ({filtered.length} clientes — 10 por página)</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${isDark ? "bg-[#1B1F27] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"}`}>
              <ChevronLeft className="w-3.5 h-3.5" /><span>Anterior</span>
            </button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${isDark ? "bg-[#1B1F27] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"}`}>
              <span>Siguiente</span><ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
