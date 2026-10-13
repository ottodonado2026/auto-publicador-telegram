"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
  Send, ShieldCheck, Zap, Clock, Users, Globe, CheckCircle2,
  ArrowRight, Sparkles, Layers, BarChart3, Lock, RefreshCw,
  Sun, Moon, ChevronDown, Flame, Award, MessageSquare, HelpCircle, Play
} from "lucide-react";
import GalaxyBackground from "@/components/GalaxyBackground";

type LangCode = "es" | "en" | "pt" | "fr";

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // 1 USD = rate
  decimals: number;
}

const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "USD - Dólar (EE.UU. / PR / EC / PA)", flag: "🇺🇸", rate: 1, decimals: 2 },
  { code: "EUR", symbol: "€", name: "EUR - Euro (España / Europa)", flag: "🇪🇺", rate: 0.92, decimals: 2 },
  { code: "COP", symbol: "$", name: "COP - Peso Colombiano (Colombia)", flag: "🇨🇴", rate: 4150, decimals: 0 },
  { code: "MXN", symbol: "$", name: "MXN - Peso Mexicano (México)", flag: "🇲🇽", rate: 19.8, decimals: 2 },
  { code: "ARS", symbol: "$", name: "ARS - Peso Argentino (Argentina)", flag: "🇦🇷", rate: 1180, decimals: 0 },
  { code: "CLP", symbol: "$", name: "CLP - Peso Chileno (Chile)", flag: "🇨🇱", rate: 960, decimals: 0 },
  { code: "PEN", symbol: "S/", name: "PEN - Sol Peruano (Perú)", flag: "🇵🇪", rate: 3.75, decimals: 2 },
  { code: "BRL", symbol: "R$", name: "BRL - Real Brasileño (Brasil)", flag: "🇧🇷", rate: 5.75, decimals: 2 },
  { code: "UYU", symbol: "$U", name: "UYU - Peso Uruguayo (Uruguay)", flag: "🇺🇾", rate: 42.5, decimals: 0 },
  { code: "PYG", symbol: "₲", name: "PYG - Guaraní (Paraguay)", flag: "🇵🇾", rate: 7850, decimals: 0 },
  { code: "CRC", symbol: "₡", name: "CRC - Colón (Costa Rica)", flag: "🇨🇷", rate: 515, decimals: 0 },
  { code: "VES", symbol: "Bs.", name: "VES - Bolívar (Venezuela)", flag: "🇻🇪", rate: 65, decimals: 2 },
  { code: "DOP", symbol: "RD$", name: "DOP - Peso Dominicano (Rep. Dom.)", flag: "🇩🇴", rate: 60.5, decimals: 0 },
  { code: "GTQ", symbol: "Q", name: "GTQ - Quetzal (Guatemala)", flag: "🇬🇹", rate: 7.75, decimals: 2 },
  { code: "BOB", symbol: "Bs", name: "BOB - Boliviano (Bolivia)", flag: "🇧🇴", rate: 6.95, decimals: 2 },
];

