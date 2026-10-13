import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCampaignBroadcast } from "@/lib/broadcaster";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId requerido" }, { status: 400 });
    }

    // Verificar que la campaña pertenezca al usuario (o sea SUPERADMIN)
    const campaign = await prisma.campaign.findFirst({
      where: session.role === "SUPERADMIN" 
        ? { id: campaignId } 
        : { id: campaignId, userId: session.userId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    // Ejecutar la ronda de difusión
    const result = await runCampaignBroadcast(campaignId);

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error, results: result.results }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Ronda de difusión ejecutada con éxito",
      results: result.results,
    });
  } catch (error: any) {
    console.error("Error en /api/campaigns/broadcast:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al ejecutar la difusión" },
      { status: 500 }
    );
  }
}
