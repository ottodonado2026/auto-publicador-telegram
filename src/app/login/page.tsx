"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, ShieldCheck, Zap, Lock, Mail, User as UserIcon, 
  ArrowRight, Sparkles, CheckCircle2, ChevronRight, Bot
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al procesar la solicitud");
      }

      if (data.user?.role === "SUPERADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-between selection:bg-black selection:text-white relative overflow-hidden">
      {/* Luces de fondo sutiles tipo Apple */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header Minimalista */}
      <header className="w-full backdrop-blur-xl bg-white/70 border-b border-black/[0.05] sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] ring-1 ring-white/20">
              <Bot className="w-5 h-5 text-neutral-100" />
            </div>
            <div className="flex items-baseline">
              <span className="font-bold text-lg tracking-tight text-neutral-900">Ott</span>
              <span className="font-semibold text-lg tracking-tight text-neutral-500">Bot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5 mb-0.5 inline-block"></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-100/80 px-3 py-1 rounded-full border border-neutral-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Neon • Zero Trust
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Card Principal con acabado tipo iOS 18 / macOS Sonoma */}
          <div className="bg-white/90 backdrop-blur-xl rounded-[28px] p-8 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-neutral-200/80">
            {/* Header del Formulario */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-neutral-100/80 mb-3 border border-neutral-200/60 shadow-sm">
                <Sparkles className="w-5 h-5 text-neutral-800" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {isRegister ? "Empieza con OttBot" : "Bienvenido de nuevo"}
              </h1>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                {isRegister
                  ? "Crea tu cuenta hoy y recibe 1 día de prueba de autopublicación automática."
                  : "Ingresa a tu centro de control de campañas de Telegram."}
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-50/90 border border-red-200/70 text-red-600 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                <span>{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 pl-1">
                    Nombre o Empresa
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Roberto Gómez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 pl-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 pl-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? "Crear Cuenta (1 Día Gratis)" : "Entrar a OttBot"}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Alternar Registro / Login */}
            <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
              >
                <span>
                  {isRegister
                    ? "¿Ya tienes cuenta? Inicia sesión"
                    : "¿No tienes cuenta? Pruébalo 1 día gratis"}
                </span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Sello de Seguridad */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Plataforma Cloud Cifrada • Protocolo MTProto Telegram</span>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="py-6 text-center text-xs text-neutral-400">
        © 2026 OttBot Platform. Diseñado para automatización masiva en Telegram.
      </footer>
    </div>
  );
}
