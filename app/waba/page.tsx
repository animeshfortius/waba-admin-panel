"use client";

import { Radio, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";

const wabaAccounts = [
  { id: "WABA-01", name: "Acme Corp Main", phone: "+91 9876543210", phoneId: "109283746", quality: "HIGH", tier: "100K/day", status: "CONNECTED" },
  { id: "WABA-02", name: "Global Retail Support", phone: "+91 9711223344", phoneId: "584930219", quality: "HIGH", tier: "10K/day", status: "CONNECTED" },
  { id: "WABA-03", name: "Zeta Marketing", phone: "+91 9988776655", phoneId: "991827364", quality: "LOW", tier: "1K/day", status: "FLAGGED" },
];

export default function WabaAccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">WABA Accounts & Phone Health</h1>
        <p className="text-slate-500 text-sm">Monitor WhatsApp Business Accounts, phone number health, and messaging limit tiers.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Registered WABA Phone Numbers</h2>
          <button className="text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Health
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Account Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Phone Number ID</th>
                <th className="p-4">Messaging Tier</th>
                <th className="p-4">Quality Rating</th>
                <th className="p-4">Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {wabaAccounts.map((waba) => (
                <tr key={waba.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{waba.name}</td>
                  <td className="p-4 text-slate-700">{waba.phone}</td>
                  <td className="p-4 font-mono text-xs text-slate-500">{waba.phoneId}</td>
                  <td className="p-4 text-slate-600">{waba.tier}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      waba.quality === 'HIGH' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {waba.quality === 'HIGH' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {waba.quality}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      waba.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {waba.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}