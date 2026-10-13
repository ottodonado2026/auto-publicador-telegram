import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { pendingTelegramAuths, cleanPhoneNumber } from "@/lib/telegram";

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
    const pending = pendingTelegramAuths.get(cleanPhone);

    if (!pending || !pending.client || !pending.loginUserId) {
      return NextResponse.json(
        { error: "La sesión de verificación ha expirado o no existe. Por favor solicita un nuevo código iniciando sesión." },
        { status: 400 }
      );
    }

    const { client, phoneCodeHash, loginUserId } = pending;

    // Verificar el código recibido en Telegram MTProto
    try {
      await (client as any).invoke(
        new (await import("telegram/tl")).Api.auth.SignIn({
          phoneNumber: cleanPhone,
          phoneCodeHash,
          phoneCode: phoneCode.trim(),
        })
      );
    } catch (err: any) {
      if (err.message && err.message.includes("SESSION_PASSWORD_NEEDED")) {
        if (password2fa) {
          await (client as any).signInWithPassword({
            password: password2fa,
          });
        } else {
          // El código de 5 dígitos fue válido, pero Telegram pide 2FA de Telegram
          return NextResponse.json({
            require2fa: true,
            message: "Tu cuenta de Telegram tiene contraseña de verificación en dos pasos (2FA). Ingrésala para continuar.",
          });
        }
      } else {
        console.error("Código de Telegram incorrecto en login:", err);
        return NextResponse.json(
          { error: err.message || "Código incorrecto o expirado de Telegram." },
          { status: 400 }
        );
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

    // Limpiar estado temporal en memoria
    pendingTelegramAuths.delete(cleanPhone);

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
