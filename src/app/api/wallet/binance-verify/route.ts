import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BINANCE_API_KEY =
  process.env.BINANCE_API_KEY ||
  "gdXUidih2KRIrQbLxuK0jGfk3Q38AiEwlfHUkW0B0ya7waDPGXVjW4SFKguY7nsU";
const BINANCE_API_SECRET =
  process.env.BINANCE_API_SECRET ||
  "v8viz5yxA6njiWh9N1s1mhgckyQEEU2SICcTxQ0lDfIaKjKOXSDUyORxptSBqd4x";
const BINANCE_PAY_UID = process.env.BINANCE_PAY_UID || "1158258762";
const BINANCE_PAY_USERNAME = process.env.BINANCE_PAY_USERNAME || "streamofi";

const MIN_ALLOWED_AMOUNT_USD = 1.50;

const PLAN_PRICES: Record<
  string,
  { name: string; days: number; priceUSD: number; maxCampaigns: number; maxAccounts: number }
> = {
  "plan-1": { name: "Pase Express (1 Día)", days: 1, priceUSD: 1.50, maxCampaigns: 2, maxAccounts: 1 },
  "plan-2": { name: "Plan Semanal (7 Días)", days: 7, priceUSD: 7.00, maxCampaigns: 3, maxAccounts: 1 },
  "plan-3": { name: "Plan Quincenal (15 Días)", days: 15, priceUSD: 13.50, maxCampaigns: 5, maxAccounts: 2 },
  "plan-4": { name: "Plan Mensual (30 Días)", days: 30, priceUSD: 24.00, maxCampaigns: 8, maxAccounts: 3 },
};

const SUPPORTED_STABLECOINS = ["USDT"];

