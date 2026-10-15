"use client";

import { useState } from "react";

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("hub");

  // User Management & Search States
  const [searchUsername, setSearchUsername] = useState("agent1");
  const [isUserSearched, setIsUserSearched] = useState(true);
  const [userActiveTab, setUserActiveTab] = useState<string>("profile");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Site Branding Tabs State
  const [activeBrandingTab, setActiveBrandingTab] = useState<string>("domain");

  // Sample Data States
  const [clients] = useState([
    {
      id: 1,
      clientName: "agent1",
      phone: "918888888888",
      email: "agent1@gmail.com",
      plan: "Enterprise",
      status: "Active",
    },
    {
      id: 2,
      clientName: "Acme Corp",
      phone: "919876543210",
      email: "acme@gmail.com",
      plan: "Standard",
      status: "Active",
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 text-xs">
      {/* Top Header & Breadcrumbs */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-gray-400">
            Admin Home{" "}
            {activeSection !== "hub" &&
              `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeSection === "hub" && "Administrator Control Center"}
            {activeSection === "user_management" && "Manage User"}
            {activeSection === "client_list" && "Client List Management"}
            {activeSection === "client_tree" && "Client Tree View Hierarchy"}
            {activeSection === "site_branding" && "Site Branding & White-Label"}
            {activeSection === "system_traffic" && "System Traffic & Monitoring"}
          </h1>
        </div>

        {activeSection !== "hub" && (
          <button
            onClick={() => setActiveSection("hub")}
            className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 shadow-sm flex items-center space-x-1 cursor-pointer bg-white"
          >
            <span>⬅</span>
            <span>Back to Admin Hub</span>
          </button>
        )}
      </div>

      {/* ADMIN HUB DASHBOARD CARDS GRID */}
      {activeSection === "hub" && (
        <div className="space-y-6">
          {/* Section 1: Administrator */}
          <div className="space-y-3">
            <h2 className="font-bold text-gray-500 uppercase tracking-wider pl-1">
              Administrator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveSection("user_management")}
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  👤
                </div>
                <h3 className="font-bold text-gray-800">UserManagement</h3>
                <p className="text-[10px] text-gray-400">
                  Easily manage users and permissions.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("client_list")}
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  📋
                </div>
                <h3 className="font-bold text-gray-800">Client List</h3>
                <p className="text-[10px] text-gray-400">
                  View your complete client list.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("client_tree")}
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  🌳
                </div>
                <h3 className="font-bold text-gray-800">Client Tree View</h3>
                <p className="text-[10px] text-gray-400">
                  Visualize client hierarchy easily.
                </p>
              </div>

              <div
                onClick={() => setActiveSection("site_branding")}
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  🎨
                </div>
                <h3 className="font-bold text-gray-800">Site Branding</h3>
                <p className="text-[10px] text-gray-400">
                  White-Label Solution setup.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Reporting & Monitoring */}
          <div className="space-y-3 pt-2">
            <h2 className="font-bold text-gray-500 uppercase tracking-wider pl-1">
              Monitoring Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveSection("system_traffic")}
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  📈
                </div>
                <h3 className="font-bold text-gray-800">System Traffic</h3>
                <p className="text-[10px] text-gray-400">
                  Monitor real-time system traffic.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. USER MANAGEMENT SECTION */}
      {activeSection === "user_management" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search username (e.g. agent1)..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="border rounded-xl px-3.5 py-2 w-80 bg-gray-50 focus:outline-none"
            />
            <button
              onClick={() => setIsUserSearched(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow cursor-pointer"
            >
              🔍 Search
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow ml-auto cursor-pointer"
            >
              + Add User
            </button>
          </div>

          {isUserSearched && (
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap border-b space-x-8 font-semibold text-gray-500 text-sm">
                <button
                  onClick={() => setUserActiveTab("profile")}
                  className={`pb-3 border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                    userActiveTab === "profile"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent"
                  }`}
                >
                  <span>👤</span>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setUserActiveTab("whatsapp")}
                  className={`pb-3 border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                    userActiveTab === "whatsapp"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent"
                  }`}
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setUserActiveTab("funds")}
                  className={`pb-3 border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                    userActiveTab === "funds"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent"
                  }`}
                >
                  <span>💳</span>
                  <span>Funds</span>
                </button>
                <button
                  onClick={() => setUserActiveTab("seemore")}
                  className={`pb-3 border-b-2 flex items-center space-x-1.5 cursor-pointer ${
                    userActiveTab === "seemore"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent"
                  }`}
                >
                  <span>⚙️</span>
                  <span>See More</span>
                </button>
              </div>

              {/* Profile Tab */}
              {userActiveTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 border rounded-2xl p-6 text-center space-y-4 bg-gray-50/50">
                    <div className="w-24 h-24 mx-auto bg-amber-100 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                      🧑‍💼
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">
                        {searchUsername} ✔
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        agent1@gmail.com
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600">
                        User Name
                      </label>
                      <input
                        type="text"
                        defaultValue={searchUsername}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600">
                        Account Status
                      </label>
                      <select className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium">
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-semibold text-gray-600">
                        API Key
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue="02163551-5dd5-4b5b-9c5f-32c9ec9663b9"
                        className="w-full border rounded-lg p-2.5 bg-gray-100 font-mono text-gray-500"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => alert("Settings updated!")}
                        className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer"
                      >
                        Update Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Tab */}
              {userActiveTab === "whatsapp" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                    <span className="font-semibold text-gray-700">
                      WhatsApp API Enabled
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="toggle toggle-success"
                    />
                  </div>
                  <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                    <span className="font-semibold text-gray-700">
                      Secure Reporting
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                    />
                  </div>
                  <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                    <span className="font-semibold text-gray-700">
                      International Account
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                    />
                  </div>
                </div>
              )}

              {/* Funds Tab */}
              {userActiveTab === "funds" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowFundModal(true)}
                        className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                      >
                        + Transfer Funds
                      </button>
                      <button
                        onClick={() => setShowRateModal(true)}
                        className="border border-emerald-300 text-emerald-700 font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                      >
                        ⚙️ Manage User Rates
                      </button>
                    </div>
                    <div className="flex space-x-4 font-bold">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl border">
                        Wallet Balance: ₹0.00
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border">
                        Oversell Balance: ₹0.00
                      </span>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
                        <th className="p-3">USER</th>
                        <th className="p-3">CREDITS</th>
                        <th className="p-3">CREDIT TYPE</th>
                        <th className="p-3">DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-gray-400"
                        >
                          No data found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* See More Tab */}
              {userActiveTab === "seemore" && (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => alert("Logging in as user...")}
                      className="bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      🔑 Login As User
                    </button>
                    <button
                      onClick={() => alert("Whitelist modal opened")}
                      className="border px-5 py-2.5 rounded-xl font-bold cursor-pointer"
                    >
                      🛡️ Manage WhiteList Number
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. CLIENT LIST SECTION */}
      {activeSection === "client_list" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-3 bg-gray-50 border-b font-bold text-gray-600">
            🎛️ Filter Records
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
                <th className="p-3.5">USER NAME</th>
                <th className="p-3.5">MOBILE NUMBER</th>
                <th className="p-3.5">EMAIL ID</th>
                <th className="p-3.5">IS ACTIVE</th>
                <th className="p-3.5">REGISTRATION DATE</th>
                <th className="p-3.5">EXPIRY DATE</th>
                <th className="p-3.5 text-center">CHECK BALANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-bold">{c.clientName}</td>
                  <td className="p-3.5 font-mono">+{c.phone}</td>
                  <td className="p-3.5">{c.email}</td>
                  <td className="p-3.5">
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      ✔
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">10-Oct-2026</td>
                  <td className="p-3.5 font-mono">30-Oct-2026</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => alert("Balance: ₹12,500")}
                      className="p-1.5 border rounded cursor-pointer"
                    >
                      🗄️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CLIENT TREE VIEW */}
      {activeSection === "client_tree" && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-sm text-gray-800">
              Client Hierarchy Tree View
            </h3>
            <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border">
              Root: Fortius Infocom (Admin)
            </span>
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-emerald-500/30">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md space-y-1">
              <div className="font-bold">👑 Fortius Infocom (Super Admin)</div>
              <div className="text-[11px] text-slate-400">Balance: ₹24,500</div>
            </div>
            <div className="pl-6 space-y-3 border-l-2">
              <div className="bg-white p-4 rounded-xl border shadow-xs">
                <div className="font-bold text-gray-800">
                  🏢 Rahul Reseller (Tier-1 Partner)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SITE BRANDING SECTION */}
      {activeSection === "site_branding" && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <div className="flex border-b space-x-6 text-sm font-semibold text-gray-500">
            <button
              onClick={() => setActiveBrandingTab("domain")}
              className={`pb-3 border-b-2 cursor-pointer ${
                activeBrandingTab === "domain"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent"
              }`}
            >
              🌐 Domain
            </button>
            <button
              onClick={() => setActiveBrandingTab("reseller")}
              className={`pb-3 border-b-2 cursor-pointer ${
                activeBrandingTab === "reseller"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent"
              }`}
            >
              🏢 Reseller Info
            </button>
            <button
              onClick={() => setActiveBrandingTab("notification")}
              className={`pb-3 border-b-2 cursor-pointer ${
                activeBrandingTab === "notification"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent"
              }`}
            >
              🔔 Notification
            </button>
            <button
              onClick={() => setActiveBrandingTab("smtp")}
              className={`pb-3 border-b-2 cursor-pointer ${
                activeBrandingTab === "smtp"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent"
              }`}
            >
              ⚙️ SMTP
            </button>
          </div>

          {activeBrandingTab === "domain" && (
            <div className="space-y-4 max-w-xl">
              <label className="block font-semibold text-gray-600">
                Domain Name
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter Domain"
                  className="w-full border rounded-lg p-2.5 bg-gray-50"
                />
                <button
                  onClick={() => alert("Domain saved!")}
                  className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {activeBrandingTab === "reseller" && (
            <div className="space-y-4 max-w-2xl">
              <input
                type="text"
                placeholder="Company Name"
                className="w-full border rounded-lg p-2.5 bg-gray-50"
              />
              <input
                type="email"
                placeholder="Email ID"
                className="w-full border rounded-lg p-2.5 bg-gray-50"
              />
              <button
                onClick={() => alert("Saved!")}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          )}

          {activeBrandingTab === "notification" && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex justify-between border p-3 rounded-xl bg-gray-50">
                <span>Notify Customer via Email</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="toggle toggle-success"
                />
              </div>
              <button
                onClick={() => alert("Saved!")}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          )}

          {activeBrandingTab === "smtp" && (
            <div className="space-y-4 max-w-2xl">
              <input
                type="text"
                placeholder="SMTP Host"
                className="w-full border rounded-lg p-2.5 bg-gray-50"
              />
              <input
                type="text"
                placeholder="SMTP Port"
                className="w-full border rounded-lg p-2.5 bg-gray-50"
              />
              <button
                onClick={() => alert("SMTP Saved!")}
                className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. SYSTEM TRAFFIC SECTION */}
      {activeSection === "system_traffic" && (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-3">
          <div className="text-3xl">📈</div>
          <h3 className="font-bold text-sm text-gray-800">
            System Traffic & Real-time Monitoring
          </h3>
          <p className="text-gray-500">
            Live analytics and traffic bandwidth details loaded successfully.
          </p>
        </div>
      )}

      {/* FUND TRANSFER MODAL */}
      {showFundModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-sm border-b pb-2">Fund Transfer</h3>
            <select className="w-full border rounded-lg p-2.5 bg-gray-50">
              <option>Actual</option>
              <option>Virtual</option>
            </select>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full border rounded-lg p-2.5 bg-gray-50"
            />
            <div className="flex justify-center space-x-3 pt-3 border-t">
              <button
                onClick={() => setShowFundModal(false)}
                className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setShowFundModal(false)}
                className="border px-6 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE USER RATES MODAL (ONLY WHATSAPP) */}
      {showRateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 text-xs relative">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-bold text-gray-800 text-sm">
                WhatsApp Rates & Margins
              </span>
              <button
                onClick={() => setShowRateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 w-64">
                  <label className="block font-semibold text-gray-600">
                    Margin Type
                  </label>
                  <select className="w-full border rounded-lg p-2 bg-gray-50 focus:outline-none font-medium">
                    <option>Fixed Price</option>
                    <option>Percentage Margin</option>
                  </select>
                </div>
                <span className="text-[11px] text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                  Selling price cannot be set less than 50% of My Rate
                </span>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
                      <th className="p-3">COUNTRY INFO</th>
                      <th className="p-3">CHANNEL TYPE</th>
                      <th className="p-3">MY RATE / UNIT</th>
                      <th className="p-3">SELLING RATE / UNIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700 font-medium">
                    <tr>
                      <td className="p-3 flex items-center space-x-2">
                        <span>🇮🇳</span>
                        <span>(91) INDIA - IN</span>
                      </td>
                      <td className="p-3">Utility</td>
                      <td className="p-3 font-mono text-gray-500">0.1350</td>
                      <td className="p-3">
                        <input
                          type="text"
                          defaultValue="0.1550"
                          className="border rounded px-2.5 py-1 w-28 bg-gray-50 font-mono focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center space-x-2">
                        <span>🇮🇳</span>
                        <span>(91) INDIA - IN</span>
                      </td>
                      <td className="p-3">Service</td>
                      <td className="p-3 font-mono text-gray-500">0.1350</td>
                      <td className="p-3">
                        <input
                          type="text"
                          defaultValue="0.1550"
                          className="border rounded px-2.5 py-1 w-28 bg-gray-50 font-mono focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center space-x-2">
                        <span>🇮🇳</span>
                        <span>(91) INDIA - IN</span>
                      </td>
                      <td className="p-3">Authentication</td>
                      <td className="p-3 font-mono text-gray-500">0.1350</td>
                      <td className="p-3">
                        <input
                          type="text"
                          defaultValue="0.1550"
                          className="border rounded px-2.5 py-1 w-28 bg-gray-50 font-mono focus:outline-none"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 flex items-center space-x-2">
                        <span>🇮🇳</span>
                        <span>(91) INDIA - IN</span>
                      </td>
                      <td className="p-3">Marketing</td>
                      <td className="p-3 font-mono text-gray-500">0.8046</td>
                      <td className="p-3">
                        <input
                          type="text"
                          defaultValue="0.8246"
                          className="border rounded px-2.5 py-1 w-28 bg-gray-50 font-mono focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    alert("WhatsApp rates saved successfully!");
                    setShowRateModal(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow cursor-pointer"
                >
                  💾 Save Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW USER MODAL (EXACT SCREENSHOT REPLICATED) */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs relative">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-gray-800 text-sm">Add User</span>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {/* User Name */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">User Name</label>
                <input
                  type="text"
                  placeholder="Enter User Name"
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    className="w-full border rounded-lg p-2.5 pr-8 bg-gray-50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Mobile Number</label>
                <div className="flex border rounded-lg overflow-hidden bg-gray-50">
                  <span className="px-3 py-2.5 bg-gray-100 text-gray-500 font-medium border-r flex items-center space-x-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Enter Mobile Number"
                    className="w-full p-2.5 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Mail Id */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Mail Id</label>
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              {/* Account Expiry Date */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Account Expiry Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none text-gray-600 font-medium"
                />
              </div>

              {/* Account Type Dropdown */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Account Type</label>
                <select className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium">
                  <option value="">Select Account Type</option>
                  <option value="reseller">Reseller</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              {/* Select Products Dropdown */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Select Products</label>
                <div className="border rounded-lg p-2 bg-gray-50 space-y-2">
                  <input
                    type="text"
                    placeholder="Search & select products..."
                    className="w-full border rounded p-1.5 text-xs bg-white focus:outline-none"
                  />
                  <div className="flex items-center space-x-2 pt-1 border-t">
                    <input type="checkbox" id="whatsapp_product" defaultChecked className="rounded text-emerald-600" />
                    <label htmlFor="whatsapp_product" className="font-medium text-gray-700 cursor-pointer">WhatsApp</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-center space-x-3 pt-3 border-t">
              <button
                onClick={() => {
                  alert("User added successfully!");
                  setShowAddUserModal(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-xl border cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}