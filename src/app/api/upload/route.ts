import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se seleccionó ningún archivo" }, { status: 400 });
    }

    // Validar tipo de imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes (PNG, JPG, WEBP)" }, { status: 400 });
    }

    // Convertir a base64 Data URL (óptimo para Serverless / Vercel sin almacenar en disco local)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al procesar la imagen" }, { status: 500 });
  }
}
