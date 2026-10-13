import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateUserSubscription } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        botCode: true,
        email: true,
        phoneNumber: true,
        storeName: true,
        name: true,
        role: true,
        isActive: true,
        walletBalance: true,
        createdAt: true,
        subscription: true,
        walletTransactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        telegramAccounts: {
          select: {
            id: true,
            phoneNumber: true,
            firstName: true,
            username: true,
            status: true,
            isSystemAccount: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false, error: "Usuario inactivo" }, { status: 403 });
    }

    if (!user.botCode) {
      const newBotCode = `BOT-I${Math.floor(100000 + Math.random() * 900000)}`;
      await prisma.user.update({
        where: { id: user.id },
        data: { botCode: newBotCode },
      });
      user = { ...user, botCode: newBotCode };
    }

    const membership = await validateUserSubscription(user.id);

    return NextResponse.json({
      authenticated: true,
      user,
      membership,
    });
  } catch (error) {
    console.error("Error en /api/auth/me:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
