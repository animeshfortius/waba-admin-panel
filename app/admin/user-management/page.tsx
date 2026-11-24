"use client";

import BalanceTransferModal from "@/components/BalanceTransferModal";
import ManageRatesModal from "@/components/ManageRatesModal";
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
  const [whatsappSubTab, setWhatsappSubTab] = useState("channelList");

  const [currentAdminId, setCurrentAdminId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");

  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRegisterApiModal, setShowRegisterApiModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState("");
  const [tpsInput, setTpsInput] = useState("50");

  const [whatsappSettings, setWhatsappSettings] = useState({
    whatsappApiEnabled: true,
    secureReporting: false,
    internationalAccount: false,
    chatbotEnabled: true,
  });

  const [showFundModal, setShowFundModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [whitelistInput, setWhitelistInput] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    phone: "",
    email: "",
    expiryDate: "",
    role: "USER",
    customDomain: "",
    brandName: "",
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const [whitelistNumbers, setWhitelistNumbers] = useState<string[]>([]);

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

  const [walletBalance, setWalletBalance] = useState(0);
  const [oversellBalance, setOversellBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();

    const adminRole =
      localStorage.getItem("userRole") || localStorage.getItem("adminRole") || "SUPER_ADMIN";
    const adminId = localStorage.getItem("userId") || localStorage.getItem("adminId") || "";

    setCurrentUserRole(adminRole);
    setCurrentAdminId(adminId);

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          if (data.user.id) setCurrentAdminId(data.user.id);
          if (data.user.role) setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
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

  const refreshSelectedUserFunds = async (userId: string) => {
    const refRes = await fetch(`/api/admin/funds?userId=${encodeURIComponent(userId)}`);
    const refData = await refRes.json();
    if (refData.success) {
      const nextActual = Number(refData.actualBalance ?? 0);
      const nextVirtual = Number(refData.virtualBalance ?? 0);
      setWalletBalance(nextActual);
      setOversellBalance(nextVirtual);
      setTransactions(refData.transactions || []);
      setSelectedUser((prev: any) =>
        prev && prev.id === userId
          ? { ...prev, actualBalance: nextActual, virtualBalance: nextVirtual }
          : prev
      );
    }
  };

  const handleSuggestionSelect = (user: any) => {
    setSearchQuery(user.name || user.username || user.email || "");
    setShowSuggestions(false);
  };

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
        name: found.name || found.username || "",
        email: found.email || "",
        phone: found.phone || "",
        role: found.role || "USER",
        status: "Active",
        expiryDate: found.expiryDate
          ? String(found.expiryDate).substring(0, 10)
          : "2026-10-29",
      });

      setWhatsappSettings({
        whatsappApiEnabled: found.whatsappApiEnabled ?? true,
        chatbotEnabled: found.chatbotEnabled ?? true,
        secureReporting: found.secureReporting ?? false,
        internationalAccount: found.internationalAccount ?? false,
      });

      setShowSuggestions(false);
      setChangePasswordToggle(false);
      setNewPasswordInput("");
    } else {
      alert(`User "${searchQuery}" not found in database!`);
      setSelectedUser(null);
    }
  };

  useEffect(() => {
    if (selectedUser?.id) {
      fetch(`/api/admin/funds?userId=${encodeURIComponent(selectedUser.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setWalletBalance(Number(data.actualBalance ?? 0));
            setOversellBalance(Number(data.virtualBalance ?? 0));
            setTransactions(data.transactions || []);
          }
        })
        .catch((err) => console.error("Error loading user funds:", err));

      fetch(`/api/admin/waba-accounts?userId=${encodeURIComponent(selectedUser.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success || Array.isArray(data)) {
            setWabaChannels(data.channels || data || []);
          }
        })
        .catch(() => {
          setWabaChannels([
            {
              id: "1",
              wabaNumber: "17118223955",
              phoneId: "1392605743942712",
              wabaId: "1606011797347774",
              displayName: "El Royal Restaurant",
              configureDate: "02 Nov 2026 11:40:39 AM",
              webhookUrl: "NA",
              tps: 50,
            },
            {
              id: "2",
              wabaNumber: "17114127744",
              phoneId: "1403660482826321",
              wabaId: "1415443286878597",
              displayName: "Arvind Seth",
              configureDate: "19 Oct 2026 11:32:15 AM",
              webhookUrl: "NA",
              tps: 50,
            },
          ]);
        });
    }
  }, [selectedUser?.id]);

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
        window.location.href = data.redirectUrl || "/dashboard";
      } else {
        alert("Failed to login as user: " + data.message);
      }
    } catch (err) {
      console.error("Error impersonating user:", err);
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
          username: formData.name,
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

  const handleSaveWhatsappSettings = async () => {
    if (!selectedUser?.id) {
      alert("Please select a user first!");
      return;
    }
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          whatsappApiEnabled: whatsappSettings.whatsappApiEnabled,
          chatbotEnabled: whatsappSettings.chatbotEnabled,
          secureReporting: whatsappSettings.secureReporting,
          internationalAccount: whatsappSettings.internationalAccount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ WhatsApp Account Settings saved successfully!");
        fetchUsers();
      } else {
        alert("❌ Failed to save settings: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving whatsapp settings:", err);
      alert("Network error while saving settings.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return;

    if (
      !confirm(
        `Are you sure you want to permanently delete "${selectedUser.name || selectedUser.username}"?`
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          requesterId: currentAdminId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "User account deleted successfully.");
        setSelectedUser(null);
        setSearchQuery("");
        fetchUsers();
      } else {
        alert(data.error || "Access Denied: You do not have permission to delete accounts.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Unable to connect to the server.");
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    try {
      const payload = {
        username: newUserData.username,
        name: newUserData.username,
        email: newUserData.email,
        password: newUserData.password,
        phone: newUserData.phone,
        role: newUserData.role,
        expiryDate: newUserData.expiryDate,
        customDomain: newUserData.customDomain || undefined,
        brandName: newUserData.brandName || undefined,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("User created successfully!");
        setShowAddUserModal(false);
        setNewUserData({
          username: "",
          password: "",
          phone: "",
          email: "",
          expiryDate: "",
          role: "USER",
          customDomain: "",
          brandName: "",
        });
        fetchUsers();
      } else {
        alert(data.error || data.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Network error while creating user.");
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs font-sans">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="text-[11px] text-slate-400 font-medium">
            Admin Home › User Management
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Manage User</h1>
        </div>
        <Link
          href="/admin"
          className="border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-50 shadow-2xs bg-white transition"
        >
          ⬅ Back to Admin Hub
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 relative">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-xl relative">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search by username, email or mobile..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="border border-slate-300 rounded-xl px-3.5 py-2.5 w-full bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 text-xs"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSuggestionSelect(u)}
                    className="p-3 hover:bg-emerald-50/70 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{u.username || u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer text-xs flex items-center gap-1.5 transition"
          >
            🔍 Search
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAddUserModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xs cursor-pointer text-xs transition"
        >
          + Add User
        </button>
      </div>

      {!selectedUser ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-16 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-sm font-bold text-slate-800">No User Selected</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Search for a White-Label Reseller, Reseller, or User by typing their username,
            email, or mobile number above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="flex flex-wrap border-b border-slate-200 gap-6 font-semibold text-slate-500 text-xs">
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
                    : "border-transparent hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 border border-slate-200/80 rounded-2xl p-6 text-center space-y-3 bg-slate-50/60">
                <div className="w-20 h-20 mx-auto bg-amber-100 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-2xs">
                  🧑‍💼
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center justify-center gap-1">
                    {formData.name || selectedUser.username || "User"}{" "}
                    <span className="text-emerald-600">✔</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {formData.email || selectedUser.email}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {formData.role}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">User Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700">API Key</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedUser.apiKey || selectedUser.id || ""}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-100 font-mono text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Account Type</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none font-medium"
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="WHITE_LABEL_RESELLER">White Label Reseller</option>
                      <option value="RESELLER">Reseller</option>
                      <option value="USER">User</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">Mobile Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Account Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2 border border-slate-200/80 p-4 rounded-xl bg-slate-50/60">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-slate-700">Password Management</label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={changePasswordToggle}
                          onChange={(e) => setChangePasswordToggle(e.target.checked)}
                          className="toggle toggle-success"
                        />
                        <span className="text-xs font-bold text-slate-600">Change Password?</span>
                      </label>
                    </div>

                    {changePasswordToggle ? (
                      <div className="space-y-2">
                        <input
                          type="password"
                          placeholder="Enter new password to update..."
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newPasswordInput) return alert("Enter password");
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
                              alert("Password updated in database!");
                              setNewPasswordInput("");
                              setChangePasswordToggle(false);
                            }
                          }}
                          className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xs cursor-pointer"
                        >
                          💾 Save New Password
                        </button>
                      </div>
                    ) : (
                      <input
                        type="password"
                        disabled
                        defaultValue="************************"
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-400 font-mono"
                      />
                    )}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block font-semibold text-slate-700">Email Id</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xs cursor-pointer text-xs"
                  >
                    🗑️ Delete Account
                  </button>

                  <div className="flex space-x-3 ml-auto">
                    <button
                      type="button"
                      onClick={handleLoginAsUser}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      🚀 Login as User
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdateSettings}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-2xs cursor-pointer text-xs"
                    >
                      💾 Update Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "whatsapp" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border-r border-slate-200 pr-4 space-y-2 text-slate-700 font-semibold">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Account Settings
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("accountSettings")}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer ${
                    whatsappSubTab === "accountSettings"
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Account Settings
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("messageManagement")}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer ${
                    whatsappSubTab === "messageManagement"
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Message Management
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("channelList")}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer ${
                    whatsappSubTab === "channelList"
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Channel List
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappSubTab("bspConfig")}
                  className={`w-full text-left px-3 py-2 rounded-xl cursor-pointer ${
                    whatsappSubTab === "bspConfig"
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "hover:bg-slate-50"
                  }`}
                >
                  BSP Configuration
                </button>
              </div>

              <div className="md:col-span-3 space-y-4">
                {whatsappSubTab === "channelList" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-800 text-sm">Channel List</h3>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase border-b font-bold text-[10px]">
                            <th className="p-3">User Name</th>
                            <th className="p-3">WABA Details</th>
                            <th className="p-3">Default</th>
                            <th className="p-3">Display Name</th>
                            <th className="p-3">ConfigureDate</th>
                            <th className="p-3">Webhook Url</th>
                            <th className="p-3">TPS</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {wabaChannels.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                No channels found
                              </td>
                            </tr>
                          ) : (
                            wabaChannels.map((ch: any) => (
                              <tr
                                key={ch.id}
                                className="hover:bg-slate-50 text-slate-700 font-medium"
                              >
                                <td className="p-3 font-bold text-slate-800">
                                  {selectedUser.username || selectedUser.name}
                                </td>
                                <td className="p-3 font-mono text-[11px] leading-relaxed">
                                  WABA Number: {ch.wabaNumber || "17118223955"} <br />
                                  Phone ID: {ch.phoneId || "1392605743942712"} <br />
                                  Waba ID: {ch.wabaId || "1606011797347774"}
                                </td>
                                <td className="p-3">
                                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                                    ● Set Default
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-slate-800">
                                  {ch.displayName || "Active-08"}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-500">
                                  {ch.configureDate || "02 Nov 2026 11:40:39 AM"}
                                </td>
                                <td className="p-3 text-slate-500">{ch.webhookUrl || "NA"}</td>
                                <td className="p-3 font-bold text-slate-800">{ch.tps || 50}</td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChannel(ch);
                                      setWebhookUrlInput(
                                        ch.webhookUrl === "NA" ? "" : ch.webhookUrl
                                      );
                                      setTpsInput(ch.tps || "50");
                                      setShowConfigModal(true);
                                    }}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded border hover:bg-blue-100 cursor-pointer"
                                    title="Configure"
                                  >
                                    ⚙️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="p-1.5 bg-rose-50 text-rose-600 rounded border hover:bg-rose-100 cursor-pointer"
                                    title="Delete Channel"
                                  >
                                    🗑️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedChannel(ch);
                                      setShowRegisterApiModal(true);
                                    }}
                                    className="p-1.5 bg-amber-50 text-amber-600 rounded border hover:bg-amber-100 font-bold cursor-pointer"
                                    title="Register API"
                                  >
                                    🔑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => alert("Chat / Session active")}
                                    className="p-1.5 bg-green-50 text-green-600 rounded border hover:bg-green-100 font-bold cursor-pointer"
                                    title="Chat Control"
                                  >
                                    C
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

                {whatsappSubTab === "accountSettings" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                      WhatsApp Account Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="font-semibold text-slate-700">WhatsApp API Enabled</span>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.whatsappApiEnabled}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              whatsappApiEnabled: e.target.checked,
                            })
                          }
                          className="toggle toggle-success cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="font-semibold text-slate-700">
                          Chatbot Enabled / Disabled
                        </span>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.chatbotEnabled}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              chatbotEnabled: e.target.checked,
                            })
                          }
                          className="toggle toggle-success cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="font-semibold text-slate-700">Secure Reporting</span>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.secureReporting}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              secureReporting: e.target.checked,
                            })
                          }
                          className="toggle toggle-success cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                        <span className="font-semibold text-slate-700">International Account</span>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.internationalAccount}
                          onChange={(e) =>
                            setWhatsappSettings({
                              ...whatsappSettings,
                              internationalAccount: e.target.checked,
                            })
                          }
                          className="toggle toggle-success cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSaveWhatsappSettings}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-2xs text-xs cursor-pointer"
                      >
                        💾 Save WhatsApp Settings
                      </button>
                    </div>
                  </div>
                )}

                {whatsappSubTab === "messageManagement" && (
                  <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center text-slate-500 font-medium">
                    Message Management configuration view
                  </div>
                )}

                {whatsappSubTab === "bspConfig" && (
                  <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center text-slate-500 font-medium">
                    BSP Configuration view
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "funds" && (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFundModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-2xs cursor-pointer"
                  >
                    + Transfer Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRateModal(true)}
                    className="border border-emerald-300 text-emerald-700 font-bold px-4 py-2 rounded-xl shadow-2xs cursor-pointer hover:bg-emerald-50"
                  >
                    ⚙️ Manage User Rates
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 font-bold">
                  <span className="bg-purple-50 text-purple-800 px-3 py-1.5 rounded-xl border border-purple-200">
                    Wallet Balance: ₹{walletBalance.toFixed(2)}
                  </span>
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200">
                    Virtual Balance: ₹{oversellBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase border-b font-bold text-[10px]">
                      <th className="p-3">USER</th>
                      <th className="p-3">FROM USER</th>
                      <th className="p-3">CREDITS</th>
                      <th className="p-3">CREDIT TYPE</th>
                      <th className="p-3">TRANSFER DATE</th>
                      <th className="p-3">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          <td className="p-3 font-bold text-slate-800">
                            {formData.name || selectedUser.username}
                          </td>
                          <td className="p-3">Super Admin</td>
                          <td className="p-3 font-bold text-emerald-600">
                            ₹{Number(tx.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                              {tx.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-600">{tx.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  <div
                    key={idx}
                    className="flex justify-between items-center border border-slate-200 p-3 rounded-xl bg-slate-50"
                  >
                    <span className="font-semibold text-slate-700">{setting}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="toggle toggle-success cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => alert("Email Settings Saved successfully!")}
                className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-2xs cursor-pointer"
              >
                Save All Settings
              </button>
            </div>
          )}

          {activeTab === "seemore" && (
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleLoginAsUser}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5"
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

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-700">Whitelisted Numbers</h4>
                  <button
                    type="button"
                    onClick={() => setShowWhitelistModal(true)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    + Add Number
                  </button>
                </div>

                <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 uppercase border-b text-[10px]">
                      <th className="p-2.5">NUMBER</th>
                      <th className="p-2.5 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono">
                    {whitelistNumbers.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-slate-400 font-sans">
                          No Whitelisted numbers found
                        </td>
                      </tr>
                    ) : (
                      whitelistNumbers.map((num, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">{num}</td>
                          <td className="p-2.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() =>
                                setWhitelistNumbers(whitelistNumbers.filter((_, i) => i !== idx))
                              }
                              className="text-rose-600 font-bold text-[11px] cursor-pointer"
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

      {/* Whitelist Number Modal */}
      {showWhitelistModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Whitelisted Number</h3>
              <button
                type="button"
                onClick={() => setShowWhitelistModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Mobile Number (with country code)
              </label>
              <input
                type="text"
                value={whitelistInput}
                onChange={(e) => setWhitelistInput(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white font-mono"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWhitelistModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleaned = whitelistInput.replace(/\D/g, "").trim();
                  if (!cleaned) return alert("Enter a valid mobile number");
                  setWhitelistNumbers((prev) =>
                    prev.includes(cleaned) ? prev : [...prev, cleaned]
                  );
                  setWhitelistInput("");
                  setShowWhitelistModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Modal */}
      {showConfigModal && selectedChannel && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Configure Channel ({selectedChannel.displayName})
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Webhook URL</label>
                <input
                  type="text"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="Enter Webhook URL"
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-slate-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">TPS</label>
                <input
                  type="number"
                  value={tpsInput}
                  onChange={(e) => setTpsInput(e.target.value)}
                  className="w-full border rounded-xl p-3 text-xs mt-1 bg-slate-50 focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Configuration saved successfully!");
                  setShowConfigModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register API Confirmation Modal */}
      {showRegisterApiModal && selectedChannel && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">🔑</div>
            <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
            <p className="text-xs text-slate-600">
              Do you really want to call Register API against this number?
            </p>
            <div className="flex justify-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegisterApiModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/waba-accounts/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        wabaNumber: selectedChannel?.wabaNumber,
                        phoneId: selectedChannel?.phoneId,
                        accessToken: selectedChannel?.accessToken,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("✅ " + data.message);
                    } else {
                      alert("❌ Error: " + data.error);
                    }
                  } catch {
                    alert("Network error calling Register API");
                  } finally {
                    setShowRegisterApiModal(false);
                  }
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                Yes, Register it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">⚠️</div>
            <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
            <p className="text-xs text-slate-600">Do you really want to delete this channel?</p>
            <div className="flex justify-center space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Channel deleted successfully!");
                  setShowDeleteModal(false);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, delete!
              </button>
            </div>
          </div>
        </div>
      )}

      {showFundModal && selectedUser && (
        <BalanceTransferModal
          user={{
            ...selectedUser,
            actualBalance: walletBalance,
            virtualBalance: oversellBalance,
          }}
          onClose={() => setShowFundModal(false)}
          onSuccess={async () => {
            setShowFundModal(false);
            if (selectedUser?.id) {
              await refreshSelectedUserFunds(selectedUser.id);
              await fetchUsers();
            }
          }}
        />
      )}

      {showRateModal && selectedUser && (
        <ManageRatesModal
          user={selectedUser}
          onClose={() => setShowRateModal(false)}
          onSuccess={() => {
            setShowRateModal(false);
          }}
        />
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600">User Name</label>
                <input
                  type="text"
                  placeholder="Enter User Name"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs mt-1 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm cursor-pointer"
                  >
                    {showNewUserPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Mobile Number</label>
                <input
                  type="text"
                  placeholder="Enter Mobile Number"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs mt-1 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Mail Id</label>
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs mt-1 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Account Expiry Date</label>
                <input
                  type="date"
                  value={newUserData.expiryDate}
                  onChange={(e) => setNewUserData({ ...newUserData, expiryDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs mt-1 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Account Type</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs mt-1 bg-slate-50 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="USER">User</option>
                  <option value="RESELLER">Reseller</option>
                  <option value="WHITE_LABEL_RESELLER">White Label Reseller</option>
                </select>
              </div>

              {newUserData.role === "WHITE_LABEL_RESELLER" && (
                <div className="space-y-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div>
                    <label className="text-xs font-semibold text-emerald-900">
                      Custom Domain (A-Record)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. waba.clientbrand.com"
                      value={newUserData.customDomain}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, customDomain: e.target.value })
                      }
                      className="w-full border border-emerald-300 rounded-xl p-2 text-xs mt-1 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-900">Brand Name</label>
                    <input
                      type="text"
                      placeholder="Client Brand Name"
                      value={newUserData.brandName}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, brandName: e.target.value })
                      }
                      className="w-full border border-emerald-300 rounded-xl p-2 text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-2xs cursor-pointer"
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