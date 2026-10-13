import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUserSubscription } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();

    const [campaigns, telegramAccount, membership, user] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: session.userId },
        include: {
          _count: {
            select: { logs: true },
          },
          logs: {
            take: 10,
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
        },
      }),
    ]);

    return NextResponse.json({
      campaigns,
      telegramAccount,
      membership,
      user,
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
        error: "Tu membresía ha expirado. Realiza una recarga diaria para crear y activar campañas.",
      }, { status: 403 });
    }

    const { name, messageContent, mediaUrl, intervalMinutes, targetGroupIds, useSystemFarm } = await req.json();

    if (!name || !messageContent) {
      return NextResponse.json({ error: "El nombre y el texto del anuncio son obligatorios" }, { status: 400 });
    }

    // Buscar la cuenta a usar (o una cuenta de la granja del sistema si seleccionó esa modalidad)
    let account = await prisma.telegramAccount.findFirst({
      where: useSystemFarm 
        ? { isSystemAccount: true, status: "CONNECTED" } 
        : { userId: session.userId, status: "CONNECTED" },
    });

    // Si aún no hay cuenta conectada para la granja de prueba, vinculamos con la del usuario o temporal
    if (!account) {
      account = await prisma.telegramAccount.findFirst({
        where: { userId: session.userId },
      });
    }

    if (!account) {
      // Si no tiene cuenta, creamos el placeholder para que no rompa el flujo de creación de copy
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
        status: "ACTIVE",
        nextRunAt: new Date(),
      },
    });

    // Disparar la primera ronda de difusión en segundo plano
    import("@/lib/broadcaster").then(({ runCampaignBroadcast }) => {
      runCampaignBroadcast(campaign.id).catch((err) =>
        console.error("Error en difusión automática inicial:", err)
      );
    });

    return NextResponse.json({ success: true, campaign });
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

    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (messageContent !== undefined) updateData.messageContent = messageContent;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl || null;
    if (intervalMinutes !== undefined) updateData.intervalMinutes = Number(intervalMinutes) || 60;
    if (targetGroupIds !== undefined) updateData.targetGroupIds = targetGroupIds;

    // Si actualiza la modalidad de cuenta o granja
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

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Error al actualizar campaña:", error);
    return NextResponse.json({ error: "Error al actualizar campaña" }, { status: 500 });
  }
}
