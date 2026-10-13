"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { 
  Sun, Moon, Lock, Mail, ArrowRight, User as UserIcon, 
  AlertCircle, ChevronRight, Phone, Send, Sparkles,
  ShieldCheck, KeyRound, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft
} from "lucide-react";

type AuthAnimationPhase =
  | "IDLE"
  | "CREATING_ACCOUNT"
  | "ACCOUNT_CREATED"
  | "LOGGING_IN"
  | "LOGIN_SUCCESS";

export default function ClientLoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [animPhase, setAnimPhase] = useState<AuthAnimationPhase>("IDLE");
  const [animProgress, setAnimProgress] = useState(0);

  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "register") {
        setIsRegister(true);
      }
      const ref = urlParams.get("ref");
      if (ref) {
        setRefCode(ref.toUpperCase());
        setIsRegister(true);
      }
    }
  }, []);

  // Formulario Registro
  const [storeName, setStoreName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulario Login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Paso OTP
  const [phoneCode, setPhoneCode] = useState("");
  const [password2fa, setPassword2fa] = useState("");
  const [require2fa, setRequire2fa] = useState(false);
  const [activePhone, setActivePhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validación de Correo Real (Regex)
  const isEmailValid = useMemo(() => {
    if (!email) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  }, [email]);

  // Cálculo de Seguridad de Contraseña
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "bg-neutral-600", width: "0%" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Débil", color: "bg-red-500", text: "text-red-400", width: "25%" };
      case 2:
        return { score: 2, label: "Media", color: "bg-amber-500", text: "text-amber-400", width: "50%" };
      case 3:
        return { score: 3, label: "Fuerte", color: "bg-blue-500", text: "text-blue-400", width: "75%" };
      case 4:
        return { score: 4, label: "Muy Fuerte", color: "bg-emerald-500", text: "text-emerald-400", width: "100%" };
      default:
        return { score: 1, label: "Débil (Mín. 8 caract.)", color: "bg-red-500", text: "text-red-400", width: "20%" };
    }
  }, [password]);

  // Secuencia animada para Registro o Inicio de Sesión exitoso
  const runSuccessAnimationAndRedirect = (mode: "REGISTER" | "LOGIN", targetUrl: string) => {
    setAnimProgress(15);
    setAnimPhase(mode === "REGISTER" ? "CREATING_ACCOUNT" : "LOGGING_IN");

    const t1 = setTimeout(() => setAnimProgress(55), 400);
    const t2 = setTimeout(() => setAnimProgress(90), 1000);
    const t3 = setTimeout(() => {
      setAnimProgress(100);
      setAnimPhase(mode === "REGISTER" ? "ACCOUNT_CREATED" : "LOGIN_SUCCESS");
    }, 1700);

    const t4 = setTimeout(() => {
      router.push(targetUrl);
      router.refresh();
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  // Manejar envío del formulario inicial
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (isRegister) {
      if (!isEmailValid) {
        setError("Por favor ingresa un correo electrónico real y válido (ejemplo: usuario@dominio.com)");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden. Por favor verifícalas.");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register-send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName,
            phoneNumber,
            email: email.trim().toLowerCase(),
            password,
            refCode: refCode ? refCode.trim().toUpperCase() : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al solicitar código a Telegram");

        setActivePhone(data.phoneNumber);
        setMaskedPhone(data.phoneNumber);
        setStep("OTP");
        setInfoMessage(`Código de verificación enviado a tu Telegram al número ${data.phoneNumber}`);
      } else {
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
          setActivePhone(data.phoneNumber);
          setMaskedPhone(data.maskedPhone || data.phoneNumber);
          setStep("OTP");
          setInfoMessage(`Te enviamos un código de acceso a tu Telegram oficial.`);
        } else {
          const targetUrl = data.user?.role === "SUPERADMIN" ? "/admin" : "/dashboard";
          runSuccessAnimationAndRedirect("LOGIN", targetUrl);
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
        setLoading(false);
        return;
      }

      const targetUrl = data.user?.role === "SUPERADMIN" ? "/admin" : "/dashboard";
      runSuccessAnimationAndRedirect(isRegister ? "REGISTER" : "LOGIN", targetUrl);
    } catch (err: any) {
      setError(err.message || "Error al verificar código");
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-between p-3 selection:bg-[#229ED9] selection:text-white transition-colors duration-300 ${
      isDark ? "bg-[#13161C] text-white" : "bg-[#ECEEF1] text-[#0F172A]"
    }`}>
      {/* Barra superior con botón de Volver al Inicio y Alternar Tema */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between p-2">
        <Link
          href="/"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
            isDark
              ? "bg-[#1E2229] border-[#2B303C] text-neutral-300 hover:border-[#229ED9] hover:text-white"
              : "bg-white border-neutral-300 text-neutral-700 hover:border-[#229ED9] shadow-xs"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#229ED9]" />
          <span>Volver al Inicio</span>
        </Link>

        <button
          onClick={toggleTheme}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            isDark
              ? "bg-[#1E2229] border-[#2B303C] text-neutral-300 hover:border-[#229ED9]"
              : "bg-white border-neutral-300 text-neutral-700 hover:border-[#229ED9] shadow-xs"
          }`}
          title="Alternar Modo Claro / Oscuro"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          <span>{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>
      </div>

      {/* Tarjeta Central Adaptable */}
      <main className="flex-1 flex items-center justify-center p-1">
        <div className={`w-full ${
          animPhase !== "IDLE"
            ? "max-w-[460px]"
            : step === "OTP" 
            ? "max-w-[430px]" 
            : isRegister 
            ? "max-w-[680px]" 
            : "max-w-[420px]"
        } rounded-[28px] p-6 sm:p-8 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? "bg-[#1E2229] border-[#2B303C] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" 
            : "bg-white border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        }`}>
          {/* Resplandor decorativo azul Telegram */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#229ED9]/15 rounded-full blur-3xl pointer-events-none" />

          {/* ===================================================================== */}
          {/* VISTA ANIMADA DE CREACIÓN DE CUENTA O INICIO DE SESIÓN EXITOSO        */}
          {/* ===================================================================== */}
          {animPhase !== "IDLE" ? (
            <div className="py-6 text-center space-y-6">
              {/* Logos Animados: OttBot Oficial + Telegram */}
              <div className="relative flex items-center justify-center gap-4 mx-auto py-2">
                {/* Anillo orbital animado */}
                <div
                  className={`relative w-24 h-24 rounded-full p-1 flex items-center justify-center transition-all duration-500 ${
                    animPhase === "ACCOUNT_CREATED" || animPhase === "LOGIN_SUCCESS"
                      ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#229ED9] shadow-[0_0_40px_rgba(16,185,129,0.5)] scale-105"
                      : "bg-gradient-to-tr from-[#229ED9] via-sky-400 to-blue-600 shadow-[0_0_35px_rgba(34,158,217,0.45)] animate-pulse"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 bg-[#13161C]">
                    <img
                      src="/ottbot-logo.png"
                      alt="OttBot PRO"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Insignia flotante de Telegram o Check de Éxito */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-500 ${
                      animPhase === "ACCOUNT_CREATED" || animPhase === "LOGIN_SUCCESS"
                        ? "bg-emerald-500 text-white scale-110"
                        : "bg-[#229ED9] text-white animate-bounce"
                    }`}
                  >
                    {animPhase === "ACCOUNT_CREATED" || animPhase === "LOGIN_SUCCESS" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Send className="w-4 h-4 -ml-0.5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Textos dinámicos según la fase */}
              {animPhase === "CREATING_ACCOUNT" && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Sincronizando con Telegram</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Creando tu cuenta en OttBot PRO...
                  </h2>
                  <p className={`text-xs font-medium max-w-xs mx-auto leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                    Vinculando tu número de Telegram, generando tu código único <strong>BOT-I</strong> y activando tus 24 horas gratis.
                  </p>
                </div>
              )}

              {animPhase === "ACCOUNT_CREATED" && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verificación Completada</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400">
                    ¡Cuenta Creada Exitosamente!
                  </h2>
                  <p className={`text-xs font-medium max-w-xs mx-auto leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                    Tu autopublicador 24/7 y tu prueba gratuita ya están activos. Entrando a tu portal...
                  </p>
                </div>
              )}

              {animPhase === "LOGGING_IN" && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] text-[11px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 animate-pulse" />
                    <span>Conectando con tu Bot 24/7</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Iniciando sesión en tu OttBot...
                  </h2>
                  <p className={`text-xs font-medium max-w-xs mx-auto leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                    Validando tu sesión segura y cargando tus campañas y grupos de Telegram en la nube.
                  </p>
                </div>
              )}

              {animPhase === "LOGIN_SUCCESS" && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acceso Autorizado</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400">
                    ¡Inicio de Sesión Exitoso en tu Bot!
                  </h2>
                  <p className={`text-xs font-medium max-w-xs mx-auto leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                    Todo está listo. Abriendo tu centro de control en tiempo real...
                  </p>
                </div>
              )}

              {/* Barra de Progreso Animada */}
              <div className="max-w-xs mx-auto space-y-1.5">
                <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 ${isDark ? "bg-[#14171E]" : "bg-slate-200"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      animPhase === "ACCOUNT_CREATED" || animPhase === "LOGIN_SUCCESS"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : "bg-gradient-to-r from-[#229ED9] via-sky-400 to-emerald-400"
                    }`}
                    style={{ width: `${animProgress}%` }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {animProgress}% Completado
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Encabezado con Logo Oficial */}
              <div className="text-center mb-4">
                <div className="relative inline-block mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-sky-400 shadow-[0_6px_20px_rgba(34,158,217,0.4)] animate-float">
                    <img
                      src="/ottbot-logo.png"
                      alt="OttBot Oficial"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {step === "OTP"
                    ? "Verificación con Telegram"
                    : isRegister
                    ? "Registro con Telegram"
                    : "Acceso Clientes OttBot"}
                </h1>
                <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                  {step === "OTP"
                    ? "Ingresa el código de 5 dígitos que acabamos de enviar a tu app de Telegram."
                    : isRegister
                    ? "Crea tu cuenta con tu número de Telegram, valida el código y obtén 24h gratis."
                    : "Inicia sesión con tu número de Telegram, usuario o correo electrónico."}
                </p>
              </div>

              {/* Mensajes Informativos / Error */}
              {infoMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-[11px] font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* PASO 1: Formulario Inicial */}
              {step === "FORM" && (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  {isRegister ? (
                    <>
                      {/* FILA 1: Nombre o Marca + Número de Telegram */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                            isDark ? "text-neutral-300" : "text-slate-900"
                          }`}>
                            Tu Nombre, Marca o Proyecto *
                          </label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              placeholder="Ej. Carlos / Agencia Digital"
                              value={storeName}
                              onChange={(e) => setStoreName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                            isDark ? "text-neutral-300" : "text-slate-900"
                          }`}>
                            Número Telegram (con indicativo) *
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              required
                              placeholder="+57 300 208 4859"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* FILA 2: Correo Electrónico Obligatorio y Real */}
                      <div>
                        <div className="flex items-center justify-between mb-1 pl-0.5">
                          <label className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            isDark ? "text-neutral-300" : "text-slate-900"
                          }`}>
                            Correo Electrónico (Obligatorio & Real) *
                          </label>
                          {email && (
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${
                              isEmailValid ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {isEmailValid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Correo válido</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  <span>Formato inválido</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                            email ? (isEmailValid ? "text-emerald-400" : "text-red-400") : "text-[#229ED9]"
                          }`} />
                          <input
                            type="email"
                            required
                            placeholder="tu-correo-real@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all bg-[#161B22] border-2 text-white placeholder:text-neutral-400 ${
                              email && !isEmailValid
                                ? "border-red-500/60 focus:ring-red-500/30"
                                : "border-[#2D333B] focus:ring-[#229ED9]/40 focus:border-[#229ED9]"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Código de Invitación / Referido (Opcional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1 pl-0.5">
                          <label className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            isDark ? "text-neutral-300" : "text-slate-900"
                          }`}>
                            Código de Invitación / Referido (Opcional)
                          </label>
                          {refCode && (
                            <span className="text-[10px] font-bold text-[#229ED9] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Invitación aplicada</span>
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Sparkles className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Ej: BOT-I129849"
                            value={refCode}
                            onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                          />
                        </div>
                      </div>

                      {/* FILA 3: Contraseña + Confirmación con Ojitos y Medidor */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                            isDark ? "text-neutral-300" : "text-slate-900"
                          }`}>
                            Contraseña *
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="Mínimo 6 caracteres"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#229ED9] transition-colors"
                              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {password && (
                            <div className="mt-1.5 px-0.5">
                              <div className="flex justify-between items-center text-[10px] mb-1">
                                <span className={isDark ? "text-neutral-400" : "text-slate-600 font-bold"}>Seguridad:</span>
                                <span className={`font-bold ${passwordStrength.text}`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-neutral-700/40 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                  style={{ width: passwordStrength.width }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1 pl-0.5">
                            <label className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isDark ? "text-neutral-300" : "text-slate-900"
                            }`}>
                              Confirmar Contraseña *
                            </label>
                            {confirmPassword && (
                              <span className={`text-[10px] font-bold ${
                                password === confirmPassword ? "text-emerald-400" : "text-red-400"
                              }`}>
                                {password === confirmPassword ? "✓ Coinciden" : "⚠ No coinciden"}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              placeholder="Repite tu contraseña"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all bg-[#161B22] border-2 text-white placeholder:text-neutral-400 ${
                                confirmPassword && password !== confirmPassword
                                  ? "border-red-500/60 focus:ring-red-500/30"
                                  : "border-[#2D333B] focus:ring-[#229ED9]/40 focus:border-[#229ED9]"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#229ED9] transition-colors"
                              title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#229ED9] via-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-[#229ED9]/35 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99]"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Crear Cuenta & Recibir Código Telegram</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Vista Login (Sin la palabra "Tienda") */}
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                          isDark ? "text-neutral-300" : "text-slate-900"
                        }`}>
                          Número de Telegram / Usuario / Correo
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="+57 300... / Tu Nombre o Marca / correo@..."
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                          isDark ? "text-neutral-300" : "text-slate-900"
                        }`}>
                          Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            placeholder="••••••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#229ED9] transition-colors"
                            title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-[#229ED9] via-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-[#229ED9]/35 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99]"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Continuar con mi Cuenta</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* PASO 2: Verificación de Código OTP de Telegram */}
              {step === "OTP" && (
                <form onSubmit={handleOtpSubmit} className="space-y-3">
                  <div className="text-center p-3 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30">
                    <p className="text-xs font-black text-[#229ED9]">
                      Código enviado a tu Telegram
                    </p>
                    <p className="text-xs text-neutral-300 mt-0.5 font-mono font-bold">
                      {maskedPhone}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 text-center ${
                      isDark ? "text-neutral-300" : "text-slate-900"
                    }`}>
                      Código de Telegram (5 Dígitos)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#229ED9] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="12345"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-9 pr-3 py-3 rounded-xl text-center font-mono font-black text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:border-[#229ED9] transition-all bg-[#161B22] border-2 border-[#2D333B] text-white placeholder:text-neutral-500"
                      />
                    </div>
                    <span className={`text-[11px] text-center block mt-1.5 leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      {infoMessage || (
                        <>Revisa tu notificación en Telegram (@streamzonesupport) o en Mensajes Guardados de tu cuenta OttBot.</>
                      )}
                    </span>
                  </div>

                  {require2fa && (
                    <div>
                      <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 pl-0.5 ${
                        isDark ? "text-amber-400" : "text-amber-700 font-black"
                      }`}>
                        Contraseña 2FA de la Nube de Telegram
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          placeholder="Tu contraseña 2FA de Telegram"
                          value={password2fa}
                          onChange={(e) => setPassword2fa(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all bg-[#161B22] border-2 border-amber-500/40 text-white"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || phoneCode.length < 4}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isRegister ? "Verificar & Crear mi Cuenta" : "Verificar & Iniciar Sesión"}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("FORM");
                        setPhoneCode("");
                        setError(null);
                        setInfoMessage(null);
                      }}
                      className={`text-[11px] font-semibold transition-colors underline cursor-pointer ${
                        isDark ? "text-neutral-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      ← Volver o cambiar datos
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleFormSubmit}
                      className="text-[11px] font-bold text-[#229ED9] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Reenviar Código ↻
                    </button>
                  </div>
                </form>
              )}

              {/* Toggle Registro / Iniciar Sesión (Solo si está en paso inicial) */}
              {step === "FORM" && (
                <div className={`mt-4 pt-3 border-t text-center ${isDark ? "border-[#2B303C]" : "border-neutral-200"}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs font-bold text-[#229ED9] hover:underline inline-flex items-center gap-1 cursor-pointer"
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
            </>
          )}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className={`py-2 text-center text-[11px] font-medium ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
        © 2026 OttBot Platform • Sistema Anti-Baneo & Publicación Automática
      </footer>
    </div>
  );
}
