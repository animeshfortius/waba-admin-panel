"use client";

import { useState } from "react";

export default function ResellerManager() {
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
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-6 mt-10 text-gray-800">
      <h2 className="text-2xl font-bold">Create Account (Reseller / User)</h2>
      <form onSubmit={handleCreateAccount} className="space-y-4">
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

        <button 
          type="submit" 
          className="w-full bg-emerald-600 text-white p-3 rounded font-semibold hover:bg-emerald-700"
        >
          Create {role === "RESELLER" ? "Reseller" : "User"}
        </button>
      </form>
    </div>
  );
}