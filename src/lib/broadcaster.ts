import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";
import { validateUserSubscription } from "@/lib/membership";

export interface BroadcastResult {
  target: string;
  status: "SENT" | "FAILED";
  groupTitle?: string;
  error?: string;
}

/**
 * Ejecuta una ronda de difusión para una campaña específica
 */
export async function runCampaignBroadcast(campaignId: string): Promise<{
  success: boolean;
  results: BroadcastResult[];
  error?: string;
}> {
  let client: any = null;

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

    // Determinar la cuenta de Telegram a usar
    let account: any = campaign.telegramAccount;

    // Si la cuenta asociada no tiene sesión o es un placeholder, buscar una cuenta de la granja activa
    if (!account?.sessionString) {
      account = await prisma.telegramAccount.findFirst({
        where: { isSystemAccount: true, status: "CONNECTED" },
      });
    }

    if (!account?.sessionString) {
      return {
        success: false,
        results: [],
        error: "No hay ninguna cuenta de Telegram disponible (ni personal ni de la granja) para emitir el mensaje.",
      };
    }

    // Descifrar la sesión MTProto GramJS
    const sessionString = decrypt(account.sessionString);
    client = createTelegramClient(sessionString);
    await client.connect();

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

    const results: BroadcastResult[] = [];
    const tl = await import("telegram/tl");

    for (const rawTarget of targets) {
      const cleanTarget = rawTarget
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim();

      if (!cleanTarget) continue;

      try {
        // Resolver entidad de Telegram (grupo, canal o supergrupo)
        let entity: any = null;
        try {
          entity = await client.getEntity(cleanTarget);
        } catch (e: any) {
          // Si es un canal público, intentar unirse
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

        // Si es un canal o supergrupo, unirse automáticamente si aún no somos miembros
        try {
          await client.invoke(
            new tl.Api.channels.JoinChannel({
              channel: entity,
            })
          );
        } catch (joinErr: any) {
          // Ignorar si ya era miembro o no requiere JoinChannel
          console.log(`JoinChannel info para @${cleanTarget}:`, joinErr?.message || "OK");
        }

        // Enviar mensaje con foto o solo texto
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

        // Registrar en message_logs como SENT
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
          status: "SENT",
        });

        // Delay anti-baneo de seguridad (mínimo 3 segundos entre envíos en ronda manual)
        if (targets.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (sendError: any) {
        console.error(`Error al enviar a ${rawTarget}:`, sendError);
        const errMsg = sendError.message || "Error al publicar";

        // Registrar en message_logs como FAILED
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
          status: "FAILED",
          error: errMsg,
        });
      }
    }

    // Actualizar próxima ejecución de la campaña
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + (campaign.intervalMinutes || 60));

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        nextRunAt: nextRun,
        updatedAt: new Date(),
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
    if (client) {
      try {
        await client.disconnect();
      } catch (e) {
        // Ignorar error al desconectar
      }
    }
  }
}
