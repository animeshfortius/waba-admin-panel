export interface BalanceLike {
  role?: string | null;
  walletBalance?: number | null;
  actualBalance?: number | null;
  virtualBalance?: number | null;
}

export function getUserEffectiveWalletBalance(acc: BalanceLike): number {
  const role = String(acc.role || "USER").toUpperCase();
  const baseWallet = Number(acc.walletBalance ?? acc.actualBalance ?? 0);
  const virtualBal = Number(acc.virtualBalance ?? 0);

  // For normal USER accounts, virtual balance transferred by Admin/Reseller
  // is reflected directly inside Wallet Balance.
  if (role === "USER") {
    return Number((baseWallet + virtualBal).toFixed(2));
  }

  return Number(baseWallet.toFixed(2));
}