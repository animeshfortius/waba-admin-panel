"use client";

import { useState, useEffect } from "react";

function isResellerRole(role?: string | null): boolean {
  const r = String(role || "").toUpperCase();
  return r === "RESELLER" || r === "WHITE_LABEL_RESELLER";
}

export default function BalanceTransferModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const targetIsReseller = isResellerRole(user?.role);

  const [balanceType, setBalanceType] = useState<"VIRTUAL" | "ACTUAL">(
    targetIsReseller ? "ACTUAL" : "VIRTUAL"
  );
  const [actionType, setActionType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBalanceType(isResellerRole(user?.role) ? "ACTUAL" : "VIRTUAL");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!user?.id || Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }
    if (!confirmPassword.trim()) {
      alert("Please enter your account password to confirm.");
      return;
    }

    setLoading(true);
    try {
      const effectiveBalanceType: "VIRTUAL" | "ACTUAL" = targetIsReseller
        ? balanceType
        : "VIRTUAL";

      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          amount: numericAmount,
          type: actionType,
          balanceType: effectiveBalanceType,
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Balance updated successfully!");
        setAmount("");
        setConfirmPassword("");
        onSuccess();
      } else {
        alert(data.message || data.error || "Transfer failed");
      }
    } catch (err) {
      console.error("Transfer modal error:", err);
      alert("Network error while transferring balance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Transfer Funds ({user?.username || user?.name || "User"})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Role: <span className="font-semibold text-slate-700">{user?.role || "USER"}</span> • Actual: ₹
              {Number(user?.actualBalance ?? 0).toFixed(2)} • Virtual: ₹
              {Number(user?.virtualBalance ?? 0).toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction Type
            </label>
            <select
              value={actionType}
              onChange={(e) =>
                setActionType(e.target.value === "DEBIT" ? "DEBIT" : "CREDIT")
              }
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="CREDIT">Credit (Add Balance)</option>
              <option value="DEBIT">Debit (Deduct Balance)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Balance Wallet
            </label>
            {targetIsReseller ? (
              <select
                value={balanceType}
                onChange={(e) =>
                  setBalanceType(e.target.value === "ACTUAL" ? "ACTUAL" : "VIRTUAL")
                }
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="ACTUAL">Actual Balance</option>
                <option value="VIRTUAL">Virtual Balance</option>
              </select>
            ) : (
              <div className="w-full border border-slate-200 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 font-semibold">
                Virtual Balance Only (User Account)
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirm Your Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter account password"
              className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              {loading ? "Processing..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}