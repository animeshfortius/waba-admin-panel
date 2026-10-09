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
          <p className="text-gray-500">Manage SaaS tenants, resellers, track usage and allocate credits</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700"
        >
          + Add New Reseller / User
        </button>
      </div>

      {/* Modal / Form Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 text-gray-800 relative shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold">Create Reseller or User Account</h2>
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