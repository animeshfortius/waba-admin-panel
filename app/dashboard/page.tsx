"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [filter, setFilter] = useState("7DAYS"); // "TODAY" | "7DAYS" | "30DAYS" | "ALL"
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
    marketingTotal: 0,
    marketingDelivered: 0,
    utilityTotal: 0,
    utilityDelivered: 0,
    authTotal: 0,
    authDelivered: 0,
    walletActual: 12540.50,
    walletVirtual: 50000.00,
    qualityRating: "GREEN",
    messagingLimit: "100K/day",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats(filter);
  }, [filter]);

  const fetchDashboardStats = async (selectedFilter: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?filter=${selectedFilter}`);
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

  return (
    <div className="w-full min-h-screen bg-gray-50/60 p-6 space-y-6 font-sans text-xs">
      
      {/* TOP HEADER & FILTRATION BAR */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl shadow-xs border border-gray-100 gap-4">
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span>📊</span> WABA Analytics & Performance Dashboard
          </h1>
          <p className="text-gray-400 text-[11px]">Real-time metrics fetched directly from Meta Graph API</p>
        </div>

        {/* ACTIVE FILTRATION BUTTONS */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl font-bold text-[10px]">
            {[
              { id: "TODAY", label: "Today" },
              { id: "7DAYS", label: "Last 7 Days" },
              { id: "30DAYS", label: "Last 30 Days" },
              { id: "ALL", label: "All Time" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === tab.id
                    ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l pl-3">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex flex-col">
              <span className="text-[9px] font-bold text-emerald-700 uppercase">Actual Wallet</span>
              <span className="font-mono font-extrabold text-xs text-emerald-900">₹{stats.walletActual.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: PRIMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sent */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Total Sent ({filter})</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">
                {loading ? "..." : stats.totalSent.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">📤</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
            <span>↑ Filter Applied Active</span>
          </div>
        </div>

        {/* Total Delivered */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Total Delivered</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">
                {loading ? "..." : stats.totalDelivered.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">✓</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
            <span>Delivery Rate: {stats.totalSent > 0 ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>

        {/* Read Messages */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Delivered & Read</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1 font-mono">
                {loading ? "..." : stats.totalRead.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">👁️</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-purple-600 font-bold text-[11px]">
            <span>Read Rate: {stats.totalDelivered > 0 ? ((stats.totalRead / stats.totalDelivered) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Failed / Undelivered</p>
              <h3 className="text-2xl font-black text-red-600 mt-1 font-mono">
                {loading ? "..." : stats.totalFailed.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">⚠️</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-red-500 font-bold text-[11px]">
            <span>Error monitoring active</span>
          </div>
        </div>

      </div>

      {/* ROW 2: CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Marketing */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Marketing Conversations
            </span>
            <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md font-bold text-[10px]">Promotional</span>
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

        {/* Utility */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Utility Conversations
            </span>
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold text-[10px]">Transactional</span>
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

        {/* Authentication */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-3">
          <div className="flex justify-between items-center border-b pb-2.5">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Authentication OTPs
            </span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold text-[10px]">Secure</span>
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

      {/* ROW 3: VISUAL GRAPHICS & ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Line Graph Container (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">📈 Message Delivery Analytics Trend ({filter})</h3>
              <p className="text-gray-400 text-[10px]">Performance trends across selected timeframe</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">Live Filter Active</span>
          </div>

          <div className="h-64 w-full bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center relative p-4">
            <div className="absolute inset-x-4 bottom-8 top-8 flex items-end justify-between gap-2">
              {[40, 65, 50, 85, 90, 75, 95].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-emerald-500/80 hover:bg-emerald-600 rounded-t-lg transition-all duration-300" style={{ height: `${val}%` }}></div>
                  <span className="text-[9px] text-gray-400 font-mono">Interval {i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Health Widget (1 Col) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900">🛡️ WABA Account Health</h3>
            <p className="text-gray-400 text-[10px]">Phone number quality & tier limits</p>
          </div>

          <div className="space-y-4 my-auto">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 font-bold block">Quality Rating</span>
                <span className="text-base font-black text-emerald-900 font-mono">🟢 HIGH (GREEN)</span>
              </div>
              <span className="text-2xl">✨</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-700 font-bold block">Messaging Tier Limit</span>
                <span className="text-base font-black text-blue-900 font-mono">{stats.messagingLimit}</span>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
          </div>

          <div className="border-t pt-3 flex justify-between items-center text-[11px] text-gray-400">
            <span>Status: Connected</span>
            <button onClick={() => fetchDashboardStats(filter)} className="text-emerald-600 font-bold hover:underline cursor-pointer">🔄 Refresh Stats</button>
          </div>
        </div>

      </div>

    </div>
  );
}