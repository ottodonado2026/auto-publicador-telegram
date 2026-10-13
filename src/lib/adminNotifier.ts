import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";

const ADMIN_RECIPIENTS = ["streamzonesupport", "+573002084859"];

/**
 * Envía un mensaje desde la cuenta de la granja (@ottbotoficial) al Telegram personal del Administrador
 */
export async function sendTelegramAdminAlert(messageText: string): Promise<boolean> {
  try {
    const farmAccount = await prisma.telegramAccount.findFirst({
      where: {
        status: "CONNECTED",
        OR: [
          { isSystemAccount: true },
          { phoneNumber: { contains: "3011762109" } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    if (!farmAccount || !farmAccount.sessionString) {
      console.warn("[AdminNotifier] No hay cuenta de granja conectada para enviar alertas.");
      return false;
    }

    const sessionStr = farmAccount.sessionString.includes(":")
      ? decrypt(farmAccount.sessionString)
      : farmAccount.sessionString;

    if (!sessionStr) return false;

    const tgClient = createTelegramClient(sessionStr);
    await tgClient.connect();

    let delivered = false;
    for (const recipient of ADMIN_RECIPIENTS) {
      try {
        await tgClient.sendMessage(recipient, { message: messageText });
        delivered = true;
        break;
      } catch (err) {
        // Intentar siguiente destinatario si falla
      }
    }

    // Copia de respaldo a "me" (Mensajes Guardados de la granja)
    try {
      await tgClient.sendMessage("me", { message: messageText });
    } catch {}

    await tgClient.disconnect();
    return delivered;
  } catch (error: any) {
    console.error("[AdminNotifier Error]:", error.message);
    return false;
  }
}

/**
 * Notificación cuando un nuevo usuario se registra
 */
export async function notifyAdminUserRegistered(data: {
  email?: string | null;
  phoneNumber?: string | null;
  storeName?: string | null;
  botCode?: string | null;
  referredByCode?: string | null;
}) {
  const refText = data.referredByCode ? `\n🔗 Invitado por: **${data.referredByCode}**` : "";
  const msg =
    `👤 **¡NUEVO USUARIO REGISTRADO EN OTTBOT!**\n\n` +
    `🏪 Negocio: **${data.storeName || "Sin nombre"}**\n` +
    `🔑 Código Bot: \`${data.botCode || "N/A"}\`\n` +
    `📱 Teléfono: \`${data.phoneNumber || "N/A"}\`\n` +
    `📧 Email: \`${data.email || "N/A"}\`` +
    refText +
    `\n⏰ Hora: ${new Date().toLocaleTimeString("es-CO")} • ${new Date().toLocaleDateString("es-CO")}`;

  return sendTelegramAdminAlert(msg);
}

/**
 * Notificación cuando entra un pago o recarga por Binance Pay
 */
export async function notifyAdminPaymentReceived(data: {
  amount: number;
  currency: string;
  orderId: string;
  userIdentifier: string;
  botCode?: string | null;
  mode: "WALLET" | "PLAN";
  planName?: string;
  bonusGenerated?: number;
}) {
  const bonusText = data.bonusGenerated
    ? `\n🎁 Bono de Referido generado: **+$${data.bonusGenerated.toFixed(2)} USD** (Pendiente 7d)`
    : "";

  const msg =
    `💰 **¡PAGO CONFIRMADO EN BINANCE PAY!**\n\n` +
    `💵 Monto Recibido: **+$${data.amount.toFixed(2)} ${data.currency}**\n` +
    `📌 Concepto: **${data.mode === "PLAN" ? `Compra de ${data.planName || "Plan"}` : "Recarga Directa a Wallet"}**\n` +
    `👤 Cliente: **${data.userIdentifier}** (${data.botCode || "N/A"})\n` +
    `🧾 Order ID: \`${data.orderId}\`` +
    bonusText +
    `\n\n⚡ Verificado y acreditado en Neon PostgreSQL.`;

  return sendTelegramAdminAlert(msg);
}

/**
 * Envía una alerta al Telegram personal de un cliente sobre un grupo con Captcha / Mute
 */
export async function notifyClientGroupProtection(data: {
  clientPhone: string;
  groupName: string;
  reason: string;
}) {
  try {
    const farmAccount = await prisma.telegramAccount.findFirst({
      where: {
        status: "CONNECTED",
        OR: [{ isSystemAccount: true }, { phoneNumber: { contains: "3011762109" } }],
      },
    });

    if (!farmAccount?.sessionString) return false;

    const sessionStr = farmAccount.sessionString.includes(":")
      ? decrypt(farmAccount.sessionString)
      : farmAccount.sessionString;

    const tgClient = createTelegramClient(sessionStr);
    await tgClient.connect();

    const cleanTarget = data.clientPhone.replace(/[\s\-\(\)]/g, "");
    await tgClient.sendMessage(cleanTarget, {
      message:
        `⚠️ **[OttBot Alerta de Publicación]**\n\n` +
        `No pudimos publicar en el grupo **@${data.groupName}**.\n\n` +
        `🔒 **Motivo:** ${data.reason}\n\n` +
        `👉 **Acción requerida:** Abre el grupo en Telegram desde tu celular y presiona el botón de verificación *"No soy un bot"* o acéptalo manualmente. Una vez hecho, OttBot reanudará las publicaciones automáticamente.`,
    });

    await tgClient.disconnect();
    return true;
  } catch (err) {
    console.warn("[notifyClientGroupProtection]", err);
    return false;
  }
}
