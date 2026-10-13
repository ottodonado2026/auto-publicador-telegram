import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const [rawUsers, stats] = await Promise.all([
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
      (async () => {
        const totalUsers = await prisma.user.count();
        const activeSubscriptions = await prisma.subscription.count({
          where: {
            status: { in: ["ACTIVE", "TRIAL"] },
            expiresAt: { gt: new Date() },
          },
        });
        const totalTelegrams = await prisma.telegramAccount.count();
        const totalCampaigns = await prisma.campaign.count();
        return { totalUsers, activeSubscriptions, totalTelegrams, totalCampaigns };
      })(),
    ]);

    // Asegurar que todos los usuarios tengan su código BOT-IXXXXXX
    const users = await Promise.all(
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

    return NextResponse.json({ users, stats });
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
      return NextResponse.json({ error: "Debes proporcionar userId o el código BOT-IXXXXXX del usuario" }, { status: 400 });
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
            description: `Recarga manual por código ${botCode ? `(${String(botCode).toUpperCase()}) ` : ""}(+$${amount.toFixed(2)} USD)`,
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

        // Si ya expiró, extendemos a partir de hoy; si está activa, acumulamos días
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
          // Registrar pago administrativo
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
