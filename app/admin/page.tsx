"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>("hub");

  // User Management & Search States
  const [searchUsername, setSearchUsername] = useState("agent1");
  const [isUserSearched, setIsUserSearched] = useState(true);
  const [userActiveTab, setUserActiveTab] = useState<string>("profile");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Site Branding Tabs State
  const [activeBrandingTab, setActiveBrandingTab] = useState<string>("domain");

  // Database se live users laane ke liye state
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formattedClients = data.users.map((u: any) => ({
            id: u.id,
            clientName: u.name,
            phone: u.phone || "N/A",
            email: u.email,
            plan: u.role || "USER",
            status: "Active",
          }));
          setClients(formattedClients);
        }
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 text-xs font-sans">
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
              {/* 1. USER MANAGEMENT CARD WITH DIRECT URL ROUTING */}
              <Link
                href="/admin/user-management"
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group block"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  👤
                </div>
                <h3 className="font-bold text-gray-800">User Management</h3>
                <p className="text-[10px] text-gray-400">
                  Easily manage users and permissions.
                </p>
              </Link>

              {/* 2. CLIENT LIST CARD WITH DIRECT URL ROUTING */}
              <Link
                href="/admin/client-list"
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group block"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  📋
                </div>
                <h3 className="font-bold text-gray-800">Client List</h3>
                <p className="text-[10px] text-gray-400">
                  View your complete client list.
                </p>
              </Link>

              {/* 3. CLIENT TREE VIEW CARD WITH DIRECT URL ROUTING */}
              <Link
                href="/admin/client-tree"
                className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition space-y-2 group block"
              >
                <div className="text-2xl group-hover:scale-110 transition">
                  🌳
                </div>
                <h3 className="font-bold text-gray-800">Client Tree View</h3>
                <p className="text-[10px] text-gray-400">
                  Visualize client hierarchy easily.
                </p>
              </Link>

              {/* 4. SITE BRANDING CARD */}
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

      {/* SITE BRANDING SECTION */}
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

      {/* SYSTEM TRAFFIC SECTION */}
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
    </div>
  );
}