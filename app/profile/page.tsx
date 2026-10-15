"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [username, setUsername] = useState("animeshfortius");
  const [mobile, setMobile] = useState("919140901457");
  const [email, setEmail] = useState("animeshfortius@gmail.com");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [apiKey] = useState("4c47c061-10c5-4c02-821f-7602u71c074c");
  const [notifications, setNotifications] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <span className="font-mono bg-gray-100 px-2.5 py-1 rounded">171.50.181.171</span>
          <span>🔍 Search pages...</span>
        </div>
      </div>

      {/* Main Profile Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Profile Sidebar Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm text-center space-y-4">
            <div className="relative inline-block">
              <div className="h-24 w-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold mx-auto shadow">
                👤
              </div>
              <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full text-xs shadow">
                📷
              </span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">animeshfortius</h2>
              <p className="text-xs text-gray-400">animeshfortius@gmail.com</p>
            </div>
            <div>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                🟢 Active Member
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-1 pt-4 border-t text-left">
              <button
                onClick={() => setActiveTab("personal")}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "personal"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>👤</span>
                <span>Personal Info</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "security"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>🔒</span>
                <span>Security & Settings</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-700 flex items-center space-x-2">
              <span>📊</span>
              <span>Quick Summary</span>
            </h3>
            <div className="flex justify-between text-xs text-gray-500 py-1.5 border-b">
              <span>Member Since</span>
              <span className="font-semibold text-gray-800">Jun 12, 2026</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 py-1.5">
              <span>Valid Until</span>
              <span className="font-semibold text-red-600">Dec 31, 2040</span>
            </div>
          </div>
        </div>

        {/* Right Content Details Card */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <span>🪪</span>
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-gray-400">Keep your account details up to date.</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Username</label>
                <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                  <span className="text-gray-400 mr-2">👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent w-full text-sm text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mobile Number</label>
                <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                  <span className="text-gray-400 mr-2">📱</span>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="bg-transparent w-full text-sm text-gray-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
              <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                <span className="text-gray-400 mr-2">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent w-full text-sm text-gray-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Permanent Address</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your permanent address..."
                className="w-full border rounded-lg p-3 text-sm text-gray-800 focus:outline-none bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pin Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Public API Key</label>
              <div className="flex items-center border rounded-lg px-3 py-2.5 bg-gray-100">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="bg-transparent w-full font-mono text-xs text-gray-600 focus:outline-none"
                />
                <button
                  onClick={() => alert("API Key Copied!")}
                  className="text-gray-500 hover:text-gray-800 text-sm ml-2"
                  title="Copy Key"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="notifications" className="text-xs text-gray-600">
                  Enable login notifications via SMS/Email <br />
                  <span className="text-gray-400">Get alerted every time your account is accessed from a new device.</span>
                </label>
              </div>

              <button
                onClick={() => alert("Profile Details Saved Successfully!")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow transition"
              >
                💾 Save Profile Details
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}