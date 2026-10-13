"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Bold, Italic, Quote, Code, CornerDownLeft, Sparkles, 
  Send, Upload, CheckCircle2, AlertCircle, X, Plus, Eye,
  RefreshCw, Users, CheckSquare, Square, Layers, Copy, BookmarkCheck
} from "lucide-react";

const TEMPLATES = [
  {
    title: "⚡ Cuentas Streaming Pro",
    text: "🔥 **¡PROMOCIÓN EXCLUSIVA EN STREAMING!** 🔥\n\nAdquiere hoy tus pantallas y combos con entrega instantánea:\n\n> 📺 Netflix Ultra HD 4K\n> 🍿 Disney+ & Star+\n> 🎧 Spotify Familiar\n> ⚽ Win Sports & Paramount+\n\n✅ Garantía total durante todo el mes\n✅ Soporte inmediato 24/7\n\n👇 **¡Escríbeme ya al privado para activar tu cuenta!** 👇",
  },
  {
    title: "🚀 Servicios Digitales & IPTV",
    text: "🚀 **EL MEJOR SERVICIO DE IPTV & ENTRETENIMIENTO** 🚀\n\n+10,000 Canales en Vivo, Películas y Series en Full HD y 4K.\n\n> ⚡ Cero caídas, servidores de alta velocidad\n> 📱 Compatible con Smart TV, Celular, TV Box y PC\n\n🎁 **¡Pide tu DEMO GRATIS de 2 horas ahora mismo!**",
  },
  {
    title: "💼 Tienda Online & Ofertas",
    text: "🛍️ **OFERTAS IMPERDIBLES DE LA SEMANA** 🛍️\n\nEnvíos seguros a todo el país y pagos contraentrega.\n\n> ✨ Calidad 100% garantizada\n> 💳 Métodos de pago flexibles\n\n📲 *Contáctanos al interno para conocer el catálogo completo.*",
  },
];