const TRANSLATIONS: Record<LangCode, any> = {
  es: {
    langLabel: "Español",
    nav: {
      howItWorks: "Cómo Funciona",
      modalities: "2 Modalidades",
      plans: "Planes y Precios",
      faq: "Preguntas",
      login: "Iniciar Sesión",
      freeTrial: "Crear Cuenta • 1 Día Gratis",
    },
    hero: {
      badge: "SISTEMA CLOUD 24/7 • FUNCIONA EN TODA LATINOAMÉRICA Y EL MUNDO",
      titleStart: "Multiplica tu alcance publicando tus ",
      titleHighlight: "Anuncios y Copys en Grupos de Telegram",
      titleEnd: " en Piloto Automático 24/7",
      subtitle:
        "Deja de perder horas copiando y pegando manualmente. OttBot PRO difunde tus anuncios, promociones y cualquier copy que desees en decenas de grupos de Telegram cada 60 segundos con protección Anti-Ban inteligente, incluso con tu PC o celular apagado.",
      ctaTrial: "Crear Cuenta e Iniciar Prueba Gratis de 1 Día",
      ctaLogin: "Ya tengo cuenta • Iniciar Sesión",
      trust1: "Sin tarjeta de crédito para tu prueba",
      trust2: "Funciona en cualquier país del mundo",
      trust3: "Intervalos reales de 60s + Descanso Anti-Ban",
    },
    stats: {
      users: "+240 Usuarios Activos",
      usersSub: "Publicando anuncios en Latinoamérica, EE.UU. y Europa",
      posts: "+68,000 Copys Enviados",
      postsSub: "Difusión automática en grupos 24/7 sin interrupciones",
      safety: "99.9% Seguridad Anti-Ban",
      safetySub: "Ciclo inteligente de 60s y enfriamiento cada 10 grupos",
    },
    liveSimulator: {
      tag: "SIMULADOR EN VIVO DEL PANEL DEL USUARIO",
      title: "Control Total en Tiempo Real: Conteo Regresivo de 60s, Descanso y Métricas por Grupo",
      desc: "Observa exactamente cómo trabajará tu autopublicador dentro de tu portal: la barra de progreso descuenta de 60s a 0s, dispara tu copy en el siguiente grupo y registra cada envío y clic en tu enlace.",
      activeBadge: "ACTIVA 24/7 • AUTO-LOOP",
      nextPost: "PRÓXIMO ENVÍO EN",
      cooldownBadge: "Descanso Anti-Ban tras cada 10 grupos",
      groupsSelected: "25 Grupos Vinculados",
      dailyGoal: "Meta: 100 Envíos / Día",
      recentGroupsTitle: "Últimos Grupos donde se publicó tu Copy:",
      clicksLabel: "clics al enlace",
      postsLabel: "envíos hoy",
    },
    whyUs: {
      tag: "¿POR QUÉ CONTRATAR OTTBOT PRO?",
      title: "La ventaja competitiva para dominar los grupos de Telegram sin esfuerzo manual",
      subtitle:
        "Mientras otros publican 2 o 3 veces al día a mano y se cansan, nuestro motor en la nube posiciona tus anuncios hasta 500 veces al día en los mejores horarios.",
      cards: [
        {
          title: "100% en la Nube (Apaga tu PC o Celular)",
          desc: "Tus campañas siguen publicándose las 24 horas en nuestros servidores dedicados sin gastar tu batería ni tus datos móviles.",
        },
        {
          title: "Cualquier Anuncio, Copy + Imagen + Enlace",
          desc: "Diseña copys persuasivos con emojis, sube la imagen promocional de tu oferta y añade tu enlace directo a WhatsApp, Telegram o sitio web con rastreo de clics.",
        },
        {
          title: "División Inteligente de Campañas y Grupos",
          desc: "Vincula los grupos que desees a cada campaña. El sistema reparte tus publicaciones diarias equitativamente entre tus campañas activas y sus grupos seleccionados.",
        },
        {
          title: "Compatible con Todo el Mundo y Latinoamérica",
          desc: "Admite números de Telegram de cualquier código de país (+57, +54, +52, +56, +51, +55, +598, +595, +58, +506, +1, +34 y más).",
        },
      ],
    },
    modalities: {
      tag: "TÚ ELIGES CÓMO PUBLICAR",
      title: "2 Modalidades Potentes incluidas en tu cuenta",
      subtitle:
        "En cada campaña puedes elegir si deseas emitir tus copys usando tus propias cuentas de Telegram o delegar el envío a nuestra Granja Verificada.",
      mod1Badge: "MODALIDAD 1 • CONEXIÓN DIRECTA MTPROTO",
      mod1Title: "Publica con tu Propia Cuenta de Telegram (Multi-Cuenta)",
      mod1Desc:
        "Vincula tu número de Telegram en segundos con código oficial OTP. El sistema escanea automáticamente todos los grupos donde ya eres miembro para que elijas en cuáles publicar.",
      mod1Bullets: [
        "Escaneo en vivo de todos los grupos donde estás unido.",
        "Los mensajes salen con tu propio nombre y perfil de Telegram.",
        "Conecta hasta 2 o 3 cuentas de Telegram en rotación según tu plan.",
        "¿Necesitas más capacidad? Adiciona cuentas extra (+25 grupos y +100 envíos/día) por $3.00 USD por ciclo.",
      ],
      mod2Badge: "MODALIDAD 2 • CERO RIESGO PERSONAL",
      mod2Title: "Publica con Nuestra Granja Verificada OttBot 24/7",
      mod2Desc:
        "¿No quieres usar tu número personal o apenas estás empezando? Activa el envío mediante nuestra Granja de Cuentas y nuestros bots publicarán tu copy e imagen por ti.",
      mod2Bullets: [
        "Protección absoluta: tu cuenta personal ni siquiera interviene en el envío.",
        "Publicación garantizada 24/7 en los grupos de difusión de la granja.",
        "Ideal para lanzar campañas en menos de 2 minutos tras registrarte.",
        "Rastreo exacto de cuántas personas hicieron clic en tu botón o enlace.",
      ],
    },
    plansSection: {
      tag: "PLANES FLEXIBLES Y TRANSPARENTES",
      title: "Elige tu Plan y Empieza a Publicar Hoy Mismo",
      subtitle:
        "Todos los precios están expresados por defecto en Dólares (USD) y puedes ver su conversión inmediata a la moneda de tu país. ¿Aún no estás seguro? ¡Crea tu cuenta e inicia con 1 Día de Prueba Gratis!",
      currencyLabel: "Moneda de visualización:",
      perPlan: "Pago por vigencia",
      groupsLimit: "Grupos de destino incluidos",
      campaignsLimit: "Campañas activas simultáneas",
      dailyPostsLimit: "Publicaciones automáticas / día",
      accountsLimit: "Cuenta(s) de Telegram en rotación",
      extraAccountNote: "Opción de adicionar cuenta extra de Telegram por solo",
      oneTimePayment: "Por Ciclo",
      extraBoxBadge: "CUENTAS ADICIONALES DE TELEGRAM • MULTI-CUENTA",
      extraBoxTitle: "¿Tienes varios números de Telegram con diferentes grupos?",
      extraBoxPriceSuffix: "/ ciclo del plan",
      extraBoxDesc:
        "En cualquier plan puedes vincular Cuentas Adicionales de Telegram. Cada cuenta extra escanea sus propios grupos de forma independiente y suma automáticamente +25 Grupos de Destino y +100 Publicaciones Automáticas al día durante la vigencia de tu plan activo.",
      extraBoxRule:
        "Condición de Renovación: El valor de la cuenta extra aplica por el ciclo de tu membresía activa. Si al vencer renuevas un plan básico de 1 o 7 días sin incluir la cuenta extra, el sistema mantendrá activa tu cuenta principal y pausará (🔒) las cuentas adicionales hasta que las renueves o adquieras el Plan Quincenal (incluye 2 cuentas) o Mensual (incluye 3 cuentas).",
      ctaSelect: "Comenzar con este Plan",
      ctaFreeTrialBannerTitle: "¿Quieres probar el sistema en vivo antes de recargar?",
      ctaFreeTrialBannerSub: "Regístrate ahora mismo en 30 segundos y activa tu Prueba Gratis de 1 Día con acceso real al panel.",
      ctaFreeTrialBannerBtn: "Crear Cuenta • Iniciar Prueba Gratis de 1 Día",
      plans: [
        {
          id: "1d",
          name: "Pase Express (1 Día)",
          duration: "24 Horas Activo",
          priceUSD: 1.50,
          groups: "25 Grupos de destino",
          campaigns: "2 Campañas activas",
          dailyPosts: "100 Publicaciones automáticas / día",
          accounts: "1 Cuenta de Telegram conectada",
          desc: "Ideal para probar el motor completo 24 horas o impulsar anuncios urgentes del día.",
          popular: false,
        },
        {
          id: "7d",
          name: "Plan Semanal (7 Días)",
          duration: "7 Días Continuos",
          priceUSD: 7.0,
          groups: "40 Grupos de destino",
          campaigns: "4 Campañas activas",
          dailyPosts: "200 Publicaciones automáticas / día",
          accounts: "1 Cuenta de Telegram conectada",
          desc: "Perfecto para mantener tus copys visibles toda la semana sin pausas.",
          popular: false,
        },
        {
          id: "15d",
          name: "Plan Quincenal PRO",
          duration: "15 Días Continuos",
          priceUSD: 13.5,
          groups: "60 Grupos de destino",
          campaigns: "6 Campañas activas",
          dailyPosts: "300 Publicaciones automáticas / día",
          accounts: "2 Cuentas de Telegram en rotación",
          desc: "El favorito: divide 300 envíos diarios entre hasta 6 campañas y 2 cuentas de Telegram.",
          popular: true,
        },
        {
          id: "30d",
          name: "Plan Mensual Élite",
          duration: "30 Días Continuos",
          priceUSD: 24.0,
          groups: "100 Grupos de destino",
          campaigns: "10 Campañas activas",
          dailyPosts: "500 Publicaciones automáticas / día",
          accounts: "3 Cuentas de Telegram en rotación",
          desc: "Máxima potencia 24/7 para dominar hasta 100 grupos con 500 publicaciones diarias.",
          popular: false,
        },
      ],
    },
    countriesSection: {
      title: "Disponible en toda Latinoamérica, Estados Unidos y Europa",
      subtitle:
        "Nuestro sistema opera 100% online y es compatible con cuentas de Telegram y grupos de cualquier país:",
    },
    faqSection: {
      tag: "PREGUNTAS FRECUENTES",
      title: "Todo lo que necesitas saber sobre OttBot PRO",
      items: [
        {
          q: "¿Cómo se dividen las publicaciones diarias entre mis campañas y grupos?",
          a: "Tu plan incluye un cupo total de publicaciones automáticas al día (por ejemplo, 100 en el Pase Express o 500 en el Mensual). Si tienes 1 campaña activa con 25 grupos, esa campaña se publicará 100 veces repartidas en esos 25 grupos. Si activas 2 campañas, las 100 publicaciones se dividen entre ambas campañas en rondas continuas cada 60 segundos.",
        },
        {
          q: "¿Cómo funcionan las Cuentas Adicionales de Telegram (+$3.00 USD por ciclo)?",
          a: "Si tienes varios números de Telegram con diferentes grupos, puedes adicionar cuentas extra por +$3.00 USD por ciclo de membresía. Cada cuenta extra escanea sus propios grupos por separado y te suma +25 grupos de destino y +100 publicaciones diarias adicionales durante la vigencia de tu plan.",
        },
        {
          q: "¿Cómo funciona el código único BOT-IXXXXXX para recargar mi Wallet?",
          a: "Al crear tu cuenta, el sistema te asigna automáticamente un código único en tu perfil (ejemplo: BOT-I482910). Con ese código puedes solicitar recargas de saldo en tu Wallet y activar cualquiera de los planes con 1 solo clic.",
        },
        {
          q: "¿Mi cuenta de Telegram está segura contra bloqueos?",
          a: "Sí. Nuestro motor respeta estrictamente un intervalo de 60 segundos reales entre grupo y grupo, y aplica un enfriamiento automático de seguridad tras cada 10 grupos publicados para simular comportamiento humano orgánico.",
        },
        {
          q: "¿Puedo usar el sistema desde cualquier país de Latinoamérica?",
          a: "¡Totalmente! Funciona en Colombia, México, Argentina, Chile, Uruguay, Paraguay, Venezuela, Costa Rica, Puerto Rico, Perú, Brasil, Ecuador, Panamá, EE.UU., España y cualquier país del mundo.",
        },
      ],
    },
    footer: {
      rights: "Todos los derechos reservados • Sistema Cloud de Auto-Publicación de Anuncios y Copys en Grupos de Telegram 24/7.",
    },
  },

  en: {
    langLabel: "English",
    nav: {
      howItWorks: "How It Works",
      modalities: "2 Modalities",
      plans: "Plans & Pricing",
      faq: "FAQ",
      login: "Sign In",
      freeTrial: "Create Account • 1-Day Free Trial",
    },
    hero: {
      badge: "24/7 CLOUD SYSTEM • WORKS ACROSS LATIN AMERICA, USA & WORLDWIDE",
      titleStart: "Skyrocket your reach by broadcasting your ",
      titleHighlight: "Ads & Copies to Telegram Groups",
      titleEnd: " on 24/7 Autopilot",
      subtitle:
        "Stop wasting hours copying and pasting manually. OttBot PRO broadcasts your ads, promotions, and any copy you want across dozens of Telegram groups every 60 seconds with smart Anti-Ban protection—even when your phone or PC is turned off.",
      ctaTrial: "Create Account & Start 1-Day Free Trial",
      ctaLogin: "Already have an account • Sign In",
      trust1: "No credit card required for trial",
      trust2: "Works in any country worldwide",
      trust3: "Real 60s intervals + Anti-Ban Cooldown",
    },
    stats: {
      users: "+240 Active Users",
      usersSub: "Broadcasting ads across Latin America, USA & Europe",
      posts: "+68,000 Copies Sent",
      postsSub: "Automated 24/7 group broadcasting without interruptions",
      safety: "99.9% Anti-Ban Safety",
      safetySub: "Smart 60s countdown cycle & cooldown every 10 groups",
    },
    liveSimulator: {
      tag: "LIVE USER DASHBOARD SIMULATOR",
      title: "Full Real-Time Control: 60s Countdown Bar, Cooldown & Per-Group Metrics",
      desc: "See exactly how your auto-publisher works inside your portal: the progress bar counts down from 60s to 0s, posts your copy to the next group, and logs every broadcast and link click.",
      activeBadge: "ACTIVE 24/7 • AUTO-LOOP",
      nextPost: "NEXT BROADCAST IN",
      cooldownBadge: "Anti-Ban Cooldown every 10 groups",
      groupsSelected: "25 Linked Groups",
      dailyGoal: "Goal: 100 Posts / Day",
      recentGroupsTitle: "Latest Groups where your Copy was published:",
      clicksLabel: "link clicks",
      postsLabel: "posts today",
    },
    whyUs: {
      tag: "WHY CHOOSE OTTBOT PRO?",
      title: "The unfair advantage to dominate Telegram groups without manual work",
      subtitle:
        "While others manually post 2 or 3 times a day and burn out, our cloud engine positions your ads up to 500 times a day around the clock.",
      cards: [
        {
          title: "100% Cloud-Based (Turn Off Your PC or Phone)",
          desc: "Your campaigns keep broadcasting 24/7 on our dedicated cloud servers without draining your battery or mobile data.",
        },
        {
          title: "Any Ad, Copy + Promotional Image + Tracked Link",
          desc: "Craft persuasive copies with emojis, upload your promotional image, and attach your WhatsApp, Telegram, or website link with real-time click tracking.",
        },
        {
          title: "Smart Campaign & Group Distribution",
          desc: "Assign specific groups to each campaign. The engine distributes your daily publications evenly across your active campaigns and their selected groups.",
        },
        {
          title: "Works Worldwide & Across All Latin America",
          desc: "Supports Telegram phone numbers from any country code (+1, +57, +54, +52, +56, +51, +55, +598, +595, +58, +506, +34, and more).",
        },
      ],
    },
    modalities: {
      tag: "CHOOSE HOW YOU BROADCAST",
      title: "2 Powerful Modalities Included in Your Account",
      subtitle:
        "For every campaign, you can choose whether to broadcast using your own Telegram accounts or delegate the delivery to our Verified Bot Farm.",
      mod1Badge: "MODALITY 1 • DIRECT MTPROTO CONNECTION",
      mod1Title: "Publish with Your Own Telegram Account (Multi-Account)",
      mod1Desc:
        "Link your Telegram phone number in seconds via official OTP code. The system automatically scans all groups you've joined so you can pick where to post.",
      mod1Bullets: [
        "Live scanning of all Telegram groups where you are a member.",
        "Messages are sent directly from your own Telegram profile.",
        "Connect up to 2 or 3 Telegram accounts in rotation depending on your plan.",
        "Need more capacity? Add extra Telegram accounts (+25 groups & +100 posts/day) for $3.00 USD per cycle.",
      ],
      mod2Badge: "MODALIDAD 2 • ZERO PERSONAL RISK",
      mod2Title: "Publish with Our Verified OttBot Farm 24/7",
      mod2Desc:
        "Don't want to use your personal number or just starting out? Enable our Verified Account Farm and our bots will broadcast your copy and image for you.",
      mod2Bullets: [
        "Complete protection: your personal Telegram account is never exposed.",
        "Guaranteed 24/7 publishing across our farm's broadcast groups.",
        "Launch your first ad campaign in under 2 minutes after signing up.",
        "Exact tracking of how many users clicked your link.",
      ],
    },
    plansSection: {
      tag: "FLEXIBLE & TRANSPARENT PRICING",
      title: "Pick Your Plan & Start Broadcasting Today",
      subtitle:
        "All prices default to US Dollars (USD) and can be converted instantly to your local currency above. Want to test it first? Create your account and start a 1-Day Free Trial!",
      currencyLabel: "Display Currency:",
      perPlan: "One-time period payment",
      groupsLimit: "Target groups included",
      campaignsLimit: "Simultaneous active campaigns",
      dailyPostsLimit: "Automated publications / day",
      accountsLimit: "Telegram account(s) in rotation",
      extraAccountNote: "Option to add an extra Telegram account for only",
      oneTimePayment: "Per Cycle",
      extraBoxBadge: "EXTRA TELEGRAM ACCOUNTS • MULTI-ACCOUNT EXPANSION",
      extraBoxTitle: "Have multiple Telegram numbers with different groups?",
      extraBoxPriceSuffix: "/ plan cycle",
      extraBoxDesc:
        "On any plan, you can link Extra Telegram Accounts. Each extra account independently scans its own groups and automatically adds +25 Target Groups and +100 Automated Daily Posts during your active plan cycle.",
      extraBoxRule:
        "Renewal Condition: The extra account fee applies per active membership cycle. If you later renew a basic 1-day or 7-day plan without the extra account, your primary account stays active while extra accounts are paused (🔒) until renewed or upgraded to the Biweekly (2 accounts) or Monthly (3 accounts) plan.",
      ctaSelect: "Start with this Plan",
      ctaFreeTrialBannerTitle: "Want to test the live system before topping up?",
      ctaFreeTrialBannerSub: "Sign up in 30 seconds and activate your 1-Day Free Trial with full dashboard access.",
      ctaFreeTrialBannerBtn: "Create Account • Start 1-Day Free Trial",
      plans: [
        {
          id: "1d",
          name: "Express Pass (1 Day)",
          duration: "24 Hours Active",
          priceUSD: 1.50,
          groups: "25 Target groups",
          campaigns: "2 Active campaigns",
          dailyPosts: "100 Automated posts / day",
          accounts: "1 Connected Telegram account",
          desc: "Ideal to test the full engine for 24 hours or boost urgent daily announcements.",
          popular: false,
        },
        {
          id: "7d",
          name: "Weekly Plan (7 Days)",
          duration: "7 Continuous Days",
          priceUSD: 7.0,
          groups: "40 Target groups",
          campaigns: "4 Active campaigns",
          dailyPosts: "200 Automated posts / day",
          accounts: "1 Connected Telegram account",
          desc: "Perfect to keep your copies and offers visible all week long without pauses.",
          popular: false,
        },
        {
          id: "15d",
          name: "Biweekly PRO Plan",
          duration: "15 Continuous Days",
          priceUSD: 13.5,
          groups: "60 Target groups",
          campaigns: "6 Active campaigns",
          dailyPosts: "300 Automated posts / day",
          accounts: "2 Telegram accounts in rotation",
          desc: "Most popular: split 300 daily posts across up to 6 campaigns and 2 Telegram accounts.",
          popular: true,
        },
        {
          id: "30d",
          name: "Monthly Elite Plan",
          duration: "30 Continuous Days",
          priceUSD: 24.0,
          groups: "100 Target groups",
          campaigns: "10 Active campaigns",
          dailyPosts: "500 Automated posts / day",
          accounts: "3 Telegram accounts in rotation",
          desc: "Maximum 24/7 power to dominate up to 100 groups with 500 daily broadcasts.",
          popular: false,
        },
      ],
    },
    countriesSection: {
      title: "Available Across All Latin America, United States & Europe",
      subtitle:
        "Our platform operates 100% in the cloud and works seamlessly with Telegram accounts and groups from any country:",
    },
    faqSection: {
      tag: "FREQUENTLY ASKED QUESTIONS",
      title: "Everything You Need to Know About OttBot PRO",
      items: [
        {
          q: "How are daily publications divided between my campaigns and groups?",
          a: "Your plan includes a daily quota of automated broadcasts (e.g., 100 in Express Pass or 500 in Monthly Elite). If you have 1 active campaign with 25 groups, that campaign will be published 100 times across those 25 groups. If you activate 2 campaigns, the 100 broadcasts are shared between both campaigns in continuous 60-second rounds.",
        },
        {
          q: "How do Extra Telegram Accounts (+$3.00 USD per cycle) work?",
          a: "If you have multiple Telegram numbers joined to different groups, you can add extra accounts for +$3.00 USD per membership cycle. Each extra account scans its own groups independently and adds +25 target groups and +100 daily broadcasts during your active plan.",
        },
        {
          q: "How does my unique BOT-IXXXXXX code work for Wallet top-ups?",
          a: "When you register, your profile automatically receives a unique code (e.g., BOT-I482910). Simply share your code with support/admin to have your Wallet credited instantly and activate any plan in one click.",
        },
        {
          q: "Is my Telegram account safe from bans?",
          a: "Yes. Our engine enforces a strict 60-second interval between each group post and triggers an automatic security cooldown every 10 groups to mimic natural human activity.",
        },
        {
          q: "Does it work in my country?",
          a: "Absolutely! OttBot PRO works in the USA, Puerto Rico, Colombia, Mexico, Argentina, Chile, Uruguay, Paraguay, Venezuela, Costa Rica, Peru, Brazil, Spain, and every country worldwide.",
        },
      ],
    },
    footer: {
      rights: "All rights reserved • 24/7 Cloud Auto-Publisher for Ads & Copies in Telegram Groups.",
    },
  },

  pt: {
    langLabel: "Português (BR/PT)",
    nav: {
      howItWorks: "Como Funciona",
      modalities: "2 Modalidades",
      plans: "Planos e Preços",
      faq: "Perguntas",
      login: "Entrar",
      freeTrial: "Criar Conta • 1 Dia Grátis",
    },
    hero: {
      badge: "SISTEMA CLOUD 24/7 • FUNCIONA NO BRASIL, AMÉRICA LATINA E NO MUNDO",
      titleStart: "Multiplique seu alcance publicando seus ",
      titleHighlight: "Anúncios e Copys em Grupos do Telegram",
      titleEnd: " no Piloto Automático 24/7",
      subtitle:
        "Pare de perder horas copiando e colando manualmente. O OttBot PRO divulga seus anúncios, promoções e qualquer copy que você quiser em dezenas de grupos do Telegram a cada 60 segundos com proteção Anti-Ban inteligente — mesmo com seu PC ou celular desligado.",
      ctaTrial: "Criar Conta e Iniciar Teste Grátis de 1 Dia",
      ctaLogin: "Já tenho conta • Entrar",
      trust1: "Sem cartão de crédito para testar",
      trust2: "Funciona em qualquer país do mundo",
      trust3: "Intervalos reais de 60s + Descanso Anti-Ban",
    },
    stats: {
      users: "+240 Usuários Ativos",
      usersSub: "Publicando anúncios no Brasil, América Latina, EUA e Europa",
      posts: "+68.000 Copys Enviados",
      postsSub: "Divulgação automática em grupos 24/7 sem interrupções",
      safety: "99.9% Segurança Anti-Ban",
      safetySub: "Ciclo inteligente de 60s e resfriamento a cada 10 grupos",
    },
    liveSimulator: {
      tag: "SIMULADOR AO VIVO DO PAINEL DO USUÁRIO",
      title: "Controle Total em Tempo Real: Contagem Regressiva de 60s, Descanso e Métricas por Grupo",
      desc: "Veja exatamente como seu autopublicador funciona no painel: a barra de progresso desce de 60s até 0s, dispara sua copy no próximo grupo e registra cada envio e clique no seu link.",
      activeBadge: "ATIVA 24/7 • AUTO-LOOP",
      nextPost: "PRÓXIMO ENVIO EM",
      cooldownBadge: "Descanso Anti-Ban a cada 10 grupos",
      groupsSelected: "25 Grupos Vinculados",
      dailyGoal: "Meta: 100 Envios / Dia",
      recentGroupsTitle: "Últimos Grupos onde sua Copy foi publicada:",
      clicksLabel: "cliques no link",
      postsLabel: "envios hoje",
    },
    whyUs: {
      tag: "POR QUE CONTRATAR O OTTBOT PRO?",
      title: "A vantagem competitiva para dominar os grupos do Telegram sem esforço manual",
      subtitle:
        "Enquanto outros publicam 2 ou 3 vezes por dia manualmente, nosso motor em nuvem posiciona seus anúncios até 500 vezes por dia automaticamente.",
      cards: [
        {
          title: "100% na Nuvem (Desligue seu PC ou Celular)",
          desc: "Suas campanhas continuam publicando 24 horas por dia em nossos servidores dedicados sem gastar sua bateria ou internet.",
        },
        {
          title: "Qualquer Anúncio, Copy + Imagem + Link Rastreável",
          desc: "Crie copys persuasivas com emojis, envie uma imagem promocional e adicione seu link do WhatsApp, Telegram ou site com contador de cliques.",
        },
        {
          title: "Divisão Inteligente de Campanhas e Grupos",
          desc: "Vincule os grupos desejados a cada campanha. O sistema divide suas publicações diárias entre suas campanhas ativas e seus grupos selecionados.",
        },
        {
          title: "Compatível com Brasil, América Latina e Mundo Todo",
          desc: "Aceita números de Telegram de qualquer DDI (+55, +351, +57, +54, +52, +56, +598, +595, +1 e mais).",
        },
      ],
    },
    modalities: {
      tag: "VOCÊ ESCOLHE COMO PUBLICAR",
      title: "2 Modalidades Poderosas incluídas na sua conta",
      subtitle:
        "Em cada campanha você pode escolher se deseja publicar usando suas próprias contas do Telegram ou usar nossa Fazenda Verificada.",
      mod1Badge: "MODALIDADE 1 • CONEXÃO DIRETA MTPROTO",
      mod1Title: "Publique com sua Própria Conta do Telegram (Multi-Contas)",
      mod1Desc:
        "Conecte seu número do Telegram em segundos com código oficial OTP. O sistema escaneia automaticamente todos os grupos em que você já participa.",
      mod1Bullets: [
        "Escaneamento ao vivo de todos os grupos onde você é membro.",
        "As mensagens saem com seu próprio nome e perfil do Telegram.",
        "Conecte até 2 ou 3 contas do Telegram em rotação conforme seu plano.",
        "Precisa de mais? Adicione contas extras (+25 grupos e +100 envios/dia) por $3.00 USD por ciclo.",
      ],
      mod2Badge: "MODALIDADE 2 • RISCO ZERO PESSOAL",
      mod2Title: "Publique com Nossa Fazenda Verificada OttBot 24/7",
      mod2Desc:
        "Não quer usar seu número pessoal? Ative o envio pela nossa Fazenda de Contas e nossos bots publicarão sua copy e imagem para você.",
      mod2Bullets: [
        "Proteção total: sua conta pessoal nem participa do envio.",
        "Publicação garantida 24/7 nos grupos de divulgação da fazenda.",
        "Ideal para lançar campanhas em menos de 2 minutos após o cadastro.",
        "Rastreamento exato de quantas pessoas clicaram no seu link.",
      ],
    },
    plansSection: {
      tag: "PLANOS FLEXÍVEIS E TRANSPARENTES",
      title: "Escolha seu Plano e Comece a Publicar Hoje Mesmo",
      subtitle:
        "Todos os preços têm como padrão o Dólar (USD) e você pode converter instantaneamente para Real (BRL), Euro (EUR) ou qualquer moeda da América Latina. Crie sua conta e ganhe 1 Dia de Teste Grátis!",
      currencyLabel: "Moeda de exibição:",
      perPlan: "Pagamento pelo período",
      groupsLimit: "Grupos de destino incluídos",
      campaignsLimit: "Campanhas ativas simultâneas",
      dailyPostsLimit: "Publicações automáticas / dia",
      accountsLimit: "Conta(s) do Telegram em rotação",
      extraAccountNote: "Opção de adicionar conta extra do Telegram por apenas",
      oneTimePayment: "Por Ciclo",
      extraBoxBadge: "CONTAS EXTRAS DO TELEGRAM • MULTI-CONTAS",
      extraBoxTitle: "Tem vários números do Telegram com grupos diferentes?",
      extraBoxPriceSuffix: "/ ciclo do plano",
      extraBoxDesc:
        "Em qualquer plano você pode vincular Contas Extras do Telegram. Cada conta extra escaneia seus próprios grupos separadamente e adiciona +25 Grupos de Destino e +100 Publicações Automáticas por dia durante a vigência do seu plano.",
      extraBoxRule:
        "Condição de Renovação: O valor da conta extra é válido pelo ciclo do plano ativo. Ao renovar um plano básico de 1 ou 7 dias sem incluir a conta extra, sua conta principal segue ativa e as contas extras ficam pausadas (🔒) até serem renovadas ou migradas para o Plano Quinzenal (2 contas) ou Mensal (3 contas).",
      ctaSelect: "Começar com este Plano",
      ctaFreeTrialBannerTitle: "Quer testar o sistema ao vivo antes de recarregar?",
      ctaFreeTrialBannerSub: "Cadastre-se agora em 30 segundos e ative seu Teste Grátis de 1 Dia com acesso real ao painel.",
      ctaFreeTrialBannerBtn: "Criar Conta • Iniciar Teste Grátis de 1 Dia",
      plans: [
        {
          id: "1d",
          name: "Passe Express (1 Dia)",
          duration: "24 Horas Ativo",
          priceUSD: 1.50,
          groups: "25 Grupos de destino",
          campaigns: "2 Campanhas ativas",
          dailyPosts: "100 Publicações automáticas / dia",
          accounts: "1 Conta do Telegram conectada",
          desc: "Ideal para testar o motor completo por 24 horas ou impulsionar anúncios urgentes.",
          popular: false,
        },
        {
          id: "7d",
          name: "Plano Semanal (7 Dias)",
          duration: "7 Dias Contínuos",
          priceUSD: 7.0,
          groups: "40 Grupos de destino",
          campaigns: "4 Campanhas ativas",
          dailyPosts: "200 Publicações automáticas / dia",
          accounts: "1 Conta do Telegram conectada",
          desc: "Perfeito para manter suas copys visíveis a semana inteira sem pausas.",
          popular: false,
        },
        {
          id: "15d",
          name: "Plano Quinzenal PRO",
          duration: "15 Dias Contínuos",
          priceUSD: 13.5,
          groups: "60 Grupos de destino",
          campaigns: "6 Campanhas ativas",
          dailyPosts: "300 Publicações automáticas / dia",
          accounts: "2 Contas do Telegram em rotação",
          desc: "O mais escolhido: divida 300 envios diários entre até 6 campanhas e 2 contas do Telegram.",
          popular: true,
        },
        {
          id: "30d",
          name: "Plano Mensal Elite",
          duration: "30 Dias Contínuos",
          priceUSD: 24.0,
          groups: "100 Grupos de destino",
          campaigns: "10 Campanhas ativas",
          dailyPosts: "500 Publicações automáticas / dia",
          accounts: "3 Contas do Telegram em rotação",
          desc: "Potência máxima 24/7 para dominar até 100 grupos com 500 publicações diárias.",
          popular: false,
        },
      ],
    },
    countriesSection: {
      title: "Disponível no Brasil, Portugal, toda a América Latina, EUA e Europa",
      subtitle:
        "Nosso sistema opera 100% online e funciona com contas e grupos do Telegram de qualquer país:",
    },
    faqSection: {
      tag: "PERGUNTAS FRECUENTES",
      title: "Tudo o que você precisa saber sobre o OttBot PRO",
      items: [
        {
          q: "Como as publicações diárias são divididas entre minhas campanhas e grupos?",
          a: "Seu plano inclui uma cota diária de envios automáticos (ex.: 100 no Passe Express ou 500 no Mensal). Se você tiver 1 campanha ativa com 25 grupos, ela será publicada 100 vezes nesses 25 grupos. Se ativar 2 campanhas, os 100 envios serão divididos entre ambas em rodadas a cada 60 segundos.",
        },
        {
          q: "Como funcionam as Contas Extras do Telegram (+$3.00 USD por ciclo)?",
          a: "Se você tem vários números do Telegram em grupos diferentes, pode adicionar contas extras por +$3.00 USD por ciclo de assinatura. Cada conta extra escaneia seus próprios grupos e soma +25 grupos de destino e +100 envios diários durante a vigência do plano.",
        },
        {
          q: "Como funciona meu código único BOT-IXXXXXX para recarregar a Wallet?",
          a: "Ao criar sua conta, seu perfil gera automaticamente um código único (ex.: BOT-I482910). Basta informar esse código ao suporte/administrador para receber saldo na sua Wallet instantaneamente.",
        },
        {
          q: "Minha conta do Telegram está segura contra bloqueios?",
          a: "Sim. Nosso motor respeita um intervalo real de 60 segundos entre cada grupo e aplica um descanso automático de segurança a cada 10 grupos publicados.",
        },
        {
          q: "Funciona no Brasil e em qualquer país da América Latina?",
          a: "Com certeza! Funciona perfeitamente no Brasil, Portugal, Colômbia, México, Argentina, Chile, Uruguai, Paraguai, Venezuela, Costa Rica, Porto Rico, EUA e em todo o mundo.",
        },
      ],
    },
    footer: {
      rights: "Todos os direitos reservados • Sistema Cloud de Auto-Publicação de Anúncios e Copys em Grupos do Telegram 24/7.",
    },
  },

  fr: {
    langLabel: "Français",
    nav: {
      howItWorks: "Fonctionnement",
      modalities: "2 Modalités",
      plans: "Tarifs & Offres",
      faq: "FAQ",
      login: "Connexion",
      freeTrial: "Créer un Compte • 1 Jour Gratuit",
    },
    hero: {
      badge: "SYSTÈME CLOUD 24/7 • DISPONIBLE EN AMÉRIQUE LATINE, EUROPE & MONDE ENTIER",
      titleStart: "Multipliez votre portée en publiant vos ",
      titleHighlight: "Annonces et Copys dans les Groupes Telegram",
      titleEnd: " en Pilote Automatique 24/7",
      subtitle:
        "Ne perdez plus des heures à copier-coller manuellement. OttBot PRO diffuse vos annonces, promotions et n'importe quel copy dans des dizaines de groupes Telegram toutes les 60 secondes avec protection Anti-Ban intelligente, même lorsque votre PC ou téléphone est éteint.",
      ctaTrial: "Créer un Compte & Démarrer l'Essai Gratuit d'1 Jour",
      ctaLogin: "J'ai déjà un compte • Connexion",
      trust1: "Aucune carte bancaire requise",
      trust2: "Fonctionne dans tous les pays du monde",
      trust3: "Intervalle réel de 60s + Pause Anti-Ban",
    },
    stats: {
      users: "+240 Utilisateurs Actifs",
      usersSub: "Diffusion d'annonces en Amérique Latine, USA et Europe",
      posts: "+68 000 Copys Envoyés",
      postsSub: "Publication automatique 24/7 dans les groupes sans interruption",
      safety: "99.9% Sécurité Anti-Ban",
      safetySub: "Cycle intelligent de 60s et refroidissement tous les 10 groupes",
    },
    liveSimulator: {
      tag: "SIMULATEUR EN DIRECT DU PORTAIL CLIENT",
      title: "Contrôle Total en Temps Réel : Compte à Rebours 60s, Pause & Statistiques par Groupe",
      desc: "Découvrez exactement comment votre auto-publieur fonctionne dans votre portail : la barre descend de 60s à 0s, publie votre copy dans le groupe suivant et comptabilise chaque envoi et clic.",
      activeBadge: "ACTIF 24/7 • AUTO-LOOP",
      nextPost: "PROCHAIN ENVOI DANS",
      cooldownBadge: "Pause Anti-Ban tous les 10 groupes",
      groupsSelected: "25 Groupes Liés",
      dailyGoal: "Objectif : 100 Envois / Jour",
      recentGroupsTitle: "Derniers Groupes où votre Copy a été publié :",
      clicksLabel: "clics sur le lien",
      postsLabel: "envois aujourd'hui",
    },
    whyUs: {
      tag: "POURQUOI CHOISIR OTTBOT PRO ?",
      title: "L'avantage décisif pour dominer les groupes Telegram sans effort manuel",
      subtitle:
        "Pendant que d'autres publient 2 ou 3 fois par jour à la main, notre moteur cloud positionne vos annonces jusqu'à 500 fois par jour automatiquement.",
      cards: [
        {
          title: "100% dans le Cloud (Éteignez votre PC ou Téléphone)",
          desc: "Vos campagnes continuent d'être diffusées 24h/24 sur nos serveurs dédiés sans consommer votre batterie ni vos données mobiles.",
        },
        {
          title: "Toute Annonce, Copy + Image + Lien Suivi",
          desc: "Rédigez des copys persuasifs avec emojis, ajoutez une image promotionnelle et insérez votre lien WhatsApp, Telegram ou site web avec suivi des clics.",
        },
        {
          title: "Répartition Intelligente des Campagnes et Groupes",
          desc: "Associez les groupes de votre choix à chaque campagne. Le système répartit vos publications quotidiennes entre vos campagnes actives et leurs groupes.",
        },
        {
          title: "Compatible dans le Monde Entier et en Amérique Latine",
          desc: "Prend en charge les numéros Telegram de tous les pays (+33, +1, +57, +54, +52, +56, +55, +34 et plus).",
        },
      ],
    },
    modalities: {
      tag: "CHOISISSEZ VOTRE MODE DE DIFFUSION",
      title: "2 Modalités Puissantes incluses dans votre compte",
      subtitle:
        "Pour chaque campagne, choisissez de publier avec vos propres comptes Telegram ou de déléguer l'envoi à notre Ferme Vérifiée.",
      mod1Badge: "MODALITÉ 1 • CONNEXION DIRECTE MTPROTO",
      mod1Title: "Publiez avec Votre Propre Compte Telegram (Multi-Comptes)",
      mod1Desc:
        "Connectez votre numéro Telegram en quelques secondes par code officiel OTP. Le système détecte automatiquement tous les groupes dont vous êtes membre.",
      mod1Bullets: [
        "Détection en direct de tous vos groupes Telegram.",
        "Les messages sont envoyés sous votre propre profil Telegram.",
        "Connectez jusqu'à 2 ou 3 comptes Telegram en rotation selon votre offre.",
        "Ajoutez des comptes supplémentaires (+25 groupes & +100 envois/jour) pour 3,00 $ USD par cycle.",
      ],
      mod2Badge: "MODALITÉ 2 • ZÉRO RISQUE PERSONNEL",
      mod2Title: "Publiez avec Notre Ferme Vérifiée OttBot 24/7",
      mod2Desc:
        "Vous ne souhaitez pas utiliser votre numéro personnel ? Activez notre Ferme de Comptes et nos bots diffuseront votre copy et votre image pour vous.",
      mod2Bullets: [
        "Protection totale : votre compte personnel n'est jamais exposé.",
        "Diffusion garantie 24/7 dans les groupes de notre ferme.",
        "Idéal pour lancer vos annonces en moins de 2 minutes après l'inscription.",
        "Suivi précis du nombre de clics sur votre lien.",
      ],
    },
    plansSection: {
      tag: "TARIFS FLEXIBLES ET TRANSPARENTS",
      title: "Choisissez Votre Offre & Commencez à Publier Aujourd'hui",
      subtitle:
        "Tous les prix sont affichés par défaut en Dollars (USD) et peuvent être convertis instantanément en Euros (EUR) ou dans toutes les devises d'Amérique Latine. Créez votre compte et profitez d'1 Jour d'Essai Gratuit !",
      currencyLabel: "Devise d'affichage :",
      perPlan: "Paiement pour la période",
      groupsLimit: "Groupes cibles inclus",
      campaignsLimit: "Campagnes actives simultanées",
      dailyPostsLimit: "Publications automatiques / jour",
      accountsLimit: "Compte(s) Telegram en rotation",
      extraAccountNote: "Option d'ajout de compte Telegram supplémentaire pour seulement",
      oneTimePayment: "Par Cycle",
      extraBoxBadge: "COMPTES TELEGRAM SUPPLÉMENTAIRES • MULTI-COMPTES",
      extraBoxTitle: "Vous avez plusieurs numéros Telegram avec différents groupes ?",
      extraBoxPriceSuffix: "/ cycle de l'offre",
      extraBoxDesc:
        "Dans chaque offre, vous pouvez lier des Comptes Telegram Supplémentaires. Chaque compte extra analyse ses propres groupes séparément et ajoute +25 Groupes Cibles et +100 Publications Automatiques par jour pendant la durée de votre offre.",
      extraBoxRule:
        "Condition de Renouvellement : Le tarif du compte supplémentaire s'applique par cycle d'abonnement actif. En cas de renouvellement d'une offre 1 ou 7 jours sans le compte extra, votre compte principal reste actif et les comptes supplémentaires sont mis en pause (🔒) jusqu'à leur renouvellement.",
      ctaSelect: "Choisir cette Offre",
      ctaFreeTrialBannerTitle: "Vous voulez tester le système en direct avant de recharger ?",
      ctaFreeTrialBannerSub: "Inscrivez-vous en 30 secondes et activez votre Essai Gratuit d'1 Jour avec accès complet au portail.",
      ctaFreeTrialBannerBtn: "Créer un Compte • Essai Gratuit d'1 Jour",
      plans: [
        {
          id: "1d",
          name: "Pass Express (1 Jour)",
          duration: "24 Heures Actif",
          priceUSD: 1.50,
          groups: "25 Groupes cibles",
          campaigns: "2 Campagnes actives",
          dailyPosts: "100 Publications automatiques / jour",
          accounts: "1 Compte Telegram connecté",
          desc: "Idéal pour tester le moteur complet pendant 24h ou booster des annonces urgentes.",
          popular: false,
        },
        {
          id: "7d",
          name: "Offre Hebdomadaire (7 Jours)",
          duration: "7 Jours Continus",
          priceUSD: 7.0,
          groups: "40 Groupes cibles",
          campaigns: "4 Campagnes actives",
          dailyPosts: "200 Publications automatiques / jour",
          accounts: "1 Compte Telegram connecté",
          desc: "Parfait pour garder vos copys visibles toute la semaine sans interruption.",
          popular: false,
        },
        {
          id: "15d",
          name: "Offre Quinzaine PRO",
          duration: "15 Jours Continus",
          priceUSD: 13.5,
          groups: "60 Groupes cibles",
          campaigns: "6 Campagnes actives",
          dailyPosts: "300 Publications automatiques / jour",
          accounts: "2 Comptes Telegram en rotation",
          desc: "Le plus populaire : répartissez 300 envois quotidiens sur 6 campagnes et 2 comptes Telegram.",
          popular: true,
        },
        {
          id: "30d",
          name: "Offre Mensuelle Élite",
          duration: "30 Jours Continus",
          priceUSD: 24.0,
          groups: "100 Groupes cibles",
          campaigns: "10 Campagnes actives",
          dailyPosts: "500 Publications automatiques / jour",
          accounts: "3 Comptes Telegram en rotation",
          desc: "Puissance maximale 24/7 pour dominer jusqu'à 100 groupes avec 500 publications par jour.",
          popular: false,
        },
      ],
    },
    countriesSection: {
      title: "Disponible dans toute l'Amérique Latine, aux États-Unis et en Europe",
      subtitle:
        "Notre système fonctionne 100% en ligne avec les comptes et groupes Telegram de tous les pays :",
    },
    faqSection: {
      tag: "QUESTIONS FRÉQUENTES",
      title: "Tout savoir sur OttBot PRO",
      items: [
        {
          q: "Comment les publications quotidiennes sont-elles réparties entre mes campagnes et groupes ?",
          a: "Votre offre inclut un quota quotidien d'envois automatiques (ex. 100 dans le Pass Express ou 500 dans l'Offre Mensuelle). Si vous avez 1 campagne active avec 25 groupes, elle sera publiée 100 fois dans ces 25 groupes. Si vous activez 2 campagnes, les 100 publications sont partagées entre les deux campagnes toutes les 60 secondes.",
        },
        {
          q: "Comment fonctionnent les Comptes Telegram Supplémentaires (+3,00 $ USD par cycle) ?",
          a: "Si vous possédez plusieurs numéros Telegram ayant rejoint différents groupes, vous pouvez ajouter des comptes supplémentaires pour +3,00 $ USD par cycle. Chaque compte analyse ses propres groupes et ajoute +25 groupes cibles et +100 publications quotidiennes pendant la durée de votre offre.",
        },
        {
          q: "Comment fonctionne mon code unique BOT-IXXXXXX pour recharger mon Wallet ?",
          a: "Dès votre inscription, votre profil reçoit un code unique (ex. BOT-I482910). Communiquez simplement ce code au support/administrateur pour créditer votre Wallet instantanément.",
        },
        {
          q: "Mon compte Telegram est-il protégé contre les blocages ?",
          a: "Oui. Notre moteur respecte un intervalle strict de 60 secondes entre chaque groupe et applique une pause de sécurité automatique tous les 10 groupes publiés.",
        },
        {
          q: "Puis-je utiliser le système depuis n'importe quel pays ?",
          a: "Absolument ! Il fonctionne en France, Espagne, États-Unis, Colombie, Mexique, Argentine, Chili, Uruguay, Paraguay, Venezuela, Costa Rica, Porto Rico, Brésil et dans le monde entier.",
        },
      ],
    },
    footer: {
      rights: "Tous droits réservés • Système Cloud d'Auto-Publication d'Annonces et Copys dans les Groupes Telegram 24/7.",
    },
  },
};

