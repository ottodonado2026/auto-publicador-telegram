"use client";

import { useEffect, useState } from "react";
import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { 
  Send, PhoneCall, KeyRound, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, Users, 
  User, Store, Mail, Lock, Eye, EyeOff, ShieldAlert, Check
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

  // Estado del Modal de Restablecer Contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"SEND" | "VERIFY" | "DONE">("SEND");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reset2fa, setReset2fa] = useState("");
  const [require2fa, setRequire2fa] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

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

  // Solicitar código para restablecer contraseña por Telegram
  const handleStartPasswordReset = async () => {
    try {
      setResetLoading(true);
      setResetError(null);
      const res = await fetch("/api/auth/reset-password-send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: sessionUser?.phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al solicitar código");
      setResetStep("VERIFY");
    } catch (err: any) {
      setResetError(err.message || "Error al solicitar código por Telegram");
    } finally {
      setResetLoading(false);
    }
  };

  // Confirmar restablecimiento de contraseña
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setResetLoading(true);
      setResetError(null);
      const res = await fetch("/api/auth/reset-password-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: sessionUser?.phoneNumber,
          phoneCode: resetCode,
          newPassword,
          password2fa: reset2fa || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.require2fa) {
          setRequire2fa(true);
          throw new Error(data.message);
        }
        throw new Error(data.error || "Error al restablecer la contraseña");
      }
      setResetSuccess(data.message);
      setResetStep("DONE");
    } catch (err: any) {
      setResetError(err.message || "Error al verificar código");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"}`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-5xl w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gestión de Perfil & Cuenta de Telegram
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Consulta tus credenciales registradas, restablece tu contraseña mediante OTP de Telegram y sincroniza tus grupos de difusión.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* TARJETA 1: PERFIL REGISTRADO Y ACCESO A CONTRASEÑA */}
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D3340]/60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center text-[#229ED9] font-bold">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black">{sessionUser?.storeName || sessionUser?.name || "Mi Tienda"}</h2>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[#229ED9] border border-[#229ED9]/30 uppercase">
                      Cuenta Cliente
                    </span>
                  </div>
                  <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                    ID: {sessionUser?.id ? sessionUser.id.slice(0, 12) : "..."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowResetModal(true);
                  setResetStep("SEND");
                  setResetError(null);
                  setResetSuccess(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Restablecer Contraseña por Telegram</span>
              </button>
            </div>

            {/* Datos Registrados */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1">
                  <Store className="w-3.5 h-3.5 text-[#229ED9]" />
                  <span>Nombre de la Tienda</span>
                </div>
                <div className="text-sm font-black truncate">
                  {sessionUser?.storeName || "No registrado"}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teléfono Móvil (Telegram)</span>
                </div>
                <div className="text-sm font-black font-mono truncate">
                  {sessionUser?.phoneNumber || "No vinculado"}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Correo Electrónico</span>
                </div>
                <div className="text-sm font-black font-mono truncate">
                  {sessionUser?.email || "No registrado"}
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA 2: VINCULACIÓN MTPROTO DE TELEGRAM */}
          {step === "CONNECTED" ? (
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
                      className="text-xs text-[#229ED9] hover:underline font-bold cursor-pointer"
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
          ) : (
            /* FORMULARIO DE CONEXIÓN SI NO ESTÁ CONECTADO */
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
                <form onSubmit={handleSendCode} className="space-y-4 max-w-lg">
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
                    className="w-full py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Solicitando código oficial a Telegram..." : "Enviar Código a mi Telegram"}
                  </button>
                </form>
              )}

              {step === "CODE" && (
                <form onSubmit={handleVerifyCode} className="space-y-4 max-w-lg">
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Validando sesión..." : "Confirmar y Activar mi Telegram"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Aviso de Seguridad */}
          <div className={`rounded-3xl p-5 border shadow-md flex items-center gap-3.5 ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Tu sesión MTProto se encuentra cifrada de extremo a extremo con el estándar AES-256. Ninguna contraseña es almacenada en texto plano.
            </p>
          </div>
        </div>
      </main>

      {/* MODAL RESTABLECER CONTRASEÑA POR TELEGRAM */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-7 border shadow-2xl relative ${
            isDark ? "bg-[#1E2229] border-[#2D3340] text-white" : "bg-white border-neutral-300 text-neutral-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#2D3340]/50 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black">Restablecer Contraseña</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Cerrar
              </button>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetStep === "SEND" && (
              <div className="space-y-4">
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Te enviaremos un código de seguridad directamente a tu aplicación oficial de Telegram al número registrado:
                </p>

                <div className={`p-4 rounded-2xl border text-center font-mono font-black text-sm ${
                  isDark ? "bg-[#171A20] border-[#2D3340] text-[#229ED9]" : "bg-neutral-50 border-neutral-200 text-[#229ED9]"
                }`}>
                  {sessionUser?.phoneNumber || "Sin número registrado"}
                </div>

                <button
                  type="button"
                  onClick={handleStartPasswordReset}
                  disabled={resetLoading || !sessionUser?.phoneNumber}
                  className="w-full py-3 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? "Enviando código oficial..." : "Enviar Código a mi Telegram"}
                </button>
              </div>
            )}

            {resetStep === "VERIFY" && (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Código de Telegram recibido
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="12345"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-center text-lg font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                      isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                        isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] ${
                      isDark ? "bg-[#171A20] border-[#2D3340] text-white" : "bg-neutral-50 border-neutral-300 text-neutral-900"
                    }`}
                  />
                </div>

                {require2fa && (
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1.5">
                      Contraseña 2FA de tu Telegram (Opcional si la tienes activa)
                    </label>
                    <input
                      type="password"
                      placeholder="Ingresa tu contraseña de verificación en 2 pasos"
                      value={reset2fa}
                      onChange={(e) => setReset2fa(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                        isDark ? "bg-[#171A20] border-amber-500/50 text-white" : "bg-neutral-50 border-amber-500/50 text-neutral-900"
                      }`}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading || !resetCode || !newPassword || !confirmPassword}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? "Verificando y actualizando..." : "Confirmar y Cambiar Contraseña"}
                </button>
              </form>
            )}

            {resetStep === "DONE" && (
              <div className="text-center space-y-4 py-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black">¡Contraseña Cambiada!</h4>
                <p className="text-xs text-neutral-400">
                  {resetSuccess || "Tu contraseña ha sido actualizada con éxito."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full py-2.5 bg-[#229ED9] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
