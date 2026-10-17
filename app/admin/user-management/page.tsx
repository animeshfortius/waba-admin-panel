"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Password change states
  const [changePasswordToggle, setChangePasswordToggle] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Fetch users on load
  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        const list = data.users || (Array.isArray(data) ? data : []);
        setAllUsers(list);
        if (list.length > 0) {
          // Default selection
          setSelectedUser(list[0]);
          setSearchQuery(list[0].name || list[0].email);
        }
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Handle Search
  const handleSearch = () => {
    setLoading(true);
    const found = allUsers.find(
      (u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      setSelectedUser(found);
      setChangePasswordToggle(false);
      setNewPasswordInput("");
    } else {
      alert("User not found!");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs font-sans">
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-gray-400">Admin Home › User Management</div>
          <h1 className="text-xl font-bold text-gray-800">Manage User</h1>
        </div>
        <Link
          href="/admin"
          className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 shadow-sm bg-white"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      {/* Search Bar & Add User Action */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Enter username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-xl px-3.5 py-2 w-full bg-gray-50 focus:outline-none text-xs"
          />
          <button
            onClick={handleSearch}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow cursor-pointer text-xs flex items-center gap-1"
          >
            🔍 Search
          </button>
        </div>
        <button
          onClick={() => alert("Add User Modal coming soon!")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer text-xs"
        >
          + Add User
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap border-b space-x-6 font-semibold text-gray-500 text-xs">
          {[
            { id: "profile", label: "👤 Profile" },
            { id: "whatsapp", label: "💬 WhatsApp" },
            { id: "funds", label: "💳 Funds" },
            { id: "products", label: "📦 Products" },
            { id: "email_setting", label: "📧 Email Setting" },
            { id: "seemore", label: "⚙️ See More" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-transparent hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PROFILE TAB CONTENT */}
        {activeTab === "profile" && selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* User Avatar Card */}
            <div className="lg:col-span-1 border rounded-2xl p-6 text-center space-y-3 bg-gray-50/50">
              <div className="w-20 h-20 mx-auto bg-amber-100 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                🧑‍💼
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm flex items-center justify-center gap-1">
                  {selectedUser.name || "User"} <span className="text-emerald-500">✔</span>
                </h4>
                <p className="text-[11px] text-gray-400">{selectedUser.email}</p>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">User Name</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.name || ""}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Status</label>
                  <select className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-gray-600">API Key</label>
                  <input
                    type="text"
                    readOnly
                    defaultValue={selectedUser.id || "02163551-5dd5-4b5b-9c5f-32c9ec9663b9"}
                    className="w-full border rounded-lg p-2.5 bg-gray-100 font-mono text-gray-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Type</label>
                  <select className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium">
                    <option>{selectedUser.role || "Agent"}</option>
                    <option>Reseller</option>
                    <option>User</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Mobile Number</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.phone ? `+${selectedUser.phone}` : "+91 8888888888"}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Expiry Date</label>
                  <input
                    type="date"
                    defaultValue="2026-10-29"
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Password Management Section with Toggle */}
                <div className="space-y-2 md:col-span-2 border p-4 rounded-xl bg-gray-50/50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-700">Password Management</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={changePasswordToggle}
                        onChange={(e) => setChangePasswordToggle(e.target.checked)}
                        className="toggle toggle-success"
                      />
                      <span className="text-xs font-bold text-gray-600">Change Password?</span>
                    </label>
                  </div>

                  {changePasswordToggle ? (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="Enter new secure password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-white focus:outline-none font-mono"
                      />
                      <button
                        onClick={async () => {
                          if (!newPasswordInput) {
                            alert("Please enter a new password!");
                            return;
                          }
                          try {
                            const res = await fetch("/api/admin/update-password", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId: selectedUser.id,
                                newPassword: newPasswordInput,
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert("Password successfully updated and saved in database!");
                              setNewPasswordInput("");
                              setChangePasswordToggle(false);
                            } else {
                              alert("Failed: " + data.message);
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Error updating password");
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow cursor-pointer"
                      >
                        💾 Save New Password
                      </button>
                    </div>
                  ) : (
                    <input
                      type="password"
                      disabled
                      defaultValue="************************"
                      className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-400 font-mono"
                    />
                  )}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block font-semibold text-gray-600">Email Id</label>
                  <input
                    type="email"
                    defaultValue={selectedUser.email || ""}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => alert("Settings Updated Successfully!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer text-xs"
                >
                  💾 Update Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTHER TABS PLACEHOLDERS */}
        {activeTab !== "profile" && (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border">
            {activeTab.toUpperCase()} Section Details for {selectedUser?.name || "User"}
          </div>
        )}
      </div>
    </div>
  );
}