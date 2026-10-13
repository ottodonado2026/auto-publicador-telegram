import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCampaignBroadcast } from "@/lib/broadcaster";

export const dynamic = "force-dynamic";

const EXTRA_ROUND_PRICE_USD = 1.0;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { campaignId, isPaidExtraRound } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId requerido" }, { status: 400 });
    }

    // Verificar que la campaña pertenezca al usuario (o sea SUPERADMIN)
    const campaign = await prisma.campaign.findFirst({
      where:
        session.role === "SUPERADMIN"
          ? { id: campaignId }
          : { id: campaignId, userId: session.userId },
      include: {
        user: {
          include: { subscription: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    // Verificar tope diario si no es Ronda Extra Pagada
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sentTodayCount = await prisma.messageLog.count({
      where: {
        campaign: { userId: campaign.userId },
        status: "SENT",
        createdAt: { gte: startOfToday },
      },
    });

    const maxCampQuota = campaign.user?.subscription?.maxCampaigns || 2;
    const maxDailyLimit =
      maxCampQuota >= 8 ? 500 : maxCampQuota >= 5 ? 300 : maxCampQuota >= 3 ? 200 : 100;

    if (!isPaidExtraRound && sentTodayCount >= maxDailyLimit) {
      return NextResponse.json(
        {
          error: `Ya alcanzaste las ${maxDailyLimit} publicaciones automáticas del día incluidas en tu plan. Puedes lanzar una Ronda Extra por $1.00 USD desde tu Wallet.`,
        },
        { status: 400 }
      );
    }

    // Si solicita Ronda Extra Pagada (+$1.00 USD desde su Wallet)
    if (isPaidExtraRound) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      const currentBalance = Number(user?.walletBalance || 0);

      if (currentBalance < EXTRA_ROUND_PRICE_USD) {
        return NextResponse.json(
          {
            error: `Saldo insuficiente en tu Wallet ($${currentBalance.toFixed(2)} USD). Necesitas $${EXTRA_ROUND_PRICE_USD.toFixed(2)} USD para lanzar una Ronda Extra Adicional.`,
          },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.userId },
          data: {
            walletBalance: { decrement: EXTRA_ROUND_PRICE_USD },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: session.userId,
            amount: EXTRA_ROUND_PRICE_USD,
            type: "DEBIT",
            description: `Ronda Extra Adicional en Vivo (${campaign.name})`,
          },
        }),
      ]);
    }

    // Lanzar la secuencia de difusión en segundo plano (con intervalo real de 60s entre cada grupo)
    runCampaignBroadcast(campaignId, {
      isPaidExtraRound: Boolean(isPaidExtraRound),
    }).catch((err) => console.error("Error en ronda en segundo plano:", err));

    return NextResponse.json({
      success: true,
      message: isPaidExtraRound
        ? "¡Ronda Extra ($1.00 USD) iniciada en vivo! Publicando un grupo cada 60 segundos..."
        : "¡Secuencia de difusión en vivo iniciada! Publicando un grupo cada 60 segundos...",
    });
  } catch (error: any) {
    console.error("Error en /api/campaigns/broadcast:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al ejecutar la difusión" },
      { status: 500 }
    );
  }
}
