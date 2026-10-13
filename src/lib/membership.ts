import { prisma } from "./prisma";
import { SubscriptionStatus } from "@prisma/client";

export interface MembershipCheckResult {
  hasAccess: boolean;
  reason?: string;
  daysRemaining: number;
  status: SubscriptionStatus;
  autoRenewed?: boolean;
  completingDailyCycle?: boolean;
}

export function getPlanDetailsByRate(dailyRate: number) {
  if (dailyRate <= 0.85) {
    return { name: "Plan Mensual Élite (30 Días)", days: 30, priceUSD: 24.0, dailyPostLimit: 500, maxGroups: 100, baseMaxAccounts: 3 };
  }
  if (dailyRate <= 0.95) {
    return { name: "Plan Quincenal PRO (15 Días)", days: 15, priceUSD: 13.5, dailyPostLimit: 300, maxGroups: 60, baseMaxAccounts: 2 };
  }
  if (dailyRate <= 1.05) {
    return { name: "Plan Semanal (7 Días)", days: 7, priceUSD: 7.0, dailyPostLimit: 200, maxGroups: 50, baseMaxAccounts: 1 };
  }
  return { name: "Pase Express (1 Día)", days: 1, priceUSD: 1.25, dailyPostLimit: 100, maxGroups: 25, baseMaxAccounts: 1 };
}

/**
 * Validación backend Zero Trust del estado de membresía de un usuario:
 * 1. Si la membresía está vigente (now <= expiresAt), tiene acceso normal.
 * 2. Si el reloj superó expiresAt hoy pero las campañas del día AÚN NO han completado su meta diaria de envíos,
 *    permite terminar las publicaciones del día sin pausar a mitad de camino.
 * 3. Cuando ya se cumplió el ciclo y venció expiresAt:
 *    - Si el usuario tiene saldo suficiente en su Wallet, cobra automáticamente de la Wallet y renueva su membresía
 *      (cobrando también las cuentas extra si las mantiene activas) para que sus campañas continúen todos los días.
 *    - Si NO tiene saldo en su Wallet, paraliza/pausa todas las campañas activas del usuario y marca la suscripción como EXPIRED.
 */
export async function validateUserSubscription(userId: string): Promise<MembershipCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user || !user.subscription) {
    return {
      hasAccess: false,
      reason: "No cuenta con una suscripción registrada.",
      daysRemaining: 0,
      status: SubscriptionStatus.EXPIRED,
    };
  }

  const subscription = user.subscription;

  if (subscription.status === SubscriptionStatus.SUSPENDED) {
    return {
      hasAccess: false,
      reason: "Tu cuenta se encuentra temporalmente suspendida por el administrador.",
      daysRemaining: 0,
      status: SubscriptionStatus.SUSPENDED,
    };
  }

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (now <= expiresAt) {
    return {
      hasAccess: true,
      daysRemaining: Math.max(1, daysRemaining),
      status: subscription.status,
    };
  }

  // La fecha expiresAt ya se cumplió: verificamos primero si hoy estaba activo y aún no ha completado las publicaciones del día
  const plan = getPlanDetailsByRate(Number(subscription.dailyRate || 1.25));
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [sentTodayCount, activeCampaignsCount] = await Promise.all([
    prisma.messageLog.count({
      where: {
        campaign: { userId },
        status: "SENT",
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.campaign.count({
      where: { userId, status: "ACTIVE" },
    }),
  ]);

  const hoursSinceExpired = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60);

  // Si expiró hace menos de 18 horas, tiene campañas activas y todavía NO se han cumplido las publicaciones del ciclo de hoy,
  // NO se puede pausar hasta que termine de cumplir sus publicaciones del día.
  if (hoursSinceExpired <= 18 && activeCampaignsCount > 0 && sentTodayCount > 0 && sentTodayCount < plan.dailyPostLimit) {
    return {
      hasAccess: true,
      daysRemaining: 1,
      status: SubscriptionStatus.ACTIVE,
      completingDailyCycle: true,
    };
  }

  // El ciclo ya se cumplió: verificamos si tiene saldo en la Wallet para Cobro Automático
  const walletBalance = Number(user.walletBalance || 0);
  const extraAccountsCount = Math.max(0, (subscription.maxAccounts || 1) - plan.baseMaxAccounts);
  const extraAccountsCost = extraAccountsCount * 3.0; // $3.00 USD por cada cuenta extra en el nuevo ciclo

  let renewDays = 0;
  let renewPrice = 0;
  let renewName = "";
  let newDailyRate = Number(subscription.dailyRate || 1.25);
  let renewedMaxAccounts = plan.baseMaxAccounts;

  if (walletBalance >= plan.priceUSD + extraAccountsCost) {
    renewDays = plan.days;
    renewPrice = plan.priceUSD + extraAccountsCost;
    renewName =
      extraAccountsCount > 0
        ? `${plan.name} + ${extraAccountsCount} Cuenta(s) Extra`
        : plan.name;
    renewedMaxAccounts = subscription.maxAccounts || plan.baseMaxAccounts;
  } else if (walletBalance >= plan.priceUSD) {
    renewDays = plan.days;
    renewPrice = plan.priceUSD;
    renewName = plan.name;
    renewedMaxAccounts = plan.baseMaxAccounts;
  } else if (walletBalance >= 1.25) {
    renewDays = 1;
    renewPrice = 1.25;
    renewName = "Pase Express (1 Día)";
    newDailyRate = 1.25;
    renewedMaxAccounts = 1;
  }

  if (renewDays > 0 && renewPrice > 0) {
    const newExpiresAt = new Date(now.getTime() + renewDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: renewPrice },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          amount: renewPrice,
          type: "DEBIT",
          description: `Cobro Automático de Wallet: Renovación de ${renewName} (-$${renewPrice.toFixed(2)} USD)`,
        },
      }),
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          dailyRate: newDailyRate,
          expiresAt: newExpiresAt,
          maxAccounts: renewedMaxAccounts,
        },
      }),
      prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: renewPrice,
          daysAdded: renewDays,
          reference: "WALLET_AUTO_RENEW",
        },
      }),
    ]);

    return {
      hasAccess: true,
      daysRemaining: renewDays,
      status: SubscriptionStatus.ACTIVE,
      autoRenewed: true,
    };
  }

  // No tiene saldo suficiente en Wallet y ya cumplió su ciclo: paralizar campañas activas y marcar EXPIRED
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.EXPIRED },
    }),
    prisma.campaign.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "PAUSED" },
    }),
  ]);

  return {
    hasAccess: false,
    reason: "Ciclo cumplido y saldo de Wallet insuficiente. Recarga tu Wallet para reanudar tus campañas.",
    daysRemaining: 0,
    status: SubscriptionStatus.EXPIRED,
  };
}
