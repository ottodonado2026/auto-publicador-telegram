"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw, Search, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, AlertCircle, ShieldCheck
} from "lucide-react";

interface PaymentRecord {
  id: string;
  userId: string;
  user?: {
    botCode: string | null;
    email: string;
    storeName: string | null;
    name: string | null;
    phoneNumber: string | null;
  };
  amount: number;
  currency: string;
  method: string;
  status: string;
  txHash: string | null;
  description: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completado", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  PENDING: { label: "Pendiente", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
  REJECTED: { label: "Rechazado", color: "text-red-400 bg-red-500/15 border-red-500/30" },
};

const METHOD_MAP: Record<string, { label: string; icon: string }> = {
  BINANCE_PAY: { label: "Binance Pay", icon: "₿" },
  MANUAL: { label: "Manual Admin", icon: "⚙️" },
  WALLET: { label: "Wallet Interna", icon: "💼" },
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalUSD: 0 });
  const PAGE_SIZE = 10;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      const txs: any[] = (data.recentWalletTransactions || []).filter(
        (tx: any) => tx.type === "CREDIT"
      );

      const mapped: PaymentRecord[] = txs.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        user: tx.user,
        amount: Number(tx.amount || 0),
        currency: "USD",
        method: tx.description?.toLowerCase().includes("binance") ? "BINANCE_PAY" : "MANUAL",
        status: "COMPLETED",
        txHash: null,
        description: tx.description,
        createdAt: tx.createdAt,
      }));
      setPayments(mapped);
      const completed = mapped.filter((p) => p.status === "COMPLETED");
      setStats({
        total: mapped.length,
        completed: completed.length,
        pending: mapped.filter((p) => p.status === "PENDING").length,
        totalUSD: completed.reduce((sum, p) => sum + p.amount, 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.user?.botCode?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.user?.storeName?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.txHash?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const cardBg = isDark ? "bg-[#1B1F27] border-[#2B313F]" : "bg-[#F4F6F9] border-slate-300";

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Pagos y Recargas • Binance Pay
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            Historial completo de pagos verificados automáticamente por API de Binance Pay (`streamofi`) y recargas manuales.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white"
              : "bg-[#F4F6F9] border-slate-300 text-slate-700 hover:bg-white"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjeta de Estado de Conexión API Binance Pay */}
      <div
        className={`mb-7 rounded-3xl p-6 border-2 shadow-xl ${
          isDark
            ? "bg-gradient-to-r from-[#1B2230] via-[#1B1F27] to-[#1B2230] border-yellow-500/40"
            : "bg-gradient-to-r from-yellow-50/80 via-white to-orange-50/60 border-yellow-400/50"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> API HMAC BINANCE PAY CONECTADA (OTTBOT-PRO)
            </span>
            <h2 className={`text-lg font-black ${isDark ? "text-white" : "text-[#0F172A]"}`}>
              Flujo Automático de Cobro con tu UID 1158258762 (Usuario: streamofi)
            </h2>
            <div className={`space-y-1.5 text-xs font-medium ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
              <p>
                1. El cliente ve en su portal tu <strong>Binance ID: 1158258762</strong> y tu usuario <strong>streamofi</strong>.
              </p>
              <p>
                2. El cliente envía el pago en <strong>USDT, USDC o FDUSD</strong> y pega su <strong>Order ID (ID de Orden)</strong> en el portal.
              </p>
              <p>
                3. El backend verifica el pago contra <code>/sapi/v1/pay/transactions</code> con firma HMAC-SHA256, bloquea cualquier intento de usar un Order ID repetido y acredita su Wallet o activa su Plan al instante.
              </p>
            </div>
          </div>

          <div
            className={`flex-shrink-0 p-5 rounded-2xl border text-center min-w-[230px] ${
              isDark ? "bg-[#12161E] border-[#2A3346]" : "bg-[#F4F6F9] border-slate-300"
            }`}
          >
            <div className="text-2xl mb-1">₿</div>
            <div className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>
              UID: 1158258762
            </div>
            <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">
              Usuario: streamofi
            </div>
            <div
              className={`mt-2.5 pt-2 border-t text-[11px] font-bold ${
                isDark ? "border-neutral-700 text-neutral-300" : "border-slate-200 text-slate-600"
              }`}
            >
              Verificación Automática 24/7
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Recargas", value: stats.total, icon: "📋", color: "text-[#229ED9]" },
          { label: "Completadas", value: stats.completed, icon: "✅", color: "text-emerald-400" },
          { label: "Pendientes", value: stats.pending, icon: "⏳", color: "text-amber-400" },
          { label: "Total Recaudado", value: `$${stats.totalUSD.toFixed(2)} USD`, icon: "💰", color: "text-emerald-400" },
        ].map((m) => (
          <div key={m.label} className={`rounded-2xl p-4 border ${cardBg}`}>
            <div className="text-xl mb-1">{m.icon}</div>
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
            placeholder="Buscar por código BOT-I, Order ID, email o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
              isDark
                ? "bg-[#1B1F27] border-[#2D3340] text-white placeholder:text-neutral-500"
                : "bg-[#F4F6F9] border-slate-300 text-slate-900"
            }`}
          />
        </div>
        <div className={`text-xs font-bold ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
          {filtered.length} registro(s) • Página {currentPage} de {totalPages}
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardBg}`}>
        <table className="w-full text-left text-xs table-auto">
          <thead
            className={`font-extrabold uppercase tracking-wider text-[10px] border-b ${
              isDark
                ? "bg-[#14171E] text-neutral-400 border-[#2B313F]"
                : "bg-[#E8ECF2] text-slate-600 border-slate-300"
            }`}
          >
            <tr>
              <th className="px-4 py-3.5">Cliente / Código</th>
              <th className="px-4 py-3.5">Monto</th>
              <th className="px-4 py-3.5">Método</th>
              <th className="px-4 py-3.5">Estado</th>
              <th className="px-4 py-3.5">Detalle / Order ID</th>
              <th className="px-4 py-3.5">Fecha</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-[#282E3B]" : "divide-slate-200"}`}>
            {paginated.map((p) => {
              const statusInfo = STATUS_MAP[p.status] || {
                label: p.status,
                color: "text-neutral-400 bg-neutral-500/15 border-neutral-500/30",
              };
              const methodInfo = METHOD_MAP[p.method] || { label: p.method, icon: "💳" };
              return (
                <tr key={p.id} className={`transition-colors ${isDark ? "hover:bg-[#232834]/60" : "hover:bg-white/70"}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] font-mono font-black text-[11px]">
                        {p.user?.botCode || "N/A"}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate font-mono ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                      {p.user?.storeName || p.user?.name || p.user?.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      +${p.amount.toFixed(2)}
                    </span>
                    <div className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{p.currency}</div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        p.method === "BINANCE_PAY"
                          ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                          : isDark
                          ? "bg-[#13161C] border-[#2D3340] text-neutral-300"
                          : "bg-slate-100 border-slate-300 text-slate-600"
                      }`}
                    >
                      {methodInfo.icon} {methodInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
                      {p.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {p.status === "REJECTED" && <AlertCircle className="w-3 h-3" />}
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 max-w-[320px] text-[11px] ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                    <span className="block break-words">{p.description || "—"}</span>
                  </td>
                  <td className={`px-4 py-3.5 whitespace-nowrap text-[11px] font-mono ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className={`px-4 py-12 text-center text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                  No se encontraron registros de pagos.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div
          className={`px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold ${
            isDark
              ? "bg-[#14171E] border-[#2B313F] text-neutral-400"
              : "bg-[#E8ECF2] border-slate-300 text-slate-600"
          }`}
        >
          <span>
            Página {currentPage} de {totalPages} ({filtered.length} registros — 10 por página)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                isDark ? "bg-[#1B1F27] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer disabled:opacity-40 ${
                isDark ? "bg-[#1B1F27] border-[#2D3340] text-white" : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
