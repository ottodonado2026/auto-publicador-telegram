"use client";

import { useEffect, useState } from "react";
import { 
  Send, PhoneCall, KeyRound, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, MessageSquare, Bot, Trash2
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
      fetchFarmAccounts();
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Flota / Granja de Bots de Telegram
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Administra tus cuentas oficiales conectadas con protocolo MTProto para la difusión compartida en grupos.
          </p>
        </div>

        <button
          onClick={fetchFarmAccounts}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-300 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          <span>Actualizar Granja</span>
        </button>
      </div>

      {/* Cuentas Ya Conectadas en la Granja */}
      <div className="mb-8">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-500 mb-4">
          Cuentas Activas en tu Flota ({accounts.length})
        </h2>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-neutral-300 text-center text-xs text-neutral-500">
            Aún no tienes cuentas registradas en tu granja.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-3xl p-5 border border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#229ED9] to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                    <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] fill-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-[#0F172A] text-sm">
                      {acc.firstName || "OttBot Oficial"}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono mt-0.5 font-medium">
                      {acc.phoneNumber}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sesión MTProto Cifrada Activa</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulario de Conexión de Cuentas Nuevas */}
        <div className="md:col-span-2 bg-white rounded-3xl p-7 border border-neutral-300/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Agregar Otra Cuenta a la Granja</h2>
              <p className="text-xs text-neutral-400">Expande tu flota para mayor capacidad de publicaciones simultáneas</p>
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
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-emerald-900">¡Cuenta Conectada Exitosamente!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                La sesión MTProto fue cifrada con AES-256 y guardada en Neon PostgreSQL.
              </p>
              <button
                onClick={() => {
                  setStep("PHONE");
                  setPhoneNumber("");
                  setPhoneCode("");
                }}
                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                Vincular otra cuenta
              </button>
            </div>
          )}
        </div>

        {/* Resumen de Capacidad */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-300/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Capacidad de la Granja</span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-medium">
            Al tener tus cuentas de bot conectadas en la granja, el backend de OttBot puede balancear la carga de publicaciones entre ellas sin sobrecargar ningún número.
          </p>
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-[11px] text-neutral-700 space-y-1.5 font-medium">
            <div>• <strong>Cuentas vinculadas:</strong> {accounts.length} activa(s)</div>
            <div>• <strong>Delay de seguridad:</strong> 60s por grupo</div>
            <div>• <strong>Descanso automático:</strong> 60 a 120 min</div>
          </div>
        </div>

      </div>
    </div>
  );
}
