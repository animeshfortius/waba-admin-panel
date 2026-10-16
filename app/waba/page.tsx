"use client";

import { useState } from "react";
import { MoreVertical, Plus, CheckCircle, RefreshCw } from "lucide-react";

interface WabaChannel {
  id: string;
  wabaNumber: string;
  phoneNumberId: string;
  wabaBusinessId: string;
  bspName: string;
  messagingLimit: string;
  qualityRating: string;
  isVerified: boolean;
  isDefault: boolean;
  displayName: string;
  configuredDate: string;
  webhookUrl: string;
}

const wabaChannelsData: WabaChannel[] = [
  {
    id: "1",
    wabaNumber: "15553945963",
    phoneNumberId: "1384456657081014",
    wabaBusinessId: "28402710282733872",
    bspName: "BSP-3",
    messagingLimit: "2000 | TIER_250",
    qualityRating: "HIGH",
    isVerified: true,
    isDefault: true,
    displayName: "Active-08",
    configuredDate: "06 Oct 2026 11:53:57 AM",
    webhookUrl: "NA",
  },
  {
    id: "2",
    wabaNumber: "15553945964",
    phoneNumberId: "1092837461928374",
    wabaBusinessId: "28402710282799999",
    bspName: "BSP-1",
    messagingLimit: "100K | TIER_100K",
    qualityRating: "HIGH",
    isVerified: true,
    isDefault: false,
    displayName: "Acme Corp Main",
    configuredDate: "10 Oct 2026 04:20:10 PM",
    webhookUrl: "https://api.example.com/webhook",
  },
];

export default function WabaChannelsPage() {
  const [channels, setChannels] = useState<WabaChannel[]>(wabaChannelsData);

  const handleSetDefault = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => ({
        ...ch,
        isDefault: ch.id === id,
      }))
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="text-xs text-gray-500 font-medium space-x-1">
        <span>WhatsApp</span>
        <span>&gt;</span>
        <span>Configuration</span>
        <span>&gt;</span>
        <span className="text-gray-800">WABA Channels</span>
      </div>

      {/* Header & Register Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">WABA Channels</h1>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Register New WhatsApp
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-gray-200 uppercase tracking-wider">
              <th className="p-3">WABA NUMBER</th>
              <th className="p-3">PHONENUMBER ID</th>
              <th className="p-3">WABA BUSINESSID</th>
              <th className="p-3">BSP NAME</th>
              <th className="p-3">MESSAGING LIMIT</th>
              <th className="p-3">QUALITY RATING</th>
              <th className="p-3 text-center">DEFAULT</th>
              <th className="p-3">DISPLAY NAME</th>
              <th className="p-3">CONFIGUREDATE</th>
              <th className="p-3">WEBHOOK URL</th>
              <th className="p-3 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
            {channels.map((channel) => (
              <tr key={channel.id} className="hover:bg-slate-50 transition">
                <td className="p-3 font-semibold text-slate-800">
                  {channel.wabaNumber}
                </td>
                <td className="p-3 font-mono text-slate-600">
                  {channel.phoneNumberId}
                </td>
                <td className="p-3 font-mono text-slate-600">
                  {channel.wabaBusinessId}
                </td>
                <td className="p-3">{channel.bspName}</td>
                <td className="p-3">
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold text-[11px] inline-flex items-center gap-1">
                    🟡 {channel.messagingLimit}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{channel.qualityRating}</span>
                    {channel.isVerified && (
                      <span className="text-gray-400 font-normal">| VERIFIED</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <label className="inline-flex items-center cursor-pointer gap-1.5">
                    <input
                      type="radio"
                      name="defaultChannel"
                      checked={channel.isDefault}
                      onChange={() => handleSetDefault(channel.id)}
                      className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-gray-500">
                      {channel.isDefault ? "Default" : "Set Default"}
                    </span>
                  </label>
                </td>
                <td className="p-3 font-semibold text-slate-800">
                  {channel.displayName}
                </td>
                <td className="p-3 text-gray-500 whitespace-nowrap">
                  {channel.configuredDate}
                </td>
                <td className="p-3 text-gray-400 font-mono">
                  {channel.webhookUrl}
                </td>
                <td className="p-3 text-center">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-500 transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
          <span>
            Showing 1 to {channels.length} of {channels.length} records
          </span>
        </div>
      </div>
    </div>
  );
}