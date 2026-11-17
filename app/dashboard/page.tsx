"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [filter, setFilter] = useState("7DAYS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");

  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalUnread: 0,
    totalFailed: 0,
    marketingTotal: 0,
    marketingDelivered: 0,
    utilityTotal: 0,
    utilityDelivered: 0,
    authTotal: 0,
    authDelivered: 0,
    qualityRating: "N/A",
    messagingLimit: "100,000 / 24 hrs",
    verifiedName: "Loading Default Account...",
    trendData: [] as any[],
    hourlyActivity: [] as any[],
    topTemplates: [] as any[],
    recentWebhooks: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [filter, selectedChannel, startDate, endDate]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard/stats?filter=${filter}`;
      if (selectedChannel) {
        url += `&channelId=${selectedChannel}`;
      }
      if (filter === "CUSTOM" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (data.accounts && data.accounts.length > 0) {
          setChannels(data.accounts);
        }
        if (!selectedChannel && data.selectedChannelId) {
          setSelectedChannel(data.selectedChannelId);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Report Export Handler
  const exportCSVReport = () => {
    const headers = ["Date", "Sent", "Delivered", "Read"];
    const rows = (stats.trendData || []).map((r: any) => [r.day, r.sent, r.del, r.read]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WABA_Report_${stats.verifiedName}_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCat = (stats.marketingTotal || 0) + (stats.utilityTotal || 0) + (stats.authTotal || 0) || 1;
  const mktPercent = Math.round(((stats.marketingTotal || 0) / totalCat) * 100);
  const utiPercent = Math.round(((stats.utilityTotal || 0) / totalCat) * 100);
  const autPercent = 100 - mktPercent - utiPercent;

  const maxTrendVal = Math.max(...(stats.trendData?.map((t: any) => Math.max(t.sent, t.del, t.read)) || [10]), 10);
  const maxHourVal = Math.max(...(stats.hourlyActivity?.map((h: any) => h.count) || [5]), 5);

  const validQueryChannel = selectedChannel && selectedChannel !== "ALL" ? `?channelId=${selectedChannel}` : "";

  return (
    <div className="w-full min-h-screen bg-gray-50/60 p-6 space-y-6 font-sans text-xs">
      
      {/* TOP HEADER, QUICK ACTIONS & ACCOUNT SELECTOR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-gray-100 gap-4">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span>📊</span> WABA Campaign Analytics & Performance Dashboard
          </h1>
          <p className="text-gray-400 text-[11px]">Enterprise analytics, live webhook audit logs & default channel performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* QUICK ACTION SHORTCUTS */}
          <Link
            href={`/dashboard/campaigns${validQueryChannel}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span>🚀</span> Launch Broadcast
          </Link>
          <Link
            href={`/dashboard/templates/create${validQueryChannel}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span>➕</span> Add Template
          </Link>
          <button
            onClick={exportCSVReport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3.5 py-2.5 rounded-xl border border-gray-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>📥</span> Export CSV
          </button>

          {/* ACCOUNT DROPDOWN (Includes All Accounts + Individual Onboarded WABAs) */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="border-2 border-emerald-500 bg-emerald-50/50 font-extrabold px-4 py-2.5 rounded-xl text-emerald-900 focus:outline-none shadow-xs cursor-pointer"
          >
            {channels.length === 0 ? (
              <option value="">Loading Accounts...</option>
            ) : (
              channels.map((ch: any) => {
                const isAll = ch.id === "ALL" || ch.phoneNumberId === "ALL";
                return (
                  <option key={ch.id} value={ch.phoneNumberId || ch.id}>
                    {isAll
                      ? `🌐 All Accounts — ${ch.displayName || "Combined Reports"}`
                      : `📱 ${ch.displayPhone || ch.phoneNumberId} — ${ch.displayName || "Active WABA"} ${ch.isDefault ? "⭐ (Default)" : ""}`}
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>

      {/* FILTRATION BAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-2xl shadow-xs border border-gray-100 gap-3">
        <div className="flex bg-gray-100 p-1 rounded-xl font-bold text-[10px] overflow-x-auto">
          {[
            { id: "TODAY", label: "Today" },
            { id: "7DAYS", label: "Last 7 Days" },
            { id: "30DAYS", label: "Last 30 Days" },
            { id: "ALL", label: "All Time" },
            { id: "CUSTOM", label: "📅 Custom Range" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filter === "CUSTOM" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-3 py-1.5 rounded-xl bg-gray-50 font-mono text-[11px]"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-3 py-1.5 rounded-xl bg-gray-50 font-mono text-[11px]"
            />
          </div>
        )}
      </div>

      {/* ROW 1: PRIMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Sent</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">{loading ? "..." : stats.totalSent.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">📤</div>
          </div>
          <div className="mt-4 text-emerald-600 font-bold text-[11px]"><span>Live Broadcast Sync</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Delivered</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">{loading ? "..." : stats.totalDelivered.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">✓</div>
          </div>
          <div className="mt-4 text-emerald-600 font-bold text-[11px]"><span>Successfully Sent to Device</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Read</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1 font-mono">{loading ? "..." : stats.totalRead.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">👁️</div>
          </div>
          <div className="mt-4 text-purple-600 font-bold text-[11px]"><span>Webhook Read Status</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Unread</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1 font-mono">{loading ? "..." : stats.totalUnread.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">⏳</div>
          </div>
          <div className="mt-4 text-amber-600 font-bold text-[11px]"><span>Delivered but Unopened</span></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Failed / Undelivered</p>
              <h3 className="text-2xl font-black text-red-600 mt-1 font-mono">{loading ? "..." : stats.totalFailed.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">⚠️</div>
          </div>
          <div className="mt-4 text-red-500 font-bold text-[11px]"><span>Webhook Error Tracking</span></div>
        </div>
      </div>

      {/* ROW 2: CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Marketing Campaigns
            </span>
            <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md font-bold text-[10px]">{mktPercent}% Share</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Total Sent</span>
              <p className="text-lg font-black font-mono text-gray-900">{stats.marketingTotal}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Delivered</span>
              <p className="text-lg font-black font-mono text-emerald-600">{stats.marketingDelivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Utility Messages
            </span>
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold text-[10px]">{utiPercent}% Share</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Total Sent</span>
              <p className="text-lg font-black font-mono text-gray-900">{stats.utilityTotal}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Delivered</span>
              <p className="text-lg font-black font-mono text-emerald-600">{stats.utilityDelivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Authentication (OTPs)
            </span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[10px]">{autPercent}% Share</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Total Sent</span>
              <p className="text-lg font-black font-mono text-gray-900">{stats.authTotal}</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-gray-400 text-[10px]">Delivered</span>
              <p className="text-lg font-black font-mono text-emerald-600">{stats.authDelivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: DATE-WISE GRAPHS & PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">📈 Date-Wise Campaign Reports ({filter})</h3>
              <p className="text-gray-400 text-[10px]">Daily performance breakdown across selected timeframe</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Delivered</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Read</span>
            </div>
          </div>

          <div className="h-64 w-full bg-gray-50/60 rounded-xl border border-dashed border-gray-200 p-4 flex flex-col justify-end overflow-x-auto">
            <div className="w-full h-48 flex items-end justify-between gap-2 pt-6 min-w-[400px]">
              {stats.trendData && stats.trendData.length > 0 ? (
                stats.trendData.map((item: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    <div className="absolute -top-10 bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                      {item.day}: Sent {item.sent}, Del {item.del}, Read {item.read}
                    </div>
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      <div className="w-2 bg-blue-500 rounded-t" style={{ height: `${Math.max(8, Math.min(100, (item.sent / maxTrendVal) * 100))}%` }}></div>
                      <div className="w-2 bg-emerald-500 rounded-t" style={{ height: `${Math.max(8, Math.min(100, (item.del / maxTrendVal) * 100))}%` }}></div>
                      <div className="w-2 bg-purple-500 rounded-t" style={{ height: `${Math.max(8, Math.min(100, (item.read / maxTrendVal) * 100))}%` }}></div>
                    </div>
                    <span className="text-[8px] text-gray-500 font-mono mt-2 truncate w-full text-center">{item.day}</span>
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-gray-400 my-auto">No date-wise data available for this range</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900">📊 Category Share (Pie Report)</h3>
            <p className="text-gray-400 text-[10px]">Distribution of Marketing, Utility & Auth</p>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div 
              className="w-36 h-36 rounded-full relative flex items-center justify-center shadow-inner"
              style={{
                background: `conic-gradient(#ec4899 0% ${mktPercent}%, #f59e0b ${mktPercent}% ${mktPercent + utiPercent}%, #3b82f6 ${mktPercent + utiPercent}% 100%)`
              }}
            >
              <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-xs">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                <span className="text-sm font-black text-gray-900 font-mono">{totalCat}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full mt-5 text-center">
              <div className="bg-pink-50 p-2 rounded-xl">
                <span className="text-[9px] text-pink-700 font-bold block">Marketing</span>
                <span className="font-black text-pink-900">{mktPercent}%</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl">
                <span className="text-[9px] text-amber-700 font-bold block">Utility</span>
                <span className="font-black text-amber-900">{utiPercent}%</span>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl">
                <span className="text-[9px] text-blue-700 font-bold block">Auth</span>
                <span className="font-black text-blue-900">{autPercent}%</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-3 flex justify-between items-center text-[11px] text-gray-400">
            <span>Webhook Sync</span>
            <span className="text-emerald-600 font-bold">100% Active</span>
          </div>
        </div>
      </div>

      {/* NEW ROW 4: HOURLY ACTIVITY SPARKLINE, TOP TEMPLATES & LIVE WEBHOOK FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Hourly Peak Activity Meter */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>⚡</span> Hourly Peak Activity
            </h3>
            <p className="text-gray-400 text-[10px]">Best messaging hours based on engagement volume</p>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 bg-gray-50/70 p-3 rounded-xl border border-dashed border-gray-200">
            {stats.hourlyActivity && stats.hourlyActivity.length > 0 ? (
              stats.hourlyActivity.map((h: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  <span className="text-[9px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition">
                    {h.count}
                  </span>
                  <div
                    className="w-full max-w-[18px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all"
                    style={{ height: `${Math.max(12, Math.min(100, (h.count / maxHourVal) * 100))}%` }}
                  ></div>
                  <span className="text-[8px] text-gray-500 font-mono">{h.hour}</span>
                </div>
              ))
            ) : (
              <div className="w-full text-center text-gray-400 my-auto">No hourly data recorded yet</div>
            )}
          </div>
        </div>

        {/* 2. Top Performing Templates Leaderboard */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <span>🏆</span> Top Performing Templates
            </h3>
            <p className="text-gray-400 text-[10px]">Templates with highest delivery & open rates</p>
          </div>

          <div className="space-y-3 my-auto">
            {stats.topTemplates && stats.topTemplates.length > 0 ? (
              stats.topTemplates.map((tpl: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-gray-900 truncate">{tpl.name}</p>
                      <p className="text-[10px] text-gray-400">{tpl.sent} Messages Sent</p>
                    </div>
                  </div>
                  <span className="bg-purple-50 text-purple-700 font-black px-2.5 py-1 rounded-lg text-[10px] shrink-0">
                    {tpl.readRate}% Read
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                No template broadcast logs yet
              </div>
            )}
          </div>
        </div>

        {/* 3. Live Webhook Audit Log Ticker */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <span>📡</span> Live Webhook Status Feed
              </h3>
              <p className="text-gray-400 text-[10px]">Real-time delivery & read receipts from Meta</p>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> LIVE
            </span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {stats.recentWebhooks && stats.recentWebhooks.length > 0 ? (
              stats.recentWebhooks.map((log: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-gray-50/80 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-800">{log.phone}</span>
                    <span className="text-[9px] text-gray-400 uppercase">({log.type})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        log.status === "READ"
                          ? "bg-purple-100 text-purple-800"
                          : log.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : log.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">{log.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                Waiting for incoming webhook events...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ROW 5: META WABA ACCOUNT HEALTH */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <span>🛡️</span> Meta WABA Account & Quality Status
          </h3>
          <p className="text-gray-400 text-[10px]">Real-time status fetched from Meta Graph API for {stats.verifiedName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-gray-50 border px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span className="text-xl">🏢</span>
            <div>
              <span className="text-[9px] text-gray-400 block uppercase font-bold">Active Account</span>
              <span className="font-bold text-gray-900">{stats.verifiedName}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <span className="text-[9px] text-emerald-700 block uppercase font-bold">Quality Rating</span>
              <span className="font-bold text-emerald-900 font-mono">
                {stats.qualityRating === "GREEN" || stats.qualityRating === "HIGH" 
                  ? "🟢 HIGH (GREEN)" 
                  : stats.qualityRating === "YELLOW" || stats.qualityRating === "MEDIUM" 
                  ? "🟡 MEDIUM (YELLOW)" 
                  : stats.qualityRating === "RED" || stats.qualityRating === "LOW" 
                  ? "🔴 LOW (RED)" 
                  : "⚪ N/A (NEUTRAL)"}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span className="text-xl">🚀</span>
            <div>
              <span className="text-[9px] text-blue-700 block uppercase font-bold">Messaging Tier</span>
              <span className="font-bold text-blue-900 font-mono">{stats.messagingLimit}</span>
            </div>
          </div>

          <button
            onClick={fetchDashboardStats}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>

    </div>
  );
}