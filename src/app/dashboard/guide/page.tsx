"use client";

import ClientSidebar from "@/components/ClientSidebar";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, ShieldCheck, Zap, Users, Clock, 
  CheckCircle2, Sparkles, Send, Bot, Layers, BarChart3
} from "lucide-react";

const PLAN_EXPLANATIONS = [
  {
    id: "express",
    tag: "Pase Express (1 Día)",
    price: "$1.25 USD",
    groups: "Hasta 25 grupos",
    dailyPosts: "100 publicaciones / día",
    maxCampaigns: "Hasta 2 campañas activas",
    accounts: "1 Cuenta de Telegram (+Opción $3 USD extra)",
    color: "text-[#38BDF8]",
    badgeBg: "bg-[#38BDF8]/15 border-[#38BDF8]/30 text-[#38BDF8]",
    summary:
      "Ideal para promociones de 24 horas. Tienes un presupuesto total de 100 publicaciones automáticas en el día y hasta 25 grupos de destino.",
    scenarios: [
      {
        title: "Opción 1: Si activas 1 sola campaña con tus 25 grupos",
        detail:
          "Tus 100 publicaciones del día se concentran en esa única campaña. El sistema publicará en tus 25 grupos (1 grupo cada 60 segundos) durante 4 rondas completas en el día (25 grupos × 4 rondas = 100 publicaciones exactas).",
      },
      {
        title: "Opción 2: Si activas las 2 campañas permitidas (División Inteligente)",
        detail:
          "Las 100 publicaciones diarias se dividen entre tus 2 campañas activas (50 publicaciones para la Campaña 1 y 50 para la Campaña 2). Puedes dividir tus 25 grupos (por ejemplo: 15 grupos en la Campaña 1 y 10 grupos en la Campaña 2) para promocionar 2 productos distintos sin cruzarlos.",
      },
    ],
  },
  {
    id: "semanal",
    tag: "Plan Semanal (7 Días)",
    price: "$7.00 USD ($1.00/día)",
    groups: "Hasta 50 grupos",
    dailyPosts: "200 publicaciones / día",
    maxCampaigns: "Hasta 3 campañas activas",
    accounts: "1 Cuenta de Telegram o Granja OttBot",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    summary:
      "Nuestro plan más elegido. Duplica tu capacidad diaria a 200 publicaciones automáticas cada día y hasta 50 grupos en rotación.",
    scenarios: [
      {
        title: "Opción 1: Si usas 1 sola campaña en 50 grupos",
        detail:
          "Esa campaña realizará 4 rondas completas a lo largo del día sobre tus 50 grupos (50 grupos × 4 rondas = 200 publicaciones diarias).",
      },
      {
        title: "Opción 2: Si activas 2 o 3 campañas simultáneas",
        detail:
          "Con 2 campañas activas, cada una dispone de 100 publicaciones/día (ej. 25 grupos en la Campaña A y 25 grupos en la Campaña B). Con 3 campañas activas, las 200 publicaciones se reparten (~66 envíos por campaña) y el motor las escalona con 5 minutos de separación para que nunca choquen.",
      },
    ],
  },
  {
    id: "quincenal",
    tag: "Plan Quincenal (15 Días)",
    price: "$13.50 USD ($0.90/día)",
    groups: "Hasta 100 grupos",
    dailyPosts: "300 publicaciones / día",
    maxCampaigns: "Hasta 5 campañas activas",
    accounts: "Hasta 2 Cuentas de Telegram simultáneas",
    color: "text-purple-400",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    summary:
      "Diseñado para usuarios y marcas con múltiples anuncios. Incluye 300 publicaciones diarias, hasta 60 grupos y soporte para conectar 2 números de Telegram.",
    scenarios: [
      {
        title: "División entre hasta 5 campañas activas",
        detail:
          "Si activas 3 campañas, cada una recibe 100 publicaciones/día. Si activas las 5 campañas, cada una recibe 60 publicaciones/día distribuidas en los grupos que selecciones para cada anuncio.",
      },
      {
        title: "Ventaja de tus 2 Cuentas de Telegram",
        detail:
          "Al vincular 2 cuentas de Telegram, cada cuenta escanea sus propios grupos independientes y puedes publicar copys distintos en los grupos de cada número.",
      },
    ],
  },
  {
    id: "mensual",
    tag: "Plan Mensual (30 Días)",
    price: "$24.00 USD ($0.80/día)",
    groups: "Hasta 100 grupos",
    dailyPosts: "500 publicaciones / día",
    maxCampaigns: "Hasta 8 campañas activas",
    accounts: "Hasta 3 Cuentas de Telegram simultáneas",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    summary:
      "Máxima potencia comercial a solo $0.80 USD por día. Hasta 100 grupos, 500 publicaciones automáticas diarias y hasta 3 cuentas de Telegram en rotación.",
    scenarios: [
      {
        title: "Distribución masiva de 500 publicaciones diarias",
        detail:
          "Puedes tener desde 1 hasta 8 campañas activas al mismo tiempo. Por ejemplo, con 5 campañas activas de diferentes servicios, cada campaña dispara 100 publicaciones diarias en los grupos que le asignes.",
      },
      {
        title: "Rotación con 3 Cuentas de Telegram + Granja OttBot",
        detail:
          "Conecta hasta 3 números propios o apóyate en nuestra flota de bots para cubrir decenas de grupos cada día en piloto automático 24/7.",
      },
    ],
  },
];

