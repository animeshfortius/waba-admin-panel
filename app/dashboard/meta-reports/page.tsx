"use client";

import { useEffect, useState } from "react";

interface WabaDetail {
  id: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string;
  verifiedName: string;
  status: string;
  qualityRating: string;
  messagingLimit: string;
  metaSyncError: string | null;
}

interface UserMetaReport {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  walletBalance: number;
  wabaCount: number;
  wabas: WabaDetail[];
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    metaSent: number;
    metaDelivered: number;
    localSent: number;
    spend: number;
  };
}

export default function AdminMetaReportsDashboard() {
  const [reports, setReports] = useState<UserMetaReport[]>([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalWabas: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    spend: 0,
  });
  const [days, setDays] = useState(7);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const fetchMetaReports = async (isManualSync = false) => {
    try {
      setError("");
      if (isManualSync) setSyncing(true);
      else setLoading(true);

      const res = await fetch(
        `/api/admin/meta-reports?days=${days}&userId=${selectedUser}&live=true`,
        { cache: "no-store", credentials: "include" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch Meta reports");
      } else {
        setReports(data.reports || []);
        setTotals(data.totals || totals);
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetaReports(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, selectedUser]);

  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.wabas.some((w) => w.displayPhone.toLowerCase().includes(q))
    );
  });

  const exportCsv = () => {
    const headers = [
      "User Name",
      "Username",
      "Role",
      "Connected WABAs",
      "Phone Numbers",
      "Quality Rating",
      "Sent",
      "Delivered",
      "Read",
      "Failed",
      "Spend (INR)",
    ];

    const rows = filteredReports.map((r) => [
      `"${r.name}"`,
      `"${r.username}"`,
      r.role,
      r.wabaCount,
      `"${r.wabas.map((w) => w.displayPhone).join(" | ") || "None"}"`,
      `"${r.wabas.map((w) => w.qualityRating).join(" | ") || "N/A"}"`,
      r.metrics.sent,
      r.metrics.delivered,
      r.metrics.read,
      r.metrics.failed,
      r.metrics.spend.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin-meta-user-reports-${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Super Admin • Global Meta Intelligence
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            All Users Meta WABA Reports Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live Meta Graph API analytics, phone quality ratings, messaging tiers & delivery logs across all child users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                days === d
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d === 1 ? "Last 24h" : `Last ${d} Days`}
            </button>
          ))}

          <button
            onClick={() => fetchMetaReports(true)}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
          >
            {syncing ? "Syncing Meta..." : "↻ Sync Live Meta"}
          </button>

          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Total Users
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totals.totalUsers}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {totals.totalWabas} Connected WABAs
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Meta Total Sent
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totals.sent.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All users combined</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Delivered
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {totals.delivered.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totals.sent > 0
              ? `${((totals.delivered / totals.sent) * 100).toFixed(1)}% rate`
              : "0% rate"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Read
          </div>
          <div className="text-2xl font-extrabold text-sky-600 mt-1">
            {totals.read.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Blue tick read</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Failed
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {totals.failed.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Undelivered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Total Billed
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{totals.spend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across campaigns</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search user name, username, email, or WABA number..."
          className="w-full sm:w-96 rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
        />

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full sm:w-64 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="ALL">All Users ({reports.length})</option>
          {reports.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name} (@{u.username})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* User-wise Meta Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="p-4">User / Account</th>
                <th className="p-4">Connected WABA & Quality</th>
                <th className="p-4 text-right">Sent</th>
                <th className="p-4 text-right">Delivered</th>
                <th className="p-4 text-right">Read</th>
                <th className="p-4 text-right">Failed</th>
                <th className="p-4 text-right">Wallet Bal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Fetching live reports from Meta Graph API for all users...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No user reports found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item.userId} className="hover:bg-slate-50/80">
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">
                        @{item.username} • {item.role}
                      </div>
                    </td>

                    <td className="p-4 align-top space-y-1.5">
                      {item.wabas.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          No WABA connected
                        </span>
                      ) : (
                        item.wabas.map((w) => (
                          <div
                            key={w.id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-2"
                          >
                            <span className="font-mono font-bold text-slate-800">
                              {w.displayPhone}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.qualityRating === "GREEN"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : w.qualityRating === "YELLOW"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              Quality: {w.qualityRating}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              {w.messagingLimit}
                            </span>
                            {w.metaSyncError && (
                              <span className="text-[10px] text-rose-600 block w-full">
                                Meta API: {w.metaSyncError}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </td>

                    <td className="p-4 align-top text-right font-bold text-slate-900">
                      {item.metrics.sent.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 align-top text-right font-bold text-emerald-600">
                      {item.metrics.delivered.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 align-top text-right font-bold text-sky-600">
                      {item.metrics.read.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 align-top text-right font-bold text-rose-600">
                      {item.metrics.failed.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 align-top text-right font-mono font-bold text-slate-800">
                      ₹{item.walletBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}