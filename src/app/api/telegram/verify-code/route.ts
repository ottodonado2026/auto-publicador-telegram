import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { pendingTelegramAuths } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { phoneNumber, phoneCode, password } = await req.json();

    const pending = pendingTelegramAuths.get(session.userId);

    if (!pending || !pending.client) {
      return NextResponse.json(
        { error: "La sesión de verificación ha expirado. Por favor, solicita el código nuevamente." },
        { status: 400 }
      );
    }

    const { client, phoneCodeHash } = pending;

    // Firmar con el código recibido en GramJS MTProto
    await (client as any).invoke(
      new (await import("telegram/tl")).Api.auth.SignIn({
        phoneNumber: pending.phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );

    // Extraer la sesión persistente de GramJS
    const sessionString = (client.session as any).save();

    // Obtener los datos del usuario conectado
    const me: any = await client.getMe();

    // Cifrar la sesión MTProto con AES-256 antes de guardarla en Neon
    const encryptedSession = encrypt(sessionString);

    // Determinar si es una cuenta de la granja del sistema (si el rol es SUPERADMIN)
    const isSystemAccount = session.role === "SUPERADMIN";

    // Guardar o actualizar en Neon PostgreSQL
    const account = await prisma.telegramAccount.upsert({
      where: { id: (await prisma.telegramAccount.findFirst({ where: { userId: session.userId, phoneNumber: pending.phoneNumber } }))?.id || "new-placeholder" },
      update: {
        sessionString: encryptedSession,
        telegramUserId: String(me?.id || ""),
        firstName: me?.firstName || "",
        username: me?.username || null,
        status: "CONNECTED",
        isSystemAccount,
      },
      create: {
        userId: session.userId,
        phoneNumber: pending.phoneNumber,
        sessionString: encryptedSession,
        telegramUserId: String(me?.id || ""),
        firstName: me?.firstName || "",
        username: me?.username || null,
        status: "CONNECTED",
        isSystemAccount,
      },
    });

    // Limpiar estado temporal de memoria
    pendingTelegramAuths.delete(session.userId);

    return NextResponse.json({
      success: true,
      message: "¡Cuenta de Telegram conectada y sesión cifrada exitosamente!",
      account: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        firstName: account.firstName,
        username: account.username,
        isSystemAccount: account.isSystemAccount,
      },
    });
  } catch (error: any) {
    console.error("Error al verificar código Telegram:", error);
    return NextResponse.json(
      { error: error.message || "Código incorrecto o expirado." },
      { status: 500 }
    );
  }
}
