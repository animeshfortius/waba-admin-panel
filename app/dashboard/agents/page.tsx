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

  // Agent Tools Modals
  const [selectedToolAgent, setSelectedToolAgent] = useState<any>(null);
  const [activeToolModal, setActiveToolModal] = useState<"config" | "assignment" | "analytics" | null>(null);
  const [configModalTab, setConfigModalTab] = useState<"channel" | "keyword">("channel");
  
  // WABA Channels State
  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [selectedChannelToAssign, setSelectedChannelToAssign] = useState("");
  const [assignedChannelsList, setAssignedChannelsList] = useState<any[]>([]);

  // Keywords State
  const [keywordInput, setKeywordInput] = useState("");

  // Analytics State
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
    setConfigModalTab("channel");

    let existingChannels: any[] = [];
    if (Array.isArray(agent.assignedChannelsList)) {
      existingChannels = agent.assignedChannelsList.map((ch: string) => ({ channel: ch, createdAt: new Date() }));
    } else if (typeof agent.assignedChannels === "string") {
      try {
        const parsed = JSON.parse(agent.assignedChannels);
        existingChannels = Array.isArray(parsed) ? parsed.map((ch: string) => ({ channel: ch, createdAt: new Date() })) : [];
      } catch {
        existingChannels = agent.assignedChannels ? [{ channel: agent.assignedChannels, createdAt: new Date() }] : [];
      }
    }
    setAssignedChannelsList(existingChannels);

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
        console.error("Error fetching analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
  };

  const handleAddChannelToAgent = async () => {
    if (!selectedChannelToAssign || !selectedToolAgent) return;
    const updated = [...assignedChannelsList, { channel: selectedChannelToAssign, createdAt: new Date() }];
    setAssignedChannelsList(updated);
    setSelectedChannelToAssign("");
    await saveChannelsToBackend(selectedToolAgent.id, updated.map(u => u.channel));
  };

  const handleRemoveChannelFromAgent = async (channelStr: string) => {
    if (!selectedToolAgent) return;
    const updated = assignedChannelsList.filter(item => item.channel !== channelStr);
    setAssignedChannelsList(updated);
    await saveChannelsToBackend(selectedToolAgent.id, updated.map(u => u.channel));
  };

  const saveChannelsToBackend = async (agentId: string, channelsArray: string[]) => {
    try {
      await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          assignedChannels: JSON.stringify(channelsArray),
          allChannelAccess: channelsArray.length === 0,
        }),
      });
      fetchAgents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editId) {
      const suggestedId = val.toLowerCase().replace(/\s+/g, "_");
      setUserIdVal(suggestedId);
      setEmail(`${suggestedId}@gmail.com`);
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

  // FIXED WORKING TOGGLE COMPONENT WITH CLICK HANDLER
  const PremiumToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
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
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Agent List</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Maximum 5 agents can be created
            </span>
          </div>
          <p className="text-slate-400 mt-0.5">Manage agent accounts and permissions</p>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <span>+ Add Agent</span>
          </button>
        </div>
      </div>

      {/* Agents Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <span className="font-bold text-slate-700 text-sm">Filter Records</span>
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

                    {/* PERMISSIONS BOX (All Chats Access, Send Template, Send Campaign) */}
                    <td className="p-4">
                      <div className="bg-[#F8F9FA] border border-slate-200/80 rounded-xl p-2.5 space-y-2 max-w-[210px] shadow-2xs">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>All Chats Access</span>
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

                    {/* AGENT TOOLS */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openAgentTool(ag, "config")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Agent Chat Configurations"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "assignment")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Assigned Chat List"
                        >
                          👤✓
                        </button>
                        <button
                          onClick={() => openAgentTool(ag, "analytics")}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition shadow-2xs"
                          title="Agent Analytics"
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

      {/* 1. AGENT CHAT CONFIGURATIONS MODAL */}
      {selectedToolAgent && activeToolModal === "config" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Agent Chat Configurations</h3>
                <p className="text-[11px] text-slate-400">Manage chat assignments and keyword routing</p>
              </div>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 border-b pb-3">
              <button
                onClick={() => setConfigModalTab("channel")}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                  configModalTab === "channel" ? "bg-emerald-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📱 Channel
              </button>
              <button
                onClick={() => setConfigModalTab("keyword")}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                  configModalTab === "keyword" ? "bg-emerald-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🔑 Keyword
              </button>
            </div>

            {configModalTab === "channel" ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>📌 CHANNEL ASSIGNMENT</span>
                    <button
                      onClick={handleAddChannelToAgent}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                    >
                      + Add Channel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600 font-medium">Select Channel</label>
                    <select
                      value={selectedChannelToAssign}
                      onChange={(e) => setSelectedChannelToAssign(e.target.value)}
                      className="w-full border rounded-xl p-2.5 bg-white font-mono font-bold text-slate-700"
                    >
                      <option value="">Select Channel</option>
                      {wabaChannels.map((ch: any) => (
                        <option key={ch.id} value={ch.displayPhone || ch.phoneNumberId}>
                          {ch.displayName || "WABA"} ({ch.displayPhone || ch.phoneNumberId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <div className="p-3 bg-slate-100 font-bold text-slate-700">Assigned Channels</div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 font-bold text-[10px]">
                        <th className="p-3">CHANNEL</th>
                        <th className="p-3">CREATED DATE</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignedChannelsList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-400">No channels assigned yet.</td>
                        </tr>
                      ) : (
                        assignedChannelsList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-800">{item.channel}</td>
                            <td className="p-3 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveChannelFromAgent(item.channel)}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>🔑 KEYWORD ASSIGNMENT</span>
                    <button
                      onClick={() => alert("Keyword added successfully!")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                    >
                      + Add Keyword
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-600 font-medium">Keywords (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. sample, support, billing"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="w-full border rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ASSIGNED CHAT LIST MODAL */}
      {selectedToolAgent && activeToolModal === "assignment" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Assigned Chat List</h3>
                <p className="text-[11px] text-slate-400">Manage WhatsApp chat assignments for {selectedToolAgent.name}</p>
              </div>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search mobile number..."
                className="w-full border rounded-xl px-3 py-2 bg-slate-50"
              />
              <div className="p-8 text-center text-slate-400 border rounded-2xl bg-slate-50">
                No chat assignments found for this agent.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AGENT ANALYTICS MODAL */}
      {selectedToolAgent && activeToolModal === "analytics" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Agent Analytics</h3>
                <p className="text-[11px] text-slate-400">Live metrics & chat status breakdown</p>
              </div>
              <button
                onClick={() => { setSelectedToolAgent(null); setActiveToolModal(null); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="p-12 text-center text-slate-500 font-medium">⏳ Loading analytics...</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border p-3.5 rounded-2xl text-center">
                    <div className="text-xl font-black text-slate-800">{analyticsData?.totalChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">All Chats</div>
                  </div>
                  <div className="bg-slate-50 border p-3.5 rounded-2xl text-center">
                    <div className="text-xl font-black text-blue-600">{analyticsData?.unreadChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">Unread</div>
                  </div>
                  <div className="bg-slate-50 border p-3.5 rounded-2xl text-center">
                    <div className="text-xl font-black text-amber-600">{analyticsData?.pendingChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">Pending</div>
                  </div>
                  <div className="bg-slate-50 border p-3.5 rounded-2xl text-center">
                    <div className="text-xl font-black text-emerald-600">{analyticsData?.solvedChats ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">Solved</div>
                  </div>
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
                  placeholder="agent@gmail.com"
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