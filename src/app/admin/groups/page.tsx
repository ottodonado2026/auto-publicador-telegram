"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Users, RefreshCw, Search, CheckSquare, Square, Rocket,
  CheckCircle2, AlertCircle, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Database
} from "lucide-react";

const OTTBOT_PROMO_DEFAULT = `🤖 **¿QUIERES PUBLICAR TUS ANUNCIOS Y COPYS EN AUTOMÁTICO 24/7 EN DECENAS DE GRUPOS?** 🚀

Automatiza tus anuncios en Telegram con **OttBot PRO**:
> ✅ Publica en 25, 40, 60 o 100 grupos sin mover un dedo
> ✅ Usa tu propia cuenta o nuestra **Granja de Bots verificados**
> ✅ Sistema Antibaneo con intervalos de 60s y descanso inteligente
> ✅ Planes desde **$1.25 USD** y 1 Día de Prueba Gratis

👉 **Crea tu cuenta e inicia tu prueba gratis hoy en OttBot PRO**`;

export default function AdminGroupsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [groups, setGroups] = useState<any[]>([]);
  const [usersWithGroups, setUsersWithGroups] = useState<any[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [promoMessage, setPromoMessage] = useState(OTTBOT_PROMO_DEFAULT);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Paginación cada 10 grupos
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
      if (data.usersWithGroups) {
        setUsersWithGroups(data.usersWithGroups);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Lista base según el usuario seleccionado ("ALL" o un userId específico)
  const baseList =
    selectedUserFilter === "ALL"
      ? groups
      : usersWithGroups.find((u) => u.userId === selectedUserFilter)?.groups || [];

  const filtered = baseList.filter(
    (g: any) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.stores && g.stores.join(" ").toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedGroups = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleGroup = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
    }
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((g: any) => g.identifier);
    setSelectedGroups(Array.from(new Set([...selectedGroups, ...ids])));
  };

  const clearSelection = () => setSelectedGroups([]);

  const handleBroadcastPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroups.length === 0) {
      setFeedback({ message: "Selecciona al menos 1 grupo de la lista para emitir.", isError: true });
      return;
    }

    try {
      setSending(true);
      setFeedback(null);
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageContent: promoMessage,
          targetGroups: selectedGroups,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al emitir");

      setFeedback({ message: data.message, isError: false });
      await fetchGroups();
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto space-y-6">
      {/* Encabezado Ancho Completo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Base de Datos de Grupos Dividida por Usuarios
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Explora los grupos que pertenecen a cada cliente registrado con paginación limpia y emite promociones de OttBot con tu Granja.
          </p>
        </div>

        <button
          onClick={fetchGroups}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1B1F27] border-[#2B313F] text-neutral-200 hover:text-white"
              : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white shadow-xs"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sincronizar Directorio ({groups.length} Grupos Únicos)</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-md ${
            feedback.isError
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SELECTOR DE DIVISIÓN POR USUARIO REGISTRADO */}
      <div
        className={`rounded-3xl p-5 border shadow-md ${
          isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
        }`}
      >
        <div className="text-[11px] font-black uppercase tracking-wider text-[#229ED9] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Filtrar Grupos por Usuario Registrado:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedUserFilter("ALL");
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
              selectedUserFilter === "ALL"
                ? "bg-[#229ED9] text-white border-[#229ED9] shadow-md"
                : isDark
                ? "bg-[#13161C] border-[#282E3B] text-neutral-300 hover:border-[#229ED9]/50"
                : "bg-white border-slate-300 text-slate-800 hover:border-[#229ED9]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Todos los Grupos Globales ({groups.length})</span>
          </button>

          {usersWithGroups.map((u) => {
            const active = selectedUserFilter === u.userId;
            return (
              <button
                key={u.userId}
                type="button"
                onClick={() => {
                  setSelectedUserFilter(u.userId);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? "bg-[#229ED9] text-white border-[#229ED9] shadow-md"
                    : isDark
                    ? "bg-[#13161C] border-[#282E3B] text-neutral-300 hover:border-[#229ED9]/50"
                    : "bg-white border-slate-300 text-slate-800 hover:border-[#229ED9]"
                }`}
              >
                <span>{u.userName}</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                    active ? "bg-white/20 text-white" : "bg-[#229ED9]/15 text-[#229ED9]"
                  }`}
                >
                  {u.botCode}
                </span>
                <span className="text-[11px] opacity-85">({u.groupsCount} grupos)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL EN ANCHO COMPLETO: TABLA PAGINADA DE GRUPOS + EMISOR PROMOCIONAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LADO IZQUIERDO (8 COLUMNAS): Grupos Estructurados y Paginados cada 10 */}
        <div
          className={`xl:col-span-8 rounded-3xl p-6 border shadow-xl ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre de grupo, @usuario o cliente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                  isDark
                    ? "bg-[#13161C] border-[#282E3B] text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
              >
                ✓ Marcar Estos ({filtered.length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 cursor-pointer"
              >
                ✕ Limpiar ({selectedGroups.length})
              </button>
            </div>
          </div>

          {/* Grid de 2 Columnas para que se vea limpio y sin barra de scroll interna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paginatedGroups.map((g: any) => {
              const isSelected = selectedGroups.includes(g.identifier);
              return (
                <div
                  key={g.identifier}
                  onClick={() => toggleGroup(g.identifier)}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#229ED9]/15 border-[#229ED9]"
                      : isDark
                      ? "bg-[#13161C] border-[#282E3B] hover:border-[#229ED9]/50"
                      : "bg-white border-slate-200 hover:border-[#229ED9]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className={`font-black text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {g.title}
                      </div>
                      <div className="text-[11px] font-mono text-[#229ED9] truncate">
                        @{g.identifier}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 truncate">
                        {g.stores ? (
                          <>
                            Usuario: <strong>{g.stores.join(", ")}</strong> •{" "}
                          </>
                        ) : null}
                        <span className="text-emerald-400 font-bold">{g.totalSentCount} envíos</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={g.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9] hover:text-white transition-all flex-shrink-0"
                    title="Abrir grupo en Telegram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="p-10 text-center text-xs text-neutral-400">
              No se encontraron grupos para este criterio.
            </div>
          )}

          {/* Paginación Limpia cada 10 Grupos */}
          <div className="mt-6 pt-4 border-t border-neutral-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold">
            <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
              Mostrando {paginatedGroups.length} de {filtered.length} grupo(s) • Página {currentPage} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                  isDark ? "bg-[#13161C] border-[#282E3B] text-white" : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                  isDark ? "bg-[#13161C] border-[#282E3B] text-white" : "bg-white border-slate-300 text-slate-800"
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* LADO DERECHO (4 COLUMNAS): Emisor Promocional del Rey */}
        <div
          className={`xl:col-span-4 rounded-3xl p-6 border shadow-xl ${
            isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                Promocionar OttBot en Grupos
              </h2>
              <p className="text-[11px] text-neutral-400">
                Publica tu anuncio oficial con la Granja en los grupos marcados ({selectedGroups.length} seleccionados).
              </p>
            </div>
          </div>

          <form onSubmit={handleBroadcastPromo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5">
                Copy Promocional de tu Sistema OttBot
              </label>
              <textarea
                rows={9}
                required
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                className={`w-full p-4 rounded-2xl border text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                  isDark
                    ? "bg-[#13161C] border-[#282E3B] text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={sending || selectedGroups.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>
                {sending
                  ? "Emitiendo en los grupos..."
                  : `Publicar Oferta de OttBot en ${selectedGroups.length} Grupo(s)`}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
