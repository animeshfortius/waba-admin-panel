"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserOption {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  actualBalance?: number | null;
  virtualBalance?: number | null;
}

function isResellerRole(role?: string | null): boolean {
  const r = String(role || "").toUpperCase();
  return r === "RESELLER" || r === "WHITE_LABEL_RESELLER";
}

export default function TransferPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [actionType, setActionType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [balanceType, setBalanceType] = useState<"VIRTUAL" | "ACTUAL">("VIRTUAL");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const role = String(data?.user?.role || "USER").toUpperCase();
        const allowed =
          role === "SUPER_ADMIN" ||
          role === "RESELLER" ||
          role === "WHITE_LABEL_RESELLER";
        if (!allowed) {
          router.replace("/");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  const loadUsers = () => {
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const list = Array.isArray(data?.users) ? data.users : [];
        setUsers(list);
      })
      .catch((err) => console.error("Error loading users:", err));
  };

  useEffect(() => {
    if (authorized) {
      loadUsers();
    }
  }, [authorized]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === targetUserId) || null,
    [users, targetUserId]
  );

  const selectedIsReseller = isResellerRole(selectedUser?.role);

  useEffect(() => {
    if (!selectedUser) return;
    setBalanceType(isResellerRole(selectedUser.role) ? "ACTUAL" : "VIRTUAL");
  }, [selectedUser]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const effectiveBalanceType: "VIRTUAL" | "ACTUAL" = selectedIsReseller
        ? balanceType
        : "VIRTUAL";

      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          amount: parseFloat(amount),
          type: actionType,
          balanceType: effectiveBalanceType,
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || "Transfer successful!");
        setAmount("");
        setConfirmPassword("");
        loadUsers();
      } else {
        setMessage(data.message || data.error || "Transfer failed");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="p-6 text-xs text-slate-500">
        Checking transfer permissions...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm mt-8 space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h1 className="text-lg font-bold text-slate-900">Transfer Balance</h1>
        <Link
          href="/admin/user-management"
          className="text-slate-600 hover:text-slate-900 font-semibold"
        >
          ← Back
        </Link>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
          {message}
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Select Account / Receiver ID
          </label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Choose User / Reseller --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username || u.name || u.email} ({u.role || "USER"}) — A: ₹
                {Number(u.actualBalance ?? 0).toFixed(2)} | V: ₹
                {Number(u.virtualBalance ?? 0).toFixed(2)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Or paste exact Target User ID"
            className="mt-2 w-full border border-slate-300 rounded-xl p-2 bg-white font-mono text-[11px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) =>
                setActionType(e.target.value === "DEBIT" ? "DEBIT" : "CREDIT")
              }
              className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium"
            >
              <option value="CREDIT">Credit (Add)</option>
              <option value="DEBIT">Debit (Deduct)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Balance Type
            </label>
            {!selectedUser || selectedIsReseller ? (
              <select
                value={balanceType}
                onChange={(e) =>
                  setBalanceType(e.target.value === "ACTUAL" ? "ACTUAL" : "VIRTUAL")
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-medium"
              >
                <option value="VIRTUAL">Virtual Balance</option>
                <option value="ACTUAL">Actual Balance</option>
              </select>
            ) : (
              <div className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-700 font-semibold">
                Virtual Only (User)
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-mono"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Confirm Account Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white p-2.5 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Processing..." : "Send Transfer"}
        </button>
      </form>
    </div>
  );
}