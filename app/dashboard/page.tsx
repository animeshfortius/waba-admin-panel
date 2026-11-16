"use client";

import { useState, useEffect } from "react";

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
    qualityRating: "GREEN",
    messagingLimit: "100K/day",
    verifiedName: "WhatsApp Business",
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
      let url = `/api/dashboard/stats?filter=${filter}`;
      if (selectedChannel) url += `&channelId=${selectedChannel}`;
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

  const readRate = stats.totalDelivered > 0 ? ((stats.totalRead / stats.totalDelivered) * 100).toFixed(1) : "0";

  return (
    <div className="w-full min-h-screen bg-gray-50/60 p-6 space-y-6 font-sans text-xs">
      
      {/* TOP HEADER & ACCOUNT SELECTOR (Wallet removed from here since header has it) */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-gray-100 gap-4">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span>📊</span> WABA Analytics & Performance Dashboard
          </h1>
          <p className="text-gray-400 text-[11px]">Real-time webhook & Meta Graph API analytics across onboarded accounts</p>
        </div>

        <div>
          {channels.length > 0 && (
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="border border-gray-200 bg-gray-50 font-bold px-3 py-2 rounded-xl text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">📱 All Onboarded Accounts</option>
              {channels.map((ch: any) => (
                <option key={ch.id} value={ch.phoneNumberId || ch.id}>
                  {ch.displayPhone || ch.phoneNumberId} ({ch.verifiedName || "Active"})
                </option>
              ))}
            </select>
          )}
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
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Total Sent</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">{loading ? "..." : stats.totalSent.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">📤</div>
          </div>
          <div className="mt-4 text-emerald-600 font-bold text-[11px]"><span>Live Database Sync</span></div>
        </div>

        {/* Total Delivered with Actual Read / Unread Breakdown */}
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

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Read Rate</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1 font-mono">{readRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">📈</div>
          </div>
          <div className="mt-4 text-purple-600 font-bold text-[11px]"><span>{stats.totalRead} Messages Opened</span></div>
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

      {/* META ACCOUNT HEALTH */}
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
              <span className="text-[9px] text-gray-400 block uppercase font-bold">Account Name</span>
              <span className="font-bold text-gray-900">{stats.verifiedName}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <span className="text-[9px] text-emerald-700 block uppercase font-bold">Quality Rating</span>
              <span className="font-bold text-emerald-900 font-mono">
                {stats.qualityRating === "GREEN" ? "🟢 HIGH (GREEN)" : "🟡 MEDIUM (YELLOW)"}
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