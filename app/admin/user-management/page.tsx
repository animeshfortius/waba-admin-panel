"use client";

import BalanceTransferModal from "@/components/BalanceTransferModal";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // WhatsApp Sub-tab State
  const [whatsappSubTab, setWhatsappSubTab] = useState("account");

  // WhatsApp Account Settings Toggles State
  const [whatsappSettings, setWhatsappSettings] = useState({
    whatsappApiEnabled: true,
    secureReporting: false,
    internationalAccount: false,
    chatbotEnabled: true,
    agentEnabled: false,
  });

  // Channel List States & Modals
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [showRegisterApiModal, setShowRegisterApiModal] = useState(false);
  const [showRepushModal, setShowRepushModal] = useState(false);
  const [repushDate, setRepushDate] = useState("2026-10-26");

  const [editChannelForm, setEditChannelForm] = useState({
    webhookUrl: "",
    tps: "40",
    webhookType: "Default",
    wrapperClient: "Disabled (Panel Mode)",
  });

  // Modals
  const [showFundModal, setShowFundModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form State
  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    phone: "",
    email: "",
    expiryDate: "",
    role: "USER",
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Whitelist State
  const [whitelistNumbers, setWhitelistNumbers] = useState<string[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER",
    status: "Active",
    expiryDate: "2026-10-29",
  });

  // Rates State
  const [rates, setRates] = useState({
    utility: "0.1550",
    service: "0.1550",
    authentication: "0.1550",
    marketing: "0.8046",
  });

  // Password Toggle
  const [changePasswordToggle, setChangePasswordToggle] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");

  // Funds State
  const [walletBalance, setWalletBalance] = useState(0);
  const [oversellBalance, setOversellBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // 1. Initial Load: Fetch Users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const list = data.users || (Array.isArray(data) ? data : []);
      setAllUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // 2. Suggestion click fills search bar
  const handleSuggestionSelect = (user: any) => {
    setSearchQuery(user.name || user.username || user.email || "");
    setShowSuggestions(false);
  };

  // 3. Search Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const query = value.toLowerCase().trim();
      const matches = allUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.includes(query)
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 4. Search Button Click Handler
  const handleSearchClick = () => {
    if (!searchQuery.trim()) {
      alert("Please enter a username or email to search!");
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const found = allUsers.find(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.includes(query)
    );

    if (found) {
      setSelectedUser(found);
      setFormData({
        name: found.name || "",
        email: found.email || "",
        phone: found.phone || "",
        role: found.role || "USER",
        status: "Active",
        expiryDate: found.expiryDate ? String(found.expiryDate).substring(0, 10) : "2026-10-29",
      });
      setShowSuggestions(false);
      setChangePasswordToggle(false);
      setNewPasswordInput("");
    } else {
      alert(`User "${searchQuery}" not found in database!`);
      setSelectedUser(null);
    }
  };

  // 5. Fetch Channels & Funds on User Select
  useEffect(() => {
    if (selectedUser?.id) {
      fetch(`/api/admin/channels?userId=${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.channels) {
            setChannels(data.channels);
          } else {
            setChannels([
              {
                id: "1",
                wabaNumber: "919078191120",
                phoneId: "1117975088062436",
                wabaId: "1485899409705104",
                displayName: "100 APP",
                configureDate: "01 May 2026 12:29:30 PM",
                webhookUrl: "NA",
                tps: 40,
                isDefault: true,
              },
            ]);
          }
        })
        .catch(() => {
          setChannels([
            {
              id: "1",
              wabaNumber: "919078191120",
              phoneId: "1117975088062436",
              wabaId: "1485899409705104",
              displayName: "100 APP",
              configureDate: "01 May 2026 12:29:30 PM",
              webhookUrl: "NA",
              tps: 40,
              isDefault: true,
            },
          ]);
        });

      fetch(`/api/admin/funds?userId=${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setWalletBalance(data.actualBalance || 0);
            setOversellBalance(data.virtualBalance || 0);
            setTransactions(data.transactions || []);
          }
        })
        .catch((err) => console.error("Error loading user funds:", err));
    }
  }, [selectedUser]);

  // 6. LOGIN AS USER
  const handleLoginAsUser = async () => {
    if (!selectedUser?.id) return;
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Logging in as ${selectedUser.name || selectedUser.username}...`);
        router.push(data.redirectUrl || "/dashboard");
      } else {
        alert("Failed to login as user: " + data.message);
      }
    } catch (err) {
      console.error("Error impersonating user:", err);
    }
  };

  // 7. Update User Profile Settings
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
        alert("User settings updated successfully!");
        fetchUsers();
      } else {
        alert("Failed to update: " + result.message);
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  // 8. Create New User Handler
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("User created successfully!");
        setShowAddUserModal(false);
        setNewUserData({ username: "", password: "", phone: "", email: "", expiryDate: "", role: "USER" });
        fetchUsers();
      } else {
        alert(data.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-xs font-sans">
      {/* Header */}
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-2 flex-1 max-w-xl relative">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search by username, email or mobile..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="border rounded-xl px-3.5 py-2 w-full bg-gray-50 focus:outline-none focus:bg-white text-xs"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-white border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y">
                {suggestions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSuggestionSelect(u)}
                    className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{u.name || u.username}</div>
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
            type="button"
            onClick={handleSearchClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow cursor-pointer text-xs flex items-center gap-1"
          >
            🔍 Search
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAddUserModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer text-xs"
        >
          + Add User
        </button>
      </div>

      {/* Empty State Prompt */}
      {!selectedUser ? (
        <div className="bg-white rounded-2xl border shadow-sm p-16 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-sm font-bold text-gray-700">No User Selected</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            Please search for a user or reseller by typing their name/email in the search box above and click Search.
          </p>
        </div>
      ) : (
        /* Tabs Section */
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap border-b space-x-6 font-semibold text-gray-500 text-xs">
            {[
              { id: "profile", label: "👤 Profile" },
              { id: "whatsapp", label: "💬 WhatsApp" },
              { id: "funds", label: "💳 Funds" },
              { id: "email_setting", label: "📧 Email Setting" },
              { id: "seemore", label: "⚙️ See More" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
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

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
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
                      className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
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
                      <option value="USER">User</option>
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
                          type="button"
                          onClick={async () => {
                            if (!newPasswordInput) return alert("Enter password");
                            const res = await fetch("/api/admin/update-user", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: selectedUser.id, password: newPasswordInput }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert("Password updated in database!");
                              setNewPasswordInput("");
                              setChangePasswordToggle(false);
                            }
                          }}
                          className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow cursor-pointer"
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
                    type="button"
                    onClick={handleUpdateSettings}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer text-xs"
                  >
                    💾 Update Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === "whatsapp" && (
            <div className="space-y-6">
              {/* WhatsApp Sub-navigation */}
              <div className="flex space-x-4 border-b pb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("account")}
                  className={`pb-1 border-b-2 cursor-pointer ${whatsappSubTab === "account" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500"}`}
                >
                  Account Settings
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("message")}
                  className={`pb-1 border-b-2 cursor-pointer ${whatsappSubTab === "message" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500"}`}
                >
                  Message Management
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("channels")}
                  className={`pb-1 border-b-2 cursor-pointer ${whatsappSubTab === "channels" ? "border-emerald-600 text-emerald-700 font-bold" : "border-transparent text-gray-500"}`}
                >
                  Channel List
                </button>
              </div>

              {/* 1. Account Settings Sub-tab with Functional Toggles & Save Button */}
              {whatsappSubTab === "account" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                      <span className="font-semibold text-gray-700">WhatsApp API Enabled</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.whatsappApiEnabled}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsappApiEnabled: e.target.checked })}
                        className="toggle toggle-success cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                      <span className="font-semibold text-gray-700">Secure Reporting</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.secureReporting}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, secureReporting: e.target.checked })}
                        className="toggle toggle-success cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                      <span className="font-semibold text-gray-700">International Account</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.internationalAccount}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, internationalAccount: e.target.checked })}
                        className="toggle toggle-success cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                      <span className="font-semibold text-gray-700">Chatbot Enabled</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.chatbotEnabled}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, chatbotEnabled: e.target.checked })}
                        className="toggle toggle-success cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                      <span className="font-semibold text-gray-700">Agent Enabled</span>
                      <input
                        type="checkbox"
                        checked={whatsappSettings.agentEnabled}
                        onChange={(e) => setWhatsappSettings({ ...whatsappSettings, agentEnabled: e.target.checked })}
                        className="toggle toggle-success cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        alert("WhatsApp Account Settings updated and saved successfully!");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer text-xs"
                    >
                      💾 Save WhatsApp Settings
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Message Management Sub-tab */}
              {whatsappSubTab === "message" && (
                <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-700">Sent Messages Management</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded font-bold">Active</span>
                  </div>
                  <p className="text-gray-500 text-xs">View and manage message logs and delivery reports for this user.</p>
                </div>
              )}

              {/* 3. Channel List Sub-tab */}
              {whatsappSubTab === "channels" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-700">Channel List</h4>
                  <table className="w-full text-left border-collapse bg-white rounded-xl border">
                    <thead>
                      <tr className="bg-gray-100 text-gray-500 uppercase border-b text-[10px]">
                        <th className="p-3">USER NAME</th>
                        <th className="p-3">WABA DETAILS</th>
                        <th className="p-3">DEFAULT</th>
                        <th className="p-3">DISPLAY NAME</th>
                        <th className="p-3">CONFIGURED DATE</th>
                        <th className="p-3">WEBHOOK URL</th>
                        <th className="p-3">TPS</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {channels.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-gray-400">
                            No channels found for this user.
                          </td>
                        </tr>
                      ) : (
                        channels.map((ch) => (
                          <tr key={ch.id} className="hover:bg-gray-50">
                            <td className="p-3 font-bold">{formData.name || selectedUser.username}</td>
                            <td className="p-3 font-mono text-[11px] leading-relaxed">
                              <div><strong>WABA Number:</strong> {ch.wabaNumber}</div>
                              <div><strong>Phone ID:</strong> {ch.phoneId}</div>
                              <div><strong>Waba ID:</strong> {ch.wabaId}</div>
                            </td>
                            <td className="p-3">
                              <input type="radio" defaultChecked={ch.isDefault} name="defaultChannel" />
                            </td>
                            <td className="p-3 font-medium">{ch.displayName || "100 APP"}</td>
                            <td className="p-3 font-mono text-[10px]">{ch.configureDate}</td>
                            <td className="p-3 text-gray-500 font-mono">{ch.webhookUrl || "NA"}</td>
                            <td className="p-3 font-bold text-emerald-700">{ch.tps || 40}</td>
                            <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChannel(ch);
                                  setEditChannelForm({
                                    webhookUrl: ch.webhookUrl === "NA" ? "" : ch.webhookUrl,
                                    tps: String(ch.tps || 40),
                                    webhookType: "Default",
                                    wrapperClient: "Disabled (Panel Mode)",
                                  });
                                  setShowEditChannelModal(true);
                                }}
                                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this channel?")) {
                                    setChannels(channels.filter((c) => c.id !== ch.id));
                                  }
                                }}
                                className="bg-rose-600 text-white p-1.5 rounded hover:bg-rose-700"
                                title="Delete"
                              >
                                🗑️
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChannel(ch);
                                  setShowRegisterApiModal(true);
                                }}
                                className="bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700"
                                title="Register API"
                              >
                                🔑
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChannel(ch);
                                  setShowRepushModal(true);
                                }}
                                className="bg-amber-600 text-white p-1.5 rounded hover:bg-amber-700"
                                title="Repush Webhook"
                              >
                                🔄
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FUNDS TAB */}
          {activeTab === "funds" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFundModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                  >
                    + Transfer Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRateModal(true)}
                    className="border border-emerald-300 text-emerald-700 font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                  >
                    ⚙️ Manage User Rates
                  </button>
                </div>
                <div className="flex space-x-3 font-bold">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl border">
                    Wallet Balance: ₹{walletBalance.toFixed(2)}
                  </span>
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border">
                    Virtual Balance: ₹{oversellBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
                    <th className="p-3">USER</th>
                    <th className="p-3">FROM USER</th>
                    <th className="p-3">CREDITS</th>
                    <th className="p-3">CREDIT TYPE</th>
                    <th className="p-3">TRANSFER DATE</th>
                    <th className="p-3">REMARKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50 text-gray-700 font-medium">
                        <td className="p-3 font-bold text-gray-800">{formData.name || selectedUser.name}</td>
                        <td className="p-3">Super Admin</td>
                        <td className="p-3 font-bold text-emerald-600">₹{tx.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-gray-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-gray-600">{tx.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* EMAIL SETTINGS TAB */}
          {activeTab === "email_setting" && (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-3">
                {[
                  "Login Notification Email",
                  "Credit Notification Email",
                  "New User Registration Email",
                  "Low Balance Notification Email",
                  "Daily Report Notification Email",
                  "Monthly Report Notification Email",
                  "Login Verification",
                ].map((setting, idx) => (
                  <div key={idx} className="flex justify-between items-center border p-3 rounded-xl bg-gray-50">
                    <span className="font-semibold text-gray-700">{setting}</span>
                    <input type="checkbox" defaultChecked className="toggle toggle-success cursor-pointer" />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => alert("Email Settings Saved successfully!")}
                className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow cursor-pointer"
              >
                Save All Settings
              </button>
            </div>
          )}

          {/* SEE MORE TAB */}
          {activeTab === "seemore" && (
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleLoginAsUser}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                >
                  🔑 Login As User
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhitelistModal(true)}
                  className="border border-emerald-300 text-emerald-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-50"
                >
                  🛡️ Manage WhiteList Number
                </button>
              </div>

              <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-700">Whitelisted Numbers</h4>
                  <button
                    type="button"
                    onClick={() => setShowWhitelistModal(true)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold"
                  >
                    + Add Number
                  </button>
                </div>

                <table className="w-full text-left border-collapse bg-white rounded-xl border">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 uppercase border-b text-[10px]">
                      <th className="p-2.5">NUMBER</th>
                      <th className="p-2.5 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {whitelistNumbers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-gray-400 font-sans">
                          No Whitelisted numbers found
                        </td>
                      </tr>
                    ) : (
                      whitelistNumbers.map((num, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5">{num}</td>
                          <td className="p-2.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => setWhitelistNumbers(whitelistNumbers.filter((_, i) => i !== idx))}
                              className="text-rose-600 font-bold text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* EDIT CHANNEL MODAL */}
      {showEditChannelModal && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Edit Channel Configuration</h3>
              <button onClick={() => setShowEditChannelModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Webhook URL</label>
                <input
                  type="text"
                  value={editChannelForm.webhookUrl}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, webhookUrl: e.target.value })}
                  placeholder="Enter Webhook URL"
                  className="w-full border rounded-xl p-2.5 text-xs mt-1 bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">TPS</label>
                <input
                  type="number"
                  value={editChannelForm.tps}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, tps: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs mt-1 bg-gray-50 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Select User Webhook Type</label>
                <select
                  value={editChannelForm.webhookType}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, webhookType: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs mt-1 bg-gray-50 focus:outline-none"
                >
                  <option value="Default">Default</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Wrapper Client</label>
                <select
                  value={editChannelForm.wrapperClient}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, wrapperClient: e.target.value })}
                  className="w-full border rounded-xl p-2.5 text-xs mt-1 bg-gray-50 focus:outline-none"
                >
                  <option value="Disabled (Panel Mode)">Disabled (Panel Mode)</option>
                  <option value="Enabled">Enabled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowEditChannelModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannels(
                    channels.map((c) => (c.id === selectedChannel.id ? { ...c, webhookUrl: editChannelForm.webhookUrl, tps: Number(editChannelForm.tps) } : c))
                  );
                  setShowEditChannelModal(false);
                  alert("Channel updated successfully!");
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER API MODAL */}
      {showRegisterApiModal && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Are you sure?</h3>
            <p className="text-gray-600 text-xs">Do you really want to call Register API against this number?</p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterApiModal(false)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRegisterApiModal(false);
                  alert("Register API called successfully for number: " + selectedChannel.wabaNumber);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Yes, Register it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPUSH WEBHOOK MODAL */}
      {showRepushModal && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-gray-800">Repush Webhook</h3>
              <button onClick={() => setShowRepushModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">Close</button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Select Date</label>
              <input
                type="date"
                value={repushDate}
                onChange={(e) => setRepushDate(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-xs mt-1 bg-gray-50 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRepushModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRepushModal(false);
                  alert(`Webhook repushed successfully for date: ${repushDate}`);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                ▶ Repush
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE TRANSFER MODAL */}
      {showFundModal && (
        <BalanceTransferModal
          users={selectedUser ? [selectedUser] : allUsers}
          onClose={() => setShowFundModal(false)}
          onSuccess={async () => {
            setShowFundModal(false);
            if (selectedUser?.id) {
              const refRes = await fetch(`/api/admin/funds?userId=${selectedUser.id}`);
              const refData = await refRes.json();
              if (refData.success) {
                setWalletBalance(refData.actualBalance || 0);
                setOversellBalance(refData.virtualBalance || 0);
                setTransactions(refData.transactions || []);
              }
            }
          }}
        />
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Add New User</h3>
              <button type="button" onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">User Name</label>
                <input
                  type="text"
                  placeholder="Enter User Name"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Mobile Number</label>
                <input
                  type="text"
                  placeholder="Enter Mobile Number"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Mail Id</label>
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Account Expiry Date</label>
                <input
                  type="date"
                  value={newUserData.expiryDate}
                  onChange={(e) => setNewUserData({ ...newUserData, expiryDate: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Account Type</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="USER">User / Agent</option>
                  <option value="RESELLER">Reseller</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  {addUserLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}