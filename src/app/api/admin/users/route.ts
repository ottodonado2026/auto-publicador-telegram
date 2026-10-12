import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const [users, stats] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
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

// Endpoint para recargar días o cambiar estado de membresía manualmente
export async function PATCH(req: NextRequest) {
  try {
    await requireSuperAdmin();
    const { userId, daysToAdd, status, isActive } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    }

    if (daysToAdd !== undefined || status !== undefined) {
      const currentSub = await prisma.subscription.findUnique({
        where: { userId },
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
          where: { userId },
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

    return NextResponse.json({ success: true, message: "Usuario actualizado correctamente" });
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
