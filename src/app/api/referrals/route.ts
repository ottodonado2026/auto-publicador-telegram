import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReferralConfig, computeUserTier } from "@/lib/referralTiers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        botCode: true,
        storeName: true,
        name: true,
        walletBalance: true,
        pendingBonusBalance: true,
        referrals: {
          select: {
            id: true,
            storeName: true,
            name: true,
            botCode: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        referralBonuses: {
          include: {
            referredUser: {
              select: {
                storeName: true,
                name: true,
                botCode: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Calcular totales
    const totalReferrals = user.referrals.length;
    
    // Bonos pendientes vs liberados
    const pendingBonuses = user.referralBonuses.filter((b) => b.status === "PENDING");
    const releasedBonuses = user.referralBonuses.filter((b) => b.status === "RELEASED");

    const totalPendingUSD = pendingBonuses.reduce(
      (sum, b) => sum + Number(b.amountUSD || 0),
      0
    );
    const totalReleasedUSD = releasedBonuses.reduce(
      (sum, b) => sum + Number(b.amountUSD || 0),
      0
    );

    const config = await getReferralConfig();
    const userTier = computeUserTier(totalReferrals, config);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://auto-publicador-telegram.vercel.app";
    const referralLink = `${baseUrl}/login?ref=${user.botCode || "BOT-PRO"}`;

    return NextResponse.json({
      botCode: user.botCode,
      referralLink,
      totalReferrals,
      totalPendingUSD,
      totalReleasedUSD,
      walletBalance: Number(user.walletBalance || 0),
      tier: userTier,
      config,
      referrals: user.referrals,
      bonuses: user.referralBonuses.map((b) => ({
        id: b.id,
        amountUSD: Number(b.amountUSD),
        sourceTxAmount: Number(b.sourceTxAmount),
        status: b.status,
        releaseDate: b.releaseDate,
        createdAt: b.createdAt,
        referredBusiness:
          b.referredUser.storeName || b.referredUser.name || b.referredUser.botCode || "Negocio",
      })),
    });
  } catch (error: any) {
    console.error("Error en /api/referrals:", error);
    return NextResponse.json(
      { error: error.message || "Error al consultar referidos" },
      { status: 500 }
    );
  }
}
