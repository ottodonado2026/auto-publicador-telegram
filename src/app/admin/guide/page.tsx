import { 
  BookOpen, DollarSign, Send, Users, Shield, 
  Clock, CheckCircle2, AlertTriangle, ArrowRight, Server, Link2
} from "lucide-react";

export default function AdminGuidePage() {
  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      {/* Header con títulos oscuros y legibles */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
          Guía de Operación y Manual de Negocio
        </h1>
        <p className="text-sm text-neutral-600 font-semibold mt-1.5">
          Manual técnico y comercial para la administración y monetización de OttBot.
        </p>
      </div>

      <div className="space-y-6">
        {/* Paso 1: Modelo Híbrido */}
        <div className="bg-white rounded-2xl p-8 border border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#229ED9] flex items-center justify-center font-black text-base shadow-sm">
              1
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Modelo Dual: Flota Propia vs. Conexión de Cuenta Propia
            </h2>
          </div>
          
          <p className="text-sm text-neutral-800 leading-relaxed mb-5 font-normal">
            OttBot está estructurado para operar bajo dos modalidades según la necesidad del cliente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-300">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm mb-1.5">
                <Server className="w-4 h-4 text-[#229ED9]" />
                <span>Modalidad A: Tu Flota / Granja</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Tus propias cuentas vinculadas en OttBot actúan como los robots de difusión. El cliente solo pega los enlaces de los grupos donde desea que tus cuentas publiquen su anuncio.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-300">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm mb-1.5">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Modalidad B: Cuenta del Cliente</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                El cliente vincula su propio Telegram por código SMS. El sistema detecta todos sus grupos existentes y publica automáticamente desde su identidad de negocio.
              </p>
            </div>
          </div>
        </div>

        {/* Paso 2: Tarifas y Cobro Diario */}
        <div className="bg-white rounded-2xl p-8 border border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base shadow-sm">
              2
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Estructura de Tarifas ($1.25 base con descuento progresivo)
            </h2>
          </div>
          
          <p className="text-sm text-neutral-800 leading-relaxed mb-4 font-normal">
            El sistema incentiva a los usuarios a contratar más días continuos ofreciendo un valor por día cada vez menor:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-300">
              <div className="font-extrabold text-neutral-900 text-sm mb-1">1 Día</div>
              <div className="text-base font-black text-neutral-900">$1.25 USD</div>
              <div className="text-[11px] text-neutral-600 mt-1 font-semibold">$1.25 / día</div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-300">
              <div className="font-extrabold text-neutral-900 text-sm mb-1">7 Días</div>
              <div className="text-base font-black text-neutral-900">$7.00 USD</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">$1.00 / día (-20%)</div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-300">
              <div className="font-extrabold text-neutral-900 text-sm mb-1">15 Días</div>
              <div className="text-base font-black text-neutral-900">$13.50 USD</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">$0.90 / día (-28%)</div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-xl border border-[#229ED9] bg-blue-50/40">
              <div className="font-extrabold text-neutral-900 text-sm mb-1">30 Días</div>
              <div className="text-base font-black text-[#229ED9]">$24.00 USD</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">$0.80 / día (-36%)</div>
            </div>
          </div>

          <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Al expirar el tiempo contratado, el backend pausa en tiempo real todas las publicaciones hasta registrar una nueva recarga.</span>
          </div>
        </div>

        {/* Paso 3: Conexión de Telegram */}
        <div className="bg-white rounded-2xl p-8 border border-neutral-300 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-base shadow-sm">
              3
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Protocolo MTProto vs. Enlaces de Grupos
            </h2>
          </div>

          <div className="space-y-3 text-xs text-neutral-800 font-medium">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Detección Automática:</strong> Si el cliente conecta su cuenta, se extraen sus grupos existentes de forma automática sin necesidad de configurar URLs.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Adición por Enlace:</strong> Si utiliza tus cuentas bot o quiere agregar nuevos grupos, el cliente ingresará los enlaces públicos o privados (ej: <code>t.me/nombregrupo</code>), y la cuenta se unirá y publicará allí.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
