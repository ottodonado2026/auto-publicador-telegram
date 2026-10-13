import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, { name: string; days: number; priceUSD: number; maxCampaigns: number; maxAccounts: number }> = {
  "plan-1": { name: "Pase Express (1 Día)", days: 1, priceUSD: 1.50, maxCampaigns: 2, maxAccounts: 1 },
  "plan-2": { name: "Plan Semanal (7 Días)", days: 7, priceUSD: 7.00, maxCampaigns: 3, maxAccounts: 1 },
  "plan-3": { name: "Plan Quincenal (15 Días)", days: 15, priceUSD: 13.50, maxCampaigns: 5, maxAccounts: 2 },
  "plan-4": { name: "Plan Mensual (30 Días)", days: 30, priceUSD: 24.00, maxCampaigns: 8, maxAccounts: 3 },
};

const EXTRA_ACCOUNT_PRICE_USD = 3.00;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { planId, addonType } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const currentBalance = Number(user.walletBalance || 0);

    // CASO 1: COMPRA DE CUENTA ADICIONAL DE TELEGRAM (+$3.00 USD PAGO ÚNICO)
    if (addonType === "EXTRA_ACCOUNT") {
      if (currentBalance < EXTRA_ACCOUNT_PRICE_USD) {
        return NextResponse.json(
          {
            error: `Saldo insuficiente en tu Wallet ($${currentBalance.toFixed(2)} USD). Necesitas $${EXTRA_ACCOUNT_PRICE_USD.toFixed(2)} USD para desbloquear +1 Cuenta Adicional de Telegram.`,
          },
          { status: 400 }
        );
      }

      const currentMaxAccounts = user.subscription?.maxAccounts || 1;
      const newMaxAccounts = currentMaxAccounts + 1;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            walletBalance: { decrement: EXTRA_ACCOUNT_PRICE_USD },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: user.id,
            amount: EXTRA_ACCOUNT_PRICE_USD,
            type: "DEBIT",
            description: `Desbloqueo de +1 Cuenta Adicional de Telegram (Ahora hasta ${newMaxAccounts} cuentas)`,
          },
        }),
        prisma.subscription.update({
          where: { userId: user.id },
          data: {
            maxAccounts: newMaxAccounts,
            updatedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `¡Cupo desbloqueado con éxito! Ahora puedes vincular hasta ${newMaxAccounts} cuentas de Telegram simultáneas.`,
      });
    }

    // CASO 2: COMPRA DE PLAN DE MEMBRESÍA
    const plan = PLAN_PRICES[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan seleccionado no válido" }, { status: 400 });
    }

    if (currentBalance < plan.priceUSD) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente en tu Wallet ($${currentBalance.toFixed(2)} USD). Necesitas $${plan.priceUSD.toFixed(2)} USD para activar el ${plan.name}.`,
        },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de expiración
    const now = new Date();
    const currentExpires = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : now;
    const isStillActive = currentExpires > now && user.subscription?.status === "ACTIVE";
    const baseDate = isStillActive ? currentExpires : now;
    const newExpiresAt = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

    // Las cuentas incluidas corresponden estrictamente al plan adquirido en este nuevo ciclo
    // (evita que paguen una cuenta extra una sola vez y luego solo paguen el plan de 1 día indefinidamente)
    const finalMaxAccounts = plan.maxAccounts;

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
          description: `Activación de ${plan.name} (+${plan.days} días • Incluye hasta ${finalMaxAccounts} cuenta(s) TG)`,
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
          maxAccounts: finalMaxAccounts,
        },
        update: {
          status: "ACTIVE",
          dailyRate: Number((plan.priceUSD / plan.days).toFixed(2)),
          expiresAt: newExpiresAt,
          maxCampaigns: plan.maxCampaigns,
          maxAccounts: finalMaxAccounts,
          updatedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `¡${plan.name} activado con éxito! Se descontaron $${plan.priceUSD.toFixed(2)} USD de tu Wallet y se sumaron ${plan.days} día(s) a tu membresía.`,
    });
  } catch (error: any) {
    console.error("Error al comprar plan o extra con Wallet:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar el pago con tu Wallet" },
      { status: 500 }
    );
  }
}
