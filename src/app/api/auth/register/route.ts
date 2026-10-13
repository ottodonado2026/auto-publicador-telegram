import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validar si el usuario ya existe
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Este correo electrónico ya está registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Contar usuarios para determinar si el primero es SUPERADMIN
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? "SUPERADMIN" : "CLIENT";

    // 1 día de prueba (Trial) de regalo al registrarse
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 1);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
        role,
        subscription: {
          create: {
            status: "TRIAL",
            dailyRate: 1.0,
            expiresAt: trialExpiry,
          },
        },
      },
    });

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
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error interno del servidor al registrarse" }, { status: 500 });
  }
}
