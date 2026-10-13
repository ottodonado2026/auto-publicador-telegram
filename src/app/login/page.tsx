"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  Sun, Moon, Lock, Mail, ArrowRight, User as UserIcon, 
  Sparkles, AlertCircle, ChevronRight, Phone, Store, 
  ShieldCheck, KeyRound, RefreshCw, CheckCircle2
} from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");

  // Formulario Registro
  const [storeName, setStoreName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Formulario Login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Paso OTP
  const [phoneCode, setPhoneCode] = useState("");
  const [password2fa, setPassword2fa] = useState("");
  const [require2fa, setRequire2fa] = useState(false);
  const [activePhone, setActivePhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Manejar envío del formulario inicial
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Registro: Solicitar código a Telegram
        const res = await fetch("/api/auth/register-send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName,
            phoneNumber,
            email: email || undefined,
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al solicitar código a Telegram");

        setActivePhone(data.phoneNumber);
        setMaskedPhone(data.phoneNumber);
        setStep("OTP");
        setInfoMessage(`Código de verificación enviado a tu app de Telegram al número ${data.phoneNumber}`);
      } else {
        // Inicio de sesión
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier,
            password: loginPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Credenciales incorrectas");

        if (data.requireOtp) {
          // Requiere código de Telegram (Clientes)
          setActivePhone(data.phoneNumber);
          setMaskedPhone(data.maskedPhone || data.phoneNumber);
          setStep("OTP");
          setInfoMessage(`Te enviamos un código de acceso a tu Telegram oficial.`);
        } else {
          // SuperAdmin o sesión directa
          if (data.user?.role === "SUPERADMIN") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  // Manejar verificación del código OTP de Telegram
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/api/auth/register-verify-code"
        : "/api/auth/login-verify-code";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: activePhone,
          phoneCode,
          password2fa: password2fa || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto");

      if (data.require2fa) {
        setRequire2fa(true);
        setInfoMessage(data.message || "Escribe tu contraseña 2FA de Telegram");
        return;
      }

      // Éxito: Redirigir según el rol
      if (data.user?.role === "SUPERADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen w-screen overflow-x-hidden flex flex-col justify-between p-4 selection:bg-[#229ED9] selection:text-white transition-colors duration-300 ${
      isDark ? "bg-[#13161C] text-white" : "bg-[#ECEEF1] text-[#0F172A]"
    }`}>
      {/* Botón flotante superior para alternar tema */}
      <div className="w-full max-w-5xl mx-auto flex justify-end p-2">
        <button
          onClick={toggleTheme}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            isDark
              ? "bg-[#1E2229] border-[#2B303C] text-neutral-300 hover:border-[#229ED9]"
              : "bg-white border-neutral-300 text-neutral-700 hover:border-[#229ED9] shadow-sm"
          }`}
          title="Alternar Modo Claro / Oscuro"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          <span>{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>
      </div>

      {/* Tarjeta Central */}
      <main className="flex-1 flex items-center justify-center p-2">
        <div className={`w-full max-w-[430px] rounded-[32px] p-8 sm:p-9 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? "bg-[#1E2229] border-[#2B303C] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" 
            : "bg-white border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        }`}>
          {/* Resplandor decorativo azul Telegram */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#229ED9]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Oficial de OttBot */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_6px_25px_rgba(34,158,217,0.4)] animate-float">
                <img
                  src="/ottbot-logo.png"
                  alt="OttBot Oficial"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight">
              {step === "OTP"
                ? "Verificación de Seguridad"
                : isRegister
                ? "Registro con Telegram"
                : "Acceso Clientes OttBot"}
            </h1>
            <p className={`text-xs mt-1.5 leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {step === "OTP"
                ? "Ingresa el código que acabamos de enviar a tu app de Telegram."
                : isRegister
                ? "Crea tu cuenta, valida con tu Telegram y obtén 24 horas gratis de prueba."
                : "Inicia sesión con tu número de Telegram, tienda o correo."}
            </p>
          </div>

          {/* Mensaje Informativo */}
          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Alerta de Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PASO 1: Formulario Inicial de Registro o Login */}
          {step === "FORM" && (
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {isRegister ? (
                <>
                  {/* Nombre de Tienda */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Nombre de tu Tienda / Negocio
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Streaming Store"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Número de Telegram */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Número de Telegram (con indicativo país)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+57 301 176 2109"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500 block mt-1">
                      📲 Te enviaremos un código de seguridad directo a tu app de Telegram.
                    </span>
                  </div>

                  {/* Correo Electrónico (Opcional) */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Correo Electrónico (Opcional, para respaldo)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="tu-correo@gmail.com (opcional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Crear Cuenta & Recibir Código Telegram</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Login: Identificador (Teléfono / Tienda / Correo) */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Teléfono / Tienda / Correo
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="+57 301... / Mi Tienda / correo@..."
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                      isDark ? "text-neutral-400" : "text-neutral-600"
                    }`}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                          isDark
                            ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                            : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continuar con mi Cuenta</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}

          {/* PASO 2: Verificación de Código OTP de Telegram */}
          {step === "OTP" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center p-3 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/30">
                <p className="text-xs font-bold text-[#229ED9]">
                  Código enviado a Telegram
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                  {maskedPhone}
                </p>
              </div>

              <div>
                <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 text-center ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}>
                  Código de Telegram (5 Dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#229ED9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="12345"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-center font-mono font-black text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all ${
                      isDark
                        ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-600"
                        : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-300"
                    }`}
                  />
                </div>
                <span className="text-[11px] text-neutral-500 text-center block mt-1.5">
                  Revisa el chat oficial de <strong>Telegram</strong> en tu teléfono o PC.
                </span>
              </div>

              {require2fa && (
                <div>
                  <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                    isDark ? "text-amber-400" : "text-amber-600"
                  }`}>
                    Contraseña 2FA de la Nube de Telegram
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Tu contraseña 2FA de Telegram"
                      value={password2fa}
                      onChange={(e) => setPassword2fa(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all ${
                        isDark
                          ? "bg-[#171A20] border-amber-500/40 text-white"
                          : "bg-neutral-50 border-amber-500/40 text-neutral-900"
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phoneCode.length < 4}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verificar & Entrar al Portal</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("FORM");
                    setPhoneCode("");
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors underline"
                >
                  ← Volver o cambiar número de teléfono
                </button>
              </div>
            </form>
          )}

          {/* Toggle Registro / Iniciar Sesión (Solo si está en paso inicial) */}
          {step === "FORM" && (
            <div className={`mt-6 pt-5 border-t text-center ${isDark ? "border-[#2B303C]" : "border-neutral-200"}`}>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-xs font-bold text-[#229ED9] hover:underline inline-flex items-center gap-1"
              >
                <span>
                  {isRegister
                    ? "¿Ya tienes cuenta? Inicia sesión con Telegram"
                    : "¿No tienes cuenta? Regístrate y pruébalo 24h gratis"}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className={`py-4 text-center text-xs font-medium ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
        © 2026 OttBot Platform • Sistema Anti-Baneo & Publicación Automática
      </footer>
    </div>
  );
}
