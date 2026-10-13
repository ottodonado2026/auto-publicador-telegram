"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, DollarSign, Clock, ShieldCheck, 
  Sparkles, RefreshCw, CheckCircle2, AlertTriangle, 
  Layers, Zap, Edit3, Tag, MessageSquare, ArrowRight
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
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
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Planes de Membresía & Reglas Antibaneo
          </h1>
          <p className="text-xs text-neutral-600 font-semibold mt-1">
            Cada paquete cuenta con límites técnicos calibrados (intervalo de 60s y descansos de 60-120 min) para proteger las cuentas de Telegram.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Planes</span>
        </button>
      </div>

      {/* Grid de Planes con Beneficios y Métricas Clave (2 arriba y 2 abajo para mayor amplitud) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">
        {plans.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between relative shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                p.isPopular ? "border-[#229ED9] ring-2 ring-[#229ED9]/20" : "border-neutral-300/90"
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
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                    Vigencia: {p.days} {p.days === 1 ? "Día" : "Días"}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-[#0F172A] mb-1">{p.name}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">{p.description}</p>

                {/* Precios */}
                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-neutral-200/90 mb-5">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">
                        Precio Total USD:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-neutral-700">$</span>
                        <input
                          type="number"
                          step="0.05"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded-lg bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          disabled={saving}
                          onClick={() => handleSavePrice(p)}
                          className="px-2.5 py-1 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[#0F172A]">
                          ${Number(p.priceUSD).toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-500 font-bold">USD</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>${Number(p.dailyEquivalent).toFixed(2)} / día</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Límites Técnicos Antibaneo Destacados */}
                <div className="grid grid-cols-2 gap-2 mb-5 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-400 font-medium block">Límite Grupos:</span>
                    <span className="font-extrabold text-[#0F172A] text-xs">Hasta {p.maxGroups} grupos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-400 font-medium block">Mensajes / Día:</span>
                    <span className="font-extrabold text-[#0F172A] text-xs">{p.maxDailyPosts} envíos</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-400 font-medium block">Delay Antibaneo:</span>
                    <span className="font-extrabold text-[#0F172A] text-xs">{p.delayBetweenMsgs}s / mensaje</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-400 font-medium block">Descanso Rondas:</span>
                    <span className="font-extrabold text-[#0F172A] text-xs">{p.cooldownMinutes} min</span>
                  </div>
                </div>

                {/* Lista de Beneficios Específicos */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Beneficios Incluidos:
                  </span>
                  {(p.features as string[] || []).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-800 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditPrice(String(p.priceUSD));
                  }}
                  className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Precio</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Reglas de Seguridad Antibaneo para Escalar a 100+ Clientes */}
      <div className="bg-white rounded-3xl p-8 border border-neutral-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Protocolo de Seguridad Antibaneo para Escala Masiva (100+ Clientes)
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Cómo protegemos las cuentas personales de los clientes y las cuentas de tu granja propia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-700 leading-relaxed mt-4">
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Intervalo Humano de 60 Segundos</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Ningún mensaje se dispara al mismo segundo. El bot espera como mínimo 60 segundos entre grupo y grupo para simular el comportamiento de una persona real tecleando.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Enfriamiento / Descanso de 60 a 120 Minutos</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Al terminar de recorrer la lista de grupos, la cuenta entra en reposo absoluto durante 1 o 2 horas completas antes de volver a emitir otra ronda.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Rotación entre Múltiples Cuentas</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Para los clientes que usen tu flota, el backend reparte la carga entre todas las cuentas activas de tu granja, evitando saturar un solo número de teléfono.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