export default function ClientCampaignsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"CREATE" | "LIBRARY">("CREATE");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<any[]>([]);

  // Campos del Copy
  const [name, setName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  // Sistema de píldoras y grupos
  const [linkInput, setLinkInput] = useState("");
  const [groupPills, setGroupPills] = useState<string[]>([]);

  // Detección automática de grupos de Telegram
  const [detectedGroups, setDetectedGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  // Modalidad
  const [useSystemFarm, setUseSystemFarm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const [authRes, campRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/campaigns"),
      ]);
      const authData = await authRes.json();
      const campData = await campRes.json();

      if (authData.authenticated) setSessionUser(authData.user);
      if (campData.campaigns) setSavedCampaigns(campData.campaigns);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Formato de texto
  const formatSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageContent.substring(start, end);

    const replacement = selectedText.length > 0
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}texto${suffix}`;

    const newContent =
      messageContent.substring(0, start) +
      replacement +
      messageContent.substring(end);

    setMessageContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 0);
  };

  const insertLineBreak = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = messageContent.substring(0, start) + "\n" + messageContent.substring(end);
    setMessageContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  // Cargar grupos automáticamente de Telegram
  const loadTelegramGroups = async () => {
    try {
      setLoadingGroups(true);
      setError(null);
      const res = await fetch("/api/telegram/dialogs");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudieron obtener los grupos de tu Telegram.");
      }
      setDetectedGroups(data.groups || []);
      setShowGroupsModal(true);
    } catch (err: any) {
      setError(err.message || "Error al escanear grupos de Telegram");
    } finally {
      setLoadingGroups(false);
    }
  };

  // Alternar selección de un grupo detectado
  const toggleGroupSelection = (identifier: string) => {
    if (groupPills.includes(identifier)) {
      setGroupPills(groupPills.filter((p) => p !== identifier));
    } else {
      setGroupPills([...groupPills, identifier]);
    }
  };

  // Seleccionar o desmarcar todos los grupos
  const selectAllGroups = () => {
    const all = detectedGroups.map((g) => g.link || g.username || g.title);
    setGroupPills(Array.from(new Set([...groupPills, ...all])));
  };

  const clearAllGroups = () => {
    setGroupPills([]);
  };

  const addGroupPill = () => {
    if (!linkInput.trim()) return;
    const clean = linkInput.trim().replace(/^@/, "");
    if (!groupPills.includes(clean)) {
      setGroupPills([...groupPills, clean]);
    }
    setLinkInput("");
  };

  const removeGroupPill = (pillToRemove: string) => {
    setGroupPills(groupPills.filter((p) => p !== pillToRemove));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al subir imagen");
        setMediaUrl(data.url);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  // Cargar un copy existente en el editor
  const loadExistingCopy = (c: any) => {
    setName(c.name || "");
    setMessageContent(c.messageContent || "");
    setMediaUrl(c.mediaUrl || "");
    setIntervalMinutes(c.intervalMinutes || 60);
    setGroupPills(Array.isArray(c.targetGroupIds) ? c.targetGroupIds : []);
    setActiveTab("CREATE");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (groupPills.length === 0) {
        throw new Error("Debes asignar al menos 1 grupo de Telegram destino.");
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          messageContent,
          mediaUrl: mediaUrl || null,
          intervalMinutes: Number(intervalMinutes),
          targetGroupIds: groupPills,
          useSystemFarm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar campaña");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al guardar campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"}`}>
      <ClientSidebar user={sessionUser} membership={sessionUser?.subscription} />

      <main className="flex-1 ml-64 p-8 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Editor de Copys & Campañas
            </h1>
            <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Crea tus anuncios publicitarios o gestiona tu biblioteca de copys guardados.
            </p>
          </div>

          {/* Selector de Pestañas (Tabs) */}
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab("CREATE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "CREATE"
                  ? "bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/30"
                  : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Diseñar Nuevo Copy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("LIBRARY")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "LIBRARY"
                  ? "bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/30"
                  : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Mis Copys Guardados ({savedCampaigns.length})</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PESTAÑA 2: BIBLIOTECA DE COPYS GUARDADOS */}
        {activeTab === "LIBRARY" && (
          <div className="space-y-4">
            {savedCampaigns.length === 0 ? (
              <div className={`p-12 rounded-3xl border text-center ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <Layers className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h3 className="text-base font-bold">No tienes copys guardados todavía</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Diseña tu primer anuncio en la pestaña "Diseñar Nuevo Copy".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-3xl border shadow-md flex flex-col justify-between ${
                      isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black truncate">{c.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700 text-neutral-300"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mb-3 font-mono line-clamp-3">
                        {c.messageContent}
                      </p>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                        <span>Grupos: {Array.isArray(c.targetGroupIds) ? c.targetGroupIds.length : 0}</span>
                        <span>•</span>
                        <span>Cada {c.intervalMinutes} min</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadExistingCopy(c)}
                      className="mt-4 w-full py-2 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Cargar este Copy en el Editor</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 1: EDITOR DE COPY */}
        {activeTab === "CREATE" && (
          <>
            {/* Plantillas Recomendadas */}
            <div className={`mb-6 rounded-3xl p-5 border shadow-md ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 text-[#229ED9]">
                <Sparkles className="w-4 h-4" />
                <span>Plantillas de Anuncios Recomendadas (1 Clic)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessageContent(tpl.text)}
                    className={`p-3 text-left rounded-2xl border text-xs transition-all group ${
                      isDark
                        ? "bg-[#171A20] border-[#2D3340] hover:border-[#229ED9]"
                        : "bg-neutral-50 border-neutral-300 hover:border-[#229ED9]"
                    }`}
                  >
                    <div className="font-bold group-hover:text-[#229ED9] truncate">
                      {tpl.title}
                    </div>
                    <div className={`text-[11px] mt-1 line-clamp-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                      {tpl.text.slice(0, 75)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Dividido: Formulario Izquierda con Scroll, Teléfono Fijo Derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LADO IZQUIERDO: Formulario de Campaña */}
              <div className={`lg:col-span-7 rounded-3xl p-7 border shadow-xl space-y-5 ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              }`}>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Nombre de la Campaña (Para tu control)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Promoción Fin de Semana"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                        isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                      }`}
                    />
                  </div>

                  {/* Barra de Formato de Texto Profesional */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold">
                        Texto del Anuncio Publicitario (Formato Telegram)
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Selecciona texto y aplica estilo
                      </span>
                    </div>

                    <div className={`p-1.5 rounded-xl border mb-2 flex items-center gap-1.5 flex-wrap ${
                      isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-100 border-neutral-300"
                    }`}>
                      <button
                        type="button"
                        onClick={() => formatSelection("**")}
                        className="p-1.5 rounded-lg hover:bg-[#229ED9] hover:text-white transition-all text-xs font-black flex items-center gap-1"
                        title="Negrita (**texto**)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Negrita</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => formatSelection("*")}
                        className="p-1.5 rounded-lg hover:bg-[#229ED9] hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                        title="Cursiva (*texto*)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Cursiva</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => formatSelection("> ")}
                        className="p-1.5 rounded-lg hover:bg-[#229ED9] hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                        title="Cita (> texto)"
                      >
                        <Quote className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Cita</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => formatSelection("`")}
                        className="p-1.5 rounded-lg hover:bg-[#229ED9] hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                        title="Monoespaciado (`codigo`)"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Código</span>
                      </button>

                      <div className="h-4 w-[1px] bg-neutral-600/50 mx-1" />

                      <button
                        type="button"
                        onClick={insertLineBreak}
                        className="p-1.5 rounded-lg hover:bg-[#229ED9] hover:text-white transition-all text-xs font-bold flex items-center gap-1 text-emerald-400"
                        title="Salto de línea"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Salto Línea</span>
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      required
                      rows={8}
                      placeholder="Escribe tu mensaje o selecciona texto y haz clic en Negrita, Cursiva o Cita..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className={`w-full p-4 rounded-2xl text-xs leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                        isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                      }`}
                    />
                  </div>

                  {/* Carga de Imagen */}
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Foto o Banner Publicitario (Desde tu Computadora o Móvil)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isDark ? "bg-[#171A20] border-[#2D3340] hover:border-[#229ED9]" : "bg-neutral-50 border-neutral-300 hover:border-[#229ED9]"
                        }`}
                      >
                        <Upload className="w-4 h-4 text-[#229ED9]" />
                        <span>{uploadingImage ? "Cargando imagen..." : "Subir Foto desde mi Dispositivo"}</span>
                      </button>

                      {mediaUrl && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Imagen lista</span>
                          <button
                            type="button"
                            onClick={() => setMediaUrl("")}
                            className="text-red-400 hover:text-red-300 text-[11px] underline ml-2"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SELECCIÓN AUTOMÁTICA DE GRUPOS DE TELEGRAM CON CHECKBOXES */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold">
                        Grupos de Destino ({groupPills.length} seleccionados)
                      </label>
                      <button
                        type="button"
                        onClick={loadTelegramGroups}
                        disabled={loadingGroups}
                        className="text-xs font-extrabold text-[#229ED9] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingGroups ? "animate-spin" : ""}`} />
                        <span>{loadingGroups ? "Cargando..." : "Detectar mis Grupos en Telegram"}</span>
                      </button>
                    </div>

                    {/* Selector de Grupos con Checkboxes */}
                    {showGroupsModal && detectedGroups.length > 0 && (
                      <div className={`p-4 rounded-2xl border mb-3 space-y-3 ${
                        isDark ? "bg-[#15181E] border-[#2D3340]" : "bg-neutral-100 border-neutral-300"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#229ED9] flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Grupos Detectados en tu Cuenta ({detectedGroups.length})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={selectAllGroups}
                              className="text-[11px] font-bold text-emerald-400 hover:underline"
                            >
                              ✓ Seleccionar Todos
                            </button>
                            <span className="text-neutral-500">•</span>
                            <button
                              type="button"
                              onClick={clearAllGroups}
                              className="text-[11px] font-bold text-red-400 hover:underline"
                            >
                              ✕ Desmarcar Todos
                            </button>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {detectedGroups.map((g) => {
                            const groupKey = g.link || g.username || g.title;
                            const isSelected = groupPills.includes(groupKey);

                            return (
                              <div
                                key={g.id}
                                onClick={() => toggleGroupSelection(groupKey)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-[#229ED9]/15 border-[#229ED9] text-white"
                                    : isDark ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:border-neutral-500" : "bg-white border-neutral-300 text-neutral-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                                  )}
                                  <span className="font-bold truncate">{g.title}</span>
                                  {g.username && (
                                    <span className="text-[10px] text-neutral-400 hidden sm:inline">
                                      ({g.username})
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#229ED9]/20 text-[#229ED9]">
                                  {g.isChannel ? "Canal" : "Grupo"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ingreso manual por enlaces si lo desea */}
                    <div className="flex gap-2 mb-2.5">
                      <input
                        type="text"
                        placeholder="O escribe enlace manual (ej: t.me/ventasbogota o https://t.me/...)"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addGroupPill();
                          }
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                          isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={addGroupPill}
                        className="px-4 py-2.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Añadir</span>
                      </button>
                    </div>

                    {/* Píldoras de Grupos Asignados */}
                    {groupPills.length > 0 && (
                      <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 ${
                        isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                      }`}>
                        {groupPills.map((pill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30"
                          >
                            <span>{pill}</span>
                            <button
                              type="button"
                              onClick={() => removeGroupPill(pill)}
                              className="hover:text-red-500 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selección de Modalidad: Cuenta Propia vs Granja */}
                  <div className={`p-5 rounded-3xl border-2 transition-all duration-300 ${
                    useSystemFarm
                      ? isDark
                        ? "bg-emerald-950/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        : "bg-emerald-50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : isDark
                        ? "bg-[#171A20] border-[#2D3340]"
                        : "bg-neutral-50 border-neutral-300"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-xs uppercase tracking-wider">
                          Modalidad de Emisión:
                        </span>
                        {useSystemFarm ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                            GRANJA ACTIVA
                          </span>
                        ) : (
                          <span className="text-[11px] px-2.5 py-1 rounded-lg font-bold bg-[#229ED9]/20 text-[#229ED9]">
                            Cuenta Propia
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setUseSystemFarm(!useSystemFarm)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          useSystemFarm
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400"
                            : isDark
                              ? "bg-[#252A34] hover:bg-[#2D3340] text-neutral-300 border border-neutral-600"
                              : "bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300"
                        }`}
                      >
                        {useSystemFarm ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>✓ GRANJA ACTIVADA</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>
                            <span>Activar Granja OttBot</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className={`text-xs leading-relaxed transition-all ${
                      useSystemFarm
                        ? isDark
                          ? "text-emerald-300 font-bold bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30"
                          : "text-emerald-900 font-bold bg-emerald-100/70 p-3 rounded-2xl border border-emerald-400/50"
                        : isDark
                          ? "text-neutral-400 p-2 font-normal"
                          : "text-neutral-600 p-2 font-normal"
                    }`}>
                      {useSystemFarm ? (
                        <div className="flex items-start gap-2">
                          <span className="text-base leading-none">🚀</span>
                          <div>
                            <strong className="block text-emerald-400 text-xs uppercase tracking-wide">
                              Flota de OttBot Operando en tus Grupos
                            </strong>
                            Los grupos seleccionados arriba se asignaron a los robots de OttBot para publicar automáticamente por ti sin usar tu cuenta personal.
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <span className="text-base leading-none">👤</span>
                          <div>
                            <strong className="block text-neutral-300 text-xs">
                              Publicación desde tu Cuenta Conectada
                            </strong>
                            OttBot publicará directamente desde tu número en tus grupos seleccionados sin necesidad de que ningún robot externo intervenga.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Guardando campaña..." : "Guardar & Iniciar Difusión Automática"}
                  </button>
                </form>
              </div>

              {/* LADO DERECHO: Teléfono Móvil Fijo (Sticky) */}
              <div className="lg:col-span-5 sticky top-8 flex flex-col items-center">
                <div className="w-full max-w-[340px] bg-[#E5EBF0] text-black rounded-[40px] p-4 border-[7px] border-[#2B303C] shadow-2xl relative">
                  <div className="flex justify-between items-center px-4 py-1 text-[10px] font-bold text-neutral-600 mb-2">
                    <span>Telegram</span>
                    <span>12:00</span>
                  </div>

                  <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm border border-neutral-200 space-y-2.5">
                    {mediaUrl && (
                      <div className="w-full h-40 bg-neutral-100 rounded-xl overflow-hidden shadow-inner">
                        <img
                          src={mediaUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="text-xs text-neutral-900 font-sans whitespace-pre-wrap leading-relaxed break-words">
                      {messageContent ? (
                        messageContent
                          .split("\n")
                          .map((line, i) => {
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={i}
                                  className="border-l-2 border-[#229ED9] pl-2 text-neutral-600 my-1 italic"
                                >
                                  {line.replace("> ", "")}
                                </blockquote>
                              );
                            }
                            return <div key={i}>{line || "\u00A0"}</div>;
                          })
                      ) : (
                        "Aquí verás la vista previa exacta de tu mensaje con sus emojis y formatos..."
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-400 text-right flex items-center justify-end gap-1">
                      <span>12:00</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#229ED9]" />
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#229ED9]" />
                      Vista Previa en Vivo (Fija)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
