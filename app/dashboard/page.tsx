"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const analyticsData = [
  { date: "Oct 13", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 14", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 15", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 16", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 17", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 18", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 19", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans bg-gray-50 min-h-screen">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider">TOTAL SENT</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              ✈️
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 100.00% Since yesterday</p>
        </div>

        {/* Total Delivered */}
        <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider">TOTAL DELIVERED</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              📊
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 0.00% Since yesterday</p>
        </div>

        {/* Delivered & Read */}
        <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider">DELIVERED & READ</p>
              <div className="flex items-baseline space-x-4 mt-1">
                <div>
                  <span className="text-2xl font-bold text-gray-800">0</span>
                  <p className="text-[9px] text-gray-400">DELIVERED</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-800">0</span>
                  <p className="text-[9px] text-gray-400">READ</p>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              🛒
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 0.00% | ↑ 0.00% Since yesterday</p>
        </div>

        {/* Failed */}
        <div className="bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-wider">FAILED</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              ⚠️
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↓ 0.00% Since yesterday</p>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marketing */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
              <span>📢</span><span>MARKETING</span>
            </span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              📌
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">TOTAL</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">DELIVERED</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 0.00% Since yesterday</p>
        </div>

        {/* Utility */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
              <span>📦</span><span>UTILITY</span>
            </span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              📦
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">TOTAL</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">DELIVERED</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 0.00% Since yesterday</p>
        </div>

        {/* Authentication */}
        <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
              <span>🔐</span><span>AUTHENTICATION</span>
            </span>
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              🔒
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">TOTAL</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <div>
              <span className="text-xl font-bold text-gray-800">0</span>
              <p className="text-[10px] text-gray-400">DELIVERED</p>
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-medium">↑ 0.00% Since yesterday</p>
        </div>
      </div>

      {/* Status Analytics Line Chart Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">Status Analytics</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-lg border">
              📅 Oct 13, 2026 - Oct 19, 2026
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: "320px" }} className="pt-4">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tickLine={false} stroke="#94A3B8" fontSize={12} />
                <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} tickLine={false} stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFF" }}
                  itemStyle={{ color: "#FFF", fontSize: "12px" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                
                <Line type="monotone" dataKey="Sent" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Delivered" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Read" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Failed" stroke="#A855F7" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
              Loading Chart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}