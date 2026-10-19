"use client";

import { useState } from "react";

export default function BalanceTransferModal({ 
  users, 
  onClose, 
  onSuccess 
}: { 
  users: any[]; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetUserId, 
          amount: parseFloat(amount), 
          confirmPassword 
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message);
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Transfer failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Transfer Virtual Balance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Select Account</label>
            <select 
              value={targetUserId} 
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">-- Choose Account --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username} ({u.role}) — Virtual: ₹{u.virtualBalance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">Transfer Amount (₹)</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (e.g. 5000)"
              className="w-full border border-gray-200 rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
              required 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">Your Account Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your current password"
              className="w-full border border-gray-200 rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
              required 
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-md"
            >
              {loading ? "Processing..." : "Transfer Virtual Balance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}