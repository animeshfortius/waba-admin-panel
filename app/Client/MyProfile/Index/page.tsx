"use client";

import { useState, useEffect } from "react";

export default function MyProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    apiKey: "",
    expiryDate: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Logged-in user ya admin ki details fetch karne ke liye API call
    fetch("/api/client/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile(data.user);
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans text-xs">
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username (Non-Editable) */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-600">Username (Non-Editable)</label>
            <input
              type="text"
              readOnly
              value={profile.username || profile.name || ""}
              className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
            />
          </div>

          {/* Account Role */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-600">Account Type</label>
            <input
              type="text"
              readOnly
              value={profile.role || "USER"}
              className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
            />
          </div>

          {/* Auto-Generated API Key */}
          <div className="md:col-span-2 space-y-1">
            <label className="block font-semibold text-gray-600">API Key (Auto-Generated)</label>
            <input
              type="text"
              readOnly
              value={profile.apiKey || "Generating..."}
              className="w-full border rounded-lg p-2.5 bg-gray-100 font-mono text-gray-600 font-bold"
            />
          </div>

          {/* Email ID */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-600">Email Address</label>
            <input
              type="email"
              readOnly
              value={profile.email || ""}
              className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-600">Mobile Number</label>
            <input
              type="text"
              readOnly
              value={profile.phone || ""}
              className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 font-mono"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-1 md:col-span-2">
            <label className="block font-semibold text-gray-600">Validity / Expiry Date</label>
            <input
              type="text"
              readOnly
              value={profile.expiryDate ? profile.expiryDate.substring(0, 10) : "N/A"}
              className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}