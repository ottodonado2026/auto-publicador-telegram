"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, PhoneCall, KeyRound, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, UserCheck
} from "lucide-react";

export default function ClientTelegramPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [step, setStep] = useState<"PHONE" | "CODE" | "CONNECTED">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user);
          // Verificar si ya tiene cuenta conectada
          const acc = data.user?.telegramAccounts?.[0];
          if (acc && acc.status === "CONNECTED") {
            setStep("CONNECTED");
            setPhoneNumber(acc.phoneNumber);
          }
        }
      });
  }, []);

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
      if (!res.ok) throw new Error(data.error || "Error al solicitar código");
      setStep("CODE");
    } catch (err: any) {
      setError(err.message || "Error al conectar con Telegram");
    } finally {
      setLoading(false);
    }
  };

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
      if (!res.ok) throw new Error(data.error || "Código incorrecto o expirado");
      setStep("CONNECTED");
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"}`}>
      <ClientSidebar user={sessionUser} membership={sessionUser?.subscription} />

      <main className="flex-1 ml-64 p-8 max-w-5xl w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight">
            Vincular mi Cuenta de Telegram
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Conecta tu número oficial para que OttBot difunda automáticamente en todos los grupos donde ya perteneces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`md:col-span-2 rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md">
                <Send className="w-5 h-5 -rotate-12 fill-white" />
              </div>
              <div>
                <h2 className="text-base font-bold">Conexión Segura MTProto</h2>
                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                  Autenticación oficial de usuario (sin intermediarios)
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === "PHONE" && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                        isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] mt-1.5 block ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                    Incluye el código internacional de tu país (Ej: +57, +1, +52).
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phoneNumber}
                  className="w-full py-3 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Solicitando código oficial a Telegram..." : "Enviar Código a mi Telegram"}
                </button>
              </form>
            )}

            {step === "CODE" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold">
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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                        isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] mt-1.5 block ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                    Revisa el mensaje oficial dentro de tu aplicación de Telegram.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phoneCode}
                  className="w-full py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Validando sesión..." : "Confirmar y Activar mi Telegram"}
                </button>
              </form>
            )}

            {step === "CONNECTED" && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-emerald-400">¡Tu Telegram está Conectado!</h3>
                <p className={`text-xs mt-1 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                  El robot ya puede publicar en todos los grupos donde eres miembro.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-500/20 text-xs font-mono">
                  Número activo: <span className="font-bold text-[#229ED9]">{phoneNumber}</span>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-6 border shadow-xl space-y-4 ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidad & Seguridad</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Tu sesión se cifra con el estándar bancario AES-256 en nuestros servidores seguros. OttBot no almacena contraseñas y sólo utiliza los permisos necesarios para emitir mensajes a tus grupos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
