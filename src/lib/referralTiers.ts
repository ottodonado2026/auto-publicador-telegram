import { prisma } from "@/lib/prisma";

export interface ReferralTierConfig {
  bronzeMinRefs: number;
  bronzePercent: number;
  silverMinRefs: number;
  silverPercent: number;
  goldMinRefs: number;
  goldPercent: number;
  retentionDays: number;
  isActive: boolean;
}

export const DEFAULT_REFERRAL_CONFIG: ReferralTierConfig = {
  bronzeMinRefs: 1,
  bronzePercent: 10.0,
  silverMinRefs: 5,
  silverPercent: 15.0,
  goldMinRefs: 15,
  goldPercent: 20.0,
  retentionDays: 7,
  isActive: true,
};

export async function getReferralConfig(): Promise<ReferralTierConfig> {
  try {
    let config = await prisma.referralConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.referralConfig.create({
        data: {
          id: "default",
          ...DEFAULT_REFERRAL_CONFIG,
        },
      });
    }

    return {
      bronzeMinRefs: config.bronzeMinRefs,
      bronzePercent: config.bronzePercent,
      silverMinRefs: config.silverMinRefs,
      silverPercent: config.silverPercent,
      goldMinRefs: config.goldMinRefs,
      goldPercent: config.goldPercent,
      retentionDays: config.retentionDays,
      isActive: config.isActive,
    };
  } catch (error) {
    console.error("Error al obtener ReferralConfig de la BD, usando por defecto:", error);
    return DEFAULT_REFERRAL_CONFIG;
  }
}

export function computeUserTier(referralsCount: number, config: ReferralTierConfig = DEFAULT_REFERRAL_CONFIG) {
  if (referralsCount >= config.goldMinRefs) {
    return {
      code: "GOLD",
      name: "Oro Embajador",
      badge: "🥇 Oro Embajador",
      color: "amber",
      percentage: config.goldPercent,
      perks: [
        "Comisión máxima del 20% en cada recarga de tus invitados",
        "Insignia exclusiva de Embajador VIP en tu perfil",
        "Soporte prioritario y canal directo de atención",
        "Posibilidad de coordinar retiros especiales o planes a medida",
      ],
      currentCount: referralsCount,
      targetCount: config.goldMinRefs,
      progressPercent: 100,
      nextTierName: null,
      neededForNext: 0,
    };
  }

  if (referralsCount >= config.silverMinRefs) {
    const range = config.goldMinRefs - config.silverMinRefs;
    const currentProgress = referralsCount - config.silverMinRefs;
    const progressPercent = Math.min(100, Math.round((currentProgress / range) * 100));

    return {
      code: "SILVER",
      name: "Plata",
      badge: "🥈 Rango Plata",
      color: "slate",
      percentage: config.silverPercent,
      perks: [
        "Comisión del 15% en cada recarga de tus invitados",
        "Desbloqueo de 1 Cuenta de Telegram Extra de regalo",
        "Tu membresía mensual queda 100% pagada con 5 referidos",
        "Notificaciones instantáneas de comisiones en tu bot",
      ],
      currentCount: referralsCount,
      targetCount: config.goldMinRefs,
      progressPercent,
      nextTierName: "Oro Embajador (20%)",
      neededForNext: config.goldMinRefs - referralsCount,
    };
  }

  if (referralsCount >= config.bronzeMinRefs) {
    const range = config.silverMinRefs - config.bronzeMinRefs;
    const currentProgress = referralsCount - config.bronzeMinRefs;
    const progressPercent = Math.min(100, Math.round((currentProgress / range) * 100));

    return {
      code: "BRONZE",
      name: "Bronce",
      badge: "🥉 Rango Bronce",
      color: "orange",
      percentage: config.bronzePercent,
      perks: [
        "Comisión del 10% por cada recarga o plan comprado",
        "Liberación automática de fondos cada semana a tu Wallet",
        "Enlace de invitación con código único de tu bot",
        "Contador de visitas y compras en tiempo real",
      ],
      currentCount: referralsCount,
      targetCount: config.silverMinRefs,
      progressPercent,
      nextTierName: "Plata (15%)",
      neededForNext: config.silverMinRefs - referralsCount,
    };
  }

  return {
    code: "STARTER",
    name: "Iniciador",
    badge: "🌱 Iniciador",
    color: "blue",
    percentage: config.bronzePercent,
    perks: [
      "Gana 10% desde tu primer referido que active saldo",
      "Tu bot puede ser 100% GRATIS invitando a 3 o 5 personas",
      "Saldo liberado para adquirir planes y cuentas extra",
    ],
    currentCount: referralsCount,
    targetCount: config.bronzeMinRefs,
    progressPercent: 0,
    nextTierName: "Bronce (10%)",
    neededForNext: Math.max(1, config.bronzeMinRefs - referralsCount),
  };
}
