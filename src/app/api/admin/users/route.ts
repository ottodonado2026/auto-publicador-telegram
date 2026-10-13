import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      rawUsers,
      allPayments,
      allWalletTransactions,
      allTelegramAccounts,
      totalCampaigns,
      activeCampaignsCount,
      totalMessagesSent,
      visitsToday,
      visitsYesterday,
      visitsThisMonth,
      visitsLastMonth,
      visitsTotal,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          botCode: true,
          email: true,
          phoneNumber: true,
          storeName: true,
          name: true,
          role: true,
          isActive: true,
          walletBalance: true,
          createdAt: true,
          subscription: true,
          _count: {
            select: {
              telegramAccounts: true,
              campaigns: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        include: {
          subscription: {
            select: { userId: true, dailyRate: true },
          },
        },
        orderBy: { confirmedAt: "desc" },
      }),
      prisma.walletTransaction.findMany({
        include: {
          user: {
            select: { id: true, botCode: true, storeName: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.telegramAccount.findMany({
        select: {
          id: true,
          phoneNumber: true,
          firstName: true,
          username: true,
          status: true,
          isSystemAccount: true,
          userId: true,
          user: {
            select: { storeName: true, name: true, email: true, botCode: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.messageLog.count({ where: { status: "SENT" } }),
      prisma.landingVisit.count({ where: { createdAt: { gte: startOfToday } } }).catch(() => 0),
      prisma.landingVisit
        .count({ where: { createdAt: { gte: startOfYesterday, lt: startOfToday } } })
        .catch(() => 0),
      prisma.landingVisit.count({ where: { createdAt: { gte: startOfThisMonth } } }).catch(() => 0),
      prisma.landingVisit
        .count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } })
        .catch(() => 0),
      prisma.landingVisit.count().catch(() => 0),
    ]);

    // Asegurar que todos los usuarios tengan su código BOT-IXXXXXX
    const usersWithCodes = await Promise.all(
      rawUsers.map(async (u) => {
        if (!u.botCode) {
          const generatedCode = `BOT-I${Math.floor(100000 + Math.random() * 900000)}`;
          try {
            const updated = await prisma.user.update({
              where: { id: u.id },
              data: { botCode: generatedCode },
              select: { botCode: true },
            });
            return { ...u, botCode: updated.botCode };
          } catch {
            return { ...u, botCode: generatedCode };
          }
        }
        return u;
      })
    );

    // Calcular ingresos reales por usuario y globales
    // Consideramos como ingreso real las recargas acreditadas en Wallet (CREDIT) y pagos directos (Payment sin duplicar WALLET_PURCHASE)
    const userRevenueMap = new Map<string, number>();

    let revenueTodayUSD = 0;
    let revenueYesterdayUSD = 0;
    let revenueThisMonthUSD = 0;
    let revenueLastMonthUSD = 0;
    let totalRevenueUSD = 0;

    // Desglose por membresía comprada / activada
    const planBreakdown = {
      express1d: { count: 0, revenueUSD: 0 },
      semanal7d: { count: 0, revenueUSD: 0 },
      quincenal15d: { count: 0, revenueUSD: 0 },
      mensual30d: { count: 0, revenueUSD: 0 },
      extraAccounts: { count: 0, revenueUSD: 0 },
      walletTopups: { count: 0, revenueUSD: 0 },
    };

    // Procesar transacciones de Wallet
    for (const tx of allWalletTransactions) {
      const amt = Number(tx.amount || 0);
      const dt = new Date(tx.createdAt);

      if (tx.type === "CREDIT") {
        planBreakdown.walletTopups.count += 1;
        planBreakdown.walletTopups.revenueUSD += amt;

        totalRevenueUSD += amt;
        if (dt >= startOfToday) revenueTodayUSD += amt;
        else if (dt >= startOfYesterday && dt < startOfToday) revenueYesterdayUSD += amt;

        if (dt >= startOfThisMonth) revenueThisMonthUSD += amt;
        else if (dt >= startOfLastMonth && dt < startOfThisMonth) revenueLastMonthUSD += amt;

        userRevenueMap.set(tx.userId, (userRevenueMap.get(tx.userId) || 0) + amt);
      } else if (tx.type === "DEBIT") {
        const desc = (tx.description || "").toLowerCase();
        if (desc.includes("adicional") || desc.includes("extra")) {
          planBreakdown.extraAccounts.count += 1;
          planBreakdown.extraAccounts.revenueUSD += amt;
        }
      }
    }

    // Procesar pagos de planes (para clasificar ventas por plan y sumar recargas directas de días)
    for (const p of allPayments) {
      const amt = Number(p.amount || 0);
      const days = Number(p.daysAdded || 1);
      const dt = new Date(p.confirmedAt);
      const uid = p.subscription?.userId;

      if (days >= 28) {
        planBreakdown.mensual30d.count += 1;
        planBreakdown.mensual30d.revenueUSD += amt;
      } else if (days >= 14) {
        planBreakdown.quincenal15d.count += 1;
        planBreakdown.quincenal15d.revenueUSD += amt;
      } else if (days >= 6) {
        planBreakdown.semanal7d.count += 1;
        planBreakdown.semanal7d.revenueUSD += amt;
      } else {
        planBreakdown.express1d.count += 1;
        planBreakdown.express1d.revenueUSD += amt;
      }

      // Si fue recarga directa de días por Admin (no comprada con saldo Wallet ya contado en CREDIT), sumarla a ingresos
      if (p.reference === "ADMIN_RECHARGE") {
        totalRevenueUSD += amt;
        if (dt >= startOfToday) revenueTodayUSD += amt;
        else if (dt >= startOfYesterday && dt < startOfToday) revenueYesterdayUSD += amt;

        if (dt >= startOfThisMonth) revenueThisMonthUSD += amt;
        else if (dt >= startOfLastMonth && dt < startOfThisMonth) revenueLastMonthUSD += amt;

        if (uid) {
          userRevenueMap.set(uid, (userRevenueMap.get(uid) || 0) + amt);
        }
      }
    }

    // Enriquecer cada usuario con su total generado real y nombre de plan actual
    const users = usersWithCodes.map((u) => {
      const rate = Number(u.subscription?.dailyRate || 1.25);
      const planName =
        rate <= 0.85
          ? "Plan Mensual (30d)"
          : rate <= 0.95
          ? "Plan Quincenal (15d)"
          : rate <= 1.05
          ? "Plan Semanal (7d)"
          : "Pase Express (1d)";

      return {
        ...u,
        planName,
        totalGeneratedUSD: userRevenueMap.get(u.id) || 0,
      };
    });

    // Estadísticas de registros de usuarios por fecha
    const usersRegisteredToday = users.filter((u) => new Date(u.createdAt) >= startOfToday).length;
    const usersRegisteredYesterday = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d >= startOfYesterday && d < startOfToday;
    }).length;
    const usersRegisteredThisMonth = users.filter((u) => new Date(u.createdAt) >= startOfThisMonth).length;
    const usersRegisteredLastMonth = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d >= startOfLastMonth && d < startOfThisMonth;
    }).length;

    const activeSubscriptions = users.filter(
      (u) =>
        u.subscription &&
        (u.subscription.status === "ACTIVE" || u.subscription.status === "TRIAL") &&
        new Date(u.subscription.expiresAt) > now
    ).length;

    const farmAccounts = allTelegramAccounts.filter((a) => a.isSystemAccount);
    const clientAccounts = allTelegramAccounts.filter((a) => !a.isSystemAccount);

    const stats = {
      totalUsers: users.length,
      activeSubscriptions,
      totalTelegrams: allTelegramAccounts.length,
      farmAccountsCount: farmAccounts.length,
      clientAccountsCount: clientAccounts.length,
      totalCampaigns,
      activeCampaignsCount,
      totalMessagesSent,
      registrations: {
        today: usersRegisteredToday,
        yesterday: usersRegisteredYesterday,
        thisMonth: usersRegisteredThisMonth,
        lastMonth: usersRegisteredLastMonth,
      },
      revenue: {
        todayUSD: revenueTodayUSD,
        yesterdayUSD: revenueYesterdayUSD,
        thisMonthUSD: revenueThisMonthUSD,
        lastMonthUSD: revenueLastMonthUSD,
        totalUSD: totalRevenueUSD,
      },
      landingVisits: {
        today: visitsToday,
        yesterday: visitsYesterday,
        thisMonth: visitsThisMonth,
        lastMonth: visitsLastMonth,
        total: visitsTotal,
      },
      planBreakdown,
    };

    return NextResponse.json({
      users,
      stats,
      telegramAccounts: allTelegramAccounts,
      recentWalletTransactions: allWalletTransactions.slice(0, 30),
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado: Requiere rol SUPERADMIN" }, { status: 403 });
    }
    console.error("Error en /api/admin/users:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

// Endpoint para recargar días, saldo de Wallet (por userId o código BOT-IXXXXXX) o cambiar estado de membresía manualmente
export async function PATCH(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { userId, botCode, daysToAdd, walletCreditUSD, status, isActive } = await req.json();

    let targetUserId = userId as string | undefined;

    if (!targetUserId && botCode) {
      const normalized = String(botCode).trim().toUpperCase();
      const codeWithPrefix = normalized.startsWith("BOT-I")
        ? normalized
        : normalized.startsWith("BOT-")
        ? `BOT-I${normalized.replace(/^BOT-I?/i, "")}`
        : `BOT-I${normalized}`;

      const foundUser = await prisma.user.findFirst({
        where: {
          OR: [
            { botCode: { equals: normalized, mode: "insensitive" } },
            { botCode: { equals: codeWithPrefix, mode: "insensitive" } },
          ],
        },
      });

      if (!foundUser) {
        return NextResponse.json(
          { error: `No se encontró ningún usuario registrado con el código ${normalized}` },
          { status: 404 }
        );
      }
      targetUserId = foundUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Debes proporcionar userId o el código BOT-IXXXXXX del usuario" },
        { status: 400 }
      );
    }

    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive },
      });
    }

    // Si el SuperAdmin acredita saldo en la Wallet del usuario
    if (walletCreditUSD !== undefined && Number(walletCreditUSD) > 0) {
      const amount = Number(walletCreditUSD);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: targetUserId },
          data: {
            walletBalance: { increment: amount },
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: targetUserId,
            amount,
            type: "CREDIT",
            description: `Recarga acreditada por código ${
              botCode ? `(${String(botCode).toUpperCase()}) ` : ""
            }(+$${amount.toFixed(2)} USD)`,
          },
        }),
      ]);
    }

    if (daysToAdd !== undefined || status !== undefined) {
      const currentSub = await prisma.subscription.findUnique({
        where: { userId: targetUserId },
      });

      if (currentSub) {
        let newExpiresAt = new Date(currentSub.expiresAt);
        const now = new Date();

        const baseDate = newExpiresAt > now ? newExpiresAt : now;
        if (daysToAdd && Number(daysToAdd) > 0) {
          baseDate.setDate(baseDate.getDate() + Number(daysToAdd));
          newExpiresAt = baseDate;
        }

        await prisma.subscription.update({
          where: { userId: targetUserId },
          data: {
            expiresAt: newExpiresAt,
            status: status || (newExpiresAt > now ? "ACTIVE" : currentSub.status),
          },
        });

        if (daysToAdd && Number(daysToAdd) > 0) {
          await prisma.payment.create({
            data: {
              subscriptionId: currentSub.id,
              amount: Number(currentSub.dailyRate) * Number(daysToAdd),
              daysAdded: Number(daysToAdd),
              reference: "ADMIN_RECHARGE",
            },
          });
        }
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        botCode: true,
        name: true,
        storeName: true,
        email: true,
        walletBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acceso denegado: Requiere rol SUPERADMIN" }, { status: 403 });
    }
    console.error("Error en PATCH /api/admin/users:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
