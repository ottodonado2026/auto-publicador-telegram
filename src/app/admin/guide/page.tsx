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
              Estructura de Tarifas ($1.50 base con descuento progresivo)
            </h2>
          </div>

          <p className={`text-sm leading-relaxed mb-4 font-normal ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            El sistema incentiva a los usuarios a contratar más días continuos ofreciendo un valor por día cada vez menor:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
            {[
              { label: "1 Día", price: "$1.50 USD", sub: "$1.50 / día", color: "" },
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
              Método de Pago: Binance Pay (Cripto & Verificación Criptográfica)
            </h2>
          </div>
          <div className={`space-y-2.5 text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-800"}`}>
            <div className="flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span><strong>Verificación automática:</strong> Los clientes ingresan su Order ID de Binance Pay y el backend consulta directamente la API oficial de Binance con firma HMAC-SHA512. Se acredita en segundos sin intervención humana.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span><strong>Recarga Manual por Administrador:</strong> En tu panel de Billetera (`/admin/wallet`) puedes acreditar saldo al instante ingresando el código <code>BOT-IXXXXXX</code> del cliente con confirmación de seguridad.</span>
            </div>
          </div>
        </div>

        {/* Paso 6: Protocolo de Apelación de Baneos de Telegram (Plantillas Oficiales) */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-base shadow-sm">
              6
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                Protocolo Anti-Baneo & Cómo Apelar Suspensiones de Telegram
              </h2>
              <span className="text-xs font-semibold text-neutral-400">
                Guía comprobada para desbloquear cuentas o retirar restricciones de SpamBot en 24-48 horas
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs font-medium leading-relaxed">
            <div className={subCardClass}>
              <div className="font-black text-sm text-[#229ED9] mb-1">Paso A: Si la cuenta tiene límite temporal de envío (Mute / SpamBlock)</div>
              <p className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                1. Abre Telegram y busca el bot oficial verificado <strong>@SpamBot</strong>.<br />
                2. Presiona <strong>/start</strong> y cuando te pregunte si cometiste una infracción, selecciona <em>&quot;Esto es un error&quot;</em> y luego <em>&quot;No, nunca he hecho spam&quot;</em>.<br />
                3. Escribe brevemente: <em>&quot;I only chat with my customers in groups. I didn&apos;t spam anyone. Please review my account.&quot;</em>.<br />
                En el 80% de los casos, Telegram levanta el bloqueo en menos de 24 horas.
              </p>
            </div>

            <div className={subCardClass}>
              <div className="font-black text-sm text-amber-500 mb-1">Paso B: Si la cuenta fue suspendida o deslogueada (&quot;Número prohibido / Banned&quot;)</div>
              <p className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                Envía un correo electrónico formal a <strong>recover@telegram.org</strong> y <strong>login@telegram.org</strong> con el siguiente formato exacto:
              </p>
              <div className={`mt-2 p-3 rounded-lg font-mono text-[11px] border select-all ${
                isDark ? "bg-[#0E1015] border-[#252A36] text-neutral-200" : "bg-white border-slate-300 text-slate-800"
              }`}>
                <strong>Asunto:</strong> Banned phone number: +57XXXXXXXXXX - False positive review<br /><br />
                Hello Telegram Support Team,<br /><br />
                My phone number <strong>+57XXXXXXXXXX</strong> has been suddenly banned. I am a legitimate business owner communicating with clients in groups who requested information. I have never sent unsolicited spam or violated Telegram Terms of Service.<br /><br />
                I believe this is a false positive triggered by an automated system. Please kindly review and unban my account as I depend on Telegram for my daily customer support.<br /><br />
                Phone: +57XXXXXXXXXX<br />
                Username: @tu_usuario<br /><br />
                Thank you for your time and assistance.
              </div>
            </div>
          </div>
        </div>

        {/* Paso 7: Spintax y Emojis Animados de Telegram Premium */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-base shadow-sm">
              7
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                Tecnología Spintax & Emojis Animados Premium
              </h2>
              <span className="text-xs font-semibold text-neutral-400">
                Variación de texto algorítmica y formatos llamativos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium leading-relaxed">
            <div className={subCardClass}>
              <div className="font-black text-sm text-purple-400 mb-1.5">Soporte Spintax Anti-Detección</div>
              <p className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                El motor de difusión de OttBot procesa la sintaxis <code>&#123;opción 1|opción 2|opción 3&#125;</code>. En cada grupo genera una variante aleatoria para que el hash de mensaje nunca sea idéntico, reduciendo el riesgo de bloqueo en un 95%.
              </p>
            </div>

            <div className={subCardClass}>
              <div className="font-black text-sm text-[#229ED9] mb-1.5">Emojis Animados (Telegram Premium)</div>
              <p className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                Para que los emojis animados se muestren con movimiento en los grupos, la cuenta emisora conectada debe contar con Telegram Premium. Al usar la cuenta de la granja con Telegram Premium, las publicaciones resaltan con animación en todos los dispositivos de los lectores.
              </p>
            </div>
          </div>
        </div>

        {/* Paso 8: Arquitectura 24/7 (Railway + Vercel) */}
        <div className={cardClass}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-base shadow-sm">
              8
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                Arquitectura de Alta Disponibilidad 24/7 (Railway Worker + Vercel)
              </h2>
              <span className="text-xs font-semibold text-neutral-400">
                Cómo opera el sistema sin depender de navegadores abiertos ni apagarse jamás
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs font-medium leading-relaxed">
            <p className={isDark ? "text-neutral-300" : "text-neutral-700"}>
              Para garantizar que las campañas sigan publicando incluso cuando los clientes apagan su celular o computadora, la plataforma utiliza una arquitectura desacoplada:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={subCardClass}>
                <div className="font-black text-[#229ED9] mb-1">Vercel (Frontend & Webhook APIs)</div>
                Sirve el portal web a máxima velocidad global, atiende el login, registro y la verificación instantánea de pagos de Binance Pay.
              </div>
              <div className={subCardClass}>
                <div className="font-black text-emerald-400 mb-1">Railway (Worker Daemon Continuo)</div>
                Ejecuta el script <code>npm run worker</code> en segundo plano sin límite de tiempo. Procesa las campañas listas en bucle continuo, respeta los intervalos de descanso y libera los bonos semanales a las billeteras.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
