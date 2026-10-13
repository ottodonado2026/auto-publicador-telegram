import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";
import { validateUserSubscription } from "@/lib/membership";

export interface BroadcastResult {
  target: string;
  status: "SENT" | "FAILED";
  groupTitle?: string;
  botUsed?: string;
  error?: string;
}

// Candado en memoria para evitar ejecuciones duplicadas en la misma campaña
const g = globalThis as any;
if (!g.__activeBroadcastLocks) {
  g.__activeBroadcastLocks = new Set<string>();
}
const activeLocks: Set<string> = g.__activeBroadcastLocks;

/**
 * Obtiene el límite diario de publicaciones según los días contratados o el plan
 */
function getDailyPostLimitByRate(dailyRate: number): number {
  if (dailyRate <= 0.85) return 500; // Mensual
  if (dailyRate <= 0.95) return 300; // Quincenal
  if (dailyRate <= 1.05) return 200; // Semanal
  return 100; // Pase Express (1 Día)
}

/**
 * Ejecuta una ronda de difusión para una campaña específica
 * Con candado anti-duplicación, límite diario de publicaciones y balanceo Round-Robin.
 */
export async function runCampaignBroadcast(
  campaignId: string,
  options?: { isPaidExtraRound?: boolean }
): Promise<{
  success: boolean;
  results: BroadcastResult[];
  error?: string;
}> {
  // Evitar que se disparen 2 rondas de la misma campaña al mismo segundo
  if (activeLocks.has(campaignId)) {
    return {
      success: false,
      results: [],
      error: "Esta campaña ya está emitiendo una ronda en vivo en este momento.",
    };
  }

  activeLocks.add(campaignId);
  const connectedClients: Map<string, { client: any; account: any }> = new Map();

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        telegramAccount: true,
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!campaign) {
      return { success: false, results: [], error: "Campaña no encontrada" };
    }

    // Zero-Trust: Validar membresía vigente
    const membership = await validateUserSubscription(campaign.userId);
    if (!membership.hasAccess) {
      return {
        success: false,
        results: [],
        error: "Membresía expirada. Es necesario recargar para emitir mensajes.",
      };
    }

    // Mover inmediatamente nextRunAt hacia adelante para que el cron 24/7 no la vuelva a tomar mientras está enviando
    const intervalMins = campaign.intervalMinutes || 60;
    const immediateNextRun = new Date(Date.now() + intervalMins * 60 * 1000);
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: immediateNextRun,
      },
    });

    // Verificar cuántas publicaciones lleva hoy este usuario (desde las 00:00 de hoy)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sentTodayCount = await prisma.messageLog.count({
      where: {
        campaign: { userId: campaign.userId },
        status: "SENT",
        createdAt: { gte: startOfToday },
      },
    });

    const dailyRate = Number(campaign.user?.subscription?.dailyRate || 1.25);
    const maxCampSub = campaign.user?.subscription?.maxCampaigns || 2;
    const maxDailyLimit = maxCampSub >= 50 ? 99999 : getDailyPostLimitByRate(dailyRate);

    if (!options?.isPaidExtraRound && sentTodayCount >= maxDailyLimit) {
      return {
        success: false,
        results: [],
        error: `Has alcanzado el límite de ${maxDailyLimit} publicaciones diarias de tu plan hoy. Se reanudará automáticamente mañana o puedes adquirir una Ronda Extra por $1.00 USD.`,
      };
    }

    // Deduplicar grupos para nunca enviar 2 veces al mismo grupo en una misma ronda
    const rawTargets = Array.isArray(campaign.targetGroupIds)
      ? (campaign.targetGroupIds as string[])
      : [];

    const uniqueMap = new Map<string, string>();
    for (const t of rawTargets) {
      const cleanKey = t
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim()
        .toLowerCase();
      if (cleanKey && !uniqueMap.has(cleanKey)) {
        uniqueMap.set(cleanKey, t);
      }
    }
    const targets = Array.from(uniqueMap.values());

    if (targets.length === 0) {
      return {
        success: false,
        results: [],
        error: "La campaña no tiene grupos asignados.",
      };
    }

    // Determinar la cuenta de Telegram emisora asignada a esta campaña
    let accountPool: any[] = [];
    const primaryAcc = campaign.telegramAccount;

    if (primaryAcc && !primaryAcc.isSystemAccount && primaryAcc.sessionString && primaryAcc.status === "CONNECTED") {
      // Emitir con la cuenta de Telegram específica asignada a esta campaña (donde están unidos esos grupos)
      accountPool = [primaryAcc];
    } else {
      const farmAccounts = await prisma.telegramAccount.findMany({
        where: {
          isSystemAccount: true,
          status: "CONNECTED",
          sessionString: { not: null },
        },
      });
      accountPool = farmAccounts;
    }

    if (accountPool.length === 0) {
      return {
        success: false,
        results: [],
        error: "No hay ninguna cuenta de Telegram conectada (ni personal ni de la granja) disponible para emitir.",
      };
    }

    for (const acc of accountPool) {
      try {
        const sessionString = decrypt(acc.sessionString);
        const tgClient = createTelegramClient(sessionString);
        await tgClient.connect();
        connectedClients.set(acc.id, { client: tgClient, account: acc });
      } catch (connErr) {
        console.error(`Error al conectar cuenta ${acc.phoneNumber}:`, connErr);
      }
    }

    const activePool = Array.from(connectedClients.values());
    if (activePool.length === 0) {
      return {
        success: false,
        results: [],
        error: "No se pudo establecer conexión MTProto con las cuentas de Telegram.",
      };
    }

    const results: BroadcastResult[] = [];
    const tl = await import("telegram/tl");
    const remainingQuota = options?.isPaidExtraRound
      ? targets.length
      : Math.max(0, maxDailyLimit - sentTodayCount);

    const maxGroupsByPlan =
      dailyRate <= 0.85 ? 9999 : dailyRate <= 0.95 ? 100 : dailyRate <= 1.05 ? 50 : 25;

    const targetsToProcess = targets.slice(0, Math.min(maxGroupsByPlan, remainingQuota));

    for (let i = 0; i < targetsToProcess.length; i++) {
      const rawTarget = targetsToProcess[i];
      const cleanTarget = rawTarget
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim();

      if (!cleanTarget) continue;

      const worker = activePool[i % activePool.length];
      const { client, account } = worker;

      try {
        let entity: any = null;
        try {
          entity = await client.getEntity(cleanTarget);
        } catch {
          try {
            const res = await client.invoke(
              new tl.Api.contacts.ResolveUsername({ username: cleanTarget })
            );
            entity = res.chats?.[0] || res.peer;
          } catch {
            throw new Error(`No se pudo localizar el grupo @${cleanTarget}`);
          }
        }

        if (!entity) {
          throw new Error(`Grupo o canal no encontrado: ${cleanTarget}`);
        }

        try {
          await client.invoke(
            new tl.Api.channels.JoinChannel({
              channel: entity,
            })
          );
        } catch {}

        if (campaign.mediaUrl && campaign.mediaUrl.startsWith("data:image/")) {
          const base64Data = campaign.mediaUrl.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const { CustomFile } = await import("telegram/client/uploads");
          const toUpload = new CustomFile("banner.jpg", buffer.length, "", buffer);

          await client.sendFile(entity, {
            file: toUpload,
            caption: campaign.messageContent,
            parseMode: "md",
          });
        } else {
          await client.sendMessage(entity, {
            message: campaign.messageContent,
            parseMode: "md",
          });
        }

        const groupTitle = entity?.title || entity?.username || cleanTarget;

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            telegramAccountId: account.id,
            targetGroupId: rawTarget,
            targetGroupName: groupTitle,
            status: "SENT",
            sentAt: new Date(),
          },
        });

        results.push({
          target: rawTarget,
          groupTitle,
          botUsed: account.phoneNumber,
          status: "SENT",
        });

        // Pausa antibaneo real de 60 segundos entre grupo y grupo (para que la barra llegue de 60s a 0s)
        if (i < targetsToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      } catch (sendError: any) {
        console.error(`Error al enviar a ${rawTarget} con ${account.phoneNumber}:`, sendError);
        const errMsg = sendError.message || "Error al publicar";

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            telegramAccountId: account.id,
            targetGroupId: rawTarget,
            targetGroupName: cleanTarget,
            status: "FAILED",
            errorMessage: errMsg,
          },
        });

        results.push({
          target: rawTarget,
          botUsed: account.phoneNumber,
          status: "FAILED",
          error: errMsg,
        });
      }
    }

    // Al finalizar la ronda completa, programar el descanso real (60 o 120 min) a partir de este instante
    const finishedAt = new Date();
    const finalNextRun = new Date(finishedAt.getTime() + intervalMins * 60 * 1000);

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        lastRunAt: finishedAt,
        nextRunAt: finalNextRun,
        updatedAt: finishedAt,
      },
    });

    // Si en esta ronda ya se cumplió el total de publicaciones del día y el tiempo había vencido,
    // re-evaluar membresía para cobrar renovación automática de Wallet o pausar tras cumplir el ciclo
    const sentInRound = results.filter((r) => r.status === "SENT").length;
    if (sentTodayCount + sentInRound >= maxDailyLimit) {
      await validateUserSubscription(campaign.userId);
    }

    return {
      success: results.some((r) => r.status === "SENT"),
      results,
    };
  } catch (error: any) {
    console.error("Error global en broadcast:", error);
    return {
      success: false,
      results: [],
      error: error.message || "Error al procesar la difusión",
    };
  } finally {
    activeLocks.delete(campaignId);
    for (const { client } of connectedClients.values()) {
      try {
        await client.disconnect();
      } catch {}
    }
  }
}

/**
 * Procesador 24/7 para ejecutar todas las campañas activas cuya hora programada (nextRunAt) haya llegado.
 * Escalonado para nunca ejecutar dos campañas del mismo usuario en el mismo segundo.
 * Si la suscripción venció pero el usuario tiene saldo en su Wallet (o aún no termina las publicaciones de hoy),
 * validateUserSubscription renovará automáticamente la membresía con su Wallet o pausará cuando cumpla el ciclo.
 */
export async function processDueCampaigns(): Promise<{
  processedCount: number;
  details: { campaignId: string; name: string; sent: number; failed: number }[];
}> {
  const now = new Date();

  const dueCampaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { nextRunAt: { lte: now } },
        { nextRunAt: null },
      ],
      user: {
        isActive: true,
      },
    },
    orderBy: { nextRunAt: "asc" },
    take: 5,
  });

  const details = [];
  const processedUsersInThisTick = new Set<string>();

  for (const camp of dueCampaigns) {
    // Si el usuario tiene varias campañas vencidas al mismo tiempo, ejecutamos la primera ahora y escalonamos la segunda +5 minutos para que no choquen
    if (processedUsersInThisTick.has(camp.userId)) {
      await prisma.campaign.update({
        where: { id: camp.id },
        data: {
          nextRunAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      continue;
    }

    processedUsersInThisTick.add(camp.userId);
    const res = await runCampaignBroadcast(camp.id);
    const sent = res.results.filter((r) => r.status === "SENT").length;
    const failed = res.results.filter((r) => r.status === "FAILED").length;
    details.push({
      campaignId: camp.id,
      name: camp.name,
      sent,
      failed,
    });
  }

  return {
    processedCount: details.length,
    details,
  };
}
