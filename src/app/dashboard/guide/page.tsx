"use client";

import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, ShieldCheck, Zap, Users, Clock, AlertTriangle, 
  CheckCircle2, Sparkles, Send, Bot, RefreshCw, HelpCircle, Layers
} from "lucide-react";

export default function ClientGuidePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user);
          setMembership(data.membership);
        }
      });
  }, []);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-8 max-w-5xl w-full mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Centro de Capacitación Oficial OttBot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Guía de Instrucciones & Reglas del Sistema
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Aprende cómo funciona el piloto automático de difusión, cómo operan los planes y cómo proteger tus cuentas con las políticas antibaneo.
          </p>
        </div>

        <div className="space-y-6">
          {/* SECCIÓN 1: MODALIDADES DE PUBLICACIÓN */}
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
              <Bot className="w-5 h-5 text-[#229ED9]" />
              <span>1. Dos Formas de Publicar: Tu Cuenta vs. Granja OttBot</span>
            </h2>
            <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              En OttBot tienes total flexibilidad para elegir qué identidad publica tus anuncios en los grupos de Telegram.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 font-black text-sm text-[#229ED9] mb-2">
                  <Send className="w-4 h-4" />
                  <span>Opción A: Publicar con tu Cuenta Propia</span>
                </div>
                <ul className={`text-xs space-y-2 leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Sin intermediarios:</strong> Se usa el número de Telegram que vinculaste en tu panel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Grupos directos:</strong> Publica de inmediato en todos los grupos donde ya estés unido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Respuesta en vivo:</strong> Las personas te escriben directamente al chat privado de tu cuenta.</span>
                  </li>
                </ul>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 font-black text-sm text-emerald-400 mb-2">
                  <Bot className="w-4 h-4" />
                  <span>Opción B: Activar Granja OttBot</span>
                </div>
                <ul className={`text-xs space-y-2 leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Cero riesgo para tu cuenta:</strong> Publican nuestros robots verificados de la flota OttBot.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Unión progresiva:</strong> Los robots se unen a los grupos que les indiques respetando los límites de Telegram.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Enlaces a tu tienda:</strong> Coloca tu enlace de Telegram (@tutienda) en el copy para recibir clientes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PROTOCOLO ANTIBANEO DE TELEGRAM */}
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>2. Protocolo de Seguridad Antibaneo: ¿Cómo se unen a los grupos?</span>
            </h2>
            <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Telegram impone restricciones estrictas (llamadas <code>FLOOD_WAIT</code>) a las cuentas que intentan unirse o publicar en decenas de grupos en un solo segundo. Nuestro motor inteligente previene sanciones con estas 3 reglas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Delay Humano de 60s</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Entre cada envío a un grupo, OttBot espera un intervalo de 60 segundos. Esto simula el comportamiento natural de un usuario y no activa los filtros anti-spam.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase mb-2">
                  <Clock className="w-4 h-4" />
                  <span>Descansos de 60 a 120 Min</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Al terminar una ronda completa de tus grupos, el sistema entra en enfriamiento obligatorio. Nunca se satura un grupo con mensajes repetitivos seguidos.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase mb-2">
                  <Users className="w-4 h-4" />
                  <span>Unión Segura a Grupos</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  En planes con 30, 60 o 100 grupos, la granja no se une a los 100 en un solo segundo. La carga se reparte entre los bots de la flota y se une escalonadamente en tandas seguras.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ESTRUCTURA DE PLANES Y MULTICUENTAS */}
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>3. Estructura de Planes & Soporte Multicuenta</span>
            </h2>
            <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
              Cada plan está calibrado para diferentes necesidades de volumen. Además, los planes superiores permiten vincular hasta 2 o 3 cuentas de Telegram simultáneas para duplicar tu alcance:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="text-xs font-black text-neutral-400 uppercase">Pase Express (1 Día)</div>
                <div className="text-lg font-black mt-1">$1.25 USD</div>
                <div className="mt-2.5 text-xs space-y-1.5 text-neutral-400 font-medium">
                  <div>• Hasta 25 grupos</div>
                  <div>• <strong>100 envíos / día</strong></div>
                  <div>• Hasta 2 Campañas Activas</div>
                  <div>• 1 Cuenta TG (+Opción $3 extra)</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="text-xs font-black text-amber-400 uppercase">Semanal (7 Días)</div>
                <div className="text-lg font-black mt-1">$7.00 USD</div>
                <div className="mt-2.5 text-xs space-y-1.5 text-neutral-400 font-medium">
                  <div>• Hasta 50 grupos</div>
                  <div>• <strong>200 envíos / día</strong></div>
                  <div>• Hasta 3 Campañas Activas</div>
                  <div>• $1.00 USD / día (20% OFF)</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="text-xs font-black text-[#229ED9] uppercase">Quincenal (15 Días)</div>
                <div className="text-lg font-black mt-1">$13.50 USD</div>
                <div className="mt-2.5 text-xs space-y-1.5 text-neutral-400 font-medium">
                  <div>• Hasta 100 grupos</div>
                  <div>• <strong>300 envíos / día</strong></div>
                  <div>• Hasta 5 Campañas Activas</div>
                  <div>• <strong>Hasta 2 Cuentas TG</strong></div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="text-xs font-black text-emerald-400 uppercase">Mensual (30 Días)</div>
                <div className="text-lg font-black mt-1">$24.00 USD</div>
                <div className="mt-2.5 text-xs space-y-1.5 text-neutral-400 font-medium">
                  <div>• <strong>Grupos Ilimitados</strong></div>
                  <div>• <strong>500 envíos / día</strong></div>
                  <div>• Hasta 8 Campañas Activas</div>
                  <div>• <strong>Hasta 3 Cuentas TG</strong></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/dashboard/plans"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                <span>Ver y Recargar Planes</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* SECCIÓN 4: CONSEJOS PARA UN COPY PROFESIONAL */}
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>4. Buenas Prácticas para Crear tus Copys</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <strong className="block text-white mb-1 font-bold">✨ Formato Telegram Nativo:</strong>
                <p className={`leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Usa los botones de la barra de herramientas para aplicar <strong>**Negrita**</strong> a los títulos principales, <em>*Cursiva*</em> para detalles y <code>&gt; Cita</code> para resaltar precios o beneficios destacados.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <strong className="block text-white mb-1 font-bold">📸 Banners y Fotos Atractivas:</strong>
                <p className={`leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Los anuncios con una imagen clara tienen hasta un 300% más de interacción. Sube tu imagen directamente en el editor; el sistema la optimiza para enviarla como foto de Telegram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
