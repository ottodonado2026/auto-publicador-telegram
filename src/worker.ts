import { processDueCampaigns } from "./lib/broadcaster";
import { releaseDueReferralBonuses } from "./lib/referralRelease";

let isRunning = true;

process.on("SIGINT", () => {
  console.log("\n🛑 [Worker Daemon] Apagando de forma segura...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 [Worker Daemon] Recibida señal SIGTERM...");
  isRunning = false;
  process.exit(0);
});

async function main() {
  console.log("=================================================");
  console.log("🚀 [OttBot PRO - 24/7 Background Worker Daemon]");
  console.log("   Plataforma de Autopublicación & Difusión");
  console.log(`   Iniciado a las: ${new Date().toISOString()}`);
  console.log("   Conectado a Neon PostgreSQL");
  console.log("=================================================\n");

  let loopCounter = 0;

  while (isRunning) {
    try {
      loopCounter++;

      // 1. Procesar campañas listas para emitir en Telegram
      const broadcastRes = await processDueCampaigns();
      if (broadcastRes && (broadcastRes as any).processedCount > 0) {
        console.log(
          `[${new Date().toLocaleTimeString("es-CO")}] Difusión: Procesadas ${(broadcastRes as any).processedCount} campañas.`
        );
      }

      // 2. Cada ~5 minutos (10 ciclos de 30s), revisar si hay bonos de referidos para liberar
      if (loopCounter % 10 === 0) {
        const released = await releaseDueReferralBonuses();
        if (released > 0) {
          console.log(
            `[${new Date().toLocaleTimeString("es-CO")}] Bonos: Se liberaron ${released} comisiones a billeteras.`
          );
        }
      }
    } catch (err: any) {
      console.error("[Worker Exception]", err.message);
    }

    // Esperar 30 segundos antes de verificar la siguiente tanda
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

main().catch((err) => {
  console.error("[Worker Fatal]", err);
  process.exit(1);
});
