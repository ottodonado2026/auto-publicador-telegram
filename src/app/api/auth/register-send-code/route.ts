import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  TELEGRAM_API_ID, 
  TELEGRAM_API_HASH, 
  createTelegramClient, 
  cleanPhoneNumber 
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Regex estricto para validar correos reales
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const { storeName, phoneNumber, email, password } = await req.json();

    if (!storeName || !phoneNumber || !email || !password) {
      return NextResponse.json(
        { error: "Nombre de tienda, número de Telegram, correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Por favor ingresa un correo electrónico real y válido (ejemplo: usuario@dominio.com)" },
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

    // Validar si el teléfono ya está registrado en usuarios
    const existingPhone = await prisma.user.findFirst({
      where: { phoneNumber: cleanPhone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Este número de teléfono ya está registrado. Por favor inicia sesión." },
        { status: 409 }
      );
    }

    // Validar si el correo ya está registrado en usuarios
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Este correo electrónico ya está registrado con otra cuenta." },
        { status: 409 }
      );
    }

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

    // Guardar la sesión generada en StringSession de GramJS
    const sessionString = (client.session as any).save();

    // Persistir de forma atómica en Neon (válido por 10 minutos)
    // Esto garantiza que funcione en entornos Serverless de Vercel sin importar qué función atienda el verify
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingAuthSession.upsert({
      where: { phoneNumber: cleanPhone },
      create: {
        phoneNumber: cleanPhone,
        phoneCodeHash,
        sessionString,
        dataJson: JSON.stringify({
          storeName: storeName.trim(),
          email: cleanEmail,
          passwordHash,
          name: storeName.trim(),
        }),
        expiresAt,
      },
      update: {
        phoneCodeHash,
        sessionString,
        dataJson: JSON.stringify({
          storeName: storeName.trim(),
          email: cleanEmail,
          passwordHash,
          name: storeName.trim(),
        }),
        expiresAt,
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
