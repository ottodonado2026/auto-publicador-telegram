"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClientSidebar from "@/components/ClientSidebar";
import { 
  Send, Bold, Italic, Underline, Quote, Code, 
  Smile, Image as ImageIcon, Sparkles, CheckCircle2, 
  AlertCircle, Eye, RefreshCw, Copy, Layers
} from "lucide-react";

// Plantillas de copies profesionales predefinidas
const TEMPLATES = [
  {
    title: "Venta de Servicios / Streaming / IPTV",
    text: `🚀 **¡OFERTA EXCLUSIVA DE HOY!** 🚀\n\nDisfruta de las mejores cuentas de streaming con soporte 24/7 y garantía total.\n\n✨ **Plataformas Disponibles:**\n• Netflix Premium 4K\n• Disney+ / HBO Max\n• IPTV con más de 10.000 canales\n\n> 💡 *Precios desde solo $2 USD. Activación inmediata sin caídas.*\n\n📲 **Solicita tu demo al privado:** @TuUsuarioTelegram\n🔗 **Canal oficial:** t.me/TuCanal`,
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
  const [name, setName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [targetLinks, setTargetLinks] = useState("");
  const [useSystemFarm, setUseSystemFarm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funciones de formateo rápido estilo Telegram Markdown
  const applyFormat = (syntaxPrefix: string, syntaxSuffix: string = syntaxPrefix) => {
    setMessageContent((prev) => `${prev}${syntaxPrefix}texto${syntaxSuffix}`);
  };

  const handleApplyTemplate = (tplText: string) => {
    setMessageContent(tplText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Separar los links por saltos de línea o comas
      const groupList = targetLinks
        .split(/[\n,]/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          messageContent,
          mediaUrl: mediaUrl.trim() || null,
          intervalMinutes: Number(intervalMinutes),
          targetGroupIds: groupList,
          useSystemFarm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear campaña");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al guardar campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E9ECF0] text-[#111827] flex">
      <ClientSidebar user={null} membership={{ hasAccess: true, daysRemaining: 7 }} />

      <main className="flex-1 ml-64 p-8 max-w-6xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Editor Profesional de Copys & Campañas
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Diseña tu anuncio con formatos enriquecidos (negrita, citas, emojis y saltos de línea) y previsualízalo como se verá exactamente en Telegram.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selector de Plantillas */}
        <div className="mb-8 bg-white rounded-3xl p-6 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-[#229ED9]" />
            <span>Plantillas de Anuncios Recomendadas</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl.text)}
                className="p-3.5 text-left rounded-2xl border border-neutral-200 hover:border-[#229ED9] bg-neutral-50/70 hover:bg-blue-50/40 transition-all group"
              >
                <div className="text-xs font-bold text-neutral-900 group-hover:text-[#229ED9]">
                  {tpl.title}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                  {tpl.text.slice(0, 80)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario de Edición */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-7 border border-neutral-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Nombre de la Campaña (Para tu control)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Promoción Fin de Semana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                />
              </div>

              {/* Barra de Formato Rápido para Telegram */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Contenido del Mensaje Publicitario
                  </label>
                  <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => applyFormat("**", "**")}
                      className="p-1 hover:bg-white rounded text-neutral-700 font-bold text-xs"
                      title="Negrita (**texto**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("*", "*")}
                      className="p-1 hover:bg-white rounded text-neutral-700 italic text-xs"
                      title="Cursiva (*texto*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("> ", "")}
                      className="p-1 hover:bg-white rounded text-neutral-700 text-xs"
                      title="Cita de bloque (> texto)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("`", "`")}
                      className="p-1 hover:bg-white rounded text-neutral-700 font-mono text-xs"
                      title="Código monoespaciado (`código`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={8}
                  placeholder="Escribe tu mensaje con emojis, saltos de línea y formatos..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full p-4 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs text-neutral-900 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                />
              </div>

              {/* Imagen Adjunta */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  URL de Imagen o Banner (Opcional)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                  />
                </div>
              </div>

              {/* Grupos Destino por Enlace */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Enlaces de los Grupos Destino (1 por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder={"https://t.me/ventasbogota\nhttps://t.me/comercio_online\nt.me/grupo_ejemplo"}
                  value={targetLinks}
                  onChange={(e) => setTargetLinks(e.target.value)}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Si conectaste tu propio Telegram, también se publicará automáticamente en los grupos donde ya estés unido.
                </span>
              </div>

              {/* Modalidad de Envío */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-neutral-900 block">
                    Usar Flota / Granja de Bots de OttBot
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Nuestras cuentas publicarán por ti en los links de tus grupos.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useSystemFarm}
                  onChange={(e) => setUseSystemFarm(e.target.checked)}
                  className="w-5 h-5 accent-[#229ED9] rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Guardando campaña..." : "Guardar & Iniciar Difusión Automática"}
              </button>
            </form>
          </div>

          {/* Vista Previa en Vivo de Telegram (Phone Mockup) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-[#E5EBF0] rounded-[36px] p-4 border-[6px] border-[#2B303C] shadow-2xl relative">
              {/* Barra de Notificaciones Simulada */}
              <div className="flex justify-between items-center px-4 py-1 text-[10px] font-bold text-neutral-600 mb-2">
                <span>Telegram</span>
                <span>12:00</span>
              </div>

              {/* Chat Bubble Estilo Telegram */}
              <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm border border-neutral-200 space-y-2">
                {mediaUrl && (
                  <div className="w-full h-36 bg-neutral-100 rounded-xl overflow-hidden mb-2">
                    <img
                      src={mediaUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as any).style.display = "none")}
                    />
                  </div>
                )}

                <div className="text-xs text-neutral-900 font-sans whitespace-pre-wrap leading-relaxed break-words">
                  {messageContent || "Aquí verás la vista previa exacta de tu mensaje con sus emojis y formatos..."}
                </div>

                <div className="text-[10px] text-neutral-400 text-right flex items-center justify-end gap-1">
                  <span>12:00</span>
                  <CheckCircle2 className="w-3 h-3 text-[#229ED9]" />
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Vista Previa en Vivo
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
