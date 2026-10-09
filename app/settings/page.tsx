"use client";

import { useState } from "react";

export default function ClientsPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RESELLER");
  const [balance, setBalance] = useState(0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, walletBalance: balance }),
    });

    const data = await res.json();
    if (data.success) {
      alert(`${role} Account Successfully Created!`);
      setName("");
      setEmail("");
      setPassword("");
      setBalance(0);
      setShowModal(false);
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
          <p className="text-gray-500">Manage SaaS tenants, resellers, track onboarding, and trigger Meta Embedded Signup.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 shadow"
          >
            + Create Tenant / Reseller
          </button>
        </div>
      </div>

      {/* Existing Client List Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            className="border rounded-lg px-4 py-2 w-80 text-sm text-gray-800"
          />
          <span className="text-sm font-medium text-gray-500">Total Registered: 3</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Client</th>
              <th className="p-4">Phone Number</th>
              <th className="p-4">WABA ID</th>
              <th className="p-4">Verification Status</th>
              <th className="p-4">Wallet Balance</th>
              <th className="p-4">Messages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            <tr>
              <td className="p-4 font-medium">Acme Corp <br /><span className="text-xs text-gray-400">admin@acme.com</span></td>
              <td className="p-4">+91 9876543210</td>
              <td className="p-4 text-xs font-mono text-gray-500">109823746591283</td>
              <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">VERIFIED</span></td>
              <td className="p-4 font-semibold">₹12,400</td>
              <td className="p-4">84,200</td>
            </tr>
            <tr>
              <td className="p-4 font-medium">TechNova Solutions <br /><span className="text-xs text-gray-400">contact@technova.io</span></td>
              <td className="p-4">+91 9812345678</td>
              <td className="p-4 text-xs font-mono text-gray-500">Pending Meta Onboarding</td>
              <td className="p-4"><span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">PENDING</span></td>
              <td className="p-4 font-semibold">₹0</td>
              <td className="p-4">0</td>
            </tr>
            <tr>
              <td className="p-4 font-medium">Global Retail Inc <br /><span className="text-xs text-gray-400">support@globalretail.com</span></td>
              <td className="p-4">+91 9711223344</td>
              <td className="p-4 text-xs font-mono text-gray-500">584930219485761</td>
              <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">VERIFIED</span></td>
              <td className="p-4 font-semibold">₹32,800</td>
              <td className="p-4">128,900</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal / Form Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 text-gray-800 relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold">Create Reseller / User Account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border p-2 rounded mt-1 text-black bg-white"
                >
                  <option value="RESELLER">Reseller Account</option>
                  <option value="USER">Direct User Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1 text-black bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1 text-black bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1 text-black bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Wallet Balance (₹)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value))}
                  className="w-full border p-2 rounded mt-1 text-black bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}