import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, { name: string; days: number; priceUSD: number; maxCampaigns: number; maxAccounts: number }> = {
  "plan-1": { name: "Pase Express (1 Día)", days: 1, priceUSD: 1.25, maxCampaigns: 2, maxAccounts: 1 },
  "plan-2": { name: "Plan Semanal (7 Días)", days: 7, priceUSD: 7.00, maxCampaigns: 3, maxAccounts: 1 },
  "plan-3": { name: "Plan Quincenal (15 Días)", days: 15, priceUSD: 13.50, maxCampaigns: 5, maxAccounts: 2 },
  "plan-4": { name: "Plan Mensual (30 Días)", days: 30, priceUSD: 24.00, maxCampaigns: 8, maxAccounts: 3 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { planId } = await req.json();

    const plan = PLAN_PRICES[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan seleccionado no válido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const currentBalance = Number(user.walletBalance || 0);
    if (currentBalance < plan.priceUSD) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente en tu Wallet ($${currentBalance.toFixed(2)} USD). Necesitas $${plan.priceUSD.toFixed(2)} USD para activar el ${plan.name}.`,
        },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de expiración (sumar a la actual si aún no ha expirado, o desde hoy si ya expiró)
    const now = new Date();
    const currentExpires = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : now;
    const baseDate = currentExpires > now ? currentExpires : now;
    const newExpiresAt = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

    // Ejecutar transacción atómica: descontar Wallet, registrar movimiento y extender suscripción
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { decrement: plan.priceUSD },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: user.id,
          amount: plan.priceUSD,
          type: "DEBIT",
          description: `Activación de ${plan.name} (+${plan.days} días)`,
        },
      }),
      prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          status: "ACTIVE",
          dailyRate: Number((plan.priceUSD / plan.days).toFixed(2)),
          startsAt: now,
          expiresAt: newExpiresAt,
          maxCampaigns: plan.maxCampaigns,
          maxAccounts: plan.maxAccounts,
        },
        update: {
          status: "ACTIVE",
          dailyRate: Number((plan.priceUSD / plan.days).toFixed(2)),
          expiresAt: newExpiresAt,
          maxCampaigns: plan.maxCampaigns,
          maxAccounts: plan.maxAccounts,
          updatedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `¡${plan.name} activado con éxito! Se descontaron $${plan.priceUSD.toFixed(2)} USD de tu Wallet y se sumaron ${plan.days} día(s) a tu membresía.`,
    });
  } catch (error: any) {
    console.error("Error al comprar plan con Wallet:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el pago con tu Wallet" },
      { status: 500 }
    );
  }
}
