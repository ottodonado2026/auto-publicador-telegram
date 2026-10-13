"use client";

import { useTheme } from "@/context/ThemeContext";
import {
  BookOpen, DollarSign, Send, Shield,
  CheckCircle2, AlertTriangle, Server
} from "lucide-react";

export default function AdminGuidePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cardClass = `rounded-2xl p-8 border shadow-sm ${
    isDark
      ? "bg-[#1B1F27] border-[#2B313F]"
      : "bg-white border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
  }`;

  const subCardClass = `p-4 rounded-xl border ${
    isDark ? "bg-[#13161C] border-[#2D3340]" : "bg-neutral-50 border-neutral-300"
  }`;

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1600px] mx-auto">
      {/* Header con soporte dark mode */}
      <div className="mb-8">
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}>
          Guía de Operación y Manual de Negocio
        </h1>
        <p className={`text-sm font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
          Manual técnico y comercial para la administración y monetización de OttBot.
        </p>
      </div>

      <div className="space-y-6">
        {/* Paso 1: Modelo Híbrido */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#229ED9] flex items-center justify-center font-black text-base shadow-sm">
              1
            </div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              Modelo Dual: Flota Propia vs. Conexión de Cuenta Propia
            </h2>
          </div>

          <p className={`text-sm leading-relaxed mb-5 font-normal ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            OttBot está estructurado para operar bajo dos modalidades según la necesidad del cliente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={subCardClass}>
              <div className={`flex items-center gap-2 font-bold text-sm mb-1.5 ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>
                <Server className="w-4 h-4 text-[#229ED9]" />
                <span>Modalidad A: Tu Flota / Granja</span>
              </div>
              <p className={`text-xs leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-700"}`}>
                Tus propias cuentas vinculadas en OttBot actúan como los robots de difusión. El cliente solo pega los enlaces de los grupos donde desea que tus cuentas publiquen su anuncio.
              </p>
            </div>

            <div className={subCardClass}>
              <div className={`flex items-center gap-2 font-bold text-sm mb-1.5 ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>
                <Send className="w-4 h-4 text-emerald-500" />
                <span>Modalidad B: Cuenta del Cliente</span>
              </div>
              <p className={`text-xs leading-relaxed font-medium ${isDark ? "text-neutral-400" : "text-neutral-700"}`}>
                El cliente vincula su propio Telegram por código SMS. El sistema detecta todos sus grupos existentes y publica automáticamente desde su identidad de negocio.
              </p>
            </div>
          </div>
        </div>

        {/* Paso 2: Tarifas y Cobro Diario */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-base shadow-sm">
              2
            </div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              Estructura de Tarifas ($1.25 base con descuento progresivo)
            </h2>
          </div>

          <p className={`text-sm leading-relaxed mb-4 font-normal ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            El sistema incentiva a los usuarios a contratar más días continuos ofreciendo un valor por día cada vez menor:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
            {[
              { label: "1 Día", price: "$1.25 USD", sub: "$1.25 / día", color: "" },
              { label: "7 Días", price: "$7.00 USD", sub: "$1.00 / día (-20%)", color: "text-emerald-400" },
              { label: "15 Días", price: "$13.50 USD", sub: "$0.90 / día (-28%)", color: "text-emerald-400" },
              { label: "30 Días", price: "$24.00 USD", sub: "$0.80 / día (-36%)", color: "text-[#229ED9]", highlight: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-3.5 rounded-xl border ${
                  item.highlight
                    ? isDark ? "bg-[#229ED9]/10 border-[#229ED9]/40" : "bg-blue-50/40 border-[#229ED9]"
                    : isDark ? "bg-[#13161C] border-[#2D3340]" : "bg-neutral-50 border-neutral-300"
                }`}
              >
                <div className={`font-extrabold text-sm mb-1 ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>
                  {item.label}
                </div>
                <div className={`text-base font-black ${item.highlight ? "text-[#229ED9]" : isDark ? "text-white" : "text-neutral-900"}`}>
                  {item.price}
                </div>
                <div className={`text-[11px] mt-1 font-semibold ${item.color || (isDark ? "text-neutral-400" : "text-neutral-600")}`}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            isDark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Al expirar el tiempo contratado, el backend pausa en tiempo real todas las publicaciones hasta registrar una nueva recarga.</span>
          </div>
        </div>

        {/* Paso 3: Conexión de Telegram */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-base shadow-sm">
              3
            </div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              Protocolo MTProto vs. Enlaces de Grupos
            </h2>
          </div>

          <div className={`space-y-3 text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Detección Automática:</strong> Si el cliente conecta su cuenta, se extraen sus grupos existentes de forma automática sin necesidad de configurar URLs.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span><strong>Adición por Enlace:</strong> Si utiliza tus cuentas bot o quiere agregar nuevos grupos, el cliente ingresará los enlaces públicos o privados (ej: <code className="font-mono text-[#229ED9]">t.me/nombregrupo</code>), y la cuenta se unirá y publicará allí.</span>
            </div>
          </div>
        </div>

        {/* Paso 4: Cuentas Extra */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base shadow-sm">
              4
            </div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              Cuentas Adicionales de Telegram (+$3.00 USD / Ciclo)
            </h2>
          </div>
          <div className={`space-y-2.5 text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#229ED9] flex-shrink-0 mt-0.5" />
              <span><strong>Grupos independientes:</strong> Cada cuenta extra escanea sus propios grupos por separado y suma automáticamente <strong>+25 Grupos de Destino y +100 Publicaciones/día</strong>.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#229ED9] flex-shrink-0 mt-0.5" />
              <span><strong>Cobro por ciclo activo:</strong> El valor de $3.00 USD aplica por ciclo de membresía activa. Si el usuario renueva un plan básico de 1 o 7 días sin incluir la cuenta extra, las cuentas adicionales quedan pausadas (🔒).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong>Planes que incluyen cuentas extra gratis:</strong> Plan Quincenal (2 cuentas incluidas) y Plan Mensual Élite (3 cuentas incluidas).</span>
            </div>
          </div>
        </div>

        {/* Paso 5: Pagos Binance Pay */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-black text-base shadow-sm">
              5
            </div>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
              Método de Pago: Binance Pay (Cripto)
            </h2>
          </div>
          <div className={`space-y-2.5 text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            <div className="flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span><strong>Pago por Binance Pay:</strong> Aceptamos recargas de Wallet vía Binance Pay en USDT, BNB o cualquier cripto soportada. El usuario te envía el comprobante y tú acreditas manualmente.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span><strong>Recarga Manual:</strong> Si el usuario no tiene Binance, puede contactarte directamente por WhatsApp o Telegram para coordinar la recarga a su Wallet por otro método acordado.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
