import { prisma } from "./prisma";
import { SubscriptionStatus } from "@prisma/client";

export interface MembershipCheckResult {
  hasAccess: boolean;
  reason?: string;
  daysRemaining: number;
  status: SubscriptionStatus;
}

/**
 * Validación backend Zero Trust del estado de membresía de un usuario.
 * Nunca confía en el frontend: calcula la vigencia exacta en el servidor.
 */
export async function validateUserSubscription(userId: string): Promise<MembershipCheckResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      hasAccess: false,
      reason: "No cuenta con una suscripción registrada.",
      daysRemaining: 0,
      status: SubscriptionStatus.EXPIRED,
    };
  }

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (now > expiresAt) {
    // Si la fecha ya expiró pero el estado no se ha marcado como EXPIRED, lo actualizamos
    if (subscription.status !== SubscriptionStatus.EXPIRED) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }

    return {
      hasAccess: false,
      reason: "Tu membresía ha expirado. Realiza una recarga diaria para continuar.",
      daysRemaining: 0,
      status: SubscriptionStatus.EXPIRED,
    };
  }

  if (subscription.status === SubscriptionStatus.SUSPENDED) {
    return {
      hasAccess: false,
      reason: "Tu cuenta se encuentra temporalmente suspendida por el administrador.",
      daysRemaining,
      status: SubscriptionStatus.SUSPENDED,
    };
  }

  return {
    hasAccess: true,
    daysRemaining,
    status: subscription.status,
  };
}
