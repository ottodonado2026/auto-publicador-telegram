"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Activity, ShieldCheck, Send, ArrowUpRight, 
  RefreshCw, TrendingUp, DollarSign, Clock, BookOpen, AlertCircle
} from "lucide-react";

interface StatsData {
  totalUsers: number;
  activeSubscriptions: number;
  totalTelegrams: number;
  totalCampaigns: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-7xl w-full mx-auto">
      {/* Header Superior del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Resumen Operativo
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Métricas de facturación diaria, adopción de clientes y actividad en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-300 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas con Fondo Blanco Puro que Resalta sobre el Grisáceo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Clientes Totales</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#229ED9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalUsers ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Registrados en PostgreSQL Neon
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Membresías Activas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {stats?.activeSubscriptions ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Cobrando $1 o $2 / día
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cuentas Telegram</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#229ED9] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalTelegrams ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Protocolo MTProto GramJS
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-neutral-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Campañas Globales</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            {stats?.totalCampaigns ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 font-medium">
            Envíos automáticos a grupos
          </div>
        </div>

      </div>

      {/* Módulos de Acceso Rápido y Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Banner de Inicio Rápido: Conectar tu primer Telegram */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-7 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#229ED9] text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-[#229ED9]"></span>
              Paso Prioritario
            </div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Vincular tu Primera Cuenta de Telegram
            </h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-lg">
              Conecta tu número de teléfono personal directamente por protocolo MTProto. El sistema autenticará tu sesión y podrás verificar los grupos donde estás unido para programar autopublicaciones.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 font-medium">
              Estado: <span className="text-amber-600 font-semibold">Listo para vincular</span>
            </div>
            <Link
              href="/admin/telegram"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <span>Configurar Cuenta de Telegram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Guía Rápida para el Dueño */}
        <div className="bg-white rounded-2xl p-7 border border-neutral-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Manual del SuperAdmin
            </h3>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Aprende cómo funciona el corte automático diario ($1-$2/día), cómo recargar saldo a un cliente y cómo supervisar las sesiones.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <Link
              href="/admin/guide"
              className="text-xs font-bold text-[#229ED9] hover:underline inline-flex items-center gap-1"
            >
              <span>Abrir Manual Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
