"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { loadFacebookSDK, launchEmbeddedSignup } from "../../lib/meta-sdk";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  wabaId: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  messagesSent: string;
  walletBalance: string;
}

const initialClients: Client[] = [
  {
    id: "CL-101",
    name: "Acme Corp",
    email: "admin@acme.com",
    phone: "+91 9876543210",
    wabaId: "109823746591283",
    status: "VERIFIED",
    messagesSent: "84,200",
    walletBalance: "₹12,400",
  },
  {
    id: "CL-102",
    name: "TechNova Solutions",
    email: "contact@technova.io",
    phone: "+91 9812345678",
    wabaId: "Pending Meta Onboarding",
    status: "PENDING",
    messagesSent: "0",
    walletBalance: "₹0",
  },
  {
    id: "CL-103",
    name: "Global Retail Inc",
    email: "support@globalretail.com",
    phone: "+91 9711223344",
    wabaId: "584930219485761",
    status: "VERIFIED",
    messagesSent: "128,900",
    walletBalance: "₹32,800",
  },
];

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadFacebookSDK();
  }, []);

  const handleOnboardClient = () => {
    launchEmbeddedSignup((authData) => {
      console.log("Meta Auth Response Code:", authData.code);
      
      const newClient: Client = {
        id: `CL-${Math.floor(100 + Math.random() * 900)}`,
        name: "New Meta Onboarded Client",
        email: "onboarded@client.com",
        phone: "+91 9123456789",
        wabaId: "Exchanging Token...",
        status: "VERIFIED",
        messagesSent: "0",
        walletBalance: "₹1,000",
      };

      setClients((prev) => [newClient, ...prev]);
      alert("Meta Signup authorization successful! Authorization code captured.");
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-slate-500 text-sm">
            Manage SaaS tenants, track onboarding, and trigger Meta Embedded Signup.
          </p>
        </div>

        <button 
          onClick={handleOnboardClient}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Onboard New Client (Meta SDK)
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Registered: <span className="text-slate-900 font-bold">{clients.length}</span>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Client</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">WABA ID</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Messages</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{client.phone}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{client.wabaId}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      client.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      client.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {client.status === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {client.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                      {client.status === 'REJECTED' && <AlertCircle className="w-3.5 h-3.5" />}
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{client.walletBalance}</td>
                  <td className="p-4 text-slate-600">{client.messagesSent}</td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
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