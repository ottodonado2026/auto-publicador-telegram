"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Send, Shield, Lock, Mail, ArrowRight, ShieldCheck, 
  Sparkles, KeyRound, Bot, CheckCircle2, AlertTriangle
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Credenciales incorrectas");
      }

      // Validar en cliente también que sea SUPERADMIN
      if (data.user?.role !== "SUPERADMIN") {
        throw new Error("Acceso restringido: Esta cuenta no cuenta con privilegios de SuperAdmin.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al autenticar en el portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E1E24] flex flex-col justify-between selection:bg-black selection:text-white relative overflow-hidden font-sans">
      
      {/* Elementos ambientales de fondo claros y limpios estilo Apple */}
      <div className="absolute top-[-10%] left-[-5%] w-[480px] h-[480px] bg-gradient-to-br from-blue-100/50 via-sky-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] bg-gradient-to-tl from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[320px] h-[320px] bg-gradient-to-tr from-amber-50/30 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Navbar SuperAdmin */}
      <header className="w-full backdrop-blur-xl bg-white/70 border-b border-black/[0.04] sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Logo de Telegram con animación flotante continua */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(34,158,217,0.35)] animate-bounce duration-1000">
                <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] translate-y-[-1px] fill-white" />
              </div>
              {/* Anillo de pulso sutil */}
              <span className="absolute -inset-1 rounded-2xl bg-[#229ED9]/20 animate-ping opacity-30 pointer-events-none" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-neutral-900">Ott<span className="text-[#229ED9]">Bot</span></span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white tracking-widest uppercase">
                  HQ Admin
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">Plataforma de Control & Difusión</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 bg-white/80 px-3.5 py-1.5 rounded-full border border-neutral-200/60 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Neon PostgreSQL Conectado
            </span>
          </div>

        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[440px]">
          
          {/* Card Principal Apple Glassmorphism Blanco */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] border border-neutral-200/80">
            
            {/* Header del Login con animación flotante */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                {/* Ícono de Telegram flotante con resplandor */}
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#27A7E7] to-[#1E88E5] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(34,158,217,0.35)] transform transition-transform hover:scale-105 animate-pulse">
                  <Send className="w-8 h-8 -rotate-12 translate-x-[-2px] translate-y-[-2px] fill-white" />
                </div>
                {/* Badge de llave SuperAdmin */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center border-2 border-white shadow-sm">
                  <KeyRound className="w-3 h-3 text-amber-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Portal SuperAdmin
              </h1>
              <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto leading-relaxed">
                Ingreso exclusivo para la administración central, supervisión de clientes y control de bots de Telegram.
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200/70 text-red-600 text-xs font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 pl-1">
                  Correo Electrónico de Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@ottbot.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 pl-1">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/20 focus:border-[#229ED9] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Acceder a la Consola de Control</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sesión Zero-Trust HttpOnly
              </span>
              <span>v1.0 Oficial</span>
            </div>

          </div>

          {/* Sello de seguridad adicional */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            <span>¿Primer ingreso? Puedes inicializar tu usuario maestro en la base de datos.</span>
          </div>

        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="py-6 text-center text-xs text-neutral-400">
        © 2026 OttBot Control Hub • Diseñado con arquitectura de alto rendimiento.
      </footer>

    </div>
  );
}
