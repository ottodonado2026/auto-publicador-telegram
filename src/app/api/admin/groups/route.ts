import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createTelegramClient } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Obtiene el directorio maestro de todos los grupos únicos vinculados por los clientes
 * y de todos los grupos registrados en message_logs.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const [campaigns, logs] = await Promise.all([
      prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          targetGroupIds: true,
          userId: true,
          user: {
            select: {
              id: true,
              botCode: true,
              email: true,
              storeName: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      }),
      prisma.messageLog.findMany({
        where: { status: "SENT" },
        select: {
          targetGroupId: true,
          targetGroupName: true,
          sentAt: true,
          campaign: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  botCode: true,
                  email: true,
                  storeName: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    const groupMap = new Map<
      string,
      {
        identifier: string;
        title: string;
        addedByStores: Set<string>;
        userIds: Set<string>;
        totalSentCount: number;
        lastSentAt: Date | null;
      }
    >();

    const userGroupMap = new Map<
      string,
      {
        userId: string;
        botCode: string;
        userName: string;
        email: string;
        phoneNumber: string;
        groupKeys: Set<string>;
      }
    >();

    // Procesar grupos de las campañas de cada cliente
    for (const c of campaigns) {
      const targets = Array.isArray(c.targetGroupIds) ? (c.targetGroupIds as string[]) : [];
      const u = c.user;
      const storeLabel = u?.storeName || u?.name || u?.email || "Cliente";
      const uid = u?.id || c.userId;

      if (!userGroupMap.has(uid)) {
        userGroupMap.set(uid, {
          userId: uid,
          botCode: u?.botCode || "BOT-I000000",
          userName: storeLabel,
          email: u?.email || "",
          phoneNumber: u?.phoneNumber || "",
          groupKeys: new Set<string>(),
        });
      }

      for (const raw of targets) {
        const clean = raw
          .replace(/https?:\/\/t\.me\//, "")
          .replace(/^t\.me\//, "")
          .replace(/^@/, "")
          .trim();

        if (!clean) continue;

        const key = clean.toLowerCase();
        userGroupMap.get(uid)!.groupKeys.add(key);

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            identifier: clean,
            title: clean,
            addedByStores: new Set([storeLabel]),
            userIds: new Set([uid]),
            totalSentCount: 0,
            lastSentAt: null,
          });
        } else {
          groupMap.get(key)!.addedByStores.add(storeLabel);
          groupMap.get(key)!.userIds.add(uid);
        }
      }
    }

    // Enriquecer con nombres reales e historial de message_logs
    for (const log of logs) {
      const clean = log.targetGroupId
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim();

      if (!clean) continue;
      const key = clean.toLowerCase();
      const u = log.campaign?.user;
      const uid = u?.id || log.campaign?.userId || "historial";
      const storeLabel = u?.storeName || u?.name || u?.email || "Historial";

      if (u && !userGroupMap.has(uid)) {
        userGroupMap.set(uid, {
          userId: uid,
          botCode: u.botCode || "BOT-I000000",
          userName: storeLabel,
          email: u.email || "",
          phoneNumber: "",
          groupKeys: new Set<string>(),
        });
      }
      if (userGroupMap.has(uid)) {
        userGroupMap.get(uid)!.groupKeys.add(key);
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          identifier: clean,
          title: log.targetGroupName || clean,
          addedByStores: new Set([storeLabel]),
          userIds: new Set([uid]),
          totalSentCount: 1,
          lastSentAt: log.sentAt,
        });
      } else {
        const entry = groupMap.get(key)!;
        if (log.targetGroupName && log.targetGroupName !== clean) {
          entry.title = log.targetGroupName;
        }
        entry.addedByStores.add(storeLabel);
        entry.userIds.add(uid);
        entry.totalSentCount += 1;
        if (!entry.lastSentAt || (log.sentAt && log.sentAt > entry.lastSentAt)) {
          entry.lastSentAt = log.sentAt;
        }
      }
    }

    const groups = Array.from(groupMap.values()).map((g) => ({
      identifier: g.identifier,
      link: `https://t.me/${g.identifier}`,
      title: g.title,
      stores: Array.from(g.addedByStores),
      userIds: Array.from(g.userIds),
      totalSentCount: g.totalSentCount,
      lastSentAt: g.lastSentAt,
    }));

    const usersWithGroups = Array.from(userGroupMap.values())
      .map((u) => {
        const userGroups = Array.from(u.groupKeys)
          .map((k) => {
            const g = groupMap.get(k);
            if (!g) return null;
            return {
              identifier: g.identifier,
              link: `https://t.me/${g.identifier}`,
              title: g.title,
              totalSentCount: g.totalSentCount,
              lastSentAt: g.lastSentAt,
            };
          })
          .filter(Boolean);

        return {
          userId: u.userId,
          botCode: u.botCode,
          userName: u.userName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          groupsCount: userGroups.length,
          groups: userGroups,
        };
      })
      .filter((u) => u.groupsCount > 0);

    return NextResponse.json({
      totalUniqueGroups: groups.length,
      groups,
      usersWithGroups,
    });
  } catch (error: any) {
    console.error("Error en GET /api/admin/groups:", error);
    return NextResponse.json({ error: "No autorizado o error interno" }, { status: 500 });
  }
}

