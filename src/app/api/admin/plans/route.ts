import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const DEFAULT_PLANS = [
  {
    name: "Pase Express (1 Día)",
    days: 1,
    priceUSD: 1.25,
    dailyEquivalent: 1.25,
    description: "Difusión de prueba de 24 horas para ventas relámpago.",
    maxGroups: 15,
    maxDailyPosts: 45,
    delayBetweenMsgs: 60,
    cooldownMinutes: 120,
    allowCustomBot: true,
    allowFarmBot: false,
    features: [
      "Hasta 15 grupos de destino",
      "45 publicaciones automáticas / día",
      "Intervalo de seguridad antibaneo: 60s entre envíos",
      "Descanso inteligente de 120 min entre rondas",
      "Conexión con cuenta propia de Telegram",
      "Reportes de envíos en tiempo real"
    ],
    isPopular: false,
  },
  {
    name: "Plan Semanal (7 Días)",
    days: 7,
    priceUSD: 7.00,
    dailyEquivalent: 1.00,
    description: "Tarifa reducida a $1.00/día. Ideal para emprendedores y comercio continuo.",
    maxGroups: 30,
    maxDailyPosts: 120,
    delayBetweenMsgs: 60,
    cooldownMinutes: 90,
    allowCustomBot: true,
    allowFarmBot: true,
    features: [
      "Hasta 30 grupos de destino",
      "120 publicaciones automáticas / día",
      "Intervalo de 60 segundos entre mensajes",
      "Descanso de 90 min entre rondas",
      "Cuenta propia o Flota del Sistema por enlaces",
      "Soporte para fotos, copys y links con vista previa",
      "Ahorro del 20% vs tarifa diaria"
    ],
    isPopular: true,
  },
  {
    name: "Plan Quincenal (15 Días)",
    days: 15,
    priceUSD: 13.50,
    dailyEquivalent: 0.90,
    description: "Tarifa reducida a $0.90/día. Para negocios con catálogo amplio de productos.",
    maxGroups: 60,
    maxDailyPosts: 250,
    delayBetweenMsgs: 60,
    cooldownMinutes: 60,
    allowCustomBot: true,
    allowFarmBot: true,
    features: [
      "Hasta 60 grupos de destino",
      "250 publicaciones automáticas / día",
      "Intervalo de seguridad de 60s",
      "Descanso optimizado de 60 min",
      "Acceso prioritario a la Flota del Sistema",
      "Estadísticas de entrega exitosa",
      "Ahorro del 28% vs tarifa diaria"
    ],
    isPopular: false,
  },
  {
    name: "Plan Mensual (30 Días)",
    days: 30,
    priceUSD: 24.00,
    dailyEquivalent: 0.80,
    description: "Nuestra tarifa más rentable: solo $0.80/día. Máxima presencia y alcance constante.",
    maxGroups: 100,
    maxDailyPosts: 500,
    delayBetweenMsgs: 60,
    cooldownMinutes: 60,
    allowCustomBot: true,
    allowFarmBot: true,
    features: [
      "Hasta 100 grupos de destino",
      "500 publicaciones automáticas / día",
      "Rotación inteligente entre múltiples bots",
      "Intervalo antibaneo estricto de 60s",
      "Descanso de 60 min entre ciclos completos",
      "Flota de bots compartida o cuenta personal",
      "Soporte prioritario VIP",
      "Ahorro del 36% (Máximo Rendimiento)"
    ],
    isPopular: false,
  },
];

export async function GET() {
  try {
    await requireSuperAdmin();

    let plans = await prisma.membershipPlan.findMany({
      orderBy: { days: "asc" },
    });

    // Si no hay planes o no tienen los features actualizados, sincronizamos
    if (plans.length === 0 || !plans[0].features) {
      await prisma.membershipPlan.deleteMany(); // Reset limpio con beneficios profesionales
      for (const p of DEFAULT_PLANS) {
        await prisma.membershipPlan.create({ data: p });
      }

      plans = await prisma.membershipPlan.findMany({
        orderBy: { days: "asc" },
      });
    }

    return NextResponse.json({ plans });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    console.error("Error en /api/admin/plans:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { 
      id, priceUSD, dailyEquivalent, maxGroups, maxDailyPosts, 
      delayBetweenMsgs, cooldownMinutes, isActive, isPopular, name, description, features 
    } = await req.json();

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(priceUSD !== undefined && { priceUSD: Number(priceUSD) }),
        ...(dailyEquivalent !== undefined && { dailyEquivalent: Number(dailyEquivalent) }),
        ...(maxGroups !== undefined && { maxGroups: Number(maxGroups) }),
        ...(maxDailyPosts !== undefined && { maxDailyPosts: Number(maxDailyPosts) }),
        ...(delayBetweenMsgs !== undefined && { delayBetweenMsgs: Number(delayBetweenMsgs) }),
        ...(cooldownMinutes !== undefined && { cooldownMinutes: Number(cooldownMinutes) }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
      },
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}
