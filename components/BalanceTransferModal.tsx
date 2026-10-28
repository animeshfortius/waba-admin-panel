"use client";

import { useState } from "react";

export default function ManageRatesModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [marketingRate, setMarketingRate] = useState(0.25);
  const [utilityRate, setUtilityRate] = useState(0.15);
  const [authRate, setAuthRate] = useState(0.20);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          marketingRate,
          utilityRate,
          authRate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("User rates updated successfully!");
        onSuccess();
      } else {
        alert(data.message || "Failed to update rates");
      }
    } catch (err) {
      console.error("Error updating rates:", err);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Manage User Rates ({user.username || user.name})</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-gray-600">Marketing Rate (₹ per msg)</label>
            <input
              type="number"
              step="0.01"
              value={marketingRate}
              onChange={(e) => setMarketingRate(parseFloat(e.target.value))}
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-600">Utility Rate (₹ per msg)</label>
            <input
              type="number"
              step="0.01"
              value={utilityRate}
              onChange={(e) => setUtilityRate(parseFloat(e.target.value))}
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-600">Authentication Rate (₹ per msg)</label>
            <input
              type="number"
              step="0.01"
              value={authRate}
              onChange={(e) => setAuthRate(parseFloat(e.target.value))}
              className="w-full border rounded-xl p-3 mt-1 bg-gray-50 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 shadow-md"
            >
              {loading ? "Saving..." : "Save Rates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}