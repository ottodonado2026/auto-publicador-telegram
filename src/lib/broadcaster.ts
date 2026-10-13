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

/**
 * Ejecuta una ronda de difusión para una campaña específica
 * Soportando Balanceo de Carga (Round-Robin) cuando se usa la Flota de Granja OttBot.
 */
export async function runCampaignBroadcast(campaignId: string): Promise<{
  success: boolean;
  results: BroadcastResult[];
  error?: string;
}> {
  const connectedClients: Map<string, { client: any; account: any }> = new Map();

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        telegramAccount: true,
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

    const targets = Array.isArray(campaign.targetGroupIds)
      ? (campaign.targetGroupIds as string[])
      : [];

    if (targets.length === 0) {
      return {
        success: false,
        results: [],
        error: "La campaña no tiene grupos asignados.",
      };
    }

    // Determinar el pool de cuentas de Telegram a usar
    // Si la campaña apunta a una cuenta de sistema (o la cuenta propia no tiene sesión), cargamos TODAS las cuentas conectadas de la granja
    let accountPool: any[] = [];
    const primaryAcc = campaign.telegramAccount;

    if (primaryAcc && !primaryAcc.isSystemAccount && primaryAcc.sessionString && primaryAcc.status === "CONNECTED") {
      // Usa la cuenta personal del cliente (o todas las cuentas personales conectadas de ese cliente si tiene plan multicuenta)
      const clientAccounts = await prisma.telegramAccount.findMany({
        where: {
          userId: campaign.userId,
          isSystemAccount: false,
          status: "CONNECTED",
          sessionString: { not: null },
        },
      });
      accountPool = clientAccounts.length > 0 ? clientAccounts : [primaryAcc];
    } else {
      // Usa la Flota de Granja del SuperAdmin (Balanceo Round-Robin entre los 5+ bots conectados)
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

    // Conectar los clientes GramJS del pool
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

    // Recorrer grupos repartiendo la carga en rotación (Round-Robin) entre el pool activo
    for (let i = 0; i < targets.length; i++) {
      const rawTarget = targets[i];
      const cleanTarget = rawTarget
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim();

      if (!cleanTarget) continue;

      // Seleccionar bot en rotación: índice i % total_bots
      const worker = activePool[i % activePool.length];
      const { client, account } = worker;

      try {
        let entity: any = null;
        try {
          entity = await client.getEntity(cleanTarget);
        } catch (e: any) {
          try {
            const res = await client.invoke(
              new tl.Api.contacts.ResolveUsername({ username: cleanTarget })
            );
            entity = res.chats?.[0] || res.peer;
          } catch (innerError) {
            throw new Error(`No se pudo localizar el grupo @${cleanTarget}`);
          }
        }

        if (!entity) {
          throw new Error(`Grupo o canal no encontrado: ${cleanTarget}`);
        }

        // Si aún no es miembro, intentar unirse
        try {
          await client.invoke(
            new tl.Api.channels.JoinChannel({
              channel: entity,
            })
          );
        } catch (joinErr: any) {
          // Ya es miembro o no requiere JoinChannel
        }

        // Enviar mensaje con foto o texto
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

        // Pausa antibaneo entre envíos
        if (i < targets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3500));
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

    // Actualizar fecha de última y próxima ejecución automática
    const now = new Date();
    const nextRun = new Date(now.getTime() + (campaign.intervalMinutes || 60) * 60 * 1000);

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        lastRunAt: now,
        nextRunAt: nextRun,
        updatedAt: now,
      },
    });

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
    for (const { client } of connectedClients.values()) {
      try {
        await client.disconnect();
      } catch (e) {
        // Ignorar error al desconectar
      }
    }
  }
}

/**
 * Procesador 24/7 para ejecutar todas las campañas activas cuya hora programada (nextRunAt) haya llegado.
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
        subscription: {
          status: { in: ["ACTIVE", "TRIAL"] },
          expiresAt: { gt: now },
        },
      },
    },
    take: 10,
  });

  const details = [];

  for (const camp of dueCampaigns) {
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
    processedCount: dueCampaigns.length,
    details,
  };
}
