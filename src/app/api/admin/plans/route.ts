import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();

    let plans = await prisma.membershipPlan.findMany({
      orderBy: { days: "asc" },
    });

    // Si aún no hay planes registrados, creamos la estructura base por defecto
    if (plans.length === 0) {
      const defaultPlans = [
        {
          name: "Pase Diario (1 Día)",
          days: 1,
          priceUSD: 1.25,
          dailyEquivalent: 1.25,
          description: "Prueba rápida o difusión express de 24 horas.",
          isPopular: false,
        },
        {
          name: "Plan Semanal (7 Días)",
          days: 7,
          priceUSD: 7.00,
          dailyEquivalent: 1.00,
          description: "Tarifa reducida a $1.00/día. Campañas comerciales medianas.",
          isPopular: true,
        },
        {
          name: "Plan Quincenal (15 Días)",
          days: 15,
          priceUSD: 13.50,
          dailyEquivalent: 0.90,
          description: "Tarifa reducida a $0.90/día. Alto rendimiento continuo.",
          isPopular: false,
        },
        {
          name: "Plan Mensual (30 Días)",
          days: 30,
          priceUSD: 24.00,
          dailyEquivalent: 0.80,
          description: "Nuestra tarifa más económica: solo $0.80/día. Máximo ahorro.",
          isPopular: false,
        },
      ];

      for (const p of defaultPlans) {
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

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { name, days, priceUSD, dailyEquivalent, description, isPopular } = await req.json();

    if (!name || !days || !priceUSD) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        days: Number(days),
        priceUSD: Number(priceUSD),
        dailyEquivalent: Number(dailyEquivalent || (Number(priceUSD) / Number(days)).toFixed(2)),
        description: description || null,
        isPopular: Boolean(isPopular),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { id, priceUSD, dailyEquivalent, isActive, isPopular, name, description } = await req.json();

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(priceUSD !== undefined && { priceUSD: Number(priceUSD) }),
        ...(dailyEquivalent !== undefined && { dailyEquivalent: Number(dailyEquivalent) }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 });
  }
}
