import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createTelegramClient, cleanPhoneNumber } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, phoneCode, newPassword, password2fa } = await req.json();

    if (!phoneNumber || !phoneCode || !newPassword) {
      return NextResponse.json(
        { error: "Número, código de Telegram y nueva contraseña requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);

    const pending = await prisma.pendingAuthSession.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!pending || new Date() > pending.expiresAt) {
      return NextResponse.json(
        { error: "La sesión de verificación ha expirado o no existe. Solicita un nuevo código." },
        { status: 400 }
      );
    }

    const data = JSON.parse(pending.dataJson || "{}");
    const resetUserId = data.resetUserId;

    if (!resetUserId) {
      return NextResponse.json(
        { error: "Datos de recuperación no válidos." },
        { status: 400 }
      );
    }

    // Validar código con Telegram
    const client = createTelegramClient(pending.sessionString);
    await client.connect();

    try {
      await (client as any).invoke(
        new (await import("telegram/tl")).Api.auth.SignIn({
          phoneNumber: cleanPhone,
          phoneCodeHash: pending.phoneCodeHash,
          phoneCode: phoneCode.trim(),
        })
      );
    } catch (err: any) {
      if (err.message && err.message.includes("SESSION_PASSWORD_NEEDED")) {
        if (password2fa) {
          await (client as any).signInWithPassword({ password: password2fa });
        } else {
          return NextResponse.json({
            require2fa: true,
            message: "Tu cuenta de Telegram tiene contraseña 2FA activa. Ingrésala para continuar.",
          });
        }
      } else {
        console.error("Código de Telegram incorrecto:", err);
        return NextResponse.json(
          { error: err.message || "Código incorrecto de Telegram." },
          { status: 400 }
        );
      }
    }

    // Hashear la nueva contraseña y actualizar en Neon
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetUserId },
      data: { passwordHash, updatedAt: new Date() },
    });

    // Limpiar sesión pendiente
    await prisma.pendingAuthSession.delete({
      where: { phoneNumber: cleanPhone },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error: any) {
    console.error("Error en reset-password-verify:", error);
    return NextResponse.json(
      { error: error.message || "Error al verificar código y actualizar contraseña" },
      { status: 500 }
    );
  }
}
