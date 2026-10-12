"use client";

import { useState } from "react";
import { 
  Send, PhoneCall, KeyRound, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, MessageSquare
} from "lucide-react";

export default function AdminTelegramPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [step, setStep] = useState<"PHONE" | "CODE" | "CONNECTED">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enviar código SMS / Telegram al número
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar código");
      setStep("CODE");
    } catch (err: any) {
      setError(err.message || "Error al conectar con los servidores de Telegram");
    } finally {
      setLoading(false);
    }
  };

  // Validar código recibido
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");
      setStep("CONNECTED");
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Cuentas de Telegram & Conexión MTProto
        </h1>
        <p className="text-xs text-neutral-500 font-medium mt-1">
          Vincula tu cuenta personal de Telegram para difundir en grupos o auditar las cuentas de los clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulario de Conexión */}
        <div className="md:col-span-2 bg-white rounded-2xl p-7 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm">
              <Send className="w-5 h-5 -rotate-12 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Vincular Nueva Cuenta</h2>
              <p className="text-xs text-neutral-400">Autenticación directa con los servidores de Telegram</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "PHONE" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Número de teléfono móvil internacional
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+573001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                  />
                </div>
                <span className="text-[11px] text-neutral-400 mt-1.5 block">
                  Incluye el código de país (Ej: +57 para Colombia, +1 para USA, +52 para México).
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full py-3 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? "Conectando con Telegram..." : "Enviar Código de Verificación"}
              </button>
            </form>
          )}

          {step === "CODE" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Código de 5 dígitos recibido
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("PHONE")}
                    className="text-[11px] text-[#229ED9] hover:underline font-semibold"
                  >
                    Cambiar número
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="12345"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-center text-lg font-mono tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9]"
                  />
                </div>
                <span className="text-[11px] text-neutral-400 mt-1.5 block">
                  Revisa el chat de servicio de la aplicación oficial de Telegram.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !phoneCode}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? "Validando sesión..." : "Confirmar y Activar Cuenta"}
              </button>
            </form>
          )}

          {step === "CONNECTED" && (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-emerald-900">¡Cuenta Conectada Exitosamente!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                La sesión MTProto fue cifrada con AES-256 y guardada en Neon PostgreSQL.
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-200/60 text-xs text-neutral-600 font-medium">
                Teléfono activo: <span className="font-bold">{phoneNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tarjeta de Seguridad & Guía */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Seguridad MTProto</span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            A diferencia de los bots tradicionales (@BotFather) que requieren ser administradores del grupo, la conexión mediante MTProto permite que el sistema publique directamente con tu usuario personal en **cualquier grupo público o privado donde ya estés unido**.
          </p>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
            <div className="font-bold text-neutral-800">Recomendaciones:</div>
            <div>• Usa cuentas con foto de perfil y nombre real.</div>
            <div>• Espacia las publicaciones (mínimo 15-30 minutos).</div>
            <div>• Las sesiones se cifran con tu clave maestra en servidor.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
