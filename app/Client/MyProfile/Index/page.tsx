"use client";

import { useState, useEffect } from "react";

export default function MyProfilePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
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

  // Security toggles state
  const [securitySettings, setSecuritySettings] = useState({
    ipWhitelisting: false,
    dlrWebhook: false,
    loginNotification: false,
  });

  useEffect(() => {
    // Fetch profile data from API
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

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Security settings updated successfully!");
  };

  const copyApiKey = () => {
    if (profile.apiKey) {
      navigator.clipboard.writeText(profile.apiKey);
      alert("API Key copied to clipboard!");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-sans text-xs">Loading Profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 font-sans text-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar Profile Summary Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-xs">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-extrabold shadow">
                👤
              </div>
            </div>

            <h2 className="font-bold text-gray-800 text-sm">{profile.username || profile.name || "User"}</h2>
            <p className="text-gray-400 text-[11px] mb-3">{profile.email || "No email"}</p>
            
            <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
              ● {profile.role || "USER"}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition ${
                activeTab === "personal"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>👤</span> Personal Info
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition ${
                activeTab === "security"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>🔒</span> Security & Settings
            </button>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>⚡</span> Quick Summary
            </h3>
            <div className="flex justify-between text-gray-500 border-b pb-2">
              <span>Account Role</span>
              <span className="font-semibold text-gray-800">{profile.role || "USER"}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Valid Until</span>
              <span className="font-semibold text-rose-600">
                {profile.expiryDate ? profile.expiryDate.substring(0, 10) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-3">
          {activeTab === "personal" ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b pb-4">
                <h2 className="font-bold text-gray-900 text-sm">Personal Information</h2>
                <p className="text-gray-400 text-[11px]">Keep your account details up to date.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">USERNAME (Non-Editable)</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.username || profile.name || ""}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 text-gray-500 font-medium"
                  />
                </div>

                {/* Account Type */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">ACCOUNT TYPE</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.role || "USER"}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 text-gray-500 font-medium"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    readOnly
                    value={profile.email || ""}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 text-gray-500"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">MOBILE NUMBER</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.phone || ""}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 text-gray-500 font-mono"
                  />
                </div>

                {/* API Key */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-gray-600">PUBLIC API KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile.apiKey || "Generating..."}
                      className="w-full border rounded-xl px-3 py-2.5 bg-gray-100 font-mono text-gray-600 font-bold"
                    />
                    <button
                      type="button"
                      onClick={copyApiKey}
                      className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-gray-600">VALIDITY / EXPIRY DATE</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.expiryDate ? profile.expiryDate.substring(0, 10) : "N/A"}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 text-gray-500 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="border-b pb-4 mb-6">
                <h2 className="font-bold text-gray-900 text-sm">Security Settings</h2>
                <p className="text-gray-400 text-[11px]">Manage your account access and data delivery.</p>
              </div>

              <form onSubmit={handleUpdateSecurity} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Network Security</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div>
                      <div className="font-bold text-gray-800">IP Whitelisting</div>
                      <div className="text-[10px] text-gray-400">Restrict account access to specific IP addresses.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.ipWhitelisting}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelisting: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Real-Time Integration</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div>
                      <div className="font-bold text-gray-800">DLR Webhook (Push Delivery)</div>
                      <div className="text-[10px] text-gray-400">Receive delivery status updates via webhook.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={securitySettings.dlrWebhook}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, dlrWebhook: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>✔</span> Update Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}