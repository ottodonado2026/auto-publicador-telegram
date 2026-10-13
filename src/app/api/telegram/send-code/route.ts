import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createTelegramClient, pendingTelegramAuths } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");

    // Instanciar cliente GramJS MTProto y conectar
    const client = createTelegramClient("");
    await client.connect();

    // Solicitar código a Telegram
    const { phoneCodeHash } = await client.sendCode(
      {
        apiId: Number(process.env.TELEGRAM_API_ID || "30337191"),
        apiHash: process.env.TELEGRAM_API_HASH || "20e01d075ae793b54ed4249518a61314",
      },
      cleanPhone
    );

    // Guardar cliente pendiente asociado al usuario
    pendingTelegramAuths.set(session.userId, {
      client,
      phoneCodeHash,
      phoneNumber: cleanPhone,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado exitosamente por Telegram",
      phoneCodeHash,
    });
  } catch (error: any) {
    console.error("Error en send-code Telegram:", error);
    return NextResponse.json(
      { error: error.message || "Error al solicitar código a Telegram. Verifica el formato del número (+57...)" },
      { status: 500 }
    );
  }
}
