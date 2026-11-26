"use client";

import { useEffect, useState } from "react";

interface CreditItem {
  id: string;
  userId?: string;
  userName: string;
  userRole?: string;
  fromUser: string;
  amount: number;
  type: string;
  createdAt: string;
  description: string;
}

interface AccountInfo {
  id: string;
  username: string;
  name: string;
  role: string;
  walletBalance: number;
  virtualBalance: number;
}

export default function CreditHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<CreditItem[]>([]);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/credit-history", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error || "Unable to load credit history");
          return;
        }

        setAccount(data.account || null);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch {
        if (!cancelled) {
          setError("Network error while loading credit history");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const role = String(account?.role || "USER").toUpperCase();
  const isNormalUser = role === "USER";
  const isAdminOrReseller =
    role === "SUPER_ADMIN" ||
    role === "RESELLER" ||
    role === "WHITE_LABEL_RESELLER";

  const filteredTransactions = transactions.filter((tx) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      tx.userName?.toLowerCase().includes(q) ||
      tx.fromUser?.toLowerCase().includes(q) ||
      tx.type?.toLowerCase().includes(q) ||
      tx.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-xs font-sans">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            Dashboard › Credit History
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {role === "SUPER_ADMIN"
              ? "All Users Wallet Recharge & Credit History"
              : isAdminOrReseller
              ? "Team & Account Credit History"
              : `Credit History (${account?.name || account?.username || "User"})`}
          </h1>
        </div>

        {account && (
          <div className="flex flex-wrap gap-3 font-bold">
            <span className="bg-purple-50 text-purple-800 px-3.5 py-2 rounded-xl border border-purple-200">
              {role === "SUPER_ADMIN" ? "Actual Balance" : "Wallet Balance"}: ₹
              {Number(account.walletBalance || 0).toFixed(2)}
            </span>
            {!isNormalUser && (
              <span className="bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200">
                Virtual Balance: ₹{Number(account.virtualBalance || 0).toFixed(2)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">
              Wallet Recharge Entries ({filteredTransactions.length})
            </h2>
            <span className="text-[11px] text-slate-400">
              {role === "SUPER_ADMIN"
                ? "Showing all added users' wallet recharge and credit entries"
                : isAdminOrReseller
                ? "Showing your account and your created users' credit entries"
                : "Showing entries for your logged-in account only"}
            </span>
          </div>

          {isAdminOrReseller && (
            <input
              type="text"
              placeholder="Filter by username, type or remarks..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="border border-slate-300 rounded-xl px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-64"
            />
          )}
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Loading credit history...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 font-semibold">{error}</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            No credit history entries found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase border-b font-bold text-[10px]">
                  <th className="p-3">USER</th>
                  <th className="p-3">FROM USER</th>
                  <th className="p-3">CREDITS</th>
                  <th className="p-3">CREDIT TYPE</th>
                  <th className="p-3">DATE</th>
                  <th className="p-3">REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 text-slate-700 font-medium">
                    <td className="p-3 font-bold text-slate-800">{tx.userName}</td>
                    <td className="p-3">{tx.fromUser}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ₹{Number(tx.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-600">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}