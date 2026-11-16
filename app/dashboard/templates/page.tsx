"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function TemplatesContent() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<any[]>([]);
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    fetchTemplates(storedUserId);
  }, [searchParams]);

  const fetchTemplates = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        const accounts = data.wabaAccounts || [];
        setWabaAccounts(accounts);

        // 🟢 Dashboard selected channel fallback check
        const urlChannelId = searchParams?.get("channelId");
        if (accounts.length > 0) {
          if (urlChannelId) {
            const matchedAcc = accounts.find(
              (a: any) => a.id === urlChannelId || a.phoneNumberId === urlChannelId || a.wabaId === urlChannelId
            );
            setSelectedChannel(matchedAcc ? (matchedAcc.phoneNumberId || matchedAcc.wabaId) : accounts[0].phoneNumberId || accounts[0].wabaId);
          } else {
            const defaultAcc = accounts.find((a: any) => a.isDefault) || accounts[0];
            setSelectedChannel(defaultAcc.phoneNumberId || defaultAcc.wabaId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) => !selectedChannel || t.wabaId === selectedChannel || t.phoneNumberId === selectedChannel
  );

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-xs gap-3 w-full">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › Templates Manager</div>
          <h1 className="text-xl font-bold text-gray-800">Approved Meta Templates</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="border-2 border-emerald-500 bg-emerald-50/50 font-extrabold px-4 py-2 rounded-xl text-emerald-900 focus:outline-none cursor-pointer"
          >
            {wabaAccounts.map((acc) => (
              <option key={acc.id} value={acc.phoneNumberId || acc.wabaId}>
                📱 {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "Active WABA"}
              </option>
            ))}
          </select>
          <Link
            href={`/dashboard/templates/create${selectedChannel ? `?channelId=${selectedChannel}` : ""}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition"
          >
            ➕ Add New Template
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-semibold">No templates found for this WABA account.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 font-bold">
                <th className="p-3.5">Template Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Language</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTemplates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-gray-50/60">
                  <td className="p-3.5 font-bold font-mono text-gray-800">{tpl.name}</td>
                  <td className="p-3.5 font-semibold text-gray-600">{tpl.category}</td>
                  <td className="p-3.5 text-gray-500 font-mono">{tpl.language || "en_US"}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        tpl.status?.toUpperCase() === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : tpl.status?.toUpperCase() === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {tpl.status || "PENDING"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <Link
                      href={`/dashboard/campaigns?templateId=${tpl.id}&channelId=${selectedChannel}`}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold"
                    >
                      🚀 Broadcast
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading Templates...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}