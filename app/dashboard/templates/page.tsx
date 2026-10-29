"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState([
    {
      id: "1",
      name: "otp_test",
      language: "English",
      templateId: "1758713771836411",
      wabaNumber: "28402710282733872",
      text: "{{1}} is your verification code. For your security...",
      category: "Authentication",
      status: "Approved",
      created: "08 Oct 2025 12:05 PM",
      modified: "26 Oct 2026 04:44 PM"
    },
    {
      id: "2",
      name: "feedback_collection",
      language: "English",
      templateId: "1764876244783508",
      wabaNumber: "28402710282733872",
      text: "Hi {{1}}, the service request we completed on...",
      category: "Utility",
      status: "Approved",
      created: "08 Oct 2025 12:04 PM",
      modified: "N/A"
    }
  ]);

  useEffect(() => {
    try {
      const customTpls = JSON.parse(localStorage.getItem("custom_whatsapp_templates") || "[]");
      if (customTpls.length > 0) {
        setTemplates((prev) => [...customTpls, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-4">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › WhatsApp Templates[cite: 4]</div>
          <h1 className="text-xl font-bold text-gray-800">WhatsApp Templates</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/templates/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
          >
            <span>+ Create Templates</span>
          </Link>
          <button
            onClick={() => alert("Retrieving templates from Meta...")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            🔄 Retrieve Meta Templates
          </button>
          <button
            onClick={() => alert("Downloading templates...")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl border transition cursor-pointer"
          >
            📥 Download Templates
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border shadow-xs flex items-center justify-between">
        <input
          type="text"
          placeholder="Filter Records..."
          className="border rounded-lg px-3 py-2 text-xs w-72 bg-gray-50 focus:outline-none"
        />
        <div className="text-gray-500 font-semibold">Showing {templates.length} of {templates.length} records[cite: 4]</div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/70 border-b text-gray-600 font-bold text-[11px]">
              <th className="p-3">INSIGHTS[cite: 4]</th>
              <th className="p-3">NAME / LANG CODE[cite: 4]</th>
              <th className="p-3">TEXT[cite: 4]</th>
              <th className="p-3">CATEGORY / STATUS[cite: 4]</th>
              <th className="p-3">CREATED / MODIFIED[cite: 4]</th>
              <th className="p-3">API PAYLOAD[cite: 4]</th>
              <th className="p-3 text-center">ACTIONS[cite: 4]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map((tpl) => (
              <tr key={tpl.id} className="hover:bg-gray-50/80 transition">
                <td className="p-3 align-top">
                  <button className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-[10px] hover:bg-blue-100 cursor-pointer">
                    📊 Insights[cite: 4]
                  </button>
                </td>
                <td className="p-3 align-top space-y-0.5">
                  <div className="font-bold text-gray-900">Name: {tpl.name}[cite: 4]</div>
                  <div className="text-gray-500">Language Code: {tpl.language}[cite: 4]</div>
                  <div className="text-gray-500">Template id: {tpl.templateId}[cite: 4]</div>
                  <div className="text-gray-400 font-mono text-[10px]">WABABusinessId: {tpl.wabaNumber}[cite: 4]</div>
                </td>
                <td className="p-3 align-top text-gray-600 max-w-xs truncate">
                  {tpl.text}[cite: 4]
                </td>
                <td className="p-3 align-top space-y-1">
                  <div className="font-semibold text-gray-800">{tpl.category}[cite: 4]</div>
                  <div className="inline-flex items-center space-x-1 font-bold text-[10px]">
                    <span className={tpl.status === "Approved" ? "text-emerald-600" : "text-amber-600"}>
                      {tpl.status === "Approved" ? "🟢 Approved" : "⏳ PENDING"}[cite: 4]
                    </span>
                  </div>
                </td>
                <td className="p-3 align-top text-gray-500 space-y-0.5 text-[11px]">
                  <div>Created: {tpl.created}[cite: 4]</div>
                  <div>Modified: {tpl.modified}[cite: 4]</div>
                </td>
                <td className="p-3 align-top">
                  <button
                    onClick={() => alert(`API Payload for ${tpl.name}`)}
                    className="border px-3 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 cursor-pointer"
                  >
                    👁️ View[cite: 4]
                  </button>
                </td>
                <td className="p-3 align-top text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button title="View" className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">👁️</button>
                    <button title="Edit" className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">✏️</button>
                    <button title="Copy" className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">📋</button>
                    <button title="Delete" className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}