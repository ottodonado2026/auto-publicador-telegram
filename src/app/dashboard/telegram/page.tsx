"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, PhoneCall, KeyRound, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, Layers, Users, LogOut
} from "lucide-react";

export default function ClientTelegramPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [step, setStep] = useState<"PHONE" | "CODE" | "CONNECTED">("PHONE");
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grupos detectados
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setSessionUser(data.user);
        setMembership(data.membership);

        const acc = data.user?.telegramAccounts?.[0];
        if (acc && acc.status === "CONNECTED") {
          setStep("CONNECTED");
          setPhoneNumber(acc.phoneNumber);
          setAccountInfo(acc);
        }
      }
    } catch (err) {
      console.error("Error al cargar sesión:", err);
    }
  };

  useEffect(() => {
    fetchSession();
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
      await fetchSession();
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  // Cargar grupos automáticamente de Telegram
  const handleLoadGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await fetch("/api/telegram/dialogs");
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error("Error al cargar grupos:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"}`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-4xl w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Vincular mi Cuenta de Telegram
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Administra tu conexión oficial de Telegram y sincroniza los grupos donde perteneces.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SI LA CUENTA YA ESTÁ VINCULADA */}
        {step === "CONNECTED" ? (
          <div className="space-y-6">
            <div className={`rounded-3xl p-7 border shadow-xl ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D3340]/60">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black">{accountInfo?.firstName || "Mi Cuenta Telegram"}</h2>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                        Conectado
                      </span>
                    </div>
                    <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                      {phoneNumber || accountInfo?.phoneNumber} {accountInfo?.username ? `(@${accountInfo.username})` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadGroups}
                    disabled={loadingGroups}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingGroups ? "animate-spin" : ""}`} />
                    <span>{loadingGroups ? "Escaneando Grupos..." : "Sincronizar mis Grupos"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Deseas desvincular o conectar otro número?")) {
                        setStep("PHONE");
                      }
                    }}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isDark 
                        ? "bg-[#171A20] border-[#2D3340] text-neutral-400 hover:text-white" 
                        : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-black"
                    }`}
                  >
                    Cambiar Cuenta
                  </button>
                </div>
              </div>

              {/* Lista de Grupos Detectados */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#229ED9]">
                    <Users className="w-4 h-4" />
                    Grupos Detectados en tu Cuenta ({groups.length})
                  </span>
                  {groups.length === 0 && !loadingGroups && (
                    <button
                      onClick={handleLoadGroups}
                      className="text-xs text-[#229ED9] hover:underline font-bold"
                    >
                      Haz clic para cargar tus grupos
                    </button>
                  )}
                </div>

                {loadingGroups && (
                  <div className="p-8 text-center text-xs text-neutral-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#229ED9]" />
                    <span>Consultando grupos en tu Telegram en vivo...</span>
                  </div>
                )}

                {groups.length > 0 && (
                  <div className={`rounded-2xl border p-4 max-h-72 overflow-y-auto space-y-2 ${
                    isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    {groups.map((g) => (
                      <div
                        key={g.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="font-bold truncate">{g.title}</span>
                          {g.username && (
                            <span className="text-[11px] text-neutral-400 hidden sm:inline">
                              ({g.username})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-[#229ED9]/15 text-[#229ED9]">
                          {g.isChannel ? "Canal" : "Grupo"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {groups.length === 0 && !loadingGroups && (
                  <div className={`p-6 rounded-2xl border text-center text-xs ${
                    isDark ? "bg-[#171A20] border-[#2D3340] text-neutral-400" : "bg-neutral-50 border-neutral-200 text-neutral-600"
                  }`}>
                    Presiona el botón <strong>"Sincronizar mis Grupos"</strong> para escanear en tiempo real todos los grupos donde ya estás unido en Telegram.
                  </div>
                )}
              </div>
            </div>

            {/* Aviso de Seguridad */}
            <div className={`rounded-3xl p-5 border shadow-md flex items-center gap-3.5 ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
            }`}>
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Tu sesión MTProto se encuentra cifrada de extremo a extremo con el estándar AES-256. Ninguna contraseña es almacenada.
              </p>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE CONEXIÓN SI NO ESTÁ CONECTADO */
          <div className="max-w-xl mx-auto space-y-6">
            <div className={`rounded-3xl p-7 border shadow-xl ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md">
                  <Send className="w-5 h-5 -rotate-12 fill-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Conexión Segura MTProto</h2>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                    Autenticación directa de usuario mediante Telegram
                  </p>
                </div>
              </div>

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
                        placeholder="+57 300 123 4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                          isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phoneNumber}
                    className="w-full py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
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
                        Código de 5 dígitos recibido en Telegram
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
                      <KeyRound className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="12345"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-center text-xl font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                          isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phoneCode}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Validando sesión..." : "Confirmar y Activar mi Telegram"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
