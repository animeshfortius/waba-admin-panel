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
  { date: "Oct 14", Sent: 1, Delivered: 1, Read: 1, Failed: 0 },
  { date: "Oct 15", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 16", Sent: 2, Delivered: 2, Read: 2, Failed: 0 },
  { date: "Oct 17", Sent: 0, Delivered: 0, Read: 0, Failed: 0 },
  { date: "Oct 18", Sent: 1, Delivered: 1, Read: 1, Failed: 0 },
  { date: "Oct 19", Sent: 2, Delivered: 2, Read: 2, Failed: 0 },
];

export default function StatusAnalyticsChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-72 w-full flex items-center justify-center text-gray-400 text-xs">Loading Analytics...</div>;
  }

  return (
    <div className="h-80 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={analyticsData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="date" tickLine={false} stroke="#94A3B8" fontSize={12} />
          <YAxis tickLine={false} stroke="#94A3B8" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFF" }}
            itemStyle={{ color: "#FFF", fontSize: "12px" }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          
          <Line type="monotone" dataKey="Sent" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Delivered" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Read" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Failed" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}