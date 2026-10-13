import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";
import { decrypt } from "@/lib/crypto";
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

    // Si el usuario es SUPERADMIN, requerimos 2FA enviando un código de 5 dígitos al Telegram de la granja
    if (user.role === "SUPERADMIN") {
      const farmAccount = await prisma.telegramAccount.findFirst({
        where: {
          status: "CONNECTED",
          OR: [
            { isSystemAccount: true },
            { phoneNumber: { contains: "3002084859" } },
            { userId: user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      const adminPhone = cleanPhoneNumber(farmAccount?.phoneNumber || user.phoneNumber || "+573002084859");
      const securityCode = String(Math.floor(10000 + Math.random() * 90000));

      let sentViaDirectMsg = false;

      // Intentar enviar primero por mensaje directo a "me" (Mensajes Guardados) si la cuenta de la granja está conectada
      if (farmAccount?.sessionString) {
        try {
          let sessionStr = "";
          try {
            sessionStr = farmAccount.sessionString.includes(":")
              ? decrypt(farmAccount.sessionString)
              : farmAccount.sessionString;
          } catch {
            sessionStr = farmAccount.sessionString;
          }

          if (sessionStr) {
            const tgClient = createTelegramClient(sessionStr);
            await tgClient.connect();

            const messageText = `🔐 [OttBot PRO - SuperAdmin 2FA]\n\nTu código de verificación de 5 dígitos para acceder al Panel Rey es:\n\n👉 **${securityCode}** 👈\n\nVálido por 10 minutos. No compartas este código con nadie.`;

            // 1. Enviar a Mensajes Guardados de la cuenta de la granja (@ottbotoficial)
            try {
              await tgClient.sendMessage("me", { message: messageText });
            } catch (eMe) {
              console.warn("No se pudo enviar a me en Telegram:", eMe);
            }

            // 2. Enviar a la cuenta personal StreamZone (@streamzonesupport / +573002084859) para notificación push sonora
            const recipients = ["streamzonesupport", "+573002084859"];
            for (const r of recipients) {
              try {
                await tgClient.sendMessage(r, { message: messageText });
                console.log(`Código 2FA enviado con éxito a ${r}`);
                break;
              } catch (eRecip) {
                console.warn(`Intento de envío a ${r} omitido:`, eRecip);
              }
            }

            sentViaDirectMsg = true;

            const sessionData = {
              phoneCodeHash: "SUPERADMIN_DIRECT_MSG",
              sessionString: securityCode,
              dataJson: JSON.stringify({ loginUserId: user.id, isSuperAdminDirect: true }),
              expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            };

            await prisma.pendingAuthSession.upsert({
              where: { phoneNumber: adminPhone },
              create: {
                phoneNumber: adminPhone,
                ...sessionData,
              },
              update: sessionData,
            });

            // Guardar también bajo el número de StreamZone por si se verifica con ese número
            await prisma.pendingAuthSession.upsert({
              where: { phoneNumber: "+573002084859" },
              create: {
                phoneNumber: "+573002084859",
                ...sessionData,
              },
              update: sessionData,
            });
          }
        } catch (err) {
          console.error("No se pudo enviar por mensaje directo a Telegram, usando sendCode oficial:", err);
          sentViaDirectMsg = false;
        }
      }

      // Si no tiene sesión activa conectada o falló el envío directo, enviar por código oficial MTProto
      if (!sentViaDirectMsg) {
        const client = createTelegramClient("");
        await client.connect();

        const { phoneCodeHash } = await client.sendCode(
          {
            apiId: TELEGRAM_API_ID,
            apiHash: TELEGRAM_API_HASH,
          },
          adminPhone
        );

        const sessionString = (client.session as any).save();

        await prisma.pendingAuthSession.upsert({
          where: { phoneNumber: adminPhone },
          create: {
            phoneNumber: adminPhone,
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
      }

      const maskedPhone =
        adminPhone.length > 6
          ? `${adminPhone.slice(0, 4)} ••• ••• ${adminPhone.slice(-3)}`
          : adminPhone;

      return NextResponse.json({
        requireOtp: true,
        phoneNumber: adminPhone,
        maskedPhone,
        message: `Código de seguridad 2FA enviado al Telegram de tu granja (${maskedPhone}). Revisa tus Mensajes Guardados o notificaciones.`,
      });
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
