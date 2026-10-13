import { NextResponse } from "next/server";
import { processDueCampaigns } from "@/lib/broadcaster";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await processDueCampaigns();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error("Error en cron scheduler:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar cola de difusión" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
