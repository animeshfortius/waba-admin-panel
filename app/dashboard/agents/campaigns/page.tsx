"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function AgentCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingMeta, setSyncingMeta] = useState(false);

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAgentsList();
    fetchAgentCampaigns(false);
  }, []);

  const fetchAgentsList = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const fetchAgentCampaigns = async (syncMeta = false) => {
    setLoading(true);
    try {
      const uid = localStorage.getItem("userId") || "";
      const res = await fetch(
        `/api/agents/admin-campaigns?userId=${uid}&startDate=${startDate}&endDate=${endDate}&agentId=${selectedAgentFilter}&syncMeta=${syncMeta}`
      );
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || data.reports || []);
      }
    } catch (err) {
      console.error("Error fetching agent campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromMeta = async () => {
    setSyncingMeta(true);
    try {
      await fetchAgentCampaigns(true);
      alert("✅ Synced latest campaign & delivery status from Meta!");
    } catch {
      alert("Network error syncing with Meta.");
    } finally {
      setSyncingMeta(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return campaigns.filter((c: any) => {
      const matchesAgent =
        selectedAgentFilter === "ALL" ||
        c.agentId === selectedAgentFilter ||
        c.userName === selectedAgentFilter ||
        c.createdBy === selectedAgentFilter;

      const matchesSearch =
        !searchQuery ||
        c.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.templateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.wabaNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.channel?.includes(searchQuery);

      return matchesAgent && matchesSearch;
    });
  }, [campaigns, selectedAgentFilter, searchQuery]);

  // Total Count Summary across filtered campaigns
  const totalRecipientsCount = useMemo(() => {
    return filteredRecords.reduce(
      (sum, item) => sum + (Number(item.totalCount) || Number(item.recipientsCount) || 0),
      0
    );
  }, [filteredRecords]);

  return (
    <div className="p-6 space-y-6 font-sans text-xs bg-slate-50/40 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
        <div>
          <div className="text-slate-400 font-medium">Home › WhatsApp › Agent Campaigns</div>
          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-800">Agent Campaigns</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              Campaigns: {filteredRecords.length} | Total Messages: {totalRecipientsCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncFromMeta}
            disabled={syncingMeta}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {syncingMeta ? "⏳ Syncing Meta..." : "🔄 Sync Meta Status"}
          </button>

          <Link
            href="/dashboard/agents"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            ⬅ Back to Agents
          </Link>
        </div>
      </div>

      {/* Filter Records Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-slate-50 border px-3.5 py-2 rounded-xl">
            <span>📅</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent focus:outline-none font-mono font-medium text-slate-700"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent focus:outline-none font-mono font-medium text-slate-700"
            />
          </div>

          {/* Agent Name Dropdown */}
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="border rounded-xl px-4 py-2.5 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Agents</option>
            {agents.map((ag: any) => (
              <option key={ag.id} value={ag.userId}>
                👤 {ag.name} (@{ag.userId})
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search campaign, template, channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-60"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchAgentCampaigns(false)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition cursor-pointer"
        >
          Filter Records
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">CAMPAIGN DATE</th>
                <th className="p-4">USER NAME</th>
                <th className="p-4">CAMPAIGN INFO</th>
                <th className="p-4">TEMPLATE INFO</th>
                <th className="p-4">INTERFACE / CHANNEL</th>
                <th className="p-4">SCHEDULED INFO</th>
                <th className="p-4">COST</th>
                <th className="p-4">TOTAL COUNT</th>
                <th className="p-4">ERROR</th>
                <th className="p-4">CAMPAIGN STATUS</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-14 text-center text-slate-400 font-medium">
                    ⏳ Fetching campaign records from Meta...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-14 text-center text-slate-400 font-medium">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((camp: any, idx: number) => (
                  <tr key={camp.id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                      {camp.createdAt ? new Date(camp.createdAt).toLocaleString() : camp.date || "N/A"}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      @{camp.userName || camp.createdBy || "agent"}
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{camp.campaignName || "Campaign"}</td>
                    <td className="p-4 text-emerald-700 font-bold">{camp.templateName || "N/A"}</td>
                    <td className="p-4 font-mono text-slate-600">{camp.wabaNumber || camp.channel || "WABA"}</td>
                    <td className="p-4 text-slate-500">
                      {camp.scheduledAt ? new Date(camp.scheduledAt).toLocaleString() : "Immediate"}
                    </td>
                    <td className="p-4 font-mono text-slate-700">₹{camp.cost || "0.00"}</td>
                    <td className="p-4 font-black text-slate-900">
                      {camp.totalCount ?? camp.recipientsCount ?? 0}
                    </td>
                    <td className="p-4 text-rose-600 font-medium">{camp.error || "None"}</td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-bold text-[9px] uppercase">
                        {camp.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href="/dashboard/reports"
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center justify-center cursor-pointer"
                        title="View Report"
                      >
                        👁️
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-medium">
          <span>
            Showing {filteredRecords.length === 0 ? 0 : 1} to {filteredRecords.length} of {filteredRecords.length} records
          </span>
          <span className="font-bold text-slate-700">Total Recipients Count: {totalRecipientsCount}</span>
        </div>
      </div>
    </div>
  );
}