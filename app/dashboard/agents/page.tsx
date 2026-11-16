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
];

interface ChatConfigState {
  autoAssign: boolean;
  canResolveTickets: boolean;
  maskCustomerPhone: boolean;
  whisperNotesEnabled: boolean;
  maxConcurrentChats: number;
  shiftStart: string;
  shiftEnd: string;
}

const DEFAULT_CHAT_CONFIG: ChatConfigState = {
  autoAssign: true,
  canResolveTickets: true,
  maskCustomerPhone: false,
  whisperNotesEnabled: true,
  maxConcurrentChats: 15,
  shiftStart: "09:30",
  shiftEnd: "19:00",
};

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

  // Agent Tools Modals (Config, Assignment/Chats, Analytics)
  const [selectedToolAgent, setSelectedToolAgent] = useState<any>(null);
  const [activeToolModal, setActiveToolModal] = useState<"config" | "assignment" | "analytics" | null>(null);
  
  // WABA Channels State
  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [selectedChannelsList, setSelectedChannelsList] = useState<string[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfigState>(DEFAULT_CHAT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  // Analytics State (Meta fetched)
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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

  const openAgentTool = async (agent: any, mode: "config" | "assignment" | "analytics") => {
    setSelectedToolAgent(agent);
    setActiveToolModal(mode);

    // Load assigned channels
    let existingChannels: string[] = [];
    if (Array.isArray(agent.assignedChannelsList)) {
      existingChannels = agent.assignedChannelsList;
    } else if (typeof agent.assignedChannels === "string") {
      try {
        existingChannels = JSON.parse(agent.assignedChannels);
      } catch {
        existingChannels = agent.assignedChannels.split(",").filter(Boolean);
      }
    }
    setSelectedChannelsList(existingChannels);

    // Load chat config
    let parsedConfig: ChatConfigState = { ...DEFAULT_CHAT_CONFIG };
    if (agent.chatConfig) {
      try {
        const raw = typeof agent.chatConfig === "string" ? JSON.parse(agent.chatConfig) : agent.chatConfig;
        parsedConfig = { ...DEFAULT_CHAT_CONFIG, ...raw };
      } catch {
        parsedConfig = { ...DEFAULT_CHAT_CONFIG };
      }
    }
    setChatConfig(parsedConfig);

    // Fetch Meta analytics if requested
    if (mode === "analytics") {
      setLoadingAnalytics(true);
      setAnalyticsData(null);
      try {
        const res = await fetch(`/api/agents/analytics?agentId=${agent.id}`);
        const data = await res.json();
        if (data.success) {
          setAnalyticsData(data.analytics);
        }
      } catch (err) {
        console.error("Error fetching Meta analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
  };

  const handleSaveConfigOrAssignment = async () => {
    if (!selectedToolAgent) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedToolAgent.id,
          assignedChannels: JSON.stringify(selectedChannelsList),
          allChannelAccess: selectedChannelsList.length === 0,
          chatConfig: JSON.stringify(chatConfig),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAgents();
        setSelectedToolAgent(null);
        setActiveToolModal(null);
        alert("Agent settings & channel isolation saved successfully!");
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Network error while saving");
    } finally {
      setSavingConfig(false);
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
        let permittedChannels: string[] = [];
        if (typeof data.agent?.assignedChannels === "string") {
          try {
            permittedChannels = JSON.parse(data.agent.assignedChannels);
          } catch {
            permittedChannels = data.agent.assignedChannels.split(",").filter(Boolean);
          }
        } else if (Array.isArray(agent.assignedChannelsList)) {
          permittedChannels = agent.assignedChannelsList;
        }

        localStorage.setItem(
          "currentAgent",
          JSON.stringify({ ...data.agent, assignedChannelsList: permittedChannels })
        );
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

  const PremiumToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onChange={onChange}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none shadow-xs ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-all duration-300 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="p-6 space-y-6 font-sans text-xs bg-slate-50/40 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Agent List & Multi-Channel Isolation</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {agents.length} / 5 Seats Active
            </span>
          </div>
          <p className="text-slate-400 mt-0.5">Manage agent accounts, channel filtration, and permissions</p>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20"
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Agents Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <span className="font-bold text-slate-700 text-sm">Agents Directory & Assigned Channels</span>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 bg-white text-xs w-full sm:w-72 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">NAME</th>
                <th className="p-4">CONTACT INFO</th>
                <th className="p-4">REGISTRATION DATE</th>
                <th className="p-4">ACCOUNT EXPIRY</th>
                <th className="p-4">PERMISSIONS ⓘ</th>
                <th className="p-4">ACTIONS</th>
                <th className="p-4 text-center">AGENT TOOLS</th>
                <th className="p-4 text-right">LOGIN AS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    {loading ? "Loading agents..." : "No agents found."}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/70 transition">
                    {/* NAME */}
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {ag.name}
                      <div className="text-[10px] text-slate-400 font-mono font-normal">@{ag.userId}</div>
                    </td>

                    {/* CONTACT INFO */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span className="text-emerald-600">📞</span> {ag.phone || "N/A"}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <span>✉️</span> {ag.email}
                      </div>
                    </td>

                    {/* REGISTRATION DATE */}
                    <td className="p-4 text-slate-600">
                      <div className="font-medium">📅 {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString() : "16 Nov 2026"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ag.createdAt ? new Date(ag.createdAt).toLocaleTimeString() : "04:01:56 PM"}
                      </div>
                    </td>

                    {/* ACCOUNT EXPIRY */}
                    <td className="p-4 space-y-1">
                      <div className="font-bold text-slate-800">
                        🗓️ {ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "30 Nov 2026"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">12:00:00 AM</div>
                      <span className="inline-block bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-md text-[9px]">
                        Valid
                      </span>
                    </td>

                    {/* PERMISSIONS BOX */}
                    <td className="p-4">
                      <div className="bg-[#F8F9FA] border border-slate-200/80 rounded-xl p-2.5 space-y-2 max-w-[210px] shadow-2xs">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>All Channels Access</span>
                          <PremiumToggle
                            checked={ag.allChannelAccess ?? true}
                            onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                          />
                        </div>
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>Send Template</span>
                          <PremiumToggle
                            checked={ag.sendTemplate ?? false}
                            onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                          />
                        </div>
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>Send Campaign</span>
                          <PremiumToggle
                            checked={ag.sendCampaign ?? false}
                            onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                          />
                        </div>
                      </div>
                    </td>

                    {/* ACTIONS (Edit & Delete) */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
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
                          className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Edit Agent"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(ag.id)}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Delete Agent"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                    {/* AGENT TOOLS (⚙️ Config, 👤✓ Assignment/Chats, 📊 Analytics) */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openAgentTool(ag, "config")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Config Setting & Routing"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "assignment")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Channel Assignment & Filtration"
                        >
                          👤✓
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "analytics")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Meta-Synced Analytics"
                        >
                          📊
                        </button>
                      </div>
                    </td>

                    {/* LOGIN AS */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleLoginAs(ag)}
                        className="w-9 h-9 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-600 inline-flex items-center justify-center cursor-pointer transition shadow-2xs"
                        title="Login As Agent"
                      >
                        🚪➡️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. CONFIG SETTING MODAL */}
      {selectedToolAgent && activeToolModal === "config" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-800">
                Config Setting — <span className="text-emerald-600">{selectedToolAgent.name}</span>
              </h3>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-700">
                  <span>Max Concurrent Chats</span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md">{chatConfig.maxConcurrentChats}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={chatConfig.maxConcurrentChats}
                  onChange={(e) => setChatConfig({ ...chatConfig, maxConcurrentChats: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={chatConfig.shiftStart}
                    onChange={(e) => setChatConfig({ ...chatConfig, shiftStart: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={chatConfig.shiftEnd}
                    onChange={(e) => setChatConfig({ ...chatConfig, shiftEnd: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="font-semibold text-slate-700">Auto-Assign Incoming Chats</span>
                  <input
                    type="checkbox"
                    checked={chatConfig.autoAssign}
                    onChange={(e) => setChatConfig({ ...chatConfig, autoAssign: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="font-semibold text-slate-700">Ticket Resolution Authority</span>
                  <input
                    type="checkbox"
                    checked={chatConfig.canResolveTickets}
                    onChange={(e) => setChatConfig({ ...chatConfig, canResolveTickets: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfigOrAssignment}
                  disabled={savingConfig}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "Save Config Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHANNEL ASSIGNMENT MODAL (Filtration & Isolation) */}
      {selectedToolAgent && activeToolModal === "assignment" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  Channel Assignment & Isolation — <span className="text-emerald-600">{selectedToolAgent.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Assigned channels will strictly filter chats & template access</p>
              </div>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>Select WhatsApp Business Channels:</span>
                {selectedChannelsList.length > 0 && (
                  <button
                    onClick={() => setSelectedChannelsList([])}
                    className="text-rose-600 hover:underline font-bold"
                  >
                    Clear All (Allow All)
                  </button>
                )}
              </div>

              {wabaChannels.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border rounded-2xl bg-slate-50">
                  No WABA accounts found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {wabaChannels.map((ch: any) => {
                    const phoneKey = ch.displayPhone || ch.phoneNumberId || ch.id;
                    const isSelected = selectedChannelsList.includes(phoneKey);
                    return (
                      <div
                        key={ch.id}
                        onClick={() =>
                          setSelectedChannelsList((prev) =>
                            prev.includes(phoneKey) ? prev.filter((i) => i !== phoneKey) : [...prev, phoneKey]
                          )
                        }
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/60 shadow-2xs"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-slate-800">{ch.displayName || "WABA Line"}</div>
                          <div className="font-mono text-slate-500 mt-0.5">📱 {phoneKey}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-200 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfigOrAssignment}
                  disabled={savingConfig}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "Save Assigned Channels"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. META-FETCHED ANALYTICS MODAL */}
      {selectedToolAgent && activeToolModal === "analytics" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  Meta-Fetched Analytics — <span className="text-emerald-600">{selectedToolAgent.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Live performance metrics fetched directly via Meta API</p>
              </div>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                ⏳ Fetching live analytics & message delivery metrics from Meta...
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-emerald-600">{analyticsData?.totalChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">Total Handled Chats</div>
                  </div>
                  <div className="bg-slate-50 border p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-blue-600">{analyticsData?.resolvedChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">Resolved Tickets</div>
                  </div>
                  <div className="bg-slate-50 border p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-amber-600">{analyticsData?.avgResponseTime ?? "0s"}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">Avg Response Time</div>
                  </div>
                  <div className="bg-slate-50 border p-4 rounded-2xl text-center">
                    <div className="text-2xl font-black text-purple-600">{analyticsData?.metaDeliveryRate ?? "0%"}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">Meta Delivery Rate</div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
                  placeholder="e.g. testagent"
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
                  placeholder="agent@fortius.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Account Expiry Date</label>
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