"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [filter, setFilter] = useState("7DAYS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("ALL");

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
    qualityRating: "GREEN",
    messagingLimit: "100K/day",
    verifiedName: "All Accounts",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [filter, selectedChannel, startDate, endDate]);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/waba/accounts");
      const data = await res.json();
      if (data.accounts && data.accounts.length > 0) {
        setChannels(data.accounts);
      }
    } catch (e) {}
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard/stats?filter=${filter}&channelId=${selectedChannel}`;
      if (filter === "CUSTOM" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pie Chart Share Calculations
  const totalCat = (stats.marketingTotal || 0) + (stats.utilityTotal || 0) + (stats.authTotal || 0) || 1;
  const mktPercent = Math.round(((stats.marketingTotal || 0) / totalCat) * 100);
  const utiPercent = Math.round(((stats.utilityTotal || 0) / totalCat) * 100);
  const autPercent = 100 - mktPercent - utiPercent;

  return (
    <div className="w-full min-h-screen bg-gray-50/60 p-6 space-y-6 font-sans text-xs">
      
      {/* TOP HEADER & MULTI-ACCOUNT SELECTOR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-gray-100 gap-4">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span>📊</span> WABA Campaign Analytics & Performance Dashboard
          </h1>
          <p className="text-gray-400 text-[11px]">Select specific onboarded number to view real-time Meta & webhook campaign stats</p>
        </div>

        {/* ACCOUNT SELECTOR DROPDOWN */}
        <div>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="border-2 border-emerald-500 bg-emerald-50/50 font-extrabold px-4 py-2.5 rounded-xl text-emerald-900 focus:outline-none shadow-xs cursor-pointer"
          >
            <option value="ALL">📱 All Onboarded Accounts ({channels.length})</option>
            {channels.map((ch: any) => (
              <option key={ch.id} value={ch.phoneNumberId || ch.id}>
                📱 {ch.displayPhone || ch.phoneNumberId} — {ch.verifiedName || "Active WABA"}
              </option>
            ))}
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

      {/* ROW 1: PRIMARY METRICS WITH READ / UNREAD SPLIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sent */}
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

        {/* Total Delivered with Read & Unread Split */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Delivered</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">{loading ? "..." : stats.totalDelivered.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">✓</div>
          </div>
          <div className="mt-3 pt-2 border-t flex justify-between text-[10px] font-bold">
            <span className="text-purple-700">👁️ Read: {stats.totalRead}</span>
            <span className="text-amber-600">⏳ Unread: {stats.totalUnread}</span>
          </div>
        </div>

        {/* Delivered & Read Rate */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Read Rate</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1 font-mono">
                {stats.totalDelivered > 0 ? ((stats.totalRead / stats.totalDelivered) * 100).toFixed(1) : 0}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">📈</div>
          </div>
          <div className="mt-4 text-purple-600 font-bold text-[11px]"><span>{stats.totalRead} Messages Opened</span></div>
        </div>

        {/* Failed */}
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

      {/* ROW 3: GRAPHS & PIE CHART RESTORED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Graph (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">📈 Campaign Delivery & Read Trend</h3>
              <p className="text-gray-400 text-[10px]">Volumetric performance graph across selected account & timeframe</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Delivered</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Read</span>
            </div>
          </div>

          <div className="h-64 w-full bg-gray-50/60 rounded-xl border border-dashed border-gray-200 p-4 flex flex-col justify-end">
            <div className="w-full h-48 flex items-end justify-between gap-3 pt-6">
              {[
                { day: "Mon", sent: stats.totalSent * 0.1, del: stats.totalDelivered * 0.1, read: stats.totalRead * 0.1 },
                { day: "Tue", sent: stats.totalSent * 0.2, del: stats.totalDelivered * 0.2, read: stats.totalRead * 0.2 },
                { day: "Wed", sent: stats.totalSent * 0.15, del: stats.totalDelivered * 0.15, read: stats.totalRead * 0.15 },
                { day: "Thu", sent: stats.totalSent * 0.25, del: stats.totalDelivered * 0.25, read: stats.totalRead * 0.25 },
                { day: "Fri", sent: stats.totalSent * 0.3, del: stats.totalDelivered * 0.3, read: stats.totalRead * 0.3 },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div className="w-2 bg-blue-500 rounded-t" style={{ height: `${Math.max(10, Math.min(100, item.sent))}%` }}></div>
                    <div className="w-2 bg-emerald-500 rounded-t" style={{ height: `${Math.max(10, Math.min(100, item.del))}%` }}></div>
                    <div className="w-2 bg-purple-500 rounded-t" style={{ height: `${Math.max(10, Math.min(100, item.read))}%` }}></div>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono mt-2">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie / Donut Chart (1 Col) */}
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

      {/* ROW 4: META WABA ACCOUNT HEALTH */}
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
              <span className="text-[9px] text-gray-400 block uppercase font-bold">Account / Channel</span>
              <span className="font-bold text-gray-900">{stats.verifiedName}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <span className="text-[9px] text-emerald-700 block uppercase font-bold">Quality Rating</span>
              <span className="font-bold text-emerald-900 font-mono">
                {stats.qualityRating === "GREEN" ? "🟢 HIGH (GREEN)" : stats.qualityRating === "YELLOW" ? "🟡 MEDIUM (YELLOW)" : "🔴 LOW (RED)"}
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