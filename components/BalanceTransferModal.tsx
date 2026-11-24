"use client";

import { useState, useEffect } from "react";

interface BaseRates {
  utility: number;
  service: number;
  authentication: number;
  marketing: number;
}

function toSafeRate(raw: string, fallback: number): number {
  if (raw.trim() === "") return 0;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) || !Number.isFinite(parsed) ? fallback : parsed;
}

export default function ManageRatesModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [utilityRate, setUtilityRate] = useState<number>(0.115);
  const [serviceRate, setServiceRate] = useState<number>(0.115);
  const [authRate, setAuthRate] = useState<number>(0.115);
  const [marketingRate, setMarketingRate] = useState<number>(0.785);
  const [baseRates, setBaseRates] = useState<BaseRates>({
    utility: 0.115,
    service: 0.115,
    authentication: 0.115,
    marketing: 0.785,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/admin/rates?userId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.rates) {
            setUtilityRate(Number(data.rates.utility ?? 0.115));
            setServiceRate(Number(data.rates.service ?? 0.115));
            setAuthRate(Number(data.rates.authentication ?? 0.115));
            setMarketingRate(Number(data.rates.marketing ?? 0.785));
          }
          if (data?.baseRates) {
            setBaseRates({
              utility: Number(data.baseRates.utility ?? 0.115),
              service: Number(data.baseRates.service ?? 0.115),
              authentication: Number(data.baseRates.authentication ?? 0.115),
              marketing: Number(data.baseRates.marketing ?? 0.785),
            });
          }
        })
        .catch((err) => console.error("Error fetching rates:", err));
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setBaseRates((prev) => ({
            utility: Number(data.user.utilityRate ?? prev.utility),
            service: Number(data.user.serviceRate ?? prev.service),
            authentication: Number(data.user.authRate ?? prev.authentication),
            marketing: Number(data.user.perMsgRate ?? prev.marketing),
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanRates = {
        utility: Number(Number(utilityRate || 0).toFixed(4)),
        service: Number(Number(serviceRate || 0).toFixed(4)),
        authentication: Number(Number(authRate || 0).toFixed(4)),
        marketing: Number(Number(marketingRate || 0).toFixed(4)),
      };

      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          rates: cleanRates,
          utilityRate: cleanRates.utility,
          serviceRate: cleanRates.service,
          authRate: cleanRates.authentication,
          marketingRate: cleanRates.marketing,
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
    <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Manage User Rates ({user?.username || user?.name || "User"})
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure per-unit selling rates against base cost.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b text-[10px] uppercase">
                  <th className="p-3">COUNTRY INFO</th>
                  <th className="p-3">CHANNEL TYPE</th>
                  <th className="p-3">MY RATE / UNIT</th>
                  <th className="p-3">SELLING RATE / UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium text-slate-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-slate-600">Utility</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold font-mono">
                      {baseRates.utility.toFixed(4)}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={utilityRate}
                      onChange={(e) =>
                        setUtilityRate(toSafeRate(e.target.value, utilityRate))
                      }
                      className="border border-slate-300 rounded-lg p-2 w-32 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      required
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-slate-600">Service</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold font-mono">
                      {baseRates.service.toFixed(4)}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={serviceRate}
                      onChange={(e) =>
                        setServiceRate(toSafeRate(e.target.value, serviceRate))
                      }
                      className="border border-slate-300 rounded-lg p-2 w-32 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      required
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-slate-600">Authentication</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold font-mono">
                      {baseRates.authentication.toFixed(4)}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={authRate}
                      onChange={(e) =>
                        setAuthRate(toSafeRate(e.target.value, authRate))
                      }
                      className="border border-slate-300 rounded-lg p-2 w-32 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      required
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-medium text-slate-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-slate-600">Marketing</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold font-mono">
                      {baseRates.marketing.toFixed(4)}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={marketingRate}
                      onChange={(e) =>
                        setMarketingRate(toSafeRate(e.target.value, marketingRate))
                      }
                      className="border border-slate-300 rounded-lg p-2 w-32 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              {loading ? "Saving..." : "Save Rates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}