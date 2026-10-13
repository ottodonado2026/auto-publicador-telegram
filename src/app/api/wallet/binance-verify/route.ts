import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Credenciales configuradas en variables de entorno (.env / Vercel / Railway)
const BINANCE_API_KEY =
  process.env.BINANCE_API_KEY ||
  "gdXUidih2KRIrQbLxuK0jGfk3Q38AiEwlfHUkW0B0ya7waDPGXVjW4SFKguY7nsU";
const BINANCE_API_SECRET =
  process.env.BINANCE_API_SECRET ||
  "v8viz5yxA6njiWh9N1s1mhgckyQEEU2SICcTxQ0lDfIaKjKOXSDUyORxptSBqd4x";
const BINANCE_PAY_UID = process.env.BINANCE_PAY_UID || "1158258762";
const BINANCE_PAY_USERNAME = process.env.BINANCE_PAY_USERNAME || "streamofi";

const PLAN_PRICES: Record<
  string,
  { name: string; days: number; priceUSD: number; maxCampaigns: number; maxAccounts: number }
> = {
  "plan-1": { name: "Pase Express (1 Día)", days: 1, priceUSD: 1.25, maxCampaigns: 2, maxAccounts: 1 },
  "plan-2": { name: "Plan Semanal (7 Días)", days: 7, priceUSD: 7.00, maxCampaigns: 3, maxAccounts: 1 },
  "plan-3": { name: "Plan Quincenal (15 Días)", days: 15, priceUSD: 13.50, maxCampaigns: 5, maxAccounts: 2 },
  "plan-4": { name: "Plan Mensual (30 Días)", days: 30, priceUSD: 24.00, maxCampaigns: 8, maxAccounts: 3 },
};

const SUPPORTED_STABLECOINS = ["USDT", "FDUSD", "USDC", "BUSD"];

export async function GET() {
  return NextResponse.json({
    binanceUid: BINANCE_PAY_UID,
    binanceUsername: BINANCE_PAY_USERNAME,
    supportedCurrencies: SUPPORTED_STABLECOINS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const rawOrderId = String(body.orderId || "").trim();
    const mode: "WALLET" | "PLAN" = body.mode === "PLAN" ? "PLAN" : "WALLET";
    const planId: string | undefined = body.planId;

    if (!rawOrderId || rawOrderId.length < 6) {
      return NextResponse.json(
        {
          error:
            "Por favor ingresa un Order ID (ID de Orden) o ID de Transacción válido de Binance Pay.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    // 1. Verificar que este Order ID no haya sido utilizado antes en WalletTransaction ni en Payment
    const alreadyUsedTx = await prisma.walletTransaction.findFirst({
      where: {
        description: {
          contains: rawOrderId,
        },
      },
    });

    const alreadyUsedPayment = await prisma.payment.findFirst({
      where: {
        reference: rawOrderId,
      },
    });

    if (alreadyUsedTx || alreadyUsedPayment) {
      return NextResponse.json(
        {
          error: `El Order ID "${rawOrderId}" ya fue verificado y acreditado anteriormente. No se puede reclamar dos veces.`,
        },
        { status: 400 }
      );
    }

    // 2. Consultar historial de pagos de Binance Pay mediante firma HMAC-SHA256
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&limit=100`;
    const signature = crypto
      .createHmac("sha256", BINANCE_API_SECRET)
      .update(queryString)
      .digest("hex");

    const url = `https://api.binance.com/sapi/v1/pay/transactions?${queryString}&signature=${signature}`;

    const binanceRes = await fetch(url, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
      },
      cache: "no-store",
    });

    const binanceData = await binanceRes.json();

    if (!binanceRes.ok || binanceData.code !== "000000" || !Array.isArray(binanceData.data)) {
      console.error("Error consultando API de Binance Pay:", binanceData);
      return NextResponse.json(
        {
          error:
            "No se pudo conectar temporalmente con el verificador de Binance Pay. Intenta de nuevo en unos segundos.",
        },
        { status: 502 }
      );
    }

    // 3. Buscar la transacción que coincida por orderId, transactionId o nota exacta
    const matchedTx = binanceData.data.find((tx: any) => {
      const txOrderId = String(tx.orderId || "").trim();
      const txId = String(tx.transactionId || "").trim();
      const txNote = String(tx.note || "").trim();
      return (
        txOrderId === rawOrderId ||
        txId.toLowerCase() === rawOrderId.toLowerCase() ||
        (txNote && txNote.toLowerCase() === rawOrderId.toLowerCase())
      );
    });

    if (!matchedTx) {
      return NextResponse.json(
        {
          error: `No encontramos ningún pago recibido con el Order ID "${rawOrderId}" en la cuenta ${BINANCE_PAY_USERNAME} (UID: ${BINANCE_PAY_UID}). Verifica que hayas enviado el pago correctamente y espera 15 segundos si acabas de transferir.`,
        },
        { status: 404 }
      );
    }

    // 4. Doble verificación contra replay usando tanto orderId como transactionId reales de Binance
    const officialOrderId = String(matchedTx.orderId || rawOrderId);
    const officialTxId = String(matchedTx.transactionId || "");

    const duplicateOfficial = await prisma.walletTransaction.findFirst({
      where: {
        OR: [
          { description: { contains: officialOrderId } },
          ...(officialTxId ? [{ description: { contains: officialTxId } }] : []),
        ],
      },
    });

    if (duplicateOfficial) {
      return NextResponse.json(
        {
          error: `Este pago de Binance Pay (Order ID: ${officialOrderId}) ya fue acreditado previamente en el sistema.`,
        },
        { status: 400 }
      );
    }

    // 5. Validar que sea un ingreso positivo hacia nuestra cuenta UID
    const amountNum = parseFloat(String(matchedTx.amount || "0"));
    const receiverUid = String(matchedTx.receiverInfo?.binanceId || matchedTx.uid || "");

    if (isNaN(amountNum) || amountNum <= 0 || receiverUid !== BINANCE_PAY_UID) {
      return NextResponse.json(
        {
          error:
            "La transacción indicada no corresponde a un pago válido recibido en nuestra cuenta de Binance Pay.",
        },
        { status: 400 }
      );
    }

    // 6. Validar moneda estable (USDT / USDC / FDUSD / BUSD)
    const currency = String(matchedTx.currency || "").toUpperCase();
    if (!SUPPORTED_STABLECOINS.includes(currency)) {
      return NextResponse.json(
        {
          error: `El pago fue enviado en ${currency}. Solo se aceptan pagos en monedas equivalentes al dólar (${SUPPORTED_STABLECOINS.join(
            ", "
          )}). Contacta a soporte para revisión manual.`,
        },
        { status: 400 }
      );
    }

    const payerName = matchedTx.payerInfo?.name || "Usuario Binance";
    const payerUid = matchedTx.payerInfo?.binanceId || "";

    // =========================================================================
    // MODO A: ACTIVACIÓN DIRECTA DE UN PLAN CON BINANCE PAY
    // =========================================================================
    if (mode === "PLAN" && planId) {
      const plan = PLAN_PRICES[planId];
      if (!plan) {
        return NextResponse.json({ error: "El plan seleccionado no es válido." }, { status: 400 });
      }

      const currentWallet = Number(user.walletBalance || 0);
      const totalAvailable = Number((amountNum + currentWallet).toFixed(2));

      if (amountNum < plan.priceUSD && totalAvailable < plan.priceUSD) {
        // Si envió menos de lo que cuesta el plan y tampoco le alcanza sumando su Wallet,
        // le acreditamos el monto a su Wallet para que no pierda su dinero y le avisamos cuánto le falta.
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: { increment: amountNum } },
          }),
          prisma.walletTransaction.create({
            data: {
              userId: user.id,
              amount: amountNum,
              type: "CREDIT",
              description: `Binance Pay verificado (+$${amountNum.toFixed(
                2
              )} ${currency}) • OrderID: ${officialOrderId} • De: ${payerName} (${payerUid})`,
            },
          }),
        ]);

        const missing = (plan.priceUSD - totalAvailable).toFixed(2);
        return NextResponse.json({
          success: true,
          partial: true,
          message: `Recibimos tu pago de $${amountNum.toFixed(
            2
          )} ${currency} y lo acreditamos en tu Wallet. Para activar el ${
            plan.name
          } ($${plan.priceUSD.toFixed(2)} USD) solo te faltan $${missing} USD.`,
        });
      }

      // Calcular nueva expiración del plan
      const now = new Date();
      const currentExpires = user.subscription?.expiresAt
        ? new Date(user.subscription.expiresAt)
        : now;
      const isStillActive = currentExpires > now && user.subscription?.status === "ACTIVE";
      const baseDate = isStillActive ? currentExpires : now;
      const newExpiresAt = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

      // Diferencia a favor o a descontar de Wallet:
      // nuevoSaldo = currentWallet + amountNum - plan.priceUSD
      const walletDelta = Number((amountNum - plan.priceUSD).toFixed(2));

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            walletBalance:
              walletDelta >= 0
                ? { increment: walletDelta }
                : { decrement: Math.abs(walletDelta) },
          },
        }),
        // Registro 1: Ingreso de Binance Pay (para métricas y alertas de recarga del Admin)
        prisma.walletTransaction.create({
          data: {
            userId: user.id,
            amount: amountNum,
            type: "CREDIT",
            description: `Binance Pay verificado (+$${amountNum.toFixed(
              2
            )} ${currency}) • OrderID: ${officialOrderId} • TxID: ${officialTxId} • De: ${payerName}`,
          },
        }),
        // Registro 2: Activación del Plan
        prisma.walletTransaction.create({
          data: {
            userId: user.id,
            amount: plan.priceUSD,
            type: "DEBIT",
            description: `Activación directa con Binance Pay: ${plan.name} (+${plan.days} días • OrderID: ${officialOrderId})`,
          },
        }),
        prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            status: "ACTIVE",
            dailyRate: Number((plan.priceUSD / plan.days).toFixed(2)),
            startsAt: now,
            expiresAt: newExpiresAt,
            maxCampaigns: plan.maxCampaigns,
            maxAccounts: plan.maxAccounts,
          },
          update: {
            status: "ACTIVE",
            dailyRate: Number((plan.priceUSD / plan.days).toFixed(2)),
            expiresAt: newExpiresAt,
            maxCampaigns: plan.maxCampaigns,
            maxAccounts: plan.maxAccounts,
            updatedAt: now,
          },
        }),
      ]);

      const extraMsg =
        walletDelta > 0
          ? ` El excedente de +$${walletDelta.toFixed(2)} USD quedó abonado a favor en tu Wallet.`
          : "";

      return NextResponse.json({
        success: true,
        message: `¡Pago Binance Pay verificado! Se activó tu ${plan.name} (+${plan.days} días) automáticamente.${extraMsg}`,
      });
    }

    // =========================================================================
    // MODO B: RECARGA DE SALDO A LA WALLET DEL USUARIO
    // =========================================================================
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { increment: amountNum },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: user.id,
          amount: amountNum,
          type: "CREDIT",
          description: `Binance Pay verificado (+$${amountNum.toFixed(
            2
          )} ${currency}) • OrderID: ${officialOrderId} • TxID: ${officialTxId} • De: ${payerName}`,
        },
      }),
    ]);

    const updatedBalance = Number(user.walletBalance || 0) + amountNum;

    return NextResponse.json({
      success: true,
      amountAdded: amountNum,
      currency,
      orderId: officialOrderId,
      newBalance: updatedBalance,
      message: `¡Pago verificado en Binance Pay! Se acreditaron +$${amountNum.toFixed(
        2
      )} USD (${currency}) en tu Wallet al instante. Nuevo saldo: $${updatedBalance.toFixed(2)} USD.`,
    });
  } catch (error: any) {
    console.error("Error en verificación automática de Binance Pay:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al verificar el pago con Binance Pay" },
      { status: 500 }
    );
  }
}
