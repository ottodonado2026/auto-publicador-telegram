import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";
import { 
  TELEGRAM_API_ID, 
  TELEGRAM_API_HASH, 
  createTelegramClient, 
  cleanPhoneNumber 
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Teléfono / Tienda / Correo y contraseña requeridos" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const cleanPhone = cleanPhoneNumber(trimmed);

    // Barrera Anti-Brute Force (Zero Trust & Anti-Kali/Burp Suite)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown-ip";
    const rateLimitKey = `${ip}:${trimmed.toLowerCase()}`;

    const limitCheck = checkRateLimit(rateLimitKey);
    if (limitCheck.isBlocked) {
      return NextResponse.json(
        {
          error: `Acceso bloqueado temporalmente por seguridad (Anti-Brute Force). Demasiados intentos fallidos. Intenta nuevamente en ${limitCheck.remainingMinutes} minutos.`,
        },
        { status: 429 }
      );
    }

    // Buscar por teléfono, nombre de tienda o correo
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          { phoneNumber: trimmed },
          { storeName: { equals: trimmed, mode: "insensitive" } },
          { email: { equals: trimmed.toLowerCase(), mode: "insensitive" } },
        ],
      },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      const attempt = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { 
          error: attempt.locked 
            ? "Acceso bloqueado por 15 minutos por exceso de intentos." 
            : `Credenciales inválidas. Te quedan ${attempt.remainingAttempts} intento(s).` 
        }, 
        { status: attempt.locked ? 429 : 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Esta cuenta se encuentra inactiva o bloqueada. Contacta a soporte." },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const attempt = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { 
          error: attempt.locked 
            ? "Acceso bloqueado por 15 minutos por exceso de intentos fallidos." 
            : `Credenciales inválidas. Te quedan ${attempt.remainingAttempts} intento(s).` 
        }, 
        { status: attempt.locked ? 429 : 401 }
      );
    }

    // Limpiar contador de intentos tras autenticación correcta
    clearRateLimit(rateLimitKey);

    // El Administrador Principal puede acceder directamente sin riesgo de bloqueo por flood de Telegram
    if (user.role === "SUPERADMIN") {
      const token = signToken({
        userId: user.id,
        email: user.email || user.phoneNumber || "",
        role: user.role,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
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
    }

    // Para los clientes, verificamos con código de 5 dígitos a Telegram si tienen teléfono
    if (user.phoneNumber) {
      const clientPhone = cleanPhoneNumber(user.phoneNumber);
      
      const client = createTelegramClient("");
      await client.connect();

      const { phoneCodeHash } = await client.sendCode(
        {
          apiId: TELEGRAM_API_ID,
          apiHash: TELEGRAM_API_HASH,
        },
        clientPhone
      );

      const sessionString = (client.session as any).save();

      // Guardar en Neon con expiración de 10 minutos
      await prisma.pendingAuthSession.upsert({
        where: { phoneNumber: clientPhone },
        create: {
          phoneNumber: clientPhone,
          phoneCodeHash,
          sessionString,
          dataJson: JSON.stringify({ loginUserId: user.id }),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        update: {
          phoneCodeHash,
          sessionString,
          dataJson: JSON.stringify({ loginUserId: user.id }),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const maskedPhone =
        clientPhone.length > 6
          ? `${clientPhone.slice(0, 4)} ••• ••• ${clientPhone.slice(-3)}`
          : clientPhone;

      return NextResponse.json({
        requireOtp: true,
        phoneNumber: clientPhone,
        maskedPhone,
        message: `Te hemos enviado un código de acceso a tu Telegram oficial (${maskedPhone}).`,
      });
    }

    // Si es un usuario sin teléfono asignado, iniciar sesión directamente
    const token = signToken({
      userId: user.id,
      email: user.email || user.phoneNumber || "",
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
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
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor al iniciar sesión" },
      { status: 500 }
    );
  }
}
