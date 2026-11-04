"use client";

import { useState } from "react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Naye passwords match nahi ho rahe hain!", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "YAHAN_USER_KA_ID_DAALEIN", // Session ya state se logged-in user ki ID dein
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server se connect nahi ho paya.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Update Password Form Section */}
      <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800">Update Password</h2>
          <p className="text-xs text-gray-400">Choose a strong, unique password.</p>
        </div>

        {message.text && (
          <div className={`p-3 mb-4 rounded-lg text-xs font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Current Password</label>
            <input
              type="password"
              placeholder="Enter Current Password..."
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter New Password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm Your Password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password Now"}
          </button>
        </form>
      </div>

      {/* Password Policy Box */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>🔒</span> Password Policy
        </h3>
        <ul className="space-y-3 text-xs text-gray-600">
          <li className="flex items-center gap-2">• At least 8 characters long</li>
          <li className="flex items-center gap-2">• Uppercase & lowercase letters</li>
          <li className="flex items-center gap-2">• At least one number (0–9)</li>
          <li className="flex items-center gap-2">• At least one special character</li>
        </ul>
      </div>
    </div>
  );
}