import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  TELEGRAM_API_ID, 
  TELEGRAM_API_HASH, 
  createTelegramClient, 
  cleanPhoneNumber 
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    let phoneToUse = body.phoneNumber;

    // Si está autenticado, usar su teléfono registrado
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (user?.phoneNumber) {
        phoneToUse = user.phoneNumber;
      }
    }

    if (!phoneToUse) {
      return NextResponse.json(
        { error: "No se encontró un número de Telegram asociado para enviar el código." },
        { status: 400 }
      );
    }

    const cleanPhone = cleanPhoneNumber(phoneToUse);

    // Verificar que el usuario exista
    const user = await prisma.user.findFirst({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No existe ninguna cuenta registrada con este número de Telegram." },
        { status: 404 }
      );
    }

    // Instanciar cliente GramJS y solicitar código oficial de Telegram
    const client = createTelegramClient("");
    await client.connect();

    const { phoneCodeHash } = await client.sendCode(
      {
        apiId: TELEGRAM_API_ID,
        apiHash: TELEGRAM_API_HASH,
      },
      cleanPhone
    );

    const sessionString = (client.session as any).save();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar en Neon para recuperación segura
    await prisma.pendingAuthSession.upsert({
      where: { phoneNumber: cleanPhone },
      create: {
        phoneNumber: cleanPhone,
        phoneCodeHash,
        sessionString,
        dataJson: JSON.stringify({ resetUserId: user.id }),
        expiresAt,
      },
      update: {
        phoneCodeHash,
        sessionString,
        dataJson: JSON.stringify({ resetUserId: user.id }),
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Código de seguridad enviado a tu app de Telegram al número ${cleanPhone}`,
      phoneNumber: cleanPhone,
    });
  } catch (error: any) {
    console.error("Error en reset-password-send-code:", error);
    return NextResponse.json(
      { error: error.message || "Error al solicitar código a Telegram" },
      { status: 500 }
    );
  }
}
