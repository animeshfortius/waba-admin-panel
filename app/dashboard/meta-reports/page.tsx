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

function getDefaultDateString(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
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
  const [days, setDays] = useState<number>(7);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>(getDefaultDateString(7));
  const [toDate, setToDate] = useState<string>(getDefaultDateString(0));
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const fetchMetaReports = async (
    isManualSync = false,
    overrideCustom?: boolean,
    overrideFrom?: string,
    overrideTo?: string
  ) => {
    try {
      setError("");
      if (isManualSync) setSyncing(true);
      else setLoading(true);

      const useCustom =
        overrideCustom !== undefined ? overrideCustom : isCustomRange;
      const startVal = overrideFrom !== undefined ? overrideFrom : fromDate;
      const endVal = overrideTo !== undefined ? overrideTo : toDate;

      const params = new URLSearchParams({
        days: String(days),
        userId: selectedUser,
        live: "true",
      });

      if (useCustom && startVal && endVal) {
        params.set("startDate", startVal);
        params.set("endDate", endVal);
      }

      const res = await fetch(`/api/admin/meta-reports?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
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
    setCurrentPage(1);
    if (!isCustomRange) {
      fetchMetaReports(false, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, selectedUser, isCustomRange]);

  const handlePresetClick = (presetDays: number) => {
    setIsCustomRange(false);
    setDays(presetDays);
    setFromDate(getDefaultDateString(presetDays));
    setToDate(getDefaultDateString(0));
    setCurrentPage(1);
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    if (fromDate > toDate) {
      setError("From Date cannot be greater than To Date.");
      return;
    }
    setCurrentPage(1);
    fetchMetaReports(false, true, fromDate, toDate);
  };

  const filteredReports = reports.filter((r) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.wabas.some((w) => w.displayPhone.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedReports = filteredReports.slice(
    startIndex,
    startIndex + pageSize
  );

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

    const rangeLabel = isCustomRange ? `${fromDate}_to_${toDate}` : `${days}d`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin-meta-user-reports-${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-2">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handlePresetClick(d)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  !isCustomRange && days === d
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {d === 1 ? "Last 24h" : `Last ${d} Days`}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCustomRange((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isCustomRange
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              📅 Custom Range
            </button>

            <button
              type="button"
              onClick={() => fetchMetaReports(true)}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
            >
              {syncing ? "Syncing Meta..." : "↻ Sync Live Meta"}
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer"
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>

        {/* Custom Range Date Inputs */}
        {isCustomRange && (
          <form
            onSubmit={handleApplyCustomRange}
            className="pt-3 border-t border-slate-100 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Apply Custom Range
            </button>
          </form>
        )}
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

      {/* Filter Bar + Page Size (20 / 50 / 100) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search user name, username, email, or WABA number..."
          className="w-full lg:w-96 rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
        />

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Users ({reports.length})</option>
            {reports.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name} (@{u.username})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 bg-white cursor-pointer"
            >
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
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
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No user reports found for selected filters.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((item) => (
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
                      ₹
                      {item.walletBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {filteredReports.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-900">
              {Math.min(startIndex + pageSize, filteredReports.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-900">
              {filteredReports.length}
            </span>{" "}
            users
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-50 cursor-pointer"
            >
              ← Prev
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">
              Page {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-50 cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}