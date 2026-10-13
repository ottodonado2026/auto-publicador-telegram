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
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
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

    // Ejecutar la ronda de difusión
    const result = await runCampaignBroadcast(campaignId, {
      isPaidExtraRound: Boolean(isPaidExtraRound),
    });

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error, results: result.results }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: isPaidExtraRound
        ? "¡Ronda Extra Adicional ($1.00 USD) completada con éxito!"
        : "Ronda de difusión ejecutada con éxito",
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error en /api/campaigns/broadcast:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al ejecutar la difusión" },
      { status: 500 }
    );
  }
}
