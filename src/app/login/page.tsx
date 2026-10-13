"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { 
  Sun, Moon, Lock, Mail, ArrowRight, User as UserIcon, 
  Sparkles, AlertCircle, ChevronRight
} from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen w-screen overflow-hidden flex flex-col justify-between p-4 selection:bg-[#229ED9] selection:text-white transition-colors duration-300 ${
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

      {/* Tarjeta Central de Acceso para Clientes */}
      <main className="flex-1 flex items-center justify-center p-2">
        <div className={`w-full max-w-[420px] rounded-[32px] p-8 sm:p-9 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? "bg-[#1E2229] border-[#2B303C] shadow-[0_20px_60px_rgba(0,0,0,0.5)]" 
            : "bg-white border-neutral-300 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        }`}>
          {/* Resplandor decorativo azul Telegram */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#229ED9]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Oficial de OttBot Destacado y Grande */}
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
              {isRegister ? "Empieza con OttBot" : "Acceso Clientes OttBot"}
            </h1>
            <p className={`text-xs mt-1.5 leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {isRegister
                ? "Regístrate ahora y obtén 1 día de difusión automática gratis."
                : "Autopublica en grupos de Telegram en piloto automático."}
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 ${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                }`}>
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
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 focus:border-[#229ED9] transition-all ${
                      isDark
                        ? "bg-[#171A20] border-[#2B303C] text-white placeholder:text-neutral-500"
                        : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400"
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 ${
                isDark ? "text-neutral-400" : "text-neutral-600"
              }`}>
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="cliente@negocio.com"
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

            <div>
              <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 ${
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
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#229ED9] to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? "Comenzar Prueba Gratis (1 Día)" : "Entrar a mi Panel"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Registro / Iniciar Sesión */}
          <div className={`mt-6 pt-5 border-t text-center ${isDark ? "border-[#2B303C]" : "border-neutral-200"}`}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-bold text-[#229ED9] hover:underline inline-flex items-center gap-1"
            >
              <span>
                {isRegister
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : "¿No tienes cuenta? Pruébalo 1 día gratis"}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className={`py-4 text-center text-xs font-medium ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
        © 2026 OttBot Platform • Publica en Telegram Automáticamente
      </footer>
    </div>
  );
}
