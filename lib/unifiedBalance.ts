import { prisma } from "@/lib/prisma";

export const SUPER_ADMIN_FIXED_BALANCE = 123456789;

export function isResellerRole(role?: string | null): boolean {
  const r = String(role || "").trim().toUpperCase();
  return r === "RESELLER" || r === "WHITE_LABEL_RESELLER";
}

export function isSuperAdminRole(role?: string | null): boolean {
  return String(role || "").trim().toUpperCase() === "SUPER_ADMIN";
}

function roundMoney(val: number): number {
  return Number(Number(val || 0).toFixed(4));
}

export async function applyUnifiedResellerBalance(params: {
  tx?: any;
  userId: string;
  amount: number;
  direction: "CREDIT" | "DEBIT";
}) {
  const client = params.tx || prisma;
  const amt = roundMoney(Math.abs(Number(params.amount || 0)));

  if (amt <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const user = await client.user.findUnique({
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
    throw new Error("Target user not found");
  }

  if (isSuperAdminRole(user.role)) {
    return client.user.update({
      where: { id: user.id },
      data: {
        actualBalance: SUPER_ADMIN_FIXED_BALANCE,
        virtualBalance: SUPER_ADMIN_FIXED_BALANCE,
        walletBalance: SUPER_ADMIN_FIXED_BALANCE,
      },
    });
  }

  const currentActual = roundMoney(Number(user.actualBalance ?? 0));
  const currentVirtual = roundMoney(Number(user.virtualBalance ?? 0));
  const currentWallet = roundMoney(Number(user.walletBalance ?? 0));

  if (params.direction === "CREDIT") {
    return client.user.update({
      where: { id: user.id },
      data: {
        actualBalance: roundMoney(currentActual + amt),
        virtualBalance: roundMoney(currentVirtual + amt),
        walletBalance: roundMoney(currentWallet + amt),
      },
    });
  }

  if (currentActual < amt || currentVirtual < amt) {
    throw new Error(
      `Insufficient synced reseller balance (Actual: ₹${currentActual}, Virtual: ₹${currentVirtual}, Required: ₹${amt})`
    );
  }

  return client.user.update({
    where: { id: user.id },
    data: {
      actualBalance: roundMoney(currentActual - amt),
      virtualBalance: roundMoney(currentVirtual - amt),
      walletBalance: roundMoney(Math.max(0, currentWallet - amt)),
    },
  });
}