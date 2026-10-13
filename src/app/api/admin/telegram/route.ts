import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();

    const accounts = await prisma.telegramAccount.findMany({
      where: { isSystemAccount: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        username: true,
        status: true,
        createdAt: true,
        _count: {
          select: { campaigns: true, logs: true },
        },
      },
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
