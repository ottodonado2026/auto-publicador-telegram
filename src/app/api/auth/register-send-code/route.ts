import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  TELEGRAM_API_ID, 
  TELEGRAM_API_HASH, 
  createTelegramClient, 
  pendingTelegramAuths, 
  cleanPhoneNumber 
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { storeName, phoneNumber, email, password } = await req.json();

    if (!storeName || !phoneNumber || !password) {
      return NextResponse.json(
        { error: "Nombre de tienda, número de Telegram y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { error: "Por favor ingresa un número de teléfono válido con código de país (ej: +573011762109)" },
        { status: 400 }
      );
    }

    // Verificar si el teléfono ya está registrado
    const existingPhone = await prisma.user.findFirst({
      where: { phoneNumber: cleanPhone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Este número de teléfono ya está registrado. Por favor inicia sesión." },
        { status: 409 }
      );
    }

    // Verificar si el correo ya está registrado (si fue ingresado)
    if (email && email.trim()) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Este correo electrónico ya está registrado con otra cuenta." },
          { status: 409 }
        );
      }
    }

    // Hashear la contraseña por adelantado
    const passwordHash = await bcrypt.hash(password, 10);

    // Instanciar cliente GramJS MTProto y conectar
    const client = createTelegramClient("");
    await client.connect();

    // Solicitar código oficial a Telegram para este número
    const { phoneCodeHash } = await client.sendCode(
      {
        apiId: TELEGRAM_API_ID,
        apiHash: TELEGRAM_API_HASH,
      },
      cleanPhone
    );

    // Almacenar en memoria pendiente de verificación
    pendingTelegramAuths.set(cleanPhone, {
      client,
      phoneCodeHash,
      phoneNumber: cleanPhone,
      createdAt: Date.now(),
      registerData: {
        storeName: storeName.trim(),
        email: email && email.trim() ? email.trim().toLowerCase() : undefined,
        passwordHash,
        name: storeName.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Código de verificación enviado exitosamente a tu Telegram al número ${cleanPhone}`,
      phoneNumber: cleanPhone,
      phoneCodeHash,
    });
  } catch (error: any) {
    console.error("Error en register-send-code:", error);
    return NextResponse.json(
      {
        error: error.message || "Error al comunicarse con Telegram. Verifica que tu número tenga el formato internacional (+57...)",
      },
      { status: 500 }
    );
  }
}
