"use client";

import { useState, useEffect } from "react";

export default function ManageRatesModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [utilityRate, setUtilityRate] = useState(0.1150);
  const [serviceRate, setServiceRate] = useState(0.1150);
  const [authRate, setAuthRate] = useState(0.1150);
  const [marketingRate, setMarketingRate] = useState(0.7850);
  const [loading, setLoading] = useState(false);

  // Modal khulte hi database se exact saved rates fetch karna
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/admin/rates?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.rates) {
            setUtilityRate(data.rates.utility ?? 0.1150);
            setServiceRate(data.rates.service ?? 0.1150);
            setAuthRate(data.rates.authentication ?? 0.1150);
            setMarketingRate(data.rates.marketing ?? 0.7850);
          }
        })
        .catch((err) => console.error("Error fetching rates:", err));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          rates: {
            utility: utilityRate,
            service: serviceRate,
            authentication: authRate,
            marketing: marketingRate,
          },
          utilityRate,
          serviceRate,
          authRate,
          marketingRate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Rates updated successfully!");
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Manage User Rates ({user.username || user.name})</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="p-3">COUNTRY INFO</th>
                  <th className="p-3">CHANNEL TYPE</th>
                  <th className="p-3">MY RATE / UNIT</th>
                  <th className="p-3">SELLING RATE / UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Utility</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={utilityRate}
                      onChange={(e) => setUtilityRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Service</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={serviceRate}
                      onChange={(e) => setServiceRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Authentication</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={authRate}
                      onChange={(e) => setAuthRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Marketing</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.7850</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={marketingRate}
                      onChange={(e) => setMarketingRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 shadow-md"
            >
              {loading ? "Saving..." : "Save Rates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}