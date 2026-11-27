import { prisma } from "@/lib/prisma";
import { isResellerRole, isSuperAdminRole } from "@/lib/unifiedBalance";

export type MessageCategory =
  | "MARKETING"
  | "UTILITY"
  | "SERVICE"
  | "AUTHENTICATION";

export function resolveCategoryRate(
  user: {
    perMsgRate?: number | null;
    utilityRate?: number | null;
    serviceRate?: number | null;
    authRate?: number | null;
  },
  category?: string | null
): number {
  const cat = String(category || "MARKETING").toUpperCase();
  if (cat === "UTILITY") return Number(user.utilityRate ?? 0.155);
  if (cat === "SERVICE") return Number(user.serviceRate ?? 0.155);
  if (cat === "AUTHENTICATION" || cat === "AUTH")
    return Number(user.authRate ?? 0.155);
  return Number(user.perMsgRate ?? 0.8046);
}

// Delivered / Billable report aane par balance deduct karne ke liye
export async function deductMessageBalance(params: {
  userId: string;
  category?: string | null;
  units?: number;
  customCost?: number;
  description?: string;
  referenceId?: string;
}) {
  const units = Math.max(1, Number(params.units ?? 1));

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        role: true,
        username: true,
        actualBalance: true,
        virtualBalance: true,
        walletBalance: true,
        perMsgRate: true,
        utilityRate: true,
        serviceRate: true,
        authRate: true,
      },
    });

    if (!user) {
      throw new Error("User not found for balance deduction");
    }

    const rate = resolveCategoryRate(user, params.category);
    const totalCost =
      typeof params.customCost === "number" && !Number.isNaN(params.customCost)
        ? Number(params.customCost.toFixed(4))
        : Number((rate * units).toFixed(4));

    if (totalCost <= 0 || isSuperAdminRole(user.role)) {
      return {
        success: true,
        cost: 0,
        deductedFrom: "NONE" as const,
        user,
        transaction: null,
      };
    }

    const virtualBal = Number(user.virtualBalance ?? 0);
    const actualBal = Number(user.actualBalance ?? 0);
    const walletBal = Number(user.walletBalance ?? 0);

    // Reseller / White-Label Reseller / Sub-Reseller: Actual aur Virtual dono se same amount deduct
    if (isResellerRole(user.role)) {
      if (actualBal < totalCost || virtualBal < totalCost) {
        throw new Error("Insufficient balance to send WhatsApp message");
      }

      const nextActual = Number((actualBal - totalCost).toFixed(4));
      const nextVirtual = Number((virtualBal - totalCost).toFixed(4));
      const nextWallet = Number(Math.max(0, walletBal - totalCost).toFixed(4));

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          actualBalance: nextActual,
          virtualBalance: nextVirtual,
          walletBalance: nextWallet,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: -totalCost,
          type: "Unified Debit",
          balanceType: "BOTH",
          referenceId: params.referenceId || null,
          description:
            params.description ||
            `WhatsApp ${String(
              params.category || "MARKETING"
            ).toUpperCase()} Delivered (${units} unit • Actual & Virtual)`,
        },
      });

      return {
        success: true,
        cost: totalCost,
        deductedFrom: "BOTH" as const,
        user: updatedUser,
        transaction,
      };
    }

    // Regular USER: purana logic
    let nextVirtual = virtualBal;
    let nextActual = actualBal;
    let nextWallet = walletBal;
    let deductedFrom: "VIRTUAL" | "ACTUAL" = "ACTUAL";

    if (virtualBal >= totalCost) {
      nextVirtual = Number((virtualBal - totalCost).toFixed(4));
      deductedFrom = "VIRTUAL";
    } else if (actualBal >= totalCost) {
      nextActual = Number((actualBal - totalCost).toFixed(4));
      nextWallet = Number(Math.max(0, walletBal - totalCost).toFixed(4));
      deductedFrom = "ACTUAL";
    } else {
      throw new Error("Insufficient balance to send WhatsApp message");
    }

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        virtualBalance: nextVirtual,
        actualBalance: nextActual,
        walletBalance: nextWallet,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId: user.id,
        amount: -totalCost,
        type: deductedFrom === "VIRTUAL" ? "Virtual Debit" : "Actual Debit",
        balanceType: deductedFrom,
        referenceId: params.referenceId || null,
        description:
          params.description ||
          `WhatsApp ${String(
            params.category || "MARKETING"
          ).toUpperCase()} Delivered (${units} unit)`,
      },
    });

    return {
      success: true,
      cost: totalCost,
      deductedFrom,
      user: updatedUser,
      transaction,
    };
  });
}

// Failed / Undelivered case mein utna hi amount wallet mein wapas refund karne ke liye
export async function refundMessageBalance(params: {
  userId: string;
  amount: number;
  balanceType?: "VIRTUAL" | "ACTUAL" | "BOTH" | string | null;
  description?: string;
  referenceId?: string;
}) {
  const refundAmount = Number(Number(params.amount || 0).toFixed(4));
  if (refundAmount <= 0) {
    return { success: true, refunded: 0, user: null, transaction: null };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        role: true,
        actualBalance: true,
        virtualBalance: true,
        walletBalance: true,
      },
    });

    if (!user) {
      throw new Error("User not found for balance refund");
    }

    if (isSuperAdminRole(user.role)) {
      return { success: true, refunded: 0, user, transaction: null };
    }

    const bType = String(params.balanceType || "").toUpperCase();

    if (isResellerRole(user.role) || bType === "BOTH") {
      const nextActual = Number(
        (Number(user.actualBalance ?? 0) + refundAmount).toFixed(4)
      );
      const nextVirtual = Number(
        (Number(user.virtualBalance ?? 0) + refundAmount).toFixed(4)
      );
      const nextWallet = Number(
        (Number(user.walletBalance ?? 0) + refundAmount).toFixed(4)
      );

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          actualBalance: nextActual,
          virtualBalance: nextVirtual,
          walletBalance: nextWallet,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amount: refundAmount,
          type: "Unified Refund",
          balanceType: "BOTH",
          referenceId: params.referenceId || null,
          description:
            params.description ||
            "Refund for failed/undelivered WhatsApp message (Actual & Virtual)",
        },
      });

      return {
        success: true,
        refunded: refundAmount,
        user: updatedUser,
        transaction,
      };
    }

    const useVirtual = bType === "VIRTUAL";

    const nextVirtual = useVirtual
      ? Number((Number(user.virtualBalance ?? 0) + refundAmount).toFixed(4))
      : Number(user.virtualBalance ?? 0);

    const nextActual = !useVirtual
      ? Number((Number(user.actualBalance ?? 0) + refundAmount).toFixed(4))
      : Number(user.actualBalance ?? 0);

    const nextWallet = !useVirtual
      ? Number((Number(user.walletBalance ?? 0) + refundAmount).toFixed(4))
      : Number(user.walletBalance ?? 0);

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        virtualBalance: nextVirtual,
        actualBalance: nextActual,
        walletBalance: nextWallet,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId: user.id,
        amount: refundAmount,
        type: useVirtual ? "Virtual Refund" : "Actual Refund",
        balanceType: useVirtual ? "VIRTUAL" : "ACTUAL",
        referenceId: params.referenceId || null,
        description:
          params.description || "Refund for failed/undelivered WhatsApp message",
      },
    });

    return {
      success: true,
      refunded: refundAmount,
      user: updatedUser,
      transaction,
    };
  });
}