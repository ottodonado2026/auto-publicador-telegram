import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUserSubscription } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [campaigns, telegramAccount, membership, user, todaySentCount] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: session.userId },
        include: {
          _count: {
            select: { logs: true },
          },
          logs: {
            take: 50,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.telegramAccount.findFirst({
        where: { userId: session.userId },
      }),
      validateUserSubscription(session.userId),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          storeName: true,
          name: true,
          phoneNumber: true,
          role: true,
          walletBalance: true,
          subscription: true,
        },
      }),
      prisma.messageLog.count({
        where: {
          campaign: { userId: session.userId },
          status: "SENT",
          createdAt: { gte: startOfDay },
        },
      }),
    ]);

    const maxCampQuota = user?.subscription?.maxCampaigns || 2;
    const maxDailyPosts =
      maxCampQuota >= 8 ? 500 : maxCampQuota >= 5 ? 300 : maxCampQuota >= 3 ? 200 : 100;

    return NextResponse.json({
      campaigns,
      telegramAccount,
      membership,
      user,
      todaySentCount,
      maxDailyPosts,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Zero-Trust: Validar membresía vigente en el servidor
    const membership = await validateUserSubscription(session.userId);
    if (!membership.hasAccess) {
      return NextResponse.json({
        error: "Tu membresía ha expirado. Realiza una recarga para crear y activar campañas.",
      }, { status: 403 });
    }

    const { name, messageContent, mediaUrl, intervalMinutes, targetGroupIds, useSystemFarm } = await req.json();

    if (!name || !messageContent) {
      return NextResponse.json({ error: "El nombre y el texto del anuncio son obligatorios" }, { status: 400 });
    }

    // Verificar cuántas campañas ACTIVAS tiene actualmente y cuál es el límite de su plan
    const [activeCount, userSub] = await Promise.all([
      prisma.campaign.count({
        where: { userId: session.userId, status: "ACTIVE" },
      }),
      prisma.subscription.findUnique({
        where: { userId: session.userId },
      }),
    ]);

    const maxAllowedActive = userSub?.maxCampaigns || 2;
    // Si aún tiene cupo de campañas activas, se activa de inmediato; si ya llenó su cupo, se guarda en PAUSED en su Biblioteca de Copys
    const initialStatus = activeCount < maxAllowedActive ? "ACTIVE" : "PAUSED";

    let account = await prisma.telegramAccount.findFirst({
      where: useSystemFarm 
        ? { isSystemAccount: true, status: "CONNECTED" } 
        : { userId: session.userId, status: "CONNECTED" },
    });

    if (!account) {
      account = await prisma.telegramAccount.findFirst({
        where: { userId: session.userId },
      });
    }

    if (!account) {
      account = await prisma.telegramAccount.create({
        data: {
          userId: session.userId,
          phoneNumber: "Pendiente",
          status: "DISCONNECTED",
        },
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.userId,
        telegramAccountId: account.id,
        name,
        messageContent,
        mediaUrl: mediaUrl || null,
        intervalMinutes: Number(intervalMinutes) || 60,
        targetGroupIds: targetGroupIds || [],
        status: initialStatus,
        nextRunAt: new Date(Date.now() + (Number(intervalMinutes) || 60) * 60 * 1000),
      },
    });

    // Si quedó ACTIVE, disparar la primera ronda en segundo plano
    if (initialStatus === "ACTIVE") {
      import("@/lib/broadcaster").then(({ runCampaignBroadcast }) => {
        runCampaignBroadcast(campaign.id).catch((err) =>
          console.error("Error en difusión automática inicial:", err)
        );
      });
    }

    return NextResponse.json({
      success: true,
      campaign,
      savedAsPaused: initialStatus === "PAUSED",
      message:
        initialStatus === "PAUSED"
          ? `Tu copy se guardó en tu Biblioteca ("Mis Copys Guardados") en pausa porque ya tienes el máximo de ${maxAllowedActive} campañas activas de tu plan.`
          : "¡Campaña creada y activada en piloto automático!",
    });
  } catch (error: any) {
    console.error("Error al crear campaña:", error);
    return NextResponse.json({ error: "Error interno al guardar campaña" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { id, status, name, messageContent, mediaUrl, intervalMinutes, targetGroupIds, useSystemFarm } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de campaña requerido" }, { status: 400 });
    }

    // Si intenta ACTIVAR una campaña que estaba en PAUSED, verificar que no supere el cupo de su plan
    if (status === "ACTIVE") {
      const [activeCount, userSub, currentCamp] = await Promise.all([
        prisma.campaign.count({
          where: { userId: session.userId, status: "ACTIVE", id: { not: id } },
        }),
        prisma.subscription.findUnique({
          where: { userId: session.userId },
        }),
        prisma.campaign.findFirst({
          where: { id, userId: session.userId },
        }),
      ]);

      const maxAllowedActive = userSub?.maxCampaigns || 2;
      if (currentCamp?.status !== "ACTIVE" && activeCount >= maxAllowedActive) {
        return NextResponse.json(
          {
            error: `Tu plan actual permite hasta ${maxAllowedActive} campañas activas al mismo tiempo. Pausa primero una de tus campañas en curso para activar este copy.`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) {
      updateData.status = status;
      if (status === "ACTIVE") {
        updateData.nextRunAt = new Date(Date.now() + (Number(intervalMinutes) || 60) * 60 * 1000);
      }
    }
    if (name !== undefined) updateData.name = name;
    if (messageContent !== undefined) updateData.messageContent = messageContent;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;
    if (intervalMinutes !== undefined) updateData.intervalMinutes = Number(intervalMinutes) || 60;
    if (targetGroupIds !== undefined) updateData.targetGroupIds = targetGroupIds;

    if (useSystemFarm !== undefined) {
      const account = await prisma.telegramAccount.findFirst({
        where: useSystemFarm
          ? { isSystemAccount: true, status: "CONNECTED" }
          : { userId: session.userId, status: "CONNECTED" },
      });
      if (account) {
        updateData.telegramAccountId = account.id;
      }
    }

    const campaign = await prisma.campaign.updateMany({
      where: { id, userId: session.userId },
      data: updateData,
    });

    // Si la acaba de activar desde la biblioteca de copys, disparar ronda inmediata
    if (status === "ACTIVE") {
      import("@/lib/broadcaster").then(({ runCampaignBroadcast }) => {
        runCampaignBroadcast(id).catch((err) =>
          console.error("Error al emitir campaña recién activada:", err)
        );
      });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Error al actualizar campaña:", error);
    return NextResponse.json({ error: "Error al actualizar campaña" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de copy requerido" }, { status: 400 });
    }

    await prisma.campaign.deleteMany({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({ success: true, message: "Copy eliminado permanentemente" });
  } catch (error) {
    console.error("Error al eliminar copy:", error);
    return NextResponse.json({ error: "Error al eliminar el copy" }, { status: 500 });
  }
}
