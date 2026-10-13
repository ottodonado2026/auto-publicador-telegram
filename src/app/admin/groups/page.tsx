"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { 
  Users, Send, RefreshCw, Search, CheckSquare, 
  Square, Rocket, CheckCircle2, AlertCircle, ExternalLink, Sparkles
} from "lucide-react";

const OTTBOT_PROMO_DEFAULT = `🤖 **¿QUIERES PUBLICAR TUS ANUNCIOS EN AUTOMÁTICO 24/7 EN DECENAS DE GRUPOS?** 🚀

Automatiza tus ventas en Telegram con **OttBot PRO**:
> ✅ Publica en 15, 30, 60 o 100 grupos sin mover un dedo
> ✅ Usa tu propia cuenta o nuestra **Flota de Bots verificados**
> ✅ Sistema Antibaneo con intervalos inteligentes
> ✅ Planes desde **$1.25 USD** y prueba inmediata

👉 **Regístrate y activa tu piloto automático hoy en OttBot**`;

export default function AdminGroupsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [promoMessage, setPromoMessage] = useState(OTTBOT_PROMO_DEFAULT);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
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

  const toggleGroup = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
    }
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((g) => g.identifier);
    setSelectedGroups(Array.from(new Set([...selectedGroups, ...ids])));
  };

  const clearSelection = () => setSelectedGroups([]);

  const handleBroadcastPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroups.length === 0) {
      setFeedback({ message: "Selecciona al menos 1 grupo de la tabla para emitir.", isError: true });
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

  const filtered = groups.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.stores.join(" ").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Base de Datos Global de Grupos & autopromoción OttBot
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
            Todos los grupos vinculados por tus clientes quedan guardados automáticamente aquí para que puedas ofrecer OttBot a miles de miembros.
          </p>
        </div>

        <button
          onClick={fetchGroups}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white"
              : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sincronizar Directorio ({groups.length})</span>
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LADO IZQUIERDO: Directorio Maestro de Grupos */}
        <div className={`lg:col-span-7 rounded-3xl p-6 border shadow-xl ${
          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar grupo o tienda cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                  isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-black"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                ✓ Marcar Todos ({filtered.length})
              </button>
              <span className="text-neutral-500">•</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-red-400 hover:underline cursor-pointer"
              >
                ✕ Limpiar
              </button>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
            {filtered.map((g) => {
              const isSelected = selectedGroups.includes(g.identifier);
              return (
                <div
                  key={g.identifier}
                  onClick={() => toggleGroup(g.identifier)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#229ED9]/15 border-[#229ED9]"
                      : isDark
                      ? "bg-[#171A20] border-[#2D3340] hover:border-neutral-600"
                      : "bg-neutral-50 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-black text-sm truncate flex items-center gap-2">
                        <span>{g.title}</span>
                        <span className="text-[11px] font-mono text-[#229ED9]">@{g.identifier}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Vinculado por: <strong>{g.stores.join(", ")}</strong> • {g.totalSentCount} envíos registrados
                      </div>
                    </div>
                  </div>

                  <a
                    href={g.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-neutral-400 hover:text-[#229ED9] flex-shrink-0"
                    title="Abrir grupo en Telegram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })}

            {filtered.length === 0 && !loading && (
              <div className="p-10 text-center text-xs text-neutral-400">
                No se encontraron grupos con ese criterio.
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: Emisor Promocional del Rey para vender OttBot */}
        <div className={`lg:col-span-5 rounded-3xl p-6 border shadow-xl sticky top-8 ${
          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
        }`}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">Promocionar OttBot en Estos Grupos</h2>
              <p className="text-[11px] text-neutral-400">
                Publica tu anuncio oficial de OttBot con la Granja en los grupos marcados ({selectedGroups.length} seleccionados).
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
                className={`w-full p-4 rounded-2xl text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                  isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-black"
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