const SUPPORTED_COUNTRIES = [
  { flag: "🇺🇸", name: "Estados Unidos & Puerto Rico" },
  { flag: "🇨🇴", name: "Colombia" },
  { flag: "🇲🇽", name: "México" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇨🇱", name: "Chile" },
  { flag: "🇺🇾", name: "Uruguay" },
  { flag: "🇵🇾", name: "Paraguay" },
  { flag: "🇻🇪", name: "Venezuela" },
  { flag: "🇨🇷", name: "Costa Rica" },
  { flag: "🇵🇪", name: "Perú" },
  { flag: "🇧🇷", name: "Brasil" },
  { flag: "🇪🇨", name: "Ecuador" },
  { flag: "🇵🇦", name: "Panamá" },
  { flag: "🇩🇴", name: "Rep. Dominicana" },
  { flag: "🇬🇹", name: "Guatemala" },
  { flag: "🇧🇴", name: "Bolivia" },
  { flag: "🇸🇻", name: "El Salvador" },
  { flag: "🇪🇸", name: "España & Europa" },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [lang, setLang] = useState<LangCode>("es");
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [simSeconds, setSimSeconds] = useState<number>(60);
  const [simPostsSent, setSimPostsSent] = useState<number>(42);

  // Simulador en vivo de 60s -> 0s para mostrar exactamente cómo se vacía la barra
  useEffect(() => {
    const timer = setInterval(() => {
      setSimSeconds((prev) => {
        if (prev <= 0) {
          setSimPostsSent((p) => (p >= 100 ? 1 : p + 1));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Registrar visita real en la base de datos para métricas de SuperAdmin
  useEffect(() => {
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/" }),
    }).catch(() => {});
  }, []);

  const t = TRANSLATIONS[lang];
  const selectedCurrency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const formatPrice = (usdAmount: number) => {
    const converted = usdAmount * selectedCurrency.rate;
    const formatted =
      selectedCurrency.decimals === 0
        ? Math.round(converted).toLocaleString("es-CO")
        : converted.toFixed(2);
    return `${selectedCurrency.symbol}${formatted} ${selectedCurrency.code}`;
  };

  const simBarPercent = Math.max(0, Math.min(100, Math.round((simSeconds / 60) * 100)));

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${
        isDark ? "bg-[#0B0E14] text-[#F1F5F9]" : "bg-[#ECEEF2] text-[#0F172A]"
      }`}
    >
      {/* Fondo Cósmico de Galaxia & Partículas Animadas */}
      <GalaxyBackground />

      {/* BARRA SUPERIOR DE NAVEGACIÓN MINIMALISTA Y DESPEJADA */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
          isDark
            ? "bg-[#141820]/90 border-[#262C3A]"
            : "bg-[#F4F6F9]/95 border-[#CBD5E1]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo Limpio y Destacado */}
          <a href="#" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[#229ED9] shadow-[0_0_25px_rgba(34,158,217,0.55)] flex-shrink-0 animate-float transition-transform group-hover:scale-105">
              <img src="/ottbot-logo.png" alt="OttBot PRO" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-black text-xl sm:text-2xl tracking-tight">
                Ott<span className="text-[#229ED9]">Bot</span>
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase shadow-xs">
                PRO
              </span>
            </div>
          </a>

          {/* Links Centrales en 1 sola línea limpia (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-extrabold whitespace-nowrap">
            <a href="#simulador" className="hover:text-[#229ED9] transition-colors">
              {t.nav.howItWorks}
            </a>
            <a href="#modalidades" className="hover:text-[#229ED9] transition-colors">
              {t.nav.modalities}
            </a>
            <a href="#planes" className="hover:text-[#229ED9] transition-colors">
              {t.nav.plans}
            </a>
            <a href="#faq" className="hover:text-[#229ED9] transition-colors">
              {t.nav.faq}
            </a>
          </nav>

          {/* Solo Controles de Idioma, Moneda y Tema (Sin saturar con botones de texto) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Selector de Idioma Compacto */}
            <div className="relative">
              <select
                aria-label="Seleccionar idioma"
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#229ED9]/30 ${
                  isDark
                    ? "bg-[#1E232E] border-[#2E3646] text-white"
                    : "bg-white border-slate-300 text-slate-800 shadow-xs"
                }`}
              >
                <option value="es">🌐 ES</option>
                <option value="en">🇺🇸 EN</option>
                <option value="pt">🇧🇷 PT</option>
                <option value="fr">🇫🇷 FR</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>

            {/* Selector de Moneda Compacto */}
            <div className="relative">
              <select
                aria-label="Seleccionar moneda"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className={`appearance-none pl-2.5 pr-6 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-w-[125px] sm:max-w-[155px] truncate ${
                  isDark
                    ? "bg-[#1E232E] border-emerald-500/40 text-emerald-400"
                    : "bg-white border-emerald-600/40 text-emerald-700 shadow-xs"
                }`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-emerald-500" />
            </div>

            {/* Botón Tema Claro / Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Cambiar tema visual"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-[#1E232E] border-[#2E3646] text-amber-400 hover:border-[#229ED9]"
                  : "bg-white border-slate-300 text-slate-700 hover:border-[#229ED9]"
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* HERO PRINCIPAL PERSUASIVO */}
      <section className="relative overflow-hidden pt-10 pb-14 sm:pt-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#229ED9]/15 border border-[#229ED9]/35 text-[#229ED9] text-[11px] font-black uppercase tracking-wider mb-6">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
            {t.hero.titleStart}
            <span className="bg-gradient-to-r from-[#229ED9] via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
            {t.hero.titleEnd}
          </h1>

          <p
            className={`mt-5 text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-3xl mx-auto ${
              isDark ? "text-neutral-300" : "text-slate-600"
            }`}
          >
            {t.hero.subtitle}
          </p>

          {/* Botones de Acción Principal: Crear Cuenta (1 Día Gratis) + Iniciar Sesión */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm sm:text-base font-black shadow-xl shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>{t.hero.ctaTrial}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black border transition-all ${
                isDark
                  ? "bg-[#1A1F29] border-[#2D3546] text-white hover:border-[#229ED9]"
                  : "bg-[#F4F6F9] border-slate-300 text-slate-800 hover:bg-white hover:border-[#229ED9] shadow-sm"
              }`}
            >
              <span>{t.hero.ctaLogin}</span>
            </Link>
          </div>

          {/* Garantías Rápidas */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              {t.hero.trust1}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#229ED9]">
              <Globe className="w-4 h-4" />
              {t.hero.trust2}
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-500">
              <ShieldCheck className="w-4 h-4" />
              {t.hero.trust3}
            </span>
          </div>
        </div>

        {/* Métricas de Prueba Social */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div
            className={`rounded-3xl p-6 border text-center shadow-md ${
              isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
            }`}
          >
            <div className="text-2xl sm:text-3xl font-black text-[#229ED9]">{t.stats.users}</div>
            <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              {t.stats.usersSub}
            </p>
          </div>

          <div
            className={`rounded-3xl p-6 border text-center shadow-md ${
              isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
            }`}
          >
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">{t.stats.posts}</div>
            <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              {t.stats.postsSub}
            </p>
          </div>

          <div
            className={`rounded-3xl p-6 border text-center shadow-md ${
              isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
            }`}
          >
            <div className="text-2xl sm:text-3xl font-black text-amber-500">{t.stats.safety}</div>
            <p className={`text-xs font-semibold mt-1 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
              {t.stats.safetySub}
            </p>
          </div>
        </div>
      </section>

      {/* SIMULADOR EN VIVO DE LA BARRA DE PROGRESO (60s -> 0s) Y DESCANSO */}
      <section id="simulador" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-9">
          <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider mb-3">
            {t.liveSimulator.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{t.liveSimulator.title}</h2>
          <p className={`mt-2.5 text-xs sm:text-sm font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {t.liveSimulator.desc}
          </p>
        </div>

        {/* Tarjeta Interactiva que simula la campaña en vivo */}
        <div
          className={`rounded-3xl p-6 sm:p-8 border-2 shadow-2xl ${
            isDark
              ? "bg-[#171B24] border-[#229ED9]/40"
              : "bg-[#F4F6F9] border-[#229ED9]/40"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#229ED9]/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg">
                <Send className="w-6 h-6 -rotate-12 fill-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black">Campaña #1: Anuncio & Copy Principal</h3>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    ● {t.liveSimulator.activeBadge}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-bold text-[#229ED9]">
                  <span>{t.liveSimulator.groupsSelected}</span>
                  <span>•</span>
                  <span className="text-emerald-500">{t.liveSimulator.dailyGoal} ({simPostsSent}/100)</span>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.liveSimulator.cooldownBadge}</span>
            </div>
          </div>

          {/* Barra de Conteo Regresivo de 60s a 0s */}
          <div
            className={`mt-6 p-5 rounded-2xl border ${
              isDark ? "bg-[#11151C] border-[#262E3D]" : "bg-white border-slate-300"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-[#229ED9]">
                <Clock className="w-4 h-4 animate-spin" />
                {t.liveSimulator.nextPost}:
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-emerald-500">
                {simSeconds === 0 ? "⚡ PUBLICANDO EN GRUPO..." : `${simSeconds}s / 60s`}
              </span>
            </div>

            {/* Barra que se vacía de 100% a 0% */}
            <div className="w-full h-4 rounded-full bg-neutral-700/25 overflow-hidden p-0.5 border border-[#229ED9]/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#229ED9] to-sky-400 transition-all duration-700"
                style={{ width: `${simBarPercent}%` }}
              />
            </div>

            {/* Grupos Recientes con Métricas */}
            <div className="mt-5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2.5">
                {t.liveSimulator.recentGroupsTitle}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { name: "Clasificados & Anuncios LATAM 🌎", posts: 14, clicks: 9, time: "Hace 1 min" },
                  { name: "Emprendedores & Servicios VIP 🚀", posts: 15, clicks: 12, time: "Hace 2 min" },
                  { name: "Ofertas & Negocios Internacionales 💎", posts: 13, clicks: 7, time: "Hace 3 min" },
                ].map((g, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                      isDark ? "bg-[#181D27] border-[#293244]" : "bg-[#F4F6F9] border-slate-300"
                    }`}
                  >
                    <div className="font-black truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="truncate">{g.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-500/15 text-[11px] font-bold">
                      <span className="text-[#229ED9]">{g.posts} {t.liveSimulator.postsLabel}</span>
                      <span className="text-emerald-500">{g.clicks} {t.liveSimulator.clicksLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ CONTRATARNOS (4 VENTAJAS CLAVE) */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 text-[11px] font-black uppercase tracking-wider mb-3">
            {t.whyUs.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{t.whyUs.title}</h2>
          <p className={`mt-2.5 text-xs sm:text-sm font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {t.whyUs.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.whyUs.cards.map((card: any, idx: number) => {
            const icons = [Zap, Layers, BarChart3, Globe];
            const Icon = icons[idx % icons.length];
            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 border shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 ${
                  isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
                }`}
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black mb-2">{card.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LAS 2 MODALIDADES DE PUBLICACIÓN (CUENTA PROPIA vs GRANJA OTTBOT) */}
      <section id="modalidades" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px] font-black uppercase tracking-wider mb-3">
            {t.modalities.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{t.modalities.title}</h2>
          <p className={`mt-2.5 text-xs sm:text-sm font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {t.modalities.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modalidad 1: Propia Cuenta de Telegram */}
          <div
            className={`rounded-3xl p-7 sm:p-8 border-2 shadow-xl flex flex-col justify-between ${
              isDark
                ? "bg-[#181C24] border-[#229ED9]/45"
                : "bg-[#F4F6F9] border-[#229ED9]/45"
            }`}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] text-[10px] font-black uppercase tracking-wider border border-[#229ED9]/30 mb-4">
                <Send className="w-3.5 h-3.5" />
                {t.modalities.mod1Badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-black mb-2.5">{t.modalities.mod1Title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t.modalities.mod1Desc}
              </p>

              <ul className="space-y-2.5">
                {t.modalities.mod1Bullets.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#229ED9] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-5 border-t border-[#229ED9]/20 flex items-center justify-between">
              <span className="text-xs font-black text-[#229ED9]">
                Rotación Automática Multi-Cuenta
              </span>
              <Link
                href="/login?mode=register"
                className="px-4 py-2 rounded-xl bg-[#229ED9] hover:bg-blue-500 text-white text-xs font-black transition-all"
              >
                Probar Ahora →
              </Link>
            </div>
          </div>

          {/* Modalidad 2: Granja Verificada OttBot */}
          <div
            className={`rounded-3xl p-7 sm:p-8 border-2 shadow-xl flex flex-col justify-between ${
              isDark
                ? "bg-[#181C24] border-emerald-500/45"
                : "bg-[#F4F6F9] border-emerald-600/45"
            }`}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.modalities.mod2Badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-black mb-2.5">{t.modalities.mod2Title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t.modalities.mod2Desc}
              </p>

              <ul className="space-y-2.5">
                {t.modalities.mod2Bullets.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 pt-5 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-500">
                100% Automático • Sin usar tu número
              </span>
              <Link
                href="/login?mode=register"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all"
              >
                Activar Granja →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES Y PRECIOS CON CONVERSOR DE MONEDA EN TIEMPO REAL */}
      <section id="planes" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider mb-3">
            {t.plansSection.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{t.plansSection.title}</h2>
          <p className={`mt-2.5 text-xs sm:text-sm font-medium ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {t.plansSection.subtitle}
          </p>

          {/* Barra Rápida de Selección de Moneda encima de los Planes */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 p-2.5 rounded-2xl border border-[#229ED9]/30 bg-[#229ED9]/5">
            <span className="text-xs font-black px-2 text-[#229ED9]">{t.plansSection.currencyLabel}</span>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-none ${
                isDark
                  ? "bg-[#181C24] border-[#2E3646] text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de 4 Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.plansSection.plans.map((plan: any) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 border-2 flex flex-col justify-between relative transition-all hover:-translate-y-1 shadow-xl ${
                plan.popular
                  ? isDark
                    ? "bg-gradient-to-b from-[#1D2536] to-[#171B24] border-[#229ED9]"
                    : "bg-white border-[#229ED9] ring-4 ring-[#229ED9]/15"
                  : isDark
                  ? "bg-[#181C24] border-[#283040]"
                  : "bg-[#F4F6F9] border-[#CBD5E1]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#229ED9] text-white text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                  ⭐ MÁS ELEGIDO • RECOMENDADO
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#229ED9]">
                    {plan.duration}
                  </span>
                </div>

                <h3 className="text-lg font-black">{plan.name}</h3>

                {/* Precio convertido + Referencia en USD si eligió otra moneda */}
                <div className="mt-4 mb-2">
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-500">
                    {formatPrice(plan.priceUSD)}
                  </div>
                  {currencyCode !== "USD" && (
                    <div className="text-[11px] font-mono font-bold text-neutral-400 mt-0.5">
                      Equivalente a ${plan.priceUSD.toFixed(2)} USD
                    </div>
                  )}
                </div>

                <p className={`text-xs leading-relaxed mb-5 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  {plan.desc}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-neutral-500/20 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.groups}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#229ED9] flex-shrink-0" />
                    <span>{plan.campaigns}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="font-black">{plan.dailyPosts}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{plan.accounts}</span>
                  </div>
                </div>

                {/* Nota alineada de Cuenta Adicional ($3.00 USD Pago Único) */}
                <div
                  className={`mt-4 p-3 rounded-2xl border text-[11px] flex items-center justify-between gap-2 ${
                    isDark ? "bg-[#12161E] border-[#262E3D]" : "bg-white border-slate-200"
                  }`}
                >
                  <span className={isDark ? "text-neutral-300 font-semibold" : "text-slate-600 font-semibold"}>
                    +1 Cuenta TG Extra:
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-black text-emerald-500 whitespace-nowrap">
                    +{formatPrice(3.0)} ({t.plansSection.oneTimePayment})
                  </span>
                </div>
              </div>

              <Link
                href="/login?mode=register"
                className={`mt-6 w-full py-3 px-4 rounded-xl text-center text-xs font-black transition-all shadow-md ${
                  plan.popular
                    ? "bg-[#229ED9] hover:bg-blue-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {t.plansSection.ctaSelect}
              </Link>
            </div>
          ))}
        </div>

        {/* Tarjeta Informativa de Cuentas Adicionales de Telegram (+$3.00 USD / Ciclo) */}
        <div
          className={`mt-8 rounded-3xl p-6 sm:p-7 border-2 shadow-lg ${
            isDark
              ? "bg-gradient-to-r from-[#181C24] via-[#1B2230] to-[#181C24] border-[#229ED9]/40"
              : "bg-gradient-to-r from-sky-50/80 via-white to-indigo-50/60 border-[#229ED9]/40"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 text-[10px] font-black uppercase tracking-wider">
                📱 {t.plansSection.extraBoxBadge}
              </span>
              <h3 className="text-base sm:text-xl font-black">{t.plansSection.extraBoxTitle}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t.plansSection.extraBoxDesc}
              </p>
              <p className={`text-[11px] leading-relaxed pt-1 font-semibold ${isDark ? "text-amber-300/90" : "text-amber-800"}`}>
                ⚠️ {t.plansSection.extraBoxRule}
              </p>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-2xl border text-center flex-shrink-0 min-w-[230px] ${
                isDark ? "bg-[#12161E] border-[#2A3346]" : "bg-[#F4F6F9] border-slate-300"
              }`}
            >
              <div className="text-[11px] font-black uppercase tracking-wider text-[#229ED9]">
                +1 Cuenta Telegram Extra
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-500 mt-1">
                +{formatPrice(3.0)}
              </div>
              <div className={`text-[11px] font-bold mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                {t.plansSection.extraBoxPriceSuffix}
              </div>
              {currencyCode !== "USD" && (
                <div className="text-[10px] font-mono text-neutral-400 mt-1">
                  ($3.00 USD)
                </div>
              )}
              <div className="mt-3 pt-2.5 border-t border-neutral-500/20 text-[11px] font-bold text-emerald-500">
                +25 Grupos • +100 Envíos/Día
              </div>
            </div>
          </div>
        </div>

        {/* Banner Inferior de Prueba Gratis de 1 Día */}
        <div
          className={`mt-8 rounded-3xl p-7 sm:p-8 border-2 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl ${
            isDark
              ? "bg-gradient-to-r from-emerald-950/60 via-[#181C24] to-[#181C24] border-emerald-500/40"
              : "bg-gradient-to-r from-emerald-50 via-[#F4F6F9] to-sky-50 border-emerald-500/40"
          }`}
        >
          <div>
            <h3 className="text-lg sm:text-2xl font-black">{t.plansSection.ctaFreeTrialBannerTitle}</h3>
            <p className={`text-xs sm:text-sm font-medium mt-1 ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
              {t.plansSection.ctaFreeTrialBannerSub}
            </p>
          </div>

          <Link
            href="/login?mode=register"
            className="w-full lg:w-auto text-center px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition-all whitespace-nowrap"
          >
            🚀 {t.plansSection.ctaFreeTrialBannerBtn}
          </Link>
        </div>
      </section>

      {/* SECCIÓN VIRAL: HAZ QUE TU BOT SEA 100% GRATIS (PROGRAMA DE EMBAJADORES & NIVELES) */}
      <section id="embajadores" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`rounded-3xl p-8 sm:p-11 border-2 relative overflow-hidden shadow-2xl ${
          isDark
            ? "bg-gradient-to-b from-[#181C24] via-[#1B2230] to-[#14171F] border-purple-500/30"
            : "bg-gradient-to-b from-purple-50/60 via-white to-sky-50/60 border-purple-300"
        }`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#229ED9]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px] font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              PROGRAMA DE EMBAJADORES • BENEFICIO EXCLUSIVO
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              ¿Quieres que tu Bot y tu Membresía te salgan <span className="text-emerald-400 underline decoration-emerald-500/40">100% GRATIS</span> todos los meses?
            </h2>
            <p className={`mt-3 text-xs sm:text-sm font-medium leading-relaxed ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
              Con nuestro sistema de <strong>Rangos Progresivos</strong>, comparte tu enlace exclusivo con amigos, proveedores o clientes que vendan por Telegram. Con cada recarga que ellos hagan por Binance Pay, recibes del <strong>10% al 20%</strong> de comisión directo a tu Wallet para pagar tus propios planes y cuentas extra.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* BRONCE */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
              isDark ? "bg-[#13161C]/90 border-amber-600/30" : "bg-white border-amber-200 shadow-md"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black text-amber-500 flex items-center gap-1.5">
                    🥉 Rango Bronce
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                    1 a 4 Amigos
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mb-1">
                  10%
                </div>
                <div className="text-[11px] text-neutral-400 mb-4">Comisión por cada pago de tus referidos</div>
                <ul className="space-y-2 text-xs font-semibold">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Enlace con tu código BOT de por vida</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Liberación semanal a tu Wallet</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* PLATA */}
            <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all relative ${
              isDark ? "bg-[#161B24]/90 border-[#229ED9] ring-2 ring-[#229ED9]/20" : "bg-white border-[#229ED9] shadow-xl ring-2 ring-[#229ED9]/20"
            }`}>
              <span className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                🔥 ¡Tu Bot te sale Gratis!
              </span>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black text-[#229ED9] flex items-center gap-1.5">
                    🥈 Rango Plata
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#229ED9]/15 text-[#229ED9]">
                    5 a 14 Amigos
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-emerald-400 mb-1">
                  15%
                </div>
                <div className="text-[11px] text-neutral-400 mb-4">Comisión por cada pago de tus referidos</div>
                <ul className="space-y-2 text-xs font-semibold">
                  <li className="flex items-center gap-2 font-black text-purple-400">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>+1 Cuenta de Telegram Extra de Regalo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Tu plan mensual PRO queda 100% pagado</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ORO EMBAJADOR */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
              isDark ? "bg-[#13161C]/90 border-amber-400/40" : "bg-white border-amber-300 shadow-md"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-black text-amber-400 flex items-center gap-1.5">
                    🥇 Oro Embajador
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                    15+ Amigos VIP
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-amber-400 mb-1">
                  20%
                </div>
                <div className="text-[11px] text-neutral-400 mb-4">Comisión máxima de la plataforma</div>
                <ul className="space-y-2 text-xs font-semibold">
                  <li className="flex items-center gap-2 font-black text-amber-400">
                    <Award className="w-4 h-4 flex-shrink-0" />
                    <span>Insignia oficial de Embajador VIP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Soporte prioritario y saldo para revender</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <Link
              href="/login?mode=register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#229ED9] to-purple-600 hover:from-blue-600 hover:to-purple-500 text-white text-xs sm:text-sm font-black transition-all shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              <span>Crear Cuenta y Obtener mi Enlace de Embajador</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* COBERTURA EN TODA LATINOAMÉRICA Y EL MUNDO */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div
          className={`rounded-3xl p-7 sm:p-9 border text-center shadow-lg ${
            isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
          }`}
        >
          <h2 className="text-xl sm:text-2xl font-black">{t.countriesSection.title}</h2>
          <p className={`text-xs sm:text-sm mt-1.5 mb-6 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
            {t.countriesSection.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {SUPPORTED_COUNTRIES.map((c) => (
              <span
                key={c.name}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                  isDark
                    ? "bg-[#12161E] border-[#262E3D] text-neutral-200"
                    : "bg-white border-slate-300 text-slate-800 shadow-2xs"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES */}
      <section id="faq" className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-9">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 text-[11px] font-black uppercase tracking-wider mb-3">
            {t.faqSection.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">{t.faqSection.title}</h2>
        </div>

        <div className="space-y-4">
          {t.faqSection.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border shadow-sm ${
                isDark ? "bg-[#181C24] border-[#283040]" : "bg-[#F4F6F9] border-[#CBD5E1]"
              }`}
            >
              <h3 className="text-sm sm:text-base font-black flex items-center gap-2 text-[#229ED9]">
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span>{item.q}</span>
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed mt-2 ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className={`pt-8 pb-24 px-4 border-t text-center text-xs font-semibold ${
          isDark
            ? "bg-[#12161E] border-[#262C3A] text-neutral-400"
            : "bg-[#E2E6EC] border-[#CBD5E1] text-slate-600"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#229ED9] shadow-[0_0_15px_rgba(34,158,217,0.4)] overflow-hidden">
              <img src="/ottbot-logo.png" alt="OttBot PRO" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <span className="font-black text-base tracking-tight block">
                Ott<span className="text-[#229ED9]">Bot</span> PRO
              </span>
              <span className="text-[10px] text-neutral-400 block font-medium">Plataforma Cloud 24/7</span>
            </div>
          </div>

          <p className="text-xs font-medium text-center sm:text-right">{t.footer.rights}</p>
        </div>
      </footer>

      {/* DOCK FLOTANTE INFERIOR DE ACCESO RÁPIDO */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg pointer-events-none">
        <div
          className={`pointer-events-auto p-2.5 rounded-2xl border-2 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 ${
            isDark
              ? "bg-[#141820]/95 border-[#229ED9]/40 shadow-[0_12px_45px_rgba(34,158,217,0.35)]"
              : "bg-white/95 border-[#229ED9]/50 shadow-[0_12px_45px_rgba(34,158,217,0.25)]"
          }`}
        >
          <Link
            href="/login"
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-center border-2 transition-all whitespace-nowrap shadow-sm ${
              isDark
                ? "bg-[#1E232E] hover:bg-[#262D3B] border-[#323B4E] text-white"
                : "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
            }`}
          >
            {t.nav.login}
          </Link>

          <Link
            href="/login?mode=register"
            className="flex-[1.5] py-3 px-5 rounded-xl bg-gradient-to-r from-[#229ED9] via-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white text-xs sm:text-sm font-black text-center shadow-lg shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>{t.nav.freeTrial}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
