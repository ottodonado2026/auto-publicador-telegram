"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  Send, PhoneCall, KeyRound, CheckCircle2,
  AlertCircle, ShieldCheck, RefreshCw, Bot, Activity
} from "lucide-react";

interface FarmAccount {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  username: string | null;
  status: string;
  createdAt: string;
  _count: {
    campaigns: number;
    logs: number;
  };
}

export default function AdminTelegramPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [accounts, setAccounts] = useState<FarmAccount[]>([]);
  const [fetching, setFetching] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [step, setStep] = useState<"PHONE" | "CODE" | "CONNECTED">("PHONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFarmAccounts = async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/admin/telegram");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchFarmAccounts();
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
      if (!res.ok) throw new Error(data.error || "Error al enviar código");
      setStep("CODE");
    } catch (err: any) {
      setError(err.message || "Error al conectar con los servidores de Telegram");
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
      if (!res.ok) throw new Error(data.error || "Código inválido");
      setStep("CONNECTED");
      fetchFarmAccounts();
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto">
      {/* Header con soporte dark mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
            Flota / Granja de Bots de Telegram
          </h1>
          <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
            Administra tus cuentas oficiales conectadas con protocolo MTProto para la difusión compartida en grupos.
          </p>
        </div>

        <button
          onClick={fetchFarmAccounts}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2D3340] text-neutral-200 hover:text-white hover:border-[#229ED9]"
              : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300 shadow-sm"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          <span>Actualizar Granja</span>
        </button>
      </div>

      {/* Cuentas Ya Conectadas en la Granja */}
      <div className="mb-8">
        <h2 className={`text-sm font-extrabold uppercase tracking-wider mb-4 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
          Cuentas Activas en tu Flota ({accounts.length})
        </h2>

        {accounts.length === 0 ? (
          <div className={`rounded-3xl p-8 border text-center text-xs ${
            isDark ? "bg-[#1B1F27] border-[#2B313F] text-neutral-400" : "bg-white border-neutral-300 text-neutral-500"
          }`}>
            Aún no tienes cuentas registradas en tu granja.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between ${
                  isDark
                    ? "bg-[#1B1F27] border-[#2B313F]"
                    : "bg-white border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#229ED9] to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                    <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] fill-white" />
                  </div>
                  <div>
                    <div className={`font-extrabold text-sm ${isDark ? "text-white" : "text-[#0F172A]"}`}>
                      {acc.firstName || "OttBot Oficial"}
                    </div>
                    <div className={`text-xs font-mono mt-0.5 font-medium ${isDark ? "text-neutral-400" : "text-neutral-400"}`}>
                      {acc.phoneNumber}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sesión MTProto Cifrada Activa</span>
                    </div>
                  </div>
                </div>
                <div className={`text-right text-[10px] font-bold ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>{acc._count.logs} logs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario de Conexión */}
        <div className={`md:col-span-2 rounded-3xl p-7 border ${
          isDark
            ? "bg-[#1B1F27] border-[#2B313F]"
            : "bg-white border-neutral-300/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                Agregar Otra Cuenta a la Granja
              </h2>
              <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-400"}`}>
                Expande tu flota para mayor capacidad de publicaciones simultáneas
              </p>
            </div>
          </div>

          {error && (
            <div className={`mb-5 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isDark
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "PHONE" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  Número de teléfono móvil internacional
                </label>
                <div className="relative">
                  <PhoneCall className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-neutral-400" : "text-neutral-400"}`} />
                  <input
                    type="tel"
                    required
                    placeholder="+573001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] border ${
                      isDark
                        ? "bg-[#13161C] border-[#2D3340] text-white placeholder:text-neutral-500"
                        : "bg-neutral-50 border-neutral-300 text-neutral-900"
                    }`}
                  />
                </div>
                <span className={`text-[11px] mt-1.5 block ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                  Incluye el código de país (Ej: +57 para Colombia).
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
                  <label className={`text-xs font-bold ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
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
                  <KeyRound className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-neutral-400" : "text-neutral-400"}`} />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="12345"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] border ${
                      isDark
                        ? "bg-[#13161C] border-[#2D3340] text-white"
                        : "bg-neutral-50 border-neutral-300 text-neutral-900"
                    }`}
                  />
                </div>
                <span className={`text-[11px] mt-1.5 block ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                  Revisa el chat de servicio de la aplicación oficial de Telegram.
                </span>
              </div>
              <button
                type="submit"
                disabled={loading || !phoneCode}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 ${
                  isDark ? "bg-[#229ED9] hover:bg-blue-500" : "bg-neutral-900 hover:bg-black"
                }`}
              >
                {loading ? "Validando sesión..." : "Confirmar y Activar Cuenta"}
              </button>
            </form>
          )}

          {step === "CONNECTED" && (
            <div className={`p-6 rounded-2xl border text-center ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-emerald-50 border-emerald-200"
            }`}>
              <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              <h3 className={`text-base font-bold ${isDark ? "text-emerald-300" : "text-emerald-900"}`}>
                ¡Cuenta Conectada Exitosamente!
              </h3>
              <p className={`text-xs mt-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                La sesión MTProto fue cifrada con AES-256 y guardada en Neon PostgreSQL.
              </p>
              <button
                onClick={() => { setStep("PHONE"); setPhoneNumber(""); setPhoneCode(""); }}
                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                Vincular otra cuenta
              </button>
            </div>
          )}
        </div>

        {/* Resumen de Capacidad */}
        <div className={`rounded-3xl p-6 border space-y-4 ${
          isDark
            ? "bg-[#1B1F27] border-[#2B313F]"
            : "bg-white border-neutral-300/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        }`}>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Capacidad de la Granja</span>
          </div>
          <p className={`text-xs leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Al tener tus cuentas de bot conectadas en la granja, el backend de OttBot puede balancear la carga de publicaciones entre ellas sin sobrecargar ningún número.
          </p>
          <div className={`p-3.5 rounded-2xl border text-[11px] space-y-1.5 font-medium ${
            isDark ? "bg-[#13161C] border-[#2D3340] text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-700"
          }`}>
            <div>• <strong>Cuentas vinculadas:</strong> {accounts.length} activa(s)</div>
            <div>• <strong>Delay de seguridad:</strong> 60s por grupo</div>
            <div>• <strong>Descanso automático:</strong> 60 a 120 min</div>
          </div>
        </div>
      </div>
    </div>
  );
}
