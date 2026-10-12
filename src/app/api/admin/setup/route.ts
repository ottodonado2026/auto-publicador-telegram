import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Endpoint para inicializar el SuperAdmin maestro directamente si no existe ninguno
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, setupKey } = await req.json();

    // Verificación de seguridad básica para inicialización
    const masterKey = process.env.JWT_SECRET || "teleblast_super_secret_jwt_key_2026_change_in_production";
    
    // Si ya existe un superadmin, no permitir re-inicializar por esta vía libre
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN" },
    });

    if (existingSuperAdmin && setupKey !== masterKey) {
      return NextResponse.json({ 
        error: "Ya existe un SuperAdmin registrado en el sistema. Inicia sesión con tus credenciales." 
      }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    // Vencimiento a 10 años para la cuenta del dueño
    const lifetimeExpiry = new Date();
    lifetimeExpiry.setFullYear(lifetimeExpiry.getFullYear() + 10);

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        role: "SUPERADMIN",
        passwordHash,
        name: name || "SuperAdmin Master",
        isActive: true,
      },
      create: {
        email: normalizedEmail,
        name: name || "SuperAdmin Master",
        passwordHash,
        role: "SUPERADMIN",
        isActive: true,
        subscription: {
          create: {
            status: "ACTIVE",
            dailyRate: 0,
            expiresAt: lifetimeExpiry,
            maxAccounts: 999,
            maxCampaigns: 999,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "¡Usuario SuperAdmin inicializado correctamente!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en setup-superadmin:", error);
    return NextResponse.json({ error: "Error al inicializar SuperAdmin" }, { status: 500 });
  }
}