export async function GET() {
  return NextResponse.json({
    binanceUid: BINANCE_PAY_UID,
    binanceUsername: BINANCE_PAY_USERNAME,
    minAmountUSD: MIN_ALLOWED_AMOUNT_USD,
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
    const expectedAmount = body.expectedAmount ? Number(body.expectedAmount) : MIN_ALLOWED_AMOUNT_USD;

    if (!rawOrderId || rawOrderId.length < 6) {
      return NextResponse.json(
        {
          error:
            "Por favor ingresa un Order ID (ID de Orden) válido de tu comprobante de Binance Pay.",
        },
        { status: 400 }
      );
    }

    if (mode === "WALLET" && (isNaN(expectedAmount) || expectedAmount < MIN_ALLOWED_AMOUNT_USD)) {
      return NextResponse.json(
        {
          error: `No se permite recargar menos de $${MIN_ALLOWED_AMOUNT_USD.toFixed(
            2
          )} USD (valor mínimo de los planes).`,
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

    // 1. Verificar que este Order ID no haya sido utilizado antes en Neon PostgreSQL
    const [alreadyUsedTx, alreadyUsedPayment] = await Promise.all([
      prisma.walletTransaction.findFirst({
        where: { description: { contains: rawOrderId } },
      }),
      prisma.payment.findFirst({
        where: { reference: rawOrderId },
      }),
    ]);

    if (alreadyUsedTx || alreadyUsedPayment) {
      return NextResponse.json(
        {
          error: `El Order ID "${rawOrderId}" ya fue verificado y acreditado anteriormente. No se puede utilizar dos veces.`,
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
            "No se pudo conectar temporalmente con Binance Pay. Intenta nuevamente en unos segundos.",
        },
        { status: 502 }
      );
    }

    // 3. Buscar la transacción exacta por orderId o transactionId
    const matchedTx = binanceData.data.find((tx: any) => {
      const txOrderId = String(tx.orderId || "").trim();
      const txId = String(tx.transactionId || "").trim();
      return (
        txOrderId === rawOrderId ||
        txId.toLowerCase() === rawOrderId.toLowerCase()
      );
    });

    if (!matchedTx) {
      return NextResponse.json(
        {
          error: `No encontramos ningún pago recibido con el Order ID "${rawOrderId}" en la cuenta ${BINANCE_PAY_USERNAME} (UID: ${BINANCE_PAY_UID}). Verifica que el Order ID sea el correcto y que el pago haya sido enviado a nuestro UID.`,
        },
        { status: 404 }
      );
    }

    // 4. Doble verificación contra replay con los IDs oficiales devueltos por Binance
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
          error: `Este pago de Binance Pay (Order ID: ${officialOrderId}) ya fue procesado y acreditado anteriormente.`,
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
            "La transacción indicada no corresponde a un pago recibido en nuestra cuenta oficial de Binance Pay.",
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
          )}).`,
        },
        { status: 400 }
      );
    }

    // 7. Regla estricta: NO se permite ningún pago menor al plan mínimo ($1.25 USD)
    if (amountNum < MIN_ALLOWED_AMOUNT_USD) {
      return NextResponse.json(
        {
          error: `El pago enviado en Binance es de $${amountNum.toFixed(
            2
          )} ${currency}, lo cual es menor al valor mínimo permitido de los planes ($${MIN_ALLOWED_AMOUNT_USD.toFixed(
            2
          )} USD). No se permiten recargas menores a $${MIN_ALLOWED_AMOUNT_USD.toFixed(2)} USD.`,
        },
        { status: 400 }
      );
    }

    const payerName = matchedTx.payerInfo?.name || "Usuario Binance";
    const payerUid = matchedTx.payerInfo?.binanceId || "";

    // =========================================================================
    // MODO A: COMPRA DIRECTA DE UN PLAN DE MEMBRESÍA CON BINANCE PAY
    // =========================================================================
    if (mode === "PLAN") {
      const plan = planId ? PLAN_PRICES[planId] : null;
      if (!plan) {
        return NextResponse.json({ error: "Selecciona un plan válido para activar." }, { status: 400 });
      }

      // Validar que el pago enviado NO sea menor al precio estipulado del plan
      if (amountNum < plan.priceUSD) {
        return NextResponse.json(
          {
            error: `El pago detectado en Binance Pay es de $${amountNum.toFixed(
              2
            )} ${currency}, pero el ${plan.name} tiene un valor estipulado de $${plan.priceUSD.toFixed(
              2
            )} USD. No se puede activar el plan por un valor menor al estipulado.`,
          },
          { status: 400 }
        );
      }

      const now = new Date();
      const currentExpires = user.subscription?.expiresAt
        ? new Date(user.subscription.expiresAt)
        : now;
      const isStillActive = currentExpires > now && user.subscription?.status === "ACTIVE";
      const baseDate = isStillActive ? currentExpires : now;
      const newExpiresAt = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

      // Si pagó exactamente el plan, walletDelta es 0; si envió más, el excedente queda en su Wallet
      const walletExcess = Number(Math.max(0, amountNum - plan.priceUSD).toFixed(2));

      const updatedSub = await prisma.$transaction(async (tx) => {
        if (walletExcess > 0) {
          await tx.user.update({
            where: { id: user.id },
            data: { walletBalance: { increment: walletExcess } },
          });
        }

        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            amount: amountNum,
            type: "CREDIT",
            description: `Binance Pay verificado (+$${amountNum.toFixed(
              2
            )} ${currency}) • OrderID: ${officialOrderId} • TxID: ${officialTxId} • Pagador: ${payerName} (${payerUid})`,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: user.id,
            amount: plan.priceUSD,
            type: "DEBIT",
            description: `Compra de ${plan.name} con Binance Pay (+${plan.days} días • OrderID: ${officialOrderId})`,
          },
        });

        const sub = await tx.subscription.upsert({
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
        });

        await tx.payment.create({
          data: {
            subscriptionId: sub.id,
            amount: amountNum,
            currency,
            daysAdded: plan.days,
            reference: officialOrderId,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "BINANCE_PAY_PLAN_PURCHASE",
            details: {
              orderId: officialOrderId,
              transactionId: officialTxId,
              planId,
              planName: plan.name,
              amountPaid: amountNum,
              currency,
              payerName,
              payerUid,
            },
          },
        });

        return sub;
      });

      const excessNote =
        walletExcess > 0
          ? ` El excedente de +$${walletExcess.toFixed(2)} USD se abonó a tu Wallet.`
          : "";

      return NextResponse.json({
        success: true,
        mode: "PLAN",
        planName: plan.name,
        daysAdded: plan.days,
        amountPaid: amountNum,
        currency,
        orderId: officialOrderId,
        expiresAt: updatedSub.expiresAt,
        message: `¡Has comprado tu ${plan.name} exitosamente! Se sumaron +${plan.days} día(s) a tu suscripción activa.${excessNote}`,
      });
    }

    // =========================================================================
    // MODO B: RECARGA DE SALDO A LA WALLET DEL USUARIO
    // =========================================================================
    if (amountNum < expectedAmount) {
      return NextResponse.json(
        {
          error: `Seleccionaste recargar $${expectedAmount.toFixed(
            2
          )} USD, pero el pago enviado en Binance Pay fue de $${amountNum.toFixed(
            2
          )} ${currency}. No puedes recargar menos del valor seleccionado.`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { increment: amountNum },
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: amountNum,
          type: "CREDIT",
          description: `Binance Pay verificado (+$${amountNum.toFixed(
            2
          )} ${currency}) • OrderID: ${officialOrderId} • TxID: ${officialTxId} • Pagador: ${payerName} (${payerUid})`,
        },
      });

      if (user.subscription?.id) {
        await tx.payment.create({
          data: {
            subscriptionId: user.subscription.id,
            amount: amountNum,
            currency,
            daysAdded: 0,
            reference: officialOrderId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "BINANCE_PAY_WALLET_RECHARGE",
          details: {
            orderId: officialOrderId,
            transactionId: officialTxId,
            amountPaid: amountNum,
            currency,
            payerName,
            payerUid,
          },
        },
      });
    });

    const updatedBalance = Number((Number(user.walletBalance || 0) + amountNum).toFixed(2));

    return NextResponse.json({
      success: true,
      mode: "WALLET",
      amountPaid: amountNum,
      currency,
      orderId: officialOrderId,
      newBalance: updatedBalance,
      message: `¡Recarga exitosa para tu Wallet! Se acreditaron +$${amountNum.toFixed(
        2
      )} USD (${currency}) en tu billetera. Nuevo saldo disponible: $${updatedBalance.toFixed(2)} USD.`,
    });
  } catch (error: any) {
    console.error("Error en verificación automática de Binance Pay:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al verificar el pago con Binance Pay" },
      { status: 500 }
    );
  }
}
