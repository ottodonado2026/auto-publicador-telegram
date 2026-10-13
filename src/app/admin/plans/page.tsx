"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { 
  CreditCard, DollarSign, Clock, ShieldCheck, 
  Sparkles, RefreshCw, CheckCircle2, AlertTriangle, 
  Layers, Zap, Edit3, Tag, MessageSquare, ArrowRight, AlertCircle
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  days: number;
  priceUSD: number;
  dailyEquivalent: number;
  description: string | null;
  maxGroups: number;
  maxDailyPosts: number;
  delayBetweenMsgs: number;
  cooldownMinutes: number;
  allowCustomBot: boolean;
  allowFarmBot: boolean;
  features: string[] | null;
  isActive: boolean;
  isPopular: boolean;
}

export default function AdminPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al obtener planes de membresía");
      }
      setPlans(data.plans || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePrice = async (plan: Plan) => {
    try {
      setSaving(true);
      const newPrice = parseFloat(editPrice);
      if (isNaN(newPrice) || newPrice <= 0) return;

      const newDaily = (newPrice / plan.days).toFixed(2);

      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          priceUSD: newPrice,
          dailyEquivalent: parseFloat(newDaily),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Planes de Membresía & Reglas Antibaneo
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Cada paquete cuenta con límites técnicos calibrados (intervalo de 60s y descansos de 60-120 min) para proteger las cuentas de Telegram.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
            isDark 
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white" 
              : "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50 shadow-sm"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Planes</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Banner de Políticas Técnicas */}
      <div className={`mb-8 p-6 rounded-3xl border shadow-lg ${
        isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black">
              Protocolo de Seguridad Antibaneo para Escala Masiva (100+ Clientes)
            </h2>
            <p className={`text-[11px] ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              Cómo protegemos las cuentas personales de los clientes y las cuentas de tu granja propia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
          }`}>
            <span className="font-black text-amber-500 block mb-1">
              ⚡ Intervalo Humano de 60 Segundos
            </span>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Ningún mensaje se dispara al mismo segundo. El bot espera como mínimo 60 segundos entre grupo y grupo para simular el comportamiento de una persona real tecleando.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
          }`}>
            <span className="font-black text-blue-400 block mb-1">
              🕒 Enfriamiento / Descanso de 60 a 120 Minutos
            </span>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Al terminar de recorrer la lista de grupos, la cuenta entra en reposo absoluto durante 1 o 2 horas completas antes de volver a emitir otra ronda.
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
          }`}>
            <span className="font-black text-emerald-400 block mb-1">
              🔄 Rotación entre Múltiples Cuentas
            </span>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Para los clientes que usen tu flota, el backend reparte la carga entre todas las cuentas activas de tu granja, evitando saturar un solo número de teléfono.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Planes con Beneficios y Métricas Clave (2 arriba y 2 abajo para mayor amplitud) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">
        {plans.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative shadow-xl ${
                isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
              } ${
                p.isPopular ? "border-[#229ED9] ring-2 ring-[#229ED9]/20" : ""
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#229ED9] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Más Recomendado
                </span>
              )}

              <div>
                {/* Cabecera del Plan */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Vigencia: {p.days} {p.days === 1 ? "Día" : "Días"}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isDark ? "bg-[#171A20] text-neutral-300" : "bg-neutral-100 text-neutral-700"
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-[#229ED9]" />
                  </div>
                </div>

                <h3 className="text-lg font-black mb-1">{p.name}</h3>
                <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                  {p.description}
                </p>

                {/* Precios */}
                <div className={`rounded-2xl p-4 border mb-5 ${
                  isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-[#F8FAFC] border-neutral-200"
                }`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">
                        Precio Total USD:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold">$</span>
                        <input
                          type="number"
                          step="0.05"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className={`w-full px-2.5 py-1 text-sm font-bold border rounded-lg ${
                            isDark 
                              ? "bg-[#1E2229] border-[#2D3340] text-white" 
                              : "bg-white border-neutral-300 text-black"
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          disabled={saving}
                          onClick={() => handleSavePrice(p)}
                          className="px-2.5 py-1 bg-[#229ED9] text-white text-xs font-bold rounded-lg hover:bg-blue-600 cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-neutral-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">
                          ${Number(p.priceUSD).toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-400 font-bold">USD</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>${Number(p.dailyEquivalent).toFixed(2)} / día</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Límites Técnicos Antibaneo Destacados */}
                <div className="grid grid-cols-2 gap-2 mb-5 text-[11px]">
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <span className="text-neutral-400 font-medium block">Límite Grupos:</span>
                    <span className="font-extrabold text-xs">Hasta {p.maxGroups} grupos</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <span className="text-neutral-400 font-medium block">Mensajes / Día:</span>
                    <span className="font-extrabold text-xs">{p.maxDailyPosts} envíos</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <span className="text-neutral-400 font-medium block">Delay Antibaneo:</span>
                    <span className="font-extrabold text-xs">{p.delayBetweenMsgs}s / mensaje</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <span className="text-neutral-400 font-medium block">Descanso Rondas:</span>
                    <span className="font-extrabold text-xs">{p.cooldownMinutes} minutos</span>
                  </div>
                </div>

                {/* Lista Completa de Beneficios del Plan */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                    Beneficios Específicos Incluidos:
                  </span>
                  {p.features && p.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Edición Rápida de Precio */}
              <div className="pt-4 border-t border-[#2D3340]/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id);
                    setEditPrice(String(p.priceUSD));
                  }}
                  className="text-xs font-bold text-[#229ED9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Precio y Descuento</span>
                </button>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  p.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {p.isActive ? "Visible para Clientes" : "Oculto"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
