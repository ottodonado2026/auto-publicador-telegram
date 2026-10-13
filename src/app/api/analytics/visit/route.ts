import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";

    await prisma.landingVisit.create({
      data: {
        visitorHash: ip,
        lang: body?.lang || "es",
        currency: body?.currency || "USD",
        referrer: body?.referrer || null,
      },
    });

    const [totalUsers, totalSentPosts, totalVisits] = await Promise.all([
      prisma.user.count(),
      prisma.messageLog.count({ where: { status: "SENT" } }),
      prisma.landingVisit.count(),
    ]);

    return NextResponse.json({
      success: true,
      totalUsers,
      totalSentPosts,
      totalVisits,
    });
  } catch (error) {
    console.error("Error registrando visita a landing:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET() {
  try {
    const [totalUsers, totalSentPosts, totalVisits] = await Promise.all([
      prisma.user.count(),
      prisma.messageLog.count({ where: { status: "SENT" } }),
      prisma.landingVisit.count(),
    ]);
    return NextResponse.json({
      totalUsers,
      totalSentPosts,
      totalVisits,
    });
  } catch {
    return NextResponse.json({ totalUsers: 0, totalSentPosts: 0, totalVisits: 0 });
  }
}
