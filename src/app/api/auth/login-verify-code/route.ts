import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { createTelegramClient, cleanPhoneNumber } from "@/lib/telegram";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, phoneCode, password2fa } = await req.json();

    if (!phoneNumber || !phoneCode) {
      return NextResponse.json(
        { error: "Número de teléfono y código de verificación requeridos" },
        { status: 400 }
      );
    }

    const cleanPhone = cleanPhoneNumber(phoneNumber);

    // Protección Anti-Brute Force para intentos de código OTP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown-ip";
    const rateKey = `otp:${ip}:${cleanPhone}`;
    const limitCheck = checkRateLimit(rateKey);
    if (limitCheck.isBlocked) {
      return NextResponse.json(
        {
          error: `Demasiados intentos de código fallidos. Espera ${limitCheck.remainingMinutes} minutos e intenta de nuevo.`,
        },
        { status: 429 }
      );
    }

    // Recuperar sesión pendiente persistida en Neon
    const pending = await prisma.pendingAuthSession.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!pending || new Date() > pending.expiresAt) {
      return NextResponse.json(
        { error: "La sesión de verificación ha expirado o no existe. Por favor solicita un nuevo código iniciando sesión." },
        { status: 400 }
      );
    }

    const sessionData = JSON.parse(pending.dataJson || "{}");
    const loginUserId = sessionData.loginUserId;

    if (!loginUserId) {
      return NextResponse.json(
        { error: "Datos de sesión inválidos. Por favor vuelve a iniciar sesión." },
        { status: 400 }
      );
    }

    if (pending.phoneCodeHash === "SUPERADMIN_DIRECT_MSG") {
      if (pending.sessionString.trim() !== String(phoneCode).trim()) {
        const attempt = recordFailedAttempt(rateKey);
        return NextResponse.json(
          {
            error: attempt.locked
              ? "Demasiados intentos fallidos. Solicita un nuevo código en 15 minutos."
              : `Código de seguridad 2FA incorrecto. Te quedan ${attempt.remainingAttempts} intento(s).`,
          },
          { status: 400 }
        );
      }
      clearRateLimit(rateKey);
    } else {
      // Reconstruir cliente MTProto con la sesión persistida
      const client = createTelegramClient(pending.sessionString);
      await client.connect();

      // Verificar el código recibido en Telegram MTProto
      try {
        await (client as any).invoke(
          new (await import("telegram/tl")).Api.auth.SignIn({
            phoneNumber: cleanPhone,
            phoneCodeHash: pending.phoneCodeHash,
            phoneCode: String(phoneCode).trim(),
          })
        );
        clearRateLimit(rateKey);
      } catch (err: any) {
        if (err.message && err.message.includes("SESSION_PASSWORD_NEEDED")) {
          if (password2fa) {
            await (client as any).signInWithPassword({
              password: password2fa,
            });
            clearRateLimit(rateKey);
          } else {
            return NextResponse.json({
              require2fa: true,
              message: "Tu cuenta de Telegram tiene contraseña de verificación en dos pasos (2FA). Ingrésala para continuar.",
            });
          }
        } else {
          recordFailedAttempt(rateKey);
          console.error("Código de Telegram incorrecto en login:", err);
          return NextResponse.json(
            { error: err.message || "Código incorrecto o expirado de Telegram." },
            { status: 400 }
          );
        }
      }
    }

    // Buscar el usuario en Neon
    const user = await prisma.user.findUnique({
      where: { id: loginUserId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Limpiar sesión pendiente de Neon
    await prisma.pendingAuthSession.delete({
      where: { phoneNumber: cleanPhone },
    }).catch(() => null);

    // Firmar JWT
    const token = signToken({
      userId: user.id,
      email: user.email || user.phoneNumber || "",
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "¡Sesión iniciada correctamente!",
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        storeName: user.storeName,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error en login-verify-code:", error);
    return NextResponse.json(
      { error: error.message || "Error al verificar código de acceso" },
      { status: 500 }
    );
  }
}
