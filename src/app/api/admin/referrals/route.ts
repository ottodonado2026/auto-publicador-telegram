import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReferralConfig, computeUserTier, ReferralTierConfig } from "@/lib/referralTiers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();

    const config = await getReferralConfig();

    // 1. Obtener todos los usuarios que han referido a otros
    const referrers = await prisma.user.findMany({
      where: {
        referrals: {
          some: {},
        },
      },
      select: {
        id: true,
        botCode: true,
        storeName: true,
        name: true,
        email: true,
        phoneNumber: true,
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
        },
        referralBonuses: {
          select: {
            id: true,
            amountUSD: true,
            sourceTxAmount: true,
            status: true,
            releaseDate: true,
            createdAt: true,
          },
        },
      },
    });

    // 2. Mapear y calcular estadísticas por afiliado
    const topAffiliates = referrers.map((u) => {
      const totalRefs = u.referrals.length;
      const totalEarnedUSD = u.referralBonuses.reduce(
        (sum, b) => sum + Number(b.amountUSD || 0),
        0
      );
      const totalReleasedUSD = u.referralBonuses
        .filter((b) => b.status === "RELEASED")
        .reduce((sum, b) => sum + Number(b.amountUSD || 0), 0);
      const totalPendingUSD = u.referralBonuses
        .filter((b) => b.status === "PENDING")
        .reduce((sum, b) => sum + Number(b.amountUSD || 0), 0);

      const tier = computeUserTier(totalRefs, config);

      return {
        id: u.id,
        botCode: u.botCode,
        name: u.name,
        storeName: u.storeName,
        email: u.email,
        phoneNumber: u.phoneNumber,
        totalRefs,
        totalEarnedUSD,
        totalReleasedUSD,
        totalPendingUSD,
        tier,
      };
    });

    // Ordenar por mayor cantidad de referidos
    topAffiliates.sort((a, b) => b.totalRefs - a.totalRefs);

    // 3. Totales globales
    const allBonuses = await prisma.referralBonus.findMany({
      select: {
        amountUSD: true,
        status: true,
      },
    });

    const globalPendingUSD = allBonuses
      .filter((b) => b.status === "PENDING")
      .reduce((sum, b) => sum + Number(b.amountUSD || 0), 0);

    const globalReleasedUSD = allBonuses
      .filter((b) => b.status === "RELEASED")
      .reduce((sum, b) => sum + Number(b.amountUSD || 0), 0);

    const totalReferredUsers = await prisma.user.count({
      where: {
        referredById: { not: null },
      },
    });

    // 4. Últimos bonos registrados
    const recentBonuses = await prisma.referralBonus.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: {
          select: {
            id: true,
            botCode: true,
            storeName: true,
            name: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            botCode: true,
            storeName: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      config,
      stats: {
        totalAffiliates: referrers.length,
        totalReferredUsers,
        globalPendingUSD,
        globalReleasedUSD,
        globalTotalBonusesUSD: globalPendingUSD + globalReleasedUSD,
      },
      topAffiliates,
      recentBonuses: recentBonuses.map((b) => ({
        id: b.id,
        amountUSD: Number(b.amountUSD),
        sourceTxAmount: Number(b.sourceTxAmount),
        status: b.status,
        releaseDate: b.releaseDate,
        createdAt: b.createdAt,
        referrerName: b.referrer.storeName || b.referrer.name || b.referrer.botCode,
        referrerCode: b.referrer.botCode,
        referredName: b.referredUser.storeName || b.referredUser.name || b.referredUser.botCode,
        referredCode: b.referredUser.botCode,
      })),
    });
  } catch (error: any) {
    console.error("Error en GET /api/admin/referrals:", error);
    return NextResponse.json(
      { error: error.message || "Error al cargar datos de afiliados" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await req.json();

    const {
      bronzeMinRefs,
      bronzePercent,
      silverMinRefs,
      silverPercent,
      goldMinRefs,
      goldPercent,
      retentionDays,
      isActive,
    } = body;

    const updated = await prisma.referralConfig.upsert({
      where: { id: "default" },
      update: {
        bronzeMinRefs: Number(bronzeMinRefs) || 1,
        bronzePercent: Number(bronzePercent) || 10.0,
        silverMinRefs: Number(silverMinRefs) || 5,
        silverPercent: Number(silverPercent) || 15.0,
        goldMinRefs: Number(goldMinRefs) || 15,
        goldPercent: Number(goldPercent) || 20.0,
        retentionDays: Number(retentionDays) || 7,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      create: {
        id: "default",
        bronzeMinRefs: Number(bronzeMinRefs) || 1,
        bronzePercent: Number(bronzePercent) || 10.0,
        silverMinRefs: Number(silverMinRefs) || 5,
        silverPercent: Number(silverPercent) || 15.0,
        goldMinRefs: Number(goldMinRefs) || 15,
        goldPercent: Number(goldPercent) || 20.0,
        retentionDays: Number(retentionDays) || 7,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reglas y porcentajes de referidos actualizados correctamente",
      config: updated,
    });
  } catch (error: any) {
    console.error("Error en POST /api/admin/referrals:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
