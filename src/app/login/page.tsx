"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, Mail, ArrowRight, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ventasysoportestreaming@gmail.com");
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

      if (data.user?.role !== "SUPERADMIN") {
        throw new Error("Acceso restringido: Esta cuenta no posee privilegios de administrador.");
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
    <div className="h-screen w-screen overflow-hidden bg-[#ECEEF1] flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
      {/* Tarjeta Principal Blanca Resaltada sobre el fondo grisáceo */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-neutral-200/90 relative">
        
        {/* Header con Ícono Flotante de Telegram */}
        <div className="text-center mb-7">
          <div className="inline-flex p-3 rounded-2xl bg-[#229ED9] text-white shadow-[0_8px_20px_rgba(34,158,217,0.35)] animate-float mb-3.5">
            <Send className="w-6 h-6 -rotate-12 translate-x-[-1px] translate-y-[-1px] fill-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Ott<span className="text-[#229ED9]">Bot</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Acceso Administrativo
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario Limpio y Seguro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 pl-0.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/25 focus:border-[#229ED9] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 pl-0.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#229ED9]/25 focus:border-[#229ED9] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
