"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    status: "Active",
    expiryDate: "2026-10-29",
  });

  const [changePasswordToggle, setChangePasswordToggle] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        const list = data.users || (Array.isArray(data) ? data : []);
        setAllUsers(list);
        if (list.length > 0) {
          selectUserHandler(list[0]);
        }
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const selectUserHandler = (user: any) => {
    setSelectedUser(user);
    setSearchQuery(user.name || user.email);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "USER",
      status: "Active",
      expiryDate: user.expiryDate ? user.expiryDate.substring(0, 10) : "2026-10-29",
    });
    setShowSuggestions(false);
    setChangePasswordToggle(false);
    setNewPasswordInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const matches = allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(value.toLowerCase()) ||
          u.email?.toLowerCase().includes(value.toLowerCase()) ||
          u.phone?.includes(value)
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchClick = () => {
    const found = allUsers.find(
      (u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      selectUserHandler(found);
    } else {
      alert("User not found!");
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          expiryDate: formData.expiryDate,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert("User settings updated successfully in database!");
        setAllUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, ...formData } : u))
        );
        setSelectedUser({ ...selectedUser, ...formData });
      } else {
        alert("Failed to update: " + result.message);
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error updating user settings.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs font-sans">
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

      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-2 flex-1 max-w-xl relative">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Type username or email for suggestions..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="border rounded-xl px-3.5 py-2 w-full bg-gray-50 focus:outline-none text-xs"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-white border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y">
                {suggestions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => selectUserHandler(u)}
                    className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{u.name}</div>
                      <div className="text-[10px] text-gray-400">{u.email}</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      {u.role || "USER"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSearchClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow cursor-pointer text-xs flex items-center gap-1"
          >
            🔍 Search
          </button>
        </div>

        <button
          onClick={() => alert("Add User feature active.")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer text-xs"
        >
          + Add User
        </button>
      </div>

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

        {activeTab === "profile" && selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 border rounded-2xl p-6 text-center space-y-3 bg-gray-50/50">
              <div className="w-20 h-20 mx-auto bg-amber-100 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                🧑‍💼
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm flex items-center justify-center gap-1">
                  {formData.name || selectedUser.name || "User"}{" "}
                  <span className="text-emerald-500">✔</span>
                </h4>
                <p className="text-[11px] text-gray-400">
                  {formData.email || selectedUser.email}
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">User Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block font-semibold text-gray-600">API Key</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedUser.id || ""}
                    className="w-full border rounded-lg p-2.5 bg-gray-100 font-mono text-gray-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Type</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-medium"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="RESELLER">Reseller</option>
                    <option value="USER">User / Agent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-gray-600">Account Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                  />
                </div>

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
                        placeholder="Enter new password to update..."
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
                            const res = await fetch("/api/admin/update-user", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userId: selectedUser.id,
                                password: newPasswordInput,
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert("Password updated and saved in database!");
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleUpdateSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer text-xs"
                >
                  💾 Update Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "profile" && (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border">
            {activeTab.toUpperCase()} details loaded for {formData.name || selectedUser?.name}.
          </div>
        )}
      </div>
    </div>
  );
}