export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Iniciar el ciclo automático 24/7 en segundo plano (Railway / Render / Servidor dedicado)
    const g = globalThis as any;
    if (!g.__ottbotSchedulerRunning) {
      g.__ottbotSchedulerRunning = true;
      console.log("🚀 [OttBot 24/7 Scheduler] Motor de difusión continua iniciado...");

      setInterval(async () => {
        try {
          const { processDueCampaigns } = await import("@/lib/broadcaster");
          const res = await processDueCampaigns();
          if (res.processedCount > 0) {
            console.log(`✅ [OttBot 24/7] Procesadas ${res.processedCount} campaña(s) programadas:`, res.details);
          }
        } catch (err) {
          console.error("⚠️ [OttBot 24/7] Error en ciclo automático:", err);
        }
      }, 60 * 1000); // Verifica cada 60 segundos
    }
  }
}
