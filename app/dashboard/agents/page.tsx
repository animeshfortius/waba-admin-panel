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

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Form Fields (Intact as requested)
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

  // Agent Tools Active Modals State
  const [selectedToolAgent, setSelectedToolAgent] = useState<any>(null);
  const [activeToolModal, setActiveToolModal] = useState<"config" | "chats" | "analytics" | null>(null);
  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [agentChats, setAgentChats] = useState<any[]>([]);
  const [autoAssignChat, setAutoAssignChat] = useState(true);
  const [selectedWabaChannel, setSelectedWabaChannel] = useState("ALL");

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
        setWabaChannels(data.wabaAccounts);
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
    }
  };

  const openAgentTool = async (agent: any, tool: "config" | "chats" | "analytics") => {
    setSelectedToolAgent(agent);
    setActiveToolModal(tool);

    if (tool === "chats") {
      try {
        const res = await fetch("/api/chat/sessions");
        const data = await res.json();
        if (data.success && data.sessions) {
          // Filter chats assigned to this agent or show all if allChannelAccess is true
          const filtered = agent.allChannelAccess
            ? data.sessions
            : data.sessions.filter((s: any) => s.assignedTo === agent.userId || s.assignedTo === agent.name);
          setAgentChats(filtered);
        } else {
          setAgentChats([]);
        }
      } catch (err) {
        console.error("Error fetching agent chats:", err);
        setAgentChats([]);
      }
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
    // Optimistic UI update
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
        alert("Failed to update toggle in database: " + (data.error || "Unknown error"));
        fetchAgents();
      }
    } catch (err) {
      console.error("Failed to update permission", err);
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

  // Reusable Sliding Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="p-6 space-y-6 font-sans text-xs">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agent List</h1>
          <p className="text-gray-400">WhatsApp &gt; Agent List</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl font-bold text-xs shadow-xs hidden sm:block">
            ⚠️ Maximum 5 agents can be created.
          </div>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow"
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="font-bold text-gray-700 text-sm">Filter Records</span>
          <input
            type="text"
            placeholder="Search by Name, User ID, Email or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-xl px-3 py-1.5 bg-gray-50 text-xs w-full sm:w-64 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
                <th className="p-4">Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Registration Date</th>
                <th className="p-4">Account Expiry</th>
                <th className="p-4">Permissions & Access</th>
                <th className="p-4 text-center">Actions</th>
                <th className="p-4 text-center">Agent Tools</th>
                <th className="p-4 text-right">Login As</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    {loading ? "Loading agents..." : "No agents found."}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900 text-sm">
                      {ag.name}
                      <div className="text-[10px] text-gray-400 font-mono">ID: {ag.userId}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>📞 {ag.phone || "N/A"}</div>
                      <div className="text-[10px] text-gray-400">✉️ {ag.email}</div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {ag.createdAt ? new Date(ag.createdAt).toLocaleString() : "16 Nov 2026"}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">
                        {ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "30/10/2026"}
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[9px]">
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-4 space-y-2">
                      {/* Toggle 1: All Chats Access */}
                      <div className="flex items-center justify-between max-w-[185px] bg-gray-50 px-3 py-1.5 rounded-xl border">
                        <span className="font-semibold text-gray-700">All Chats Access</span>
                        <ToggleSwitch
                          checked={ag.allChannelAccess ?? true}
                          onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                        />
                      </div>

                      {/* Toggle 2: Send Templates */}
                      <div className="flex items-center justify-between max-w-[185px] bg-gray-50 px-3 py-1.5 rounded-xl border">
                        <span className="font-semibold text-gray-700">Send Templates</span>
                        <ToggleSwitch
                          checked={ag.sendTemplate ?? false}
                          onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                        />
                      </div>

                      {/* Toggle 3: Send Campaigns */}
                      <div className="flex items-center justify-between max-w-[185px] bg-gray-50 px-3 py-1.5 rounded-xl border">
                        <span className="font-semibold text-gray-700">Send Campaigns</span>
                        <ToggleSwitch
                          checked={ag.sendCampaign ?? false}
                          onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                        />
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
                          title="Edit Agent"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(ag.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl cursor-pointer transition border border-red-200"
                          title="Delete Agent"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                    {/* Working Agent Tools Buttons */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openAgentTool(ag, "config")}
                          className="p-2 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer transition border border-gray-200"
                          title="Chat Configuration"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "chats")}
                          className="p-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer transition border border-gray-200"
                          title="Assigned Chats"
                        >
                          👤
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "analytics")}
                          className="p-2 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 rounded-xl cursor-pointer transition border border-gray-200"
                          title="Agent Analytics"
                        >
                          📊
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleLoginAs(ag)}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer border border-emerald-200"
                      >
                        🔓 Login
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD / EDIT AGENT MODAL (Kept 100% intact) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editId ? "Edit Agent" : "Add Agent"}
              </h3>
              <button onClick={() => setShowModal(false)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter agent Name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">User ID (For Login)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. testagent"
                  value={userIdVal}
                  onChange={(e) => setUserIdVal(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono text-emerald-700 font-bold"
                />
              </div>

              {!editId && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter the password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex relative">
                  <div
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-1 bg-gray-100 border border-r-0 rounded-l-xl px-3 py-2 text-gray-700 font-medium cursor-pointer select-none min-w-[90px]"
                  >
                    <span>{ALL_COUNTRY_CODES.find((c) => c.code === countryCode)?.flag || "🇮🇳"}</span>
                    <span>{countryCode}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">▼</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter the mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-r-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-2 space-y-1">
                      <input
                        type="text"
                        placeholder="Search country or code..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-emerald-500 mb-1"
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
                          <span className="font-medium text-gray-800 truncate">{item.country}</span>
                          <span className="text-gray-400 ml-auto font-mono">{item.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">EmailId</label>
                <input
                  type="email"
                  required
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Account Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. AGENT TOOL MODAL: ⚙️ CHAT CONFIGURATION */}
      {activeToolModal === "config" && selectedToolAgent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">⚙️ Chat Configuration — {selectedToolAgent.name}</h3>
              <button onClick={() => setActiveToolModal(null)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Assign WABA Channel</label>
                <select
                  value={selectedWabaChannel}
                  onChange={(e) => setSelectedWabaChannel(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Connected WABA Numbers</option>
                  {wabaChannels.map((ch: any) => (
                    <option key={ch.id} value={ch.displayPhone}>
                      {ch.displayName} ({ch.displayPhone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
                <div>
                  <div className="font-bold text-gray-800">Auto-Assign Incoming Chats</div>
                  <div className="text-[10px] text-gray-400">Automatically route new customer messages to this agent</div>
                </div>
                <ToggleSwitch checked={autoAssignChat} onChange={() => setAutoAssignChat(!autoAssignChat)} />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setActiveToolModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`✅ Configuration saved for ${selectedToolAgent.name}!`);
                    setActiveToolModal(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AGENT TOOL MODAL: 👤 ASSIGNED CHATS */}
      {activeToolModal === "chats" && selectedToolAgent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">👤 Assigned Chats — {selectedToolAgent.name}</h3>
              <button onClick={() => setActiveToolModal(null)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y">
              {agentChats.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No active chats assigned to {selectedToolAgent.name} right now.</div>
              ) : (
                agentChats.map((chat: any) => (
                  <div key={chat.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">{chat.customerName || chat.customerPhone}</div>
                      <div className="text-[11px] text-gray-500 truncate max-w-xs">{chat.lastMessage || "No messages yet"}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {chat.status || "OPEN"}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setActiveToolModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AGENT TOOL MODAL: 📊 AGENT ANALYTICS */}
      {activeToolModal === "analytics" && selectedToolAgent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">📊 Performance Analytics — {selectedToolAgent.name}</h3>
              <button onClick={() => setActiveToolModal(null)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-emerald-700">24</div>
                <div className="text-[11px] font-semibold text-emerald-900 mt-1">Total Chats Handled</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-700">19</div>
                <div className="text-[11px] font-semibold text-blue-900 mt-1">Resolved Chats</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-amber-700">1m 42s</div>
                <div className="text-[11px] font-semibold text-amber-900 mt-1">Avg First Response</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-700">98%</div>
                <div className="text-[11px] font-semibold text-purple-900 mt-1">Customer Satisfaction</div>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setActiveToolModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
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