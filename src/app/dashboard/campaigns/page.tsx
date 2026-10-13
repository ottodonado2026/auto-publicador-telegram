"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, Bold, Italic, Underline, Quote, Code, 
  Smile, Upload, Image as ImageIcon, Sparkles, CheckCircle2, 
  AlertCircle, Eye, RefreshCw, X, Plus, Info, HelpCircle
} from "lucide-react";

const TEMPLATES = [
  {
    title: "Venta de Servicios / Streaming / IPTV",
    text: `🚀 **¡OFERTA EXCLUSIVA DE HOY!** 🚀\n\nDisfruta de las mejores cuentas con soporte 24/7 y garantía total.\n\n✨ **Plataformas Disponibles:**\n• Netflix Premium 4K\n• Disney+ / HBO Max\n• IPTV con más de 10.000 canales\n\n> 💡 *Precios desde solo $2 USD. Activación inmediata sin caídas.*\n\n📲 **Solicita tu demo al privado:** @TuUsuarioTelegram\n🔗 **Canal oficial:** t.me/TuCanal`,
  },
  {
    title: "Comercio Electrónico / Tienda / Productos",
    text: `📦 **NUEVO STOCK DISPONIBLE — ENVÍOS A TODO EL PAÍS** 📦\n\nTenemos los mejores productos al por mayor y detal con los mejores precios del mercado.\n\n🔥 **Catálogo Actualizado:**\n• Calidad garantizada\n• Pago contra entrega disponible\n\n> ⚠️ *Pocas unidades disponibles por alta demanda.*\n\n💬 **Escríbenos para pedidos:** @TuUsuarioTelegram`,
  },
  {
    title: "Inversiones / Trading / Cripto / Finanzas",
    text: `📊 **SEÑALES & ANÁLISIS EN VIVO** 📈\n\nÚnete a la comunidad de traders más activa. Operaciones en vivo y gestión de riesgo disciplinada.\n\n✅ 85% de efectividad comprobada\n✅ Sesiones operativas diarias\n\n> 🎯 *Acceso gratuito por tiempo limitado.*\n\n👉 **Ingresa aquí:** t.me/TuCanalPrivado`,
  },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  // Sistema de píldoras para los enlaces de grupos
  const [linkInput, setLinkInput] = useState("");
  const [groupPills, setGroupPills] = useState<string[]>([]);

  // Modalidad
  const [useSystemFarm, setUseSystemFarm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setSessionUser(data.user);
      });
  }, []);

  // Formato inteligente de texto en selección
  const formatSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageContent.substring(start, end);

    let replacement = "";
    if (selectedText.length > 0) {
      // Envuelve el texto seleccionado (ej. seleccionas "HOLA" -> "**HOLA**")
      replacement = `${prefix}${selectedText}${suffix}`;
    } else {
      replacement = `${prefix}texto${suffix}`;
    }

    const newContent =
      messageContent.substring(0, start) +
      replacement +
      messageContent.substring(end);

    setMessageContent(newContent);

    // Restaurar foco
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 10);
  };

  const insertLineBreak = () => {
    setMessageContent((prev) => `${prev}\n\n`);
  };

  // Carga directa de imagen desde PC o Móvil
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");

      setMediaUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Error al cargar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  // Agregar píldora de enlace de grupo
  const addGroupPill = () => {
    if (!linkInput.trim()) return;
    let clean = linkInput.trim();
    if (!clean.startsWith("http") && !clean.startsWith("t.me/")) {
      clean = `t.me/${clean.replace("@", "")}`;
    }
    if (!groupPills.includes(clean)) {
      setGroupPills([...groupPills, clean]);
    }
    setLinkInput("");
  };

  const removeGroupPill = (pill: string) => {
    setGroupPills(groupPills.filter((p) => p !== pill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!useSystemFarm && groupPills.length === 0) {
        // Si no usa granja y no puso píldoras, advertir o continuar si usa sus grupos existentes
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
    <div className={`min-h-screen flex ${isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"}`}>
      <ClientSidebar user={sessionUser} membership={sessionUser?.subscription} />

      <main className="flex-1 ml-64 p-8 max-w-7xl w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight">
            Editor Profesional de Copys & Campañas
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Selecciona texto para aplicar negrita, cursiva o citas, sube tu foto desde tu dispositivo y añade tus grupos en píldoras organizadas.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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

        {/* Layout Dividido: Formulario a la Izquierda con Scroll, Teléfono Fijo a la Derecha */}
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

              {/* Barra de Formato Intuitiva en Selección */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold">
                    Contenido del Mensaje Publicitario
                  </label>
                  <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-100 border-neutral-300"
                  }`}>
                    <button
                      type="button"
                      onClick={() => formatSelection("**", "**")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                        isDark ? "hover:bg-[#2B303C]" : "hover:bg-white"
                      }`}
                      title="Selecciona texto y pulsa Negrita (**texto**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection("*", "*")}
                      className={`p-1.5 rounded-lg text-xs italic transition-all ${
                        isDark ? "hover:bg-[#2B303C]" : "hover:bg-white"
                      }`}
                      title="Selecciona texto y pulsa Cursiva (*texto*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection("> ", "")}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        isDark ? "hover:bg-[#2B303C]" : "hover:bg-white"
                      }`}
                      title="Bloque de Cita (> texto)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatSelection("`", "`")}
                      className={`p-1.5 rounded-lg text-xs font-mono transition-all ${
                        isDark ? "hover:bg-[#2B303C]" : "hover:bg-white"
                      }`}
                      title="Monoespaciado (`código`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={insertLineBreak}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        isDark ? "hover:bg-[#2B303C] text-neutral-300" : "hover:bg-white text-neutral-700"
                      }`}
                      title="Insertar salto de línea doble"
                    >
                      Enter ↵
                    </button>
                  </div>
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

              {/* Carga Directa de Imagen desde Dispositivo (PC / Móvil) */}
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isDark 
                        ? "bg-[#171A20] border-[#2D3340] hover:border-[#229ED9]" 
                        : "bg-neutral-50 border-neutral-300 hover:border-[#229ED9]"
                    }`}
                  >
                    <Upload className="w-4 h-4 text-[#229ED9]" />
                    <span>{uploadingImage ? "Cargando imagen..." : "Subir Foto desde mi Dispositivo"}</span>
                  </button>

                  {mediaUrl && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Imagen cargada</span>
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

              {/* Campo de Enlaces con Píldoras Interactivas */}
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Grupos de Telegram Destino (Ingreso por Píldoras)
                </label>

                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    placeholder="Escribe el enlace (ej: t.me/ventasbogota o https://t.me/...)"
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
                    className="px-4 py-2.5 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Contenedor de Píldoras */}
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

              {/* Explicación y Selección de Modalidad (Tu Cuenta vs Granja) */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-300"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">Modalidad de Emisión:</span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-extrabold bg-[#229ED9]/20 text-[#229ED9]">
                      {useSystemFarm ? "Usando Granja de OttBot" : "Publicar con mi Cuenta Propia"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSystemFarm}
                    onChange={(e) => setUseSystemFarm(e.target.checked)}
                    className="w-5 h-5 accent-[#229ED9] rounded cursor-pointer"
                  />
                </div>

                <p className={`text-[11px] leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                  {useSystemFarm
                    ? "✓ Activado: Los robots de OttBot se unirán y publicarán por ti en los enlaces de grupos que agregaste arriba. Ideal si no deseas conectar tu número."
                    : "✓ Cuenta Propia: OttBot publicará desde tu número conectado tanto en los enlaces que agregues como en todos los grupos donde ya estés unido."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Guardando campaña..." : "Guardar & Iniciar Difusión Automática"}
              </button>
            </form>
          </div>

          {/* LADO DERECHO: Teléfono Móvil Fijo (Sticky) que no se mueve con el scroll */}
          <div className="lg:col-span-5 sticky top-8 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-[#E5EBF0] text-black rounded-[40px] p-4 border-[7px] border-[#2B303C] shadow-2xl relative">
              {/* Barra superior de estado */}
              <div className="flex justify-between items-center px-4 py-1 text-[10px] font-bold text-neutral-600 mb-2">
                <span>Telegram</span>
                <span>12:00</span>
              </div>

              {/* Burbuja de Mensaje Renderizada con Formato */}
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
      </main>
    </div>
  );
}
