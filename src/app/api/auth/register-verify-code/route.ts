import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { createTelegramClient, cleanPhoneNumber } from "@/lib/telegram";
import { notifyAdminUserRegistered } from "@/lib/adminNotifier";

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

    // Buscar la sesión pendiente en Neon (Serverless persistent)
    const pending = await prisma.pendingAuthSession.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!pending || new Date() > pending.expiresAt) {
      return NextResponse.json(
        { error: "La sesión de verificación ha expirado o no existe. Por favor solicita un nuevo código." },
        { status: 400 }
      );
    }

    const registerData = JSON.parse(pending.dataJson || "{}");
    if (!registerData.passwordHash) {
      return NextResponse.json(
        { error: "Datos de registro incompletos. Por favor vuelve a intentarlo." },
        { status: 400 }
      );
    }

    // Reconstruir el cliente GramJS con la sesión persistida
    const client = createTelegramClient(pending.sessionString);
    await client.connect();

    // Validar el código mediante Telegram MTProto
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
          await (client as any).signInWithPassword({
            password: password2fa,
          });
        } else {
          return NextResponse.json({
            require2fa: true,
            message: "Tu cuenta de Telegram tiene activada la verificación en dos pasos (2FA). Por favor escribe tu contraseña de Telegram.",
          });
        }
      } else {
        console.error("Error al validar código con Telegram:", err);
        return NextResponse.json(
          { error: err.message || "Código incorrecto o expirado de Telegram." },
          { status: 400 }
        );
      }
    }

    // Extraer sesión final y datos de usuario de Telegram
    let finalSessionString = "";
    let me: any = null;
    try {
      finalSessionString = (client.session as any).save();
      me = await client.getMe();
    } catch (err) {
      console.warn("No se pudo obtener sesión persistente o getMe de Telegram:", err);
    }

    // 24 horas exactas de prueba gratuita (Trial)
    const trialExpiry = new Date();
    trialExpiry.setHours(trialExpiry.getHours() + 24);

    // Determinar rol: Si no hay usuarios aún es SUPERADMIN, sino CLIENT
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? "SUPERADMIN" : "CLIENT";

    const generatedBotCode = `BOT-I${Math.floor(100000 + Math.random() * 900000)}`;

    // Buscar si fue invitado por un código de referido
    let referrerId: string | null = null;
    if (registerData.refCode) {
      const referrer = await prisma.user.findFirst({
        where: { botCode: registerData.refCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Crear el usuario en Neon PostgreSQL
    const user = await prisma.user.create({
      data: {
        botCode: generatedBotCode,
        referredById: referrerId,
        phoneNumber: cleanPhone,
        storeName: registerData.storeName,
        name: registerData.name || registerData.storeName,
        email: registerData.email || null,
        passwordHash: registerData.passwordHash,
        role,
        subscription: {
          create: {
            status: "TRIAL",
            dailyRate: 1.25,
            maxCampaigns: 2,
            maxAccounts: 1,
            expiresAt: trialExpiry,
          },
        },
        ...(finalSessionString ? {
          telegramAccounts: {
            create: {
              phoneNumber: cleanPhone,
              sessionString: encrypt(finalSessionString),
              telegramUserId: String(me?.id || ""),
              firstName: me?.firstName || registerData.storeName || "",
              username: me?.username || null,
              status: "CONNECTED",
              isSystemAccount: role === "SUPERADMIN",
            },
          },
        } : {}),
      },
    });

    // Enviar alerta instantánea al Telegram del Administrador
    notifyAdminUserRegistered({
      email: user.email,
      phoneNumber: user.phoneNumber,
      storeName: user.storeName,
      botCode: user.botCode,
      referredByCode: registerData.refCode || null,
    }).catch(() => {});

    // Limpiar sesión pendiente de Neon
    await prisma.pendingAuthSession.delete({
      where: { phoneNumber: cleanPhone },
    }).catch(() => null);

    // Generar JWT seguro
    const token = signToken({
      userId: user.id,
      email: user.email || user.phoneNumber || "",
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "¡Cuenta creada y verificada exitosamente con Telegram! Tienes 24 horas de prueba.",
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
    console.error("Error en register-verify-code:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al verificar y registrar usuario" },
      { status: 500 }
    );
  }
}
