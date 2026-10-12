import { 
  BookOpen, DollarSign, Send, Users, Shield, 
  Clock, CheckCircle2, AlertTriangle, ArrowRight 
} from "lucide-react";

export default function AdminGuidePage() {
  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Guía de Operación y Manual de Negocio
        </h1>
        <p className="text-xs text-neutral-500 font-medium mt-1">
          Aprende el flujo de trabajo completo para administrar y monetizar OttBot diariamente.
        </p>
      </div>

      <div className="space-y-6">
        {/* Paso 1: Modelo de Negocio y Cobro */}
        <div className="bg-white rounded-2xl p-7 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Modelo de Cobro Diario ($1 o $2 / día)
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mb-4">
            Cada vez que un cliente se registra, recibe **1 día de prueba gratis**. Cuando ese día finaliza, el backend marca la membresía como <span className="font-bold text-red-600">EXPIRADA</span> y pausa inmediatamente el envío de mensajes a los grupos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="font-bold text-neutral-900 mb-1">+1 Día ($1 o $2)</div>
              <div className="text-neutral-500 text-[11px]">Para usuarios que pagan día a día de forma flexible.</div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="font-bold text-neutral-900 mb-1">+7 Días ($7 - $14)</div>
              <div className="text-neutral-500 text-[11px]">Paquete semanal para campañas medianas.</div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="font-bold text-neutral-900 mb-1">+30 Días ($25 - $50)</div>
              <div className="text-neutral-500 text-[11px]">Suscripción mensual recurrente más rentable.</div>
            </div>
          </div>
        </div>

        {/* Paso 2: Cómo Conectar Telegram (MTProto) */}
        <div className="bg-white rounded-2xl p-7 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#229ED9] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Cómo Conectar la Cuenta Personal de Telegram
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mb-4">
            OttBot no usa bots convencionales; utiliza el protocolo **MTProto**. Esto significa que el sistema actúa exactamente como si tú o tu cliente estuvieran usando la app oficial:
          </p>
          <div className="space-y-2 text-xs text-neutral-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Ingreso de Teléfono:</strong> Escribe tu número completo con código de país (ej. +57300...).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Código SMS / Notificación:</strong> Telegram te enviará un código oficial en tu aplicación.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Sesión Persistente Cifrada:</strong> El backend genera una cadena de sesión cifrada con AES-256 en Neon PostgreSQL. No se guardan contraseñas y la sesión no se cierra.</span>
            </div>
          </div>
        </div>

        {/* Paso 3: Flujo de Publicación en Grupos */}
        <div className="bg-white rounded-2xl p-7 border border-neutral-300/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Cómo Funciona la Autopublicación
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Una vez conectada la cuenta, el sistema extrae automáticamente la lista de grupos donde dicha cuenta ya es miembro. El usuario escribe su mensaje publicitario, configura el intervalo (ej. cada 30 minutos o 1 hora) y el robot emite el mensaje cíclicamente mientras la membresía esté al día.
          </p>
        </div>
      </div>
    </div>
  );
}
