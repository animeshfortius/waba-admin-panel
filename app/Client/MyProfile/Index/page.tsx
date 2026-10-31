"use client";

import { useState, useEffect } from "react";

export default function MyProfilePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
  
  // Super Admin profile states
  const [formData, setFormData] = useState({
    username: "animeshfortius",
    role: "Super Admin",
    mobile: "919140901457",
    email: "animeshfortius@gmail.com",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    apiKey: "4p47cb81-10e5-4c82-821c-7862a71c674c",
    loginNotification: false,
  });

  const [loading, setLoading] = useState(true);

  // Security toggles state
  const [securitySettings, setSecuritySettings] = useState({
    ipWhitelisting: false,
    dlrWebhook: false,
  });

  useEffect(() => {
    // Fetch Super Admin details from API
    fetch("/api/client/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setFormData((prev) => ({
            ...prev,
            username: data.user.username || data.user.name || "animeshfortius",
            role: data.user.role || "Super Admin",
            email: data.user.email || "animeshfortius@gmail.com",
            mobile: data.user.phone || "919140901457",
            apiKey: data.user.apiKey || "4p47cb81-10e5-4c82-821c-7862a71c674c",
          }));
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Super Admin profile details saved successfully!");
  };

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Security settings updated successfully!");
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(formData.apiKey);
    alert("API Key copied to clipboard!");
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-sans text-xs">Loading Admin Profile...</div>;
  }

  return (
    <div className="w-full px-4 md:px-8 py-6 font-sans text-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-xs">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-extrabold shadow">
                👑
              </div>
              <span className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full text-[10px] shadow">
                ✓
              </span>
            </div>

            <h2 className="font-bold text-gray-800 text-sm">{formData.username}</h2>
            <p className="text-gray-400 text-[11px] mb-3">{formData.email}</p>
            
            <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold">
              ● Active Member
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
              <span>Member Since</span>
              <span className="font-semibold text-gray-800">Jun 12, 2026</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Valid Until</span>
              <span className="font-semibold text-rose-600">Dec 31, 2040</span>
            </div>
          </div>
        </div>

        {/* Right Content Area (Full Width Expanded) */}
        <div className="md:col-span-3">
          {activeTab === "personal" ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs w-full">
              <div className="border-b pb-4 mb-6">
                <h2 className="font-bold text-gray-900 text-sm">Personal Information</h2>
                <p className="text-gray-400 text-[11px]">Keep your Super Admin account details up to date.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">USERNAME</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">MOBILE NUMBER</label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handlePersonalChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">PERMANENT ADDRESS</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handlePersonalChange}
                    placeholder="Enter your permanent address..."
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 focus:outline-blue-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">CITY</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">STATE</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">PIN CODE</label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-800 focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">PUBLIC API KEY</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.apiKey}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-100 font-mono text-gray-600"
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

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="notif"
                    checked={formData.loginNotification}
                    onChange={(e) => setFormData(prev => ({ ...prev, loginNotification: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="notif" className="text-gray-700 font-medium">
                    Enable login notifications via SMS/Email <br />
                    <span className="text-[10px] text-gray-400">Get alerted every time your account is accessed from a new device.</span>
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>💾</span> Save Profile Details
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs w-full">
              <div className="border-b pb-4 mb-6">
                <h2 className="font-bold text-gray-900 text-sm">Security Settings</h2>
                <p className="text-gray-400 text-[11px]">Manage your Super Admin account access and data delivery.</p>
              </div>

              <form onSubmit={handleUpdateSecurity} className="space-y-6 w-full">
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