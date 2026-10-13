"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, DollarSign, Plus, Check, Clock, 
  Sparkles, RefreshCw, Edit3, ShieldCheck, Tag
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  days: number;
  priceUSD: number;
  dailyEquivalent: number;
  description: string | null;
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
    <div className="p-8 max-w-6xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Planes de Membresía & Tarifas Diarias
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Configura el precio base por día ($1.25) y los descuentos por paquetes de días continuos.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl border border-neutral-300 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Tarifas</span>
        </button>
      </div>

      {/* Grid de Planes en Tarjetas Blancas Resaltadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {plans.map((p) => {
          const isEditing = editingId === p.id;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between relative shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
                p.isPopular ? "border-[#229ED9] ring-2 ring-[#229ED9]/20" : "border-neutral-300/80"
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#229ED9] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                  Más Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {p.days} {p.days === 1 ? "Día" : "Días"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs">
                    <Clock className="w-4 h-4 text-neutral-500" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-900 mb-1">{p.name}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">{p.description}</p>

                {/* Precio Total y Equivalente Diario */}
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-neutral-200/80 mb-4">
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
                          className="w-full px-2 py-1 text-sm font-bold border border-neutral-300 rounded-lg bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          disabled={saving}
                          onClick={() => handleSavePrice(p)}
                          className="px-2 py-1 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#0F172A]">${Number(p.priceUSD).toFixed(2)}</span>
                        <span className="text-xs text-neutral-400 font-semibold">USD</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>${Number(p.dailyEquivalent).toFixed(2)} / día</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditPrice(String(p.priceUSD));
                  }}
                  className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Precio</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Explicación de la Lógica de Negocio */}
      <div className="bg-white rounded-2xl p-7 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <h3 className="text-base font-bold text-neutral-900 mb-2">
          ¿Cómo se aplican estos planes a los clientes?
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed mb-4">
          En el portal del usuario, los clientes verán estos 4 paquetes al momento de renovar o recargar días. 
          Cuando paguen, el backend sumará exactamente los días adquiridos a la fecha `expiresAt` de su suscripción en **Neon PostgreSQL**. Si un cliente compra antes de que venza su plan, los días se acumulan sin perder vigencia.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="font-bold text-neutral-900 block mb-1">Corte Exacto por Segundo</span>
            <span className="text-neutral-500 text-[11px]">Si vence a las 3:00 PM, a las 3:00 PM cesan los envíos automáticos.</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="font-bold text-neutral-900 block mb-1">Tarifa Inteligente</span>
            <span className="text-neutral-500 text-[11px]">Incentiva a comprar 30 días bajando de $1.25 a $0.80/día.</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <span className="font-bold text-neutral-900 block mb-1">Zero Trust Backend</span>
            <span className="text-neutral-500 text-[11px]">Los precios y cálculos se verifican estrictamente en el servidor.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
