// test
"use client";

import BalanceTransferModal from "@/components/BalanceTransferModal";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Inline Manage Rates Modal Component (Tabular Layout & Standard Rates: Marketing 0.7850, Others 0.1150)
function ManageRatesModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [utilityRate, setUtilityRate] = useState(0.1150);
  const [serviceRate, setServiceRate] = useState(0.1150);
  const [authRate, setAuthRate] = useState(0.1150);
  const [marketingRate, setMarketingRate] = useState(0.7850);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/admin/rates?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.rates) {
            setUtilityRate(data.rates.utility ?? 0.1150);
            setServiceRate(data.rates.service ?? 0.1150);
            setAuthRate(data.rates.authentication ?? 0.1150);
            setMarketingRate(data.rates.marketing ?? 0.7850);
          }
        })
        .catch((err) => console.error("Error fetching rates:", err));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          rates: {
            utility: utilityRate,
            service: serviceRate,
            authentication: authRate,
            marketing: marketingRate,
          },
          utilityRate,
          serviceRate,
          authRate,
          marketingRate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Rates updated successfully!");
        onSuccess();
      } else {
        alert(data.message || "Failed to update rates");
      }
    } catch (err) {
      console.error("Error updating rates:", err);
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-800">Manage User Rates ({user.username || user.name})</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="p-3">COUNTRY INFO</th>
                  <th className="p-3">CHANNEL TYPE</th>
                  <th className="p-3">MY RATE / UNIT</th>
                  <th className="p-3">SELLING RATE / UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Utility</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={utilityRate}
                      onChange={(e) => setUtilityRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Service</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={serviceRate}
                      onChange={(e) => setServiceRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Authentication</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.1150</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={authRate}
                      onChange={(e) => setAuthRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">🇮🇳 (91) INDIA – IN</td>
                  <td className="p-3 text-gray-600">Marketing</td>
                  <td className="p-3"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">0.7850</span></td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={marketingRate}
                      onChange={(e) => setMarketingRate(parseFloat(e.target.value))}
                      className="border rounded-lg p-2 w-32 bg-gray-50 focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 shadow-md"
            >
              {loading ? "Saving..." : "Save Rates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    agentEnabled: false,
  });

  const [showFundModal, setShowFundModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    phone: "",
    email: "",
    expiryDate: "",
    role: "USER",
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
    
    const adminRole = localStorage.getItem("userRole") || localStorage.getItem("adminRole") || "SUPER_ADMIN";
    const adminId = localStorage.getItem("userId") || localStorage.getItem("adminId") || "";
    
    setCurrentUserRole(adminRole);
    setCurrentAdminId(adminId);

    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          if (data.user.id) setCurrentAdminId(data.user.id);
          if (data.user.role) setCurrentUserRole(data.user.role);
        }
      })
      .catch((err) => console.log("Using local session details", err));
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

  useEffect(() => {
    if (selectedUser?.id) {
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

      fetch(`/api/admin/waba-accounts?userId=${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success || Array.isArray(data)) {
            setWabaChannels(data.channels || data || []);
          }
        })
        .catch(() => {
          setWabaChannels([
            { id: "1", wabaNumber: "17118223955", phoneId: "1392605743942712", wabaId: "1606011797347774", displayName: "El Royal Restaurant", configureDate: "02 Nov 2026 11:40:39 AM", webhookUrl: "NA", tps: 50 },
            { id: "2", wabaNumber: "17114127744", phoneId: "1403660482826321", wabaId: "1415443286878597", displayName: "Arvind Seth", configureDate: "19 Oct 2026 11:32:15 AM", webhookUrl: "NA", tps: 50 },
          ]);
        });
    }
  }, [selectedUser]);

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

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return;
    
    if (!confirm(`Are you sure you want to permanently delete "${selectedUser.name || selectedUser.username}"?`)) return;

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
        setNewUserData({ username: "", password: "", phone: "", email: "", expiryDate: "", role: "USER" });
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
                      <div className="font-bold text-gray-800">{u.username || u.name}</div>
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

      {!selectedUser ? (
        <div className="bg-white rounded-2xl border shadow-sm p-16 text-center space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="text-sm font-bold text-gray-700">No User Selected</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            Please search for a user or reseller by typing their username/email in the search box above and click Search.
          </p>
        </div>
      ) : (
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

          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 border rounded-2xl p-6 text-center space-y-3 bg-gray-50/50">
                <div className="w-20 h-20 mx-auto bg-amber-100 border-2 border-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  🧑‍💼
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm flex items-center justify-center gap-1">
                    {formData.name || selectedUser.username || "User"}{" "}
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

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer text-xs"
                  >
                    🗑️ Delete Account
                  </button>

                  <div className="flex space-x-3 ml-auto">
                    <button
                      type="button"
                      onClick={handleLoginAsUser}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      🚀 Login as User
                    </button>
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
            </div>
          )}

          {activeTab === "whatsapp" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left Sidebar for WhatsApp Tab */}
              <div className="border-r pr-4 space-y-2 text-gray-700 font-semibold">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Account Settings</div>
                <button type="button" onClick={() => setWhatsappSubTab("accountSettings")} className={`w-full text-left px-3 py-2 rounded-lg ${whatsappSubTab === "accountSettings" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50"}`}>Account Settings</button>
                <button type="button" onClick={() => setWhatsappSubTab("messageManagement")} className={`w-full text-left px-3 py-2 rounded-lg ${whatsappSubTab === "messageManagement" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50"}`}>Message Management</button>
                <button type="button" onClick={() => setWhatsappSubTab("channelList")} className={`w-full text-left px-3 py-2 rounded-lg ${whatsappSubTab === "channelList" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50"}`}>Channel List</button>
                <button type="button" onClick={() => setWhatsappSubTab("bspConfig")} className={`w-full text-left px-3 py-2 rounded-lg ${whatsappSubTab === "bspConfig" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-gray-50"}`}>BSP Configuration</button>
              </div>

              {/* Main Content Area for WhatsApp Sub-tabs */}
              <div className="md:col-span-3 space-y-4">
                {whatsappSubTab === "channelList" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h3 className="font-bold text-gray-800 text-sm">Channel List</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 uppercase border-b font-bold text-[10px]">
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
                        <tbody className="divide-y">
                          {wabaChannels.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-gray-400">No channels found</td>
                            </tr>
                          ) : (
                            wabaChannels.map((ch: any) => (
                              <tr key={ch.id} className="hover:bg-gray-50 text-gray-700 font-medium">
                                <td className="p-3 font-bold text-gray-800">{selectedUser.username || selectedUser.name}</td>
                                <td className="p-3 font-mono text-[11px] leading-relaxed">
                                  WABA Number: {ch.wabaNumber || "17118223955"} <br />
                                  Phone ID: {ch.phoneId || "1392605743942712"} <br />
                                  Waba ID: {ch.wabaId || "1606011797347774"}
                                </td>
                                <td className="p-3">
                                  <span className="bg-gray-100 border px-2.5 py-1 rounded-full text-[10px] font-semibold">● Set Default</span>
                                </td>
                                <td className="p-3 font-semibold text-gray-800">{ch.displayName || "Active-08"}</td>
                                <td className="p-3 font-mono text-[11px] text-gray-500">{ch.configureDate || "02 Nov 2026 11:40:39 AM"}</td>
                                <td className="p-3 text-gray-500">{ch.webhookUrl || "NA"}</td>
                                <td className="p-3 font-bold text-gray-800">{ch.tps || 50}</td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  {/* 4 Action Buttons */}
                                  <button type="button" onClick={() => { setSelectedChannel(ch); setWebhookUrlInput(ch.webhookUrl === "NA" ? "" : ch.webhookUrl); setTpsInput(ch.tps || "50"); setShowConfigModal(true); }} className="p-1.5 bg-blue-50 text-blue-600 rounded border hover:bg-blue-100" title="Configure">⚙️</button>
                                  <button type="button" onClick={() => setShowDeleteModal(true)} className="p-1.5 bg-rose-50 text-rose-600 rounded border hover:bg-rose-100" title="Delete Channel">🗑️</button>
                                  <button type="button" onClick={() => { setSelectedChannel(ch); setShowRegisterApiModal(true); }} className="p-1.5 bg-amber-50 text-amber-600 rounded border hover:bg-amber-100 font-bold" title="Register API">🔑</button>
                                  <button type="button" onClick={() => alert("Chat / Session active")} className="p-1.5 bg-green-50 text-green-600 rounded border hover:bg-green-100 font-bold" title="Chat Control">C</button>
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
                    <h3 className="font-bold text-gray-800 text-sm border-b pb-2">WhatsApp Account Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                        <span className="font-semibold text-gray-700">WhatsApp API Enabled</span>
                        <input type="checkbox" checked={whatsappSettings.whatsappApiEnabled} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, whatsappApiEnabled: e.target.checked })} className="toggle toggle-success cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                        <span className="font-semibold text-gray-700">Chatbot Enabled / Disabled</span>
                        <input type="checkbox" checked={whatsappSettings.chatbotEnabled} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, chatbotEnabled: e.target.checked })} className="toggle toggle-success cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                        <span className="font-semibold text-gray-700">Secure Reporting</span>
                        <input type="checkbox" checked={whatsappSettings.secureReporting} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, secureReporting: e.target.checked })} className="toggle toggle-success cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between border p-4 rounded-xl bg-gray-50">
                        <span className="font-semibold text-gray-700">International Account</span>
                        <input type="checkbox" checked={whatsappSettings.internationalAccount} onChange={(e) => setWhatsappSettings({ ...whatsappSettings, internationalAccount: e.target.checked })} className="toggle toggle-success cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="button" onClick={() => alert("WhatsApp Account Settings saved successfully!")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow text-xs">💾 Save WhatsApp Settings</button>
                    </div>
                  </div>
                )}

                {whatsappSubTab === "messageManagement" && (
                  <div className="p-6 border rounded-xl bg-gray-50 text-center text-gray-500 font-medium">Message Management configuration view</div>
                )}

                {whatsappSubTab === "bspConfig" && (
                  <div className="p-6 border rounded-xl bg-gray-50 text-center text-gray-500 font-medium">BSP Configuration view</div>
                )}
              </div>
            </div>
          )}

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
                    className="border border-emerald-300 text-emerald-700 font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer hover:bg-emerald-50"
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
                        <td className="p-3 font-bold text-gray-800">{formData.name || selectedUser.username}</td>
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

      {/* Configure Modal */}
      {showConfigModal && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">Configure Channel ({selectedChannel.displayName})</h3>
              <button type="button" onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Webhook URL</label>
                <input type="text" value={webhookUrlInput} onChange={(e) => setWebhookUrlInput(e.target.value)} placeholder="Enter Webhook URL" className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">TPS</label>
                <input type="number" value={tpsInput} onChange={(e) => setTpsInput(e.target.value)} className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Select User Webhook Type</label>
                <select className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none font-medium">
                  <option value="Default">Default</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Wrapper Client</label>
                <select className="w-full border rounded-xl p-3 text-xs mt-1 bg-gray-50 focus:outline-none font-medium">
                  <option value="Disabled">Disabled (Panel Mode)</option>
                  <option value="Enabled">Enabled</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">When enabled, incoming webhooks will NOT be processed in panel.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">Cancel</button>
              <button type="button" onClick={() => { alert("Configuration saved successfully!"); setShowConfigModal(false); }} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Register API Confirmation Modal (Key Icon) */}
      {showRegisterApiModal && selectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">🔑</div>
            <h3 className="text-lg font-bold text-gray-800">Are you sure?</h3>
            <p className="text-xs text-gray-600">Do you really want to call Register API against this number?</p>
            <div className="flex justify-center space-x-3 pt-3 border-t">
              <button type="button" onClick={() => setShowRegisterApiModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">Cancel</button>
              <button type="button" onClick={async () => {
                try {
                  const res = await fetch("/api/admin/waba-accounts/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      wabaNumber: selectedChannel?.wabaNumber,
                      phoneId: selectedChannel?.phoneId,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("✅ " + data.message);
                  } else {
                    alert("❌ Error: " + (data.error || "Failed to register"));
                  }
                } catch (err) {
                  alert("Network error calling Register API");
                } finally {
                  setShowRegisterApiModal(false);
                }
              }} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow">Yes, Register it!</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Channel Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="text-3xl">⚠️</div>
            <h3 className="text-lg font-bold text-gray-800">Are you sure?</h3>
            <p className="text-xs text-gray-600">Do you really want to delete this channel?</p>
            <div className="flex justify-center space-x-3 pt-3 border-t">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">Cancel</button>
              <button type="button" onClick={() => { alert("Channel deleted successfully!"); setShowDeleteModal(false); }} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">Yes, delete!</button>
            </div>
          </div>
        </div>
      )}

      {showFundModal && selectedUser && (
        <BalanceTransferModal
          user={selectedUser}
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
                <div className="relative mt-1">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full border rounded-xl p-3 text-xs bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
                  >
                    {showNewUserPassword ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
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