/**
 * Permite al SuperAdmin emitir una campaña propia (ej. promocionando OttBot)
 * a los grupos seleccionados de toda la base de datos usando los bots de la granja.
 */
export async function POST(req: NextRequest) {
  const connectedClients: any[] = [];
  try {
    await requireSuperAdmin();
    const { messageContent, targetGroups } = await req.json();

    if (!messageContent || !Array.isArray(targetGroups) || targetGroups.length === 0) {
      return NextResponse.json(
        { error: "Escribe el mensaje promocional y selecciona al menos 1 grupo." },
        { status: 400 }
      );
    }

    const farmAccounts = await prisma.telegramAccount.findMany({
      where: {
        isSystemAccount: true,
        status: "CONNECTED",
        sessionString: { not: null },
      },
    });

    if (farmAccounts.length === 0) {
      return NextResponse.json(
        { error: "No hay cuentas conectadas en la Granja del SuperAdmin para emitir." },
        { status: 400 }
      );
    }

    for (const acc of farmAccounts) {
      try {
        const sessionString = decrypt(acc.sessionString!);
        const client = createTelegramClient(sessionString);
        await client.connect();
        connectedClients.push({ client, account: acc });
      } catch (e) {
        console.error("Error conectando bot de granja:", e);
      }
    }

    if (connectedClients.length === 0) {
      return NextResponse.json(
        { error: "No se pudo conectar ninguna cuenta MTProto de la granja." },
        { status: 500 }
      );
    }

    const tl = await import("telegram/tl");
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targetGroups.length; i++) {
      const cleanTarget = targetGroups[i]
        .replace(/https?:\/\/t\.me\//, "")
        .replace(/^t\.me\//, "")
        .replace(/^@/, "")
        .trim();

      if (!cleanTarget) continue;

      const worker = connectedClients[i % connectedClients.length];
      try {
        let entity: any = null;
        try {
          entity = await worker.client.getEntity(cleanTarget);
        } catch {
          const res = await worker.client.invoke(
            new tl.Api.contacts.ResolveUsername({ username: cleanTarget })
          );
          entity = res.chats?.[0] || res.peer;
        }

        try {
          await worker.client.invoke(new tl.Api.channels.JoinChannel({ channel: entity }));
        } catch {}

        await worker.client.sendMessage(entity, {
          message: messageContent,
          parseMode: "md",
        });

        sentCount++;
        if (i < targetGroups.length - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err) {
        console.error(`Error enviando promo OttBot a @${cleanTarget}:`, err);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      message: `Difusión Global OttBot finalizada: ${sentCount} enviados con éxito (${failedCount} fallidos).`,
    });
  } catch (error: any) {
    console.error("Error en POST /api/admin/groups:", error);
    return NextResponse.json({ error: error.message || "Error al emitir promoción" }, { status: 500 });
  } finally {
    for (const w of connectedClients) {
      try {
        await w.client.disconnect();
      } catch {}
    }
  }
}
