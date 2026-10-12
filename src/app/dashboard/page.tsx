"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Shield, Clock, Plus, Play, Pause, AlertCircle, 
  CheckCircle2, LogOut, MessageSquare, PhoneCall, KeyRound, Sparkles
} from "lucide-react";

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de conexión Telegram
  const [telegramStatus, setTelegramStatus] = useState<"DISCONNECTED" | "CODE_SENT" | "CONNECTED">("DISCONNECTED");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setMembership(data.membership);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  const isExpired = !membership?.hasAccess;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white">
      {/* Navbar Superior tipo Apple */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-neutral-900">Ott<span className="text-neutral-500 font-semibold">Bot</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-neutral-900">{user?.name || user?.email}</div>
              <div className="text-[11px] text-neutral-400">Cliente</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-red-600 py-1.5 px-3 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner de Membresía / Pago Diario (Zero Trust) */}
        {isExpired ? (
          <div className="mb-8 p-5 bg-red-50 border border-red-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold">Tu suscripción ha expirado</div>
                <div className="text-xs text-red-600/90 mt-0.5">
                  Las campañas de publicación se han pausado automáticamente. Contacta al administrador para recargar tus días ($1 o $2 / día).
                </div>
              </div>
            </div>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Renovar Membresía
            </a>
          </div>
        ) : (
          <div className="mb-8 p-5 bg-white border border-neutral-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-neutral-400 font-medium">Estado de Membresía</div>
                <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2 mt-0.5">
                  <span>{membership?.daysRemaining} días vigentes restantes</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-medium uppercase">
                    {membership?.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              Corte estricto automatizado vía Backend
            </div>
          </div>
        )}

        {/* Sección: Conexión de Cuenta de Telegram MTProto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tarjeta de Telegram Account */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Tu Cuenta de Telegram</h2>
              <span className="p-2 rounded-xl bg-neutral-100 text-neutral-600">
                <Send className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Vincula tu cuenta personal para que el robot difunda directamente en todos los grupos donde ya perteneces.
            </p>

            {telegramError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200/60">
                {telegramError}
              </div>
            )}

            {telegramStatus === "DISCONNECTED" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Número de teléfono internacional
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+573001234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={telegramLoading || !phoneNumber}
                  onClick={() => {
                    setTelegramLoading(true);
                    setTimeout(() => {
                      setTelegramLoading(false);
                      setTelegramStatus("CODE_SENT");
                    }, 1000);
                  }}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {telegramLoading ? "Enviando código..." : "Enviar Código de Validación"}
                </button>
              </div>
            )}

            {telegramStatus === "CODE_SENT" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    Código de confirmación de Telegram
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej. 12345"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-center tracking-widest font-mono text-base"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 block">
                    Revisa tus mensajes en la app de Telegram.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={telegramLoading || !phoneCode}
                  onClick={() => {
                    setTelegramLoading(true);
                    setTimeout(() => {
                      setTelegramLoading(false);
                      setTelegramStatus("CONNECTED");
                    }, 1000);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {telegramLoading ? "Verificando..." : "Confirmar y Vincular"}
                </button>
              </div>
            )}

            {telegramStatus === "CONNECTED" && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-emerald-900">Telegram Conectado</div>
                <div className="text-xs text-emerald-700 mt-0.5">{phoneNumber || "+57300..."}</div>
                <div className="mt-4 pt-3 border-t border-emerald-200/60">
                  <span className="text-[11px] text-emerald-800">Sesión MTProto Cifrada Activa</span>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta de Campañas y Difusión */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">Campañas de Publicación</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Mensajes programados para envío automático a tus grupos.</p>
              </div>
              <button
                disabled={isExpired}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Campaña</span>
              </button>
            </div>

            {/* Empty state de campañas estilo Apple */}
            <div className="rounded-2xl border border-dashed border-neutral-200 p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Aún no tienes campañas activas</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Crea tu primer copy con fotos o enlaces para que se difunda de forma periódica en todos los grupos donde estás unido.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
