"use client";

import { useState } from "react";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, DollarSign } from "lucide-react";

interface Transaction {
  id: string;
  clientName: string;
  type: "RECHARGE" | "DEDUCTION";
  amount: string;
  date: string;
  status: "SUCCESS" | "FAILED";
}

const transactions: Transaction[] = [
  { id: "TXN-901", clientName: "Acme Corp", type: "RECHARGE", amount: "+₹5,000", date: "Today, 02:15 PM", status: "SUCCESS" },
  { id: "TXN-902", clientName: "Global Retail Inc", type: "DEDUCTION", amount: "-₹1,240", date: "Today, 11:30 AM", status: "SUCCESS" },
  { id: "TXN-903", clientName: "TechNova Solutions", type: "RECHARGE", amount: "+₹2,000", date: "Yesterday", status: "SUCCESS" },
];

export default function BillingPage() {
  const [showAddFunds, setShowAddFunds] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet & Billing Management</h1>
          <p className="text-slate-500 text-sm">Monitor tenant wallet balances, credit recharges, and Meta conversation costs.</p>
        </div>

        <button 
          onClick={() => setShowAddFunds(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Manual Credit
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Wallet className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Pool Balance</p>
            <p className="text-2xl font-bold text-slate-900">₹45,200</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Recharges (This Month)</p>
            <p className="text-2xl font-bold text-slate-900">₹1,28,000</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg. Cost / Msg</p>
            <p className="text-2xl font-bold text-slate-900">₹0.78</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Wallet Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Client Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{txn.id}</td>
                  <td className="p-4 font-semibold text-slate-900">{txn.clientName}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      txn.type === "RECHARGE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {txn.type === "RECHARGE" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {txn.type}
                    </span>
                  </td>
                  <td className={`p-4 font-semibold ${txn.type === "RECHARGE" ? "text-emerald-600" : "text-slate-900"}`}>
                    {txn.amount}
                  </td>
                  <td className="p-4 text-slate-500">{txn.date}</td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">
                      {txn.status}
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