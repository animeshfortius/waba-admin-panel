"use client";

import { Radio, Users, Wallet, CheckCircle2, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "Mon", messages: 12000 },
  { name: "Tue", messages: 19000 },
  { name: "Wed", messages: 15000 },
  { name: "Thu", messages: 22000 },
  { name: "Fri", messages: 28000 },
  { name: "Sat", messages: 35000 },
  { name: "Sun", messages: 31000 },
];

const recentClients = [
  { name: "Acme Corp", phone: "+91 9876543210", status: "VERIFIED", tier: "100K/day", health: "HIGH" },
  { name: "TechNova Solutions", phone: "+91 9812345678", status: "PENDING", tier: "1K/day", health: "MEDIUM" },
  { name: "Global Retail Inc", phone: "+91 9711223344", status: "VERIFIED", tier: "10K/day", health: "HIGH" },
  { name: "Zeta Logistics", phone: "+91 9988776655", status: "FLAGGED", tier: "1K/day", health: "LOW" },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">System performance, broadcast analytics, and WABA health summary.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Clients</p>
            <p className="text-2xl font-bold text-slate-900">24</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Radio className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active WABAs</p>
            <p className="text-2xl font-bold text-slate-900">18</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Messages Sent (Today)</p>
            <p className="text-2xl font-bold text-slate-900">142,500</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Wallet className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Wallet Balance</p>
            <p className="text-2xl font-bold text-slate-900">₹45,200</p>
          </div>
        </div>
      </div>

      {/* Analytics & Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Weekly Message Traffic
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">+18.4% vs last week</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">System Health Overview</h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Meta API Status</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded">Operational</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Webhook Processing</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded">100% Up</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Flagged Phone Numbers</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-1 rounded">1 Warning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Clients & WABA Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Client Name</th>
                <th className="p-4">WABA Number</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Messaging Tier</th>
                <th className="p-4">Quality Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recentClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{client.name}</td>
                  <td className="p-4 text-slate-600">{client.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      client.status === 'PENDING' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{client.tier}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      client.health === 'HIGH' ? 'text-emerald-600' :
                      client.health === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {client.health === 'HIGH' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {client.health}
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