export default function ClientGuidePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<"CAMPAIGNS_SPLIT" | "EXTRA_ACCOUNTS" | "MODALITIES" | "ANTIBAN">("CAMPAIGNS_SPLIT");
  const [selectedPlanTab, setSelectedPlanTab] = useState<string>("express");

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

  const currentPlanInfo =
    PLAN_EXPLANATIONS.find((p) => p.id === selectedPlanTab) || PLAN_EXPLANATIONS[0];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? "bg-[#12151B] text-white" : "bg-[#E9ECF0] text-[#0F172A]"
    }`}>
      <ClientSidebar user={sessionUser} membership={membership} />

      <main className="flex-1 ml-64 p-6 sm:p-8 max-w-5xl w-full mx-auto">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Centro de Capacitación Oficial OttBot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Guía de Instrucciones & Condiciones del Servicio
          </h1>
          <p className={`text-xs font-semibold mt-1.5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
            Selecciona una pestaña para conocer cómo se dividen tus campañas, las condiciones de cobro de Cuentas Extra de Telegram y la eliminación de grupos con error.
          </p>
        </div>

        {/* TAGS / PESTAÑAS PRINCIPALES DE LA GUÍA */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveGuideTab("CAMPAIGNS_SPLIT")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
              activeGuideTab === "CAMPAIGNS_SPLIT"
                ? "bg-[#229ED9] text-white border-[#38BDF8] shadow-lg shadow-[#229ED9]/25"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 Campañas y Envíos por Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGuideTab("EXTRA_ACCOUNTS")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
              activeGuideTab === "EXTRA_ACCOUNTS"
                ? "bg-[#229ED9] text-white border-[#38BDF8] shadow-lg shadow-[#229ED9]/25"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📱 Condiciones de Cuentas Extra ($3 USD / Ciclo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGuideTab("MODALITIES")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
              activeGuideTab === "MODALITIES"
                ? "bg-[#229ED9] text-white border-[#38BDF8] shadow-lg shadow-[#229ED9]/25"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>🤖 Cuenta Propia vs. Granja OttBot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGuideTab("ANTIBAN")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
              activeGuideTab === "ANTIBAN"
                ? "bg-[#229ED9] text-white border-[#38BDF8] shadow-lg shadow-[#229ED9]/25"
                : isDark
                ? "bg-[#1E2229] border-[#2D3340] text-neutral-300 hover:text-white"
                : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>🛡️ Reglas Antibaneo y Grupos con Error</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: CÓMO SE DIVIDEN LAS CAMPAÑAS, GRUPOS Y PUBLICACIONES SEGÚN EL PLAN */}
        {activeGuideTab === "CAMPAIGNS_SPLIT" && (
          <div className="space-y-6">
            <div className={`rounded-3xl p-6 sm:p-7 border shadow-xl ${
              isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#229ED9] block">
                    Explicación Detallada por Membresía
                  </span>
                  <h2 className="text-lg font-black mt-0.5">
                    Selecciona tu Plan para ver cómo operan tus Campañas y Grupos:
                  </h2>
                </div>
              </div>

              {/* Sub-Tags para elegir cualquiera de los 4 planes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
                {PLAN_EXPLANATIONS.map((p) => {
                  const isSelected = selectedPlanTab === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanTab(p.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0E1420] border-[#229ED9] ring-2 ring-[#229ED9]/30 text-white shadow-lg"
                          : isDark
                          ? "bg-[#15181E] border-[#2D3340] text-neutral-400 hover:text-white"
                          : "bg-neutral-50 border-neutral-300 text-neutral-700"
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase block ${isSelected ? "text-[#38BDF8]" : ""}`}>
                        {p.tag}
                      </span>
                      <span className="text-sm font-black mt-0.5 block">{p.price}</span>
                      <span className="text-[11px] opacity-80 block mt-0.5">{p.dailyPosts}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tarjeta Explicativa del Plan Seleccionado */}
              <div className="rounded-2xl p-5 sm:p-6 bg-[#0E1420] border border-[#233047] text-white space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-black text-white">{currentPlanInfo.tag}</h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${currentPlanInfo.badgeBg}`}>
                        {currentPlanInfo.price}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentPlanInfo.summary}
                    </p>
                  </div>
                </div>

                {/* 4 Cajas de Capacidad del Plan */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#131B2A] border border-[#223049]">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Grupos de Destino
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 mt-1 block">
                      {currentPlanInfo.groups}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#131B2A] border border-[#223049]">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Publicaciones al Día
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#38BDF8] mt-1 block">
                      {currentPlanInfo.dailyPosts}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#131B2A] border border-[#223049]">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Campañas en Vivo
                    </span>
                    <span className="text-sm sm:text-base font-black text-white mt-1 block">
                      {currentPlanInfo.maxCampaigns}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#131B2A] border border-[#223049]">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Cuentas Telegram
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-400 mt-1 block">
                      {currentPlanInfo.accounts}
                    </span>
                  </div>
                </div>

                {/* Ejemplos Prácticos de División */}
                <div className="space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#38BDF8] block">
                    Ejemplos Reales de cómo se ejecutan tus campañas en este plan:
                  </span>
                  {currentPlanInfo.scenarios.map((sc, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#131B2A] border border-[#223049] space-y-1"
                    >
                      <div className="text-xs font-black text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{sc.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-6">
                        {sc.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Nota sobre Biblioteca Ilimitada de Copys */}
                <div className="p-4 rounded-xl bg-[#091E2E] border border-cyan-500/30 text-xs text-slate-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">
                      💡 Recuerda: Tu Biblioteca de Copys Guardados es Ilimitada
                    </strong>
                    Puedes crear y guardar 10, 20 o 50 copys diferentes en tu pestaña{" "}
                    <strong>"Mis Copys Guardados"</strong>. Cuando quieras rotar un producto por otro, simplemente pausas una campaña activa y activas otro copy de tu biblioteca con 1 clic.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA NUEVA: CONDICIONES DE CUENTAS ADICIONALES DE TELEGRAM */}
        {activeGuideTab === "EXTRA_ACCOUNTS" && (
          <div className={`rounded-3xl p-6 sm:p-7 border shadow-xl space-y-5 ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Reglas Oficiales de Multi-Cuenta
              </span>
              <h2 className="text-lg font-black mt-0.5">
                ¿Cómo funcionan las Cuentas Extras de Telegram y cómo se cobran?
              </h2>
              <p className={`text-xs leading-relaxed mt-1 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Lee detenidamente las condiciones de funcionamiento y facturación por ciclo cuando agregas números adicionales de Telegram a tu panel:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0E1420] border border-[#233047] text-white space-y-2">
                <div className="text-xs font-black text-[#38BDF8] uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>1. Grupos Independientes + Capacidad Extra</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cuando vinculas una <strong>Cuenta Adicional de Telegram ($3.00 USD)</strong>, ese segundo o tercer número escanea sus propios grupos independientes. Además, durante el ciclo activo te suma automáticamente <strong>+25 grupos adicionales de destino</strong> y <strong>+100 publicaciones diarias extra</strong> para que publiques copys diferentes en los grupos de cada cuenta.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0E1420] border border-amber-500/40 text-white space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>2. Cobro por Ciclo de Membresía (No es Pago Único Vitalicio)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  El valor de <strong>$3.00 USD por Cuenta Extra</strong> cubre la vigencia del ciclo de tu plan actual. <strong>No es un pago único permanente:</strong> si tienes el Pase Express de 1 Día y activas una Cuenta Extra, dicha cuenta extra dura ese ciclo. Al renovar el plan en el siguiente ciclo, debes cubrir nuevamente la Cuenta Extra (o subir al <strong>Plan Quincenal $13.50</strong> o <strong>Plan Mensual $24.00</strong> que ya incluyen <strong>2 y 3 cuentas de Telegram</strong> dentro de su precio).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0E1420] border border-[#233047] text-white space-y-2">
                <div className="text-xs font-black text-emerald-400 uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>3. Renovación Automática con tu Wallet</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Al cumplirse la fecha de vencimiento de tu membresía, si cuentas con saldo suficiente en tu Wallet para cubrir tu <strong>Plan + tus Cuentas Extra</strong>, el sistema renueva todo automáticamente sin detener tus campañas.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0E1420] border border-[#233047] text-white space-y-2">
                <div className="text-xs font-black text-purple-400 uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>4. ¿Qué ocurre si renuevo solo el Plan Básico sin la Cuenta Extra?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Si al iniciar un nuevo ciclo solo pagas el Pase Express (1 Día) o Semanal (7 Días) básico sin el adicional de Cuenta Extra, tu cuenta volverá al cupo base de <strong>1 Cuenta de Telegram (25 o 50 grupos)</strong> y las cuentas adicionales quedarán en pausa con candado (<code>🔒</code>) hasta que actives el cupo extra o subas de membresía.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: DOS MODALIDADES (CUENTA PROPIA VS GRANJA) */}
        {activeGuideTab === "MODALITIES" && (
          <div className={`rounded-3xl p-7 border shadow-xl ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
              <Bot className="w-5 h-5 text-[#229ED9]" />
              <span>Dos Formas de Publicar: Tu Cuenta Propia vs. Granja OttBot</span>
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Sin intermediarios:</strong> Se usa el número de Telegram que vinculaste en tu panel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Detección automática de grupos:</strong> Escanea y selecciona con un clic los grupos donde ya estás unido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Opción Multicuenta (+1 Cuenta por $3 USD / ciclo):</strong> Puedes agregar un 2do o 3er número con sus propios grupos independientes (+25 grupos y +100 envíos extra).</span>
                  </li>
                </ul>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 font-black text-sm text-emerald-500 mb-2">
                  <Bot className="w-4 h-4" />
                  <span>Opción B: Activar Granja OttBot</span>
                </div>
                <ul className={`text-xs space-y-2 leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Cero riesgo para tu número personal:</strong> Publican nuestros robots verificados de la flota OttBot.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Rotación inteligente entre bots:</strong> Si la granja cuenta con múltiples bots activos, se reparten los grupos entre toda la flota.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span><strong>Tráfico directo a tu @usuario:</strong> Coloca tu @usuario o link de canal en el copy para que todos los interesados te escriban a ti.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 3: PROTOCOLO ANTIBANEO Y ELIMINACIÓN DE GRUPOS CON ERROR */}
        {activeGuideTab === "ANTIBAN" && (
          <div className={`rounded-3xl p-7 border shadow-xl space-y-5 ${
            isDark ? "bg-[#1E2229] border-[#2D3340]" : "bg-white border-neutral-300"
          }`}>
            <div>
              <h2 className="text-base font-black flex items-center gap-2.5 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Protocolo de Seguridad Antibaneo y Control de Grupos con Error</span>
              </h2>
              <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                Para proteger tus cuentas de Telegram y los bots de nuestra Granja frente a bloqueos (<code>FLOOD_WAIT</code>), aplicamos las siguientes reglas:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase mb-2">
                  <Clock className="w-4 h-4" />
                  <span>1. Conteo Regresivo de 60s</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Al publicar en el Grupo #1, la barra de progreso inicia un conteo regresivo de <strong>60s hasta 0s</strong>. Solo cuando llega a <strong>0s</strong> publica en el Grupo #2 y vuelve a llenarse a 60s.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-[#171A20] border-[#2D3340]" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2 text-[#229ED9] font-black text-xs uppercase mb-2">
                  <Clock className="w-4 h-4" />
                  <span>2. Descanso de Seguridad</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                  Cuando todos los grupos de la ronda fueron enviados (ej. 25 de 25), la campaña pasa a <strong>"Ronda Completada · Descanso de Seguridad"</strong> durante los 60 o 120 minutos configurados.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? "bg-red-950/20 border-red-500/40" : "bg-red-50 border-red-300"
              }`}>
                <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Eliminar Grupos con Error</span>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                  Si un grupo restringe mensajes o arroja error al publicar, tu panel mostrará una alerta roja (<strong>"⚠️ Grupo con error detectado"</strong>). Debes pulsar <strong>"Eliminar Grupo de la Campaña"</strong> de inmediato para evitar bloqueos en tu cuenta o en nuestra Granja.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
