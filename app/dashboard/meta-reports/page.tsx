"use client";

import { useEffect, useState, useCallback } from "react";

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
  apiKey?: string;
  walletBalance: number;
  actualBalance?: number;
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

const INITIAL_TOTALS = {
  totalUsers: 0,
  totalWabas: 0,
  sent: 0,
  delivered: 0,
  read: 0,
  failed: 0,
  spend: 0,
};

function getDateStringWithOffset(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function formatNumber(val: number) {
  return Number(val || 0).toLocaleString("en-IN");
}

function formatINR(val: number) {
  return `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getPercent(part: number, total: number) {
  if (!total || total <= 0) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function maskApiKey(key?: string) {
  const clean = String(key || "").trim();
  if (!clean) return "Not Generated";
  if (clean.length <= 10) return `${clean.slice(0, 3)}••••`;
  return `${clean.slice(0, 6)}••••••${clean.slice(-4)}`;
}

function getQualityBadgeStyle(quality: string) {
  const q = String(quality || "").toUpperCase();
  if (q === "GREEN") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (q === "YELLOW") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (q === "RED") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getStatusBadgeStyle(status: string) {
  const s = String(status || "").toUpperCase();
  if (s === "CONNECTED" || s === "ONLINE" || s === "ACTIVE") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
  }
  if (!s || s === "UNKNOWN") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function getAccountBalanceValue(item: UserMetaReport): number {
  const roleUpper = String(item.role || "").trim().toUpperCase();
  const isResellerRole =
    roleUpper === "RESELLER" || roleUpper === "WHITE_LABEL_RESELLER";
  if (isResellerRole && typeof item.actualBalance === "number") {
    return Number(item.actualBalance);
  }
  return Number(item.walletBalance ?? 0);
}

export default function AdminMetaReportsDashboard() {
  const [viewerRole, setViewerRole] = useState<string>("SUPER_ADMIN");
  const [reports, setReports] = useState<UserMetaReport[]>([]);
  const [totals, setTotals] = useState(INITIAL_TOTALS);
  const [days, setDays] = useState<number>(7);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [qualityFilter, setQualityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string>("");

  const normalizedViewerRole = String(viewerRole || "SUPER_ADMIN")
    .trim()
    .toUpperCase();
  const isSuperAdminViewer = normalizedViewerRole === "SUPER_ADMIN";

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setViewerRole(String(data.user.role).trim().toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const toggleRevealKey = (userId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyApiKey = async (userId: string, apiKey?: string) => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKeyId(userId);
      setTimeout(() => {
        setCopiedKeyId((prev) => (prev === userId ? "" : prev));
      }, 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const fetchMetaReports = useCallback(
    async (
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
          const rawList: UserMetaReport[] = Array.isArray(data.reports)
            ? data.reports
            : [];
          const safeReports = isSuperAdminViewer
            ? rawList
            : rawList.filter(
                (r) => String(r?.role || "").trim().toUpperCase() !== "SUPER_ADMIN"
              );

          setReports(safeReports);
          setTotals(data.totals || INITIAL_TOTALS);
          setLastSyncedAt(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err: any) {
        setError(err?.message || "Network error");
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [days, fromDate, isCustomRange, isSuperAdminViewer, selectedUser, toDate]
  );

  useEffect(() => {
    setFromDate(getDateStringWithOffset(7));
    setToDate(getDateStringWithOffset(0));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (!isCustomRange) {
      fetchMetaReports(false, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, selectedUser, isCustomRange, isSuperAdminViewer]);

  const handlePresetClick = (presetDays: number) => {
    setIsCustomRange(false);
    setDays(presetDays);
    setFromDate(getDateStringWithOffset(presetDays));
    setToDate(getDateStringWithOffset(0));
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
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.apiKey || "").toLowerCase().includes(q) ||
      r.wabas.some(
        (w) =>
          (w.displayPhone || "").toLowerCase().includes(q) ||
          (w.verifiedName || "").toLowerCase().includes(q) ||
          (w.wabaId || "").toLowerCase().includes(q) ||
          (w.phoneNumberId || "").toLowerCase().includes(q)
      );

    if (!matchesSearch) return false;

    if (qualityFilter !== "ALL") {
      return r.wabas.some(
        (w) => String(w.qualityRating || "").toUpperCase() === qualityFilter
      );
    }

    return true;
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
      "Email",
      "Role",
      "Panel API Key",
      "Connected WABAs",
      "WABA IDs",
      "Phone Number IDs",
      "Phone Numbers",
      "Verified Names",
      "Phone Status",
      "Quality Rating",
      "Messaging Tier",
      "Sent",
      "Meta Sent",
      "Local Log Sent",
      "Delivered",
      "Meta Delivered",
      "Delivery Rate",
      "Read",
      "Read Rate",
      "Failed",
      "Spend (INR)",
      "Balance (INR)",
    ];

    const rows = filteredReports.map((r) => [
      `"${r.name}"`,
      `"${r.username}"`,
      `"${r.email || ""}"`,
      r.role,
      `"${r.apiKey || ""}"`,
      r.wabaCount,
      `"${r.wabas.map((w) => w.wabaId).join(" | ") || "None"}"`,
      `"${r.wabas.map((w) => w.phoneNumberId).join(" | ") || "None"}"`,
      `"${r.wabas.map((w) => w.displayPhone).join(" | ") || "None"}"`,
      `"${r.wabas.map((w) => w.verifiedName).join(" | ") || "None"}"`,
      `"${r.wabas.map((w) => w.status).join(" | ") || "N/A"}"`,
      `"${r.wabas.map((w) => w.qualityRating).join(" | ") || "N/A"}"`,
      `"${r.wabas.map((w) => w.messagingLimit).join(" | ") || "N/A"}"`,
      r.metrics.sent,
      r.metrics.metaSent,
      r.metrics.localSent,
      r.metrics.delivered,
      r.metrics.metaDelivered,
      getPercent(r.metrics.delivered, r.metrics.sent),
      r.metrics.read,
      getPercent(r.metrics.read, r.metrics.delivered || r.metrics.sent),
      r.metrics.failed,
      r.metrics.spend.toFixed(2),
      getAccountBalanceValue(r).toFixed(2),
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

  const activeRangeLabel = isCustomRange
    ? `${fromDate} → ${toDate}`
    : days === 1
    ? "Last 24 Hours"
    : `Last ${days} Days`;

  const roleBadgeText =
    normalizedViewerRole === "WHITE_LABEL_RESELLER"
      ? "WHITE-LABEL RESELLER • META GRAPH v21.0"
      : normalizedViewerRole === "RESELLER"
      ? "RESELLER • META GRAPH v21.0"
      : "SUPER ADMIN • META GRAPH v21.0";

  return (
    <div className="p-6 space-y-6 bg-slate-50/90 min-h-screen">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {roleBadgeText}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Window: {activeRangeLabel}
              </span>
              {lastSyncedAt && (
                <span className="text-[11px] text-slate-400">
                  Last synced: {lastSyncedAt}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Global Meta WABA Reports & Account Health
            </h1>
            <p className="text-xs text-slate-500">
              User-wise visibility into panel API keys, connected WhatsApp Business Accounts, quality ratings, message delivery & balances.
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
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
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
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              📅 Custom Range
            </button>

            <button
              type="button"
              onClick={() => fetchMetaReports(true)}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60 shadow-xs"
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

        {isCustomRange && (
          <form
            onSubmit={handleApplyCustomRange}
            className="pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3"
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Accounts & WABAs
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatNumber(totals.totalUsers)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">
            {formatNumber(totals.totalWabas)} WABA numbers active
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Sent
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatNumber(totals.sent)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Outbound dispatches
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Delivered
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatNumber(totals.delivered)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1">
            {getPercent(totals.delivered, totals.sent)} delivery rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Read
          </div>
          <div className="text-2xl font-extrabold text-sky-600 mt-1">
            {formatNumber(totals.read)}
          </div>
          <div className="text-[11px] font-semibold text-sky-700 mt-1">
            {getPercent(totals.read, totals.delivered || totals.sent)} read rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Failed
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatNumber(totals.failed)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1">
            {getPercent(totals.failed, totals.sent)} failure rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Campaign Spend
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatINR(totals.spend)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            In selected period
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search user, username, email, API key, WABA ID, Phone ID, or phone..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">All Users ({reports.length})</option>
            {reports.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name} (@{u.username})
              </option>
            ))}
          </select>

          <select
            value={qualityFilter}
            onChange={(e) => {
              setQualityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Quality: All</option>
            <option value="GREEN">Quality: GREEN</option>
            <option value="YELLOW">Quality: YELLOW</option>
            <option value="RED">Quality: RED</option>
            <option value="UNKNOWN">Quality: UNKNOWN</option>
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Rows:</span>
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

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">User Profile & API Key</th>
                <th className="p-4">WABA Accounts & Meta Health</th>
                <th className="p-4 text-right">Sent</th>
                <th className="p-4 text-right">Delivered</th>
                <th className="p-4 text-right">Read</th>
                <th className="p-4 text-right">Failed</th>
                <th className="p-4 text-right">Spend / Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Fetching live WABA health, quality ratings & analytics from Meta Graph API...
                  </td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    No matching user Meta reports found for the current filters.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((item) => {
                  const isRevealed = Boolean(revealedKeys[item.userId]);
                  const hasKey = Boolean(String(item.apiKey || "").trim());
                  const displayBalance = getAccountBalanceValue(item);

                  return (
                    <tr
                      key={item.userId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-4 align-top min-w-[235px] space-y-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            @{item.username}
                          </div>
                          {item.email && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[225px]">
                              {item.email}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.role}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {item.wabaCount} WABA
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Panel API Key
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono text-[11px] text-slate-800 break-all">
                              {isRevealed
                                ? item.apiKey || "Not Generated"
                                : maskApiKey(item.apiKey)}
                            </span>
                            {hasKey && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleRevealKey(item.userId)}
                                  className="px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-semibold text-slate-600 cursor-pointer"
                                >
                                  {isRevealed ? "Hide" : "Show"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyApiKey(item.userId, item.apiKey)
                                  }
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 cursor-pointer"
                                >
                                  {copiedKeyId === item.userId ? "Copied" : "Copy"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top min-w-[320px] space-y-2">
                        {item.wabas.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-[11px] text-slate-400 italic">
                            No WABA account linked to this user
                          </div>
                        ) : (
                          item.wabas.map((w) => (
                            <div
                              key={w.id}
                              className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-mono font-bold text-slate-900">
                                    {w.displayPhone || "N/A"}
                                  </span>
                                  {w.verifiedName && (
                                    <span className="ml-2 text-[11px] font-semibold text-slate-600">
                                      • {w.verifiedName}
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(
                                    w.status
                                  )}`}
                                >
                                  {w.status || "UNKNOWN"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getQualityBadgeStyle(
                                    w.qualityRating
                                  )}`}
                                >
                                  Quality: {w.qualityRating || "UNKNOWN"}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  Tier: {w.messagingLimit || "N/A"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-400">
                                {w.wabaId && <span>WABA ID: {w.wabaId}</span>}
                                {w.phoneNumberId && (
                                  <span>Phone ID: {w.phoneNumberId}</span>
                                )}
                              </div>

                              {w.metaSyncError && (
                                <div className="text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                                  Meta Sync Note: {w.metaSyncError}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatNumber(item.metrics.sent)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Meta: {formatNumber(item.metrics.metaSent)} | Log:{" "}
                          {formatNumber(item.metrics.localSent)}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="font-extrabold text-emerald-600 text-sm">
                          {formatNumber(item.metrics.delivered)}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700/80 mt-0.5">
                          {getPercent(item.metrics.delivered, item.metrics.sent)}{" "}
                          • Meta: {formatNumber(item.metrics.metaDelivered)}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="font-extrabold text-sky-600 text-sm">
                          {formatNumber(item.metrics.read)}
                        </div>
                        <div className="text-[10px] font-semibold text-sky-700/80 mt-0.5">
                          {getPercent(
                            item.metrics.read,
                            item.metrics.delivered || item.metrics.sent
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="font-extrabold text-rose-600 text-sm">
                          {formatNumber(item.metrics.failed)}
                        </div>
                        <div className="text-[10px] font-semibold text-rose-600/80 mt-0.5">
                          {getPercent(item.metrics.failed, item.metrics.sent)}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {formatINR(item.metrics.spend)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Spend in range
                        </div>
                        <div className="font-mono text-[11px] font-bold text-emerald-700 mt-1.5 pt-1.5 border-t border-slate-100">
                          Bal: {formatINR(displayBalance)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
            users ({pageSize} per page)
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