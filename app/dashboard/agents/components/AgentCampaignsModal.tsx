"use client";

import { useState, useEffect } from "react";

export default function AgentCampaignsModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentCampaigns();
  }, []);

  const fetchAgentCampaigns = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success && data.reports) {
        setCampaigns(data.reports);
      }
    } catch (err) {
      console.error("Error loading agent campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto font-sans text-xs">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Agent Campaigns — <span className="text-indigo-600">{agent.name}</span> (@{agent.userId})
            </h2>
            <p className="text-slate-400 text-[11px]">Broadcast history, delivery status, and cost breakdown for this agent</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Campaign Records Table */}
        <div className="border rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-3 bg-slate-50 border-b flex justify-between items-center font-bold text-slate-700">
            <span>Filter Records & Broadcast History</span>
            <span className="text-[11px] text-slate-400">Total Records: {campaigns.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Campaign Date</th>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Campaign Info</th>
                  <th className="p-3">Template Info</th>
                  <th className="p-3">Interface / Channel</th>
                  <th className="p-3">Scheduled Info</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Total Count</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Loading campaign records...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400 font-medium">
                      No data found
                    </td>
                  </tr>
                ) : (
                  campaigns.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-600">{row.sentAt ? new Date(row.sentAt).toLocaleString() : "N/A"}</td>
                      <td className="p-3 font-bold text-slate-800">{row.userName || agent.name}</td>
                      <td className="p-3 font-bold text-indigo-700">{row.campaignName}</td>
                      <td className="p-3 text-slate-700">{row.templateName || "Default"}</td>
                      <td className="p-3 font-mono text-slate-600">📱 {row.channel}</td>
                      <td className="p-3 text-slate-500">{row.isScheduled ? "Scheduled" : "Instant"}</td>
                      <td className="p-3 font-mono text-purple-700 font-bold">₹{row.cost || "0.00"}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{row.totalCount || 1}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {row.status || "COMPLETED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}