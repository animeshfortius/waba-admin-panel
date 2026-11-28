import { prisma } from "@/lib/prisma";

export async function getCreatorBrandingDefaults(creatorId?: string | null) {
  if (!creatorId) {
    return {
      defaultWalletBalance: 0,
      defaultValidityMonths: null as number | null,
      notificationConfig: {
        notifyCustomerViaEmail: false,
        notifyCustomerViaSms: false,
        notifyMeViaEmail: false,
        sendPasswordViaSms: false,
        lowBalanceAlertNotification: true,
      },
    };
  }

  const cfg = await prisma.whiteLabelConfig.findUnique({
    where: { userId: creatorId },
    select: { faviconUrl: true },
  });

  let parsed: any = {};
  if (typeof cfg?.faviconUrl === "string" && cfg.faviconUrl.startsWith("{")) {
    try {
      parsed = JSON.parse(cfg.faviconUrl);
    } catch {
      parsed = {};
    }
  }

  const nCfg = parsed?.notificationConfig || {};
  const bal = Number(nCfg.defaultWalletBalance ?? 0);
  const monthsRaw = nCfg.defaultValidityMonths;
  const months =
    monthsRaw !== null && monthsRaw !== undefined && Number(monthsRaw) > 0
      ? Number(monthsRaw)
      : null;

  return {
    defaultWalletBalance: Number.isFinite(bal) && bal > 0 ? bal : 0,
    defaultValidityMonths: months,
    notificationConfig: {
      notifyCustomerViaEmail: Boolean(nCfg.notifyCustomerViaEmail ?? false),
      notifyCustomerViaSms: Boolean(nCfg.notifyCustomerViaSms ?? false),
      notifyMeViaEmail: Boolean(nCfg.notifyMeViaEmail ?? false),
      sendPasswordViaSms: Boolean(nCfg.sendPasswordViaSms ?? false),
      lowBalanceAlertNotification: Boolean(
        nCfg.lowBalanceAlertNotification ?? true
      ),
    },
  };
}

export function computeExpiryDateFromMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().substring(0, 10);
}