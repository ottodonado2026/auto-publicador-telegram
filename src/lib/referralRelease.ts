import { prisma } from "@/lib/prisma";

/**
 * Revisa y libera los bonos de referidos que hayan cumplido su ciclo de 7 días
 * Transfiere el monto a la wallet disponible del usuario promotor.
 */
export async function releaseDueReferralBonuses(): Promise<number> {
  try {
    const now = new Date();

    const dueBonuses = await prisma.referralBonus.findMany({
      where: {
        status: "PENDING",
        releaseDate: { lte: now },
      },
      include: {
        referrer: true,
        referredUser: true,
      },
    });

    if (dueBonuses.length === 0) return 0;

    let releasedCount = 0;

    for (const bonus of dueBonuses) {
      await prisma.$transaction(async (tx) => {
        // 1. Marcar como liberado
        await tx.referralBonus.update({
          where: { id: bonus.id },
          data: {
            status: "RELEASED",
            releasedAt: now,
          },
        });

        // 2. Descontar del saldo pendiente y abonar a wallet disponible
        const bonusAmount = Number(bonus.amountUSD);
        await tx.user.update({
          where: { id: bonus.referrerId },
          data: {
            walletBalance: { increment: bonusAmount },
            pendingBonusBalance: { decrement: bonusAmount },
          },
        });

        // 3. Crear registro en el historial de transacciones de Wallet
        const referredName =
          bonus.referredUser.storeName ||
          bonus.referredUser.name ||
          bonus.referredUser.botCode ||
          "Cliente";

        await tx.walletTransaction.create({
          data: {
            userId: bonus.referrerId,
            amount: bonusAmount,
            type: "CREDIT",
            description: `Bono de Referido liberado (+$${bonusAmount.toFixed(
              2
            )} USD) por compras de ${referredName}`,
          },
        });
      });

      releasedCount++;
    }

    if (releasedCount > 0) {
      console.log(`[ReferralRelease] Se liberaron exitosamente ${releasedCount} bonos a Wallet.`);
    }

    return releasedCount;
  } catch (error: any) {
    console.error("[ReferralRelease Error]:", error.message);
    return 0;
  }
}
