import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let client: any = null;

  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const requestedAccountId = searchParams.get("accountId");

    // Obtener todas las cuentas conectadas del usuario
    const connectedAccounts = await prisma.telegramAccount.findMany({
      where: {
        userId: session.userId,
        status: "CONNECTED",
        sessionString: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        groups: [],
        accounts: [],
        message: "No tienes una cuenta de Telegram conectada aún.",
      });
    }

    // Elegir la cuenta solicitada o por defecto la primera cuenta conectada
    const account =
      (requestedAccountId
        ? connectedAccounts.find((a) => a.id === requestedAccountId)
        : null) || connectedAccounts[0];

    if (!account || !account.sessionString) {
      return NextResponse.json({
        success: false,
        groups: [],
        accounts: connectedAccounts.map((a) => ({
          id: a.id,
          phoneNumber: a.phoneNumber,
          firstName: a.firstName,
          username: a.username,
        })),
        message: "La cuenta de Telegram seleccionada no tiene sesión activa.",
      });
    }

    const sessionString = decrypt(account.sessionString);
    client = createTelegramClient(sessionString);
    await client.connect();

    // Obtener los diálogos (chats) exclusivos de esa cuenta de Telegram
    const dialogs = await client.getDialogs({ limit: 120 });

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
          accountPhone: account.phoneNumber,
        };
      });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        firstName: account.firstName,
        username: account.username,
      },
      accounts: connectedAccounts.map((a) => ({
        id: a.id,
        phoneNumber: a.phoneNumber,
        firstName: a.firstName,
        username: a.username,
      })),
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
