import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  let client: any = null;

  try {
    const session = await requireAuth();

    // Buscar la cuenta conectada del usuario
    const account = await prisma.telegramAccount.findFirst({
      where: { 
        userId: session.userId, 
        status: "CONNECTED",
        sessionString: { not: null },
      },
    });

    if (!account || !account.sessionString) {
      return NextResponse.json({
        success: false,
        groups: [],
        message: "No tienes una cuenta de Telegram conectada aún.",
      });
    }

    const sessionString = decrypt(account.sessionString);
    client = createTelegramClient(sessionString);
    await client.connect();

    // Obtener los diálogos (chats) de la cuenta de Telegram
    const dialogs = await client.getDialogs({ limit: 100 });

    // Filtrar solo grupos, supergrupos y canales
    const groups = dialogs
      .filter((d: any) => d.isGroup || d.isChannel)
      .map((d: any) => {
        const username = d.entity?.username ? d.entity.username : null;
        const link = username ? `t.me/${username}` : null;

        return {
          id: String(d.id),
          title: d.title || d.name || "Grupo de Telegram",
          username: username ? `@${username}` : null,
          link,
          isChannel: !!d.isChannel,
          isGroup: !!d.isGroup,
          unreadCount: d.unreadCount || 0,
        };
      });

    return NextResponse.json({
      success: true,
      account: {
        phoneNumber: account.phoneNumber,
        firstName: account.firstName,
        username: account.username,
      },
      groups,
    });
  } catch (error: any) {
    console.error("Error al obtener grupos de Telegram:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener lista de grupos de Telegram" },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch (e) {
        // Ignorar
      }
    }
  }
}
