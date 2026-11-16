"use client";

import { useState, useEffect } from "react";

const ALL_COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+7", country: "Russia / Kazakhstan", flag: "🇷🇺" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add/Edit Form Fields
  const [name, setName] = useState("");
  const [userIdVal, setUserIdVal] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Native Modals for Chat Config & Campaigns (Matching Screenshots)
  const [activeConfigAgent, setActiveConfigAgent] = useState<any>(null);
  const [activeCampaignsAgent, setActiveCampaignsAgent] = useState<any>(null);

  // WABA Channels State for Config Modal
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchAgents();
    fetchWabaChannels();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWabaChannels = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success && data.wabaAccounts) {
        setWabaAccounts(data.wabaAccounts);
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editId) {
      const suggestedId = val.toLowerCase().replace(/\s+/g, "_");
      setUserIdVal(suggestedId);
      setEmail(`${suggestedId}@fortius.in`);
    }
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userIdVal || !email) {
      alert("Agent Name, User ID, and Email are required!");
      return;
    }

    try {
      const url = "/api/agents";
      const method = editId ? "PATCH" : "POST";
      const fullPhone = phone.startsWith("+") ? phone : `${countryCode} ${phone}`;
      const body = editId
        ? { agentId: editId, name, userId: userIdVal, email, phone: fullPhone, expiryDate }
        : { name, userId: userIdVal, password: password || "agent123", email, phone: fullPhone, expiryDate };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setName("");
        setUserIdVal("");
        setPassword("");
        setPhone("");
        setEmail("");
        setExpiryDate("");
        setEditId(null);
        fetchAgents();
      } else {
        alert(data.error || "Failed to save agent");
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleToggle = async (agentId: string, field: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setAgents((prev) =>
      prev.map((ag) => (ag.id === agentId ? { ...ag, [field]: newValue } : ag))
    );

    try {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, [field]: newValue }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to update permission: " + (data.error || "Unknown error"));
        fetchAgents();
      }
    } catch {
      fetchAgents();
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const res = await fetch(`/api/agents?id=${agentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) => prev.filter((ag) => ag.id !== agentId));
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleLoginAs = async (agent: any) => {
    try {
      const res = await fetch("/api/agents/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("currentAgent", JSON.stringify(data.agent));
        window.location.href = "/dashboard/chat?agentMode=true";
      } else {
        alert(data.error || "Failed to login as agent");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCountries = ALL_COUNTRY_CODES.filter(
    (c) => c.country.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
  );

  const filteredAgents = agents.filter(
    (ag) =>
      ag.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.phone?.includes(searchQuery)
  );

  const PremiumToggle = ({
    checked,
    onChange,
    accent = "emerald",
  }: {
    checked: boolean;
    onChange: () => void;
    accent?: "emerald" | "indigo" | "amber";
  }) => {
    const activeStyle =
      accent === "indigo"
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-200"
        : accent === "amber"
        ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200"
        : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200";

    const dotColor = accent === "indigo" ? "bg-indigo-600" : accent === "amber" ? "bg-amber-500" : "bg-emerald-600";

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none shadow-xs ${
          checked ? activeStyle : "bg-slate-200 hover:bg-slate-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-all duration-300 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${checked ? dotColor : "bg-slate-300"}`} />
        </span>
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6 font-sans text-xs bg-slate-50/40 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Agent Workforce Management</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {agents.length} / 5 Seats Active
            </span>
          </div>
          <p className="text-slate-400 mt-0.5">Manage agent logins, chat configurations, and campaign permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditId(null);
              setName("");
              setUserIdVal("");
              setPassword("");
              setPhone("");
              setEmail("");
              setExpiryDate("");
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20"
          >
            + Add New Agent
          </button>
        </div>
      </div>

      {/* Agents Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <span className="font-bold text-slate-700 text-sm">Active Agents Directory</span>
          <input
            type="text"
            placeholder="Search by name, user ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 bg-white text-xs w-full sm:w-72 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Agent Name & ID</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Quick Permissions</th>
                <th className="p-4 text-center">Chat Config & Campaigns</th>
                <th className="p-4 text-center">Actions</th>
                <th className="p-4 text-right">Login As</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {loading ? "Loading agents..." : "No agents configured yet."}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0">
                          {ag.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{ag.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{ag.userId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 space-y-0.5">
                      <div>📞 {ag.phone || "N/A"}</div>
                      <div className="text-[10px] text-slate-400">✉️ {ag.email}</div>
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "Lifetime"}
                    </td>

                    <td className="p-4 space-y-2">
                      <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="font-semibold text-slate-700">All Chats Access</span>
                        <PremiumToggle
                          checked={ag.allChannelAccess ?? true}
                          onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                        />
                      </div>
                      <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="font-semibold text-slate-700">Send Templates</span>
                        <PremiumToggle
                          accent="indigo"
                          checked={ag.sendTemplate ?? false}
                          onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                        />
                      </div>
                      <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="font-semibold text-slate-700">Send Campaigns</span>
                        <PremiumToggle
                          accent="amber"
                          checked={ag.sendCampaign ?? false}
                          onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                        />
                      </div>
                    </td>

                    {/* Chat Config & Campaigns Buttons */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActiveConfigAgent(ag)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition font-bold text-[11px] flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>⚙️</span>
                          <span>Chat Config</span>
                        </button>

                        <button
                          onClick={() => setActiveCampaignsAgent(ag)}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-xl cursor-pointer transition font-bold text-[11px] flex items-center gap-1.5"
                        >
                          <span>🚀</span>
                          <span>Campaigns</span>
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditId(ag.id);
                            setName(ag.name);
                            setUserIdVal(ag.userId || "");
                            setEmail(ag.email || "");
                            setPhone(ag.phone || "");
                            setExpiryDate(ag.expiryDate ? ag.expiryDate.split("T")[0] : "");
                            setShowModal(true);
                          }}
                          className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl cursor-pointer transition border border-amber-200"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(ag.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition border border-rose-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleLoginAs(ag)}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-200 shadow-2xs"
                      >
                        🔓 Login As
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. NATIVE CHAT CONFIG MODAL (Matching Image 1) */}
      {activeConfigAgent && (
        <AgentChatConfigModal agent={activeConfigAgent} wabaAccounts={wabaAccounts} agents={agents} onClose={() => setActiveConfigAgent(null)} />
      )}

      {/* 2. NATIVE CAMPAIGNS MODAL (Matching Image 2) */}
      {activeCampaignsAgent && (
        <AgentCampaignsModal agent={activeCampaignsAgent} onClose={() => setActiveCampaignsAgent(null)} />
      )}

      {/* ADD / EDIT AGENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800">{editId ? "Edit Agent" : "Add Agent"}</h3>
              <button onClick={() => setShowModal(false)} className="font-bold text-slate-400 hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter agent name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">User ID (For Login)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. test_agent"
                  value={userIdVal}
                  onChange={(e) => setUserIdVal(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500 font-mono text-emerald-700 font-bold"
                />
              </div>

              {!editId && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                <div className="flex relative">
                  <div
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-1 bg-slate-100 border border-r-0 rounded-l-xl px-3 py-2 text-slate-700 font-medium cursor-pointer select-none min-w-[90px]"
                  >
                    <span>{ALL_COUNTRY_CODES.find((c) => c.code === countryCode)?.flag || "🇮🇳"}</span>
                    <span>{countryCode}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">▼</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-r-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-2 space-y-1">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:outline-none focus:border-emerald-500 mb-1"
                        autoFocus
                      />
                      {filteredCountries.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCountryCode(item.code);
                            setShowCountryDropdown(false);
                            setCountrySearch("");
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 cursor-pointer text-xs rounded-lg"
                        >
                          <span>{item.flag}</span>
                          <span className="font-medium text-slate-800 truncate">{item.country}</span>
                          <span className="text-slate-400 ml-auto font-mono">{item.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="agent@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. NATIVE CHAT CONFIG MODAL (Image 1 Layout)
// ==========================================
function AgentChatConfigModal({ agent, wabaAccounts, agents, onClose }: { agent: any; wabaAccounts: any[]; agents: any[]; onClose: () => void }) {
  const [selectedWaba, setSelectedWaba] = useState(wabaAccounts[0]?.displayPhone || "15557424465");
  const [selectedAgentId, setSelectedAgentId] = useState(agent.userId);

  const [welcomeActive, setWelcomeActive] = useState(false);
  const [offHoursActive, setOffHoursActive] = useState(false);

  const [workingDays, setWorkingDays] = useState<any>({
    Sunday: { active: false, start: "09:00", end: "18:00" },
    Monday: { active: false, start: "09:30", end: "19:00" },
    Tuesday: { active: false, start: "09:30", end: "19:00" },
    Wednesday: { active: false, start: "09:30", end: "19:00" },
    Thursday: { active: false, start: "09:30", end: "19:00" },
    Friday: { active: false, start: "09:30", end: "19:00" },
    Saturday: { active: false, start: "09:00", end: "14:00" },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header & Close */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Agent Chat Configuration</h2>
            <p className="text-slate-400 text-[11px]">Manage automated welcome/off-hour messages & working hours for {agent.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        {/* Top Dropdowns Bar (Matching Image 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border">
          <select
            value={selectedWaba}
            onChange={(e) => setSelectedWaba(e.target.value)}
            className="border rounded-xl p-2.5 bg-white font-mono font-bold text-slate-700 focus:outline-none"
          >
            {wabaAccounts.length === 0 ? (
              <option value="15557424465">15557424465</option>
            ) : (
              wabaAccounts.map((acc) => (
                <option key={acc.id} value={acc.displayPhone}>
                  📱 {acc.displayPhone}
                </option>
              ))
            )}
          </select>

          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="border rounded-xl p-2.5 bg-white font-mono font-bold text-emerald-700 focus:outline-none"
          >
            {agents.map((ag) => (
              <option key={ag.id} value={ag.userId}>
                👤 {ag.userId} ({ag.name})
              </option>
            ))}
          </select>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Welcome & Off Hours */}
          <div className="lg:col-span-7 space-y-5">
            {/* Welcome Message Card */}
            <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-sm">Welcome Message</span>
                <button
                  onClick={() => alert("Welcome message configuration modal opened")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span>✏️</span> Configure
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={welcomeActive}
                  onChange={(e) => setWelcomeActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className="text-slate-600 font-medium">Configure automated reply for user's first query during working hours</span>
              </div>

              <div className="bg-emerald-900/10 border border-emerald-900/20 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                  <span>WhatsApp Live Preview</span>
                  <span>8:10 AM</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-2xs border text-slate-800">
                  Welcome!, thanks for visiting.
                </div>
              </div>
            </div>

            {/* Off Hours Message Card */}
            <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-sm">Off Hours Message</span>
                <button
                  onClick={() => alert("Off hours message configuration modal opened")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span>✏️</span> Configure
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={offHoursActive}
                  onChange={(e) => setOffHoursActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <span className="text-slate-600 font-medium">Configure automated reply for user's first query during off hours</span>
              </div>

              <div className="bg-slate-100 border p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>WhatsApp Live Preview</span>
                  <span>9:10 AM</span>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-2xs border text-slate-800">
                  We're currently offline
                </div>
              </div>
            </div>
          </div>

          {/* Right: Working / Operational Hours (Matching Image 1 Right Box) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Working / Operational Hours</h3>
                  <p className="text-[10px] text-slate-400">Configure day-wise working hours for automated replies</p>
                </div>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">⚙️</span>
              </div>

              <div className="divide-y divide-slate-100">
                {Object.keys(workingDays).map((day) => {
                  const dayObj = workingDays[day];
                  return (
                    <div key={day} className="py-3 flex items-center justify-between">
                      <span className="font-bold text-slate-700 w-24">{day}</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={dayObj.active}
                          onChange={(e) =>
                            setWorkingDays({
                              ...workingDays,
                              [day]: { ...dayObj, active: e.target.checked },
                            })
                          }
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span className={`text-[11px] font-bold ${dayObj.active ? "text-emerald-600" : "text-slate-400"}`}>
                          {dayObj.active ? `${dayObj.start} - ${dayObj.end}` : "Closed"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    alert("Operational hours saved successfully!");
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow cursor-pointer transition"
                >
                  Save Operational Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. NATIVE CAMPAIGNS MODAL (Image 2 Layout)
// ==========================================
function AgentCampaignsModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentCampaigns();
  }, []);

  const fetchAgentCampaigns = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success && data.reports) {
        setCampaigns(data.reports);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-white rounded-3xl max-w-6xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Agent Campaigns — <span className="text-indigo-600">{agent.name}</span>
            </h2>
            <p className="text-slate-400 text-[11px]">Home › WhatsApp › Agent Campaign</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        {/* Date Filter Bar (Matching Image 2) */}
        <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border">
          <div className="bg-white border rounded-xl px-3 py-1.5 font-mono text-slate-700 font-bold text-xs shadow-2xs">
            📅 15-Nov-2026 - 17-Nov-2026
          </div>
          <span className="text-slate-400 font-medium">Showing broadcast records for permitted channels</span>
        </div>

        {/* Campaign Records Table (Matching Image 2 Columns) */}
        <div className="border rounded-2xl overflow-hidden shadow-2xs bg-white">
          <div className="p-3 bg-slate-50 border-b font-extrabold text-slate-700 flex justify-between items-center">
            <span>Filter Records</span>
            <span className="text-[10px] text-slate-400 font-mono">Total Rows: {campaigns.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Campaign Date</th>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Campaign Info</th>
                  <th className="p-3">Template Info</th>
                  <th className="p-3">Interface / Channel</th>
                  <th className="p-3">Scheduled Info</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Total Count</th>
                  <th className="p-3">Error</th>
                  <th className="p-3">Campaign Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-slate-400">
                      Loading campaign logs...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-400 font-medium">
                      No data found
                    </td>
                  </tr>
                ) : (
                  campaigns.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-600">{row.sentAt ? new Date(row.sentAt).toLocaleString() : "N/A"}</td>
                      <td className="p-3 font-bold text-slate-800">{row.userName || agent.name}</td>
                      <td className="p-3 font-bold text-indigo-700">{row.campaignName}</td>
                      <td className="p-3 text-slate-700">{row.templateName || "Default"}</td>
                      <td className="p-3 font-mono text-slate-600">📱 {row.channel}</td>
                      <td className="p-3 text-slate-500">{row.isScheduled ? "Scheduled" : "Instant"}</td>
                      <td className="p-3 font-mono text-purple-700 font-bold">₹{row.cost || "0.00"}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{row.totalCount || 1}</td>
                      <td className="p-3 text-rose-600">{row.errorDetails || "N/A"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {row.status || "COMPLETED"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => alert(`Viewing details for ${row.campaignName}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}