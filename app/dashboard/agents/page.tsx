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

interface ChatConfigState {
  autoAssign: boolean;
  canResolveTickets: boolean;
  maskCustomerPhone: boolean;
  whisperNotesEnabled: boolean;
  maxConcurrentChats: number;
  shiftStart: string;
  shiftEnd: string;
  offlineFallback: string;
}

const DEFAULT_CHAT_CONFIG: ChatConfigState = {
  autoAssign: true,
  canResolveTickets: true,
  maskCustomerPhone: false,
  whisperNotesEnabled: true,
  maxConcurrentChats: 15,
  shiftStart: "09:30",
  shiftEnd: "19:00",
  offlineFallback: "QUEUE_NEXT_AGENT",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  // Search Filter State
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

  // Slide-Over Studio Drawer States
  const [selectedToolAgent, setSelectedToolAgent] = useState<any>(null);
  const [activeToolTab, setActiveToolTab] = useState<"config" | "campaigns" | "chats" | "analytics" | null>(null);
  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [agentChats, setAgentChats] = useState<any[]>([]);

  // Chat Config & Multi-Channel Isolation States
  const [selectedChannelsList, setSelectedChannelsList] = useState<string[]>([]);
  const [chatConfig, setChatConfig] = useState<ChatConfigState>(DEFAULT_CHAT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveToast, setSaveToast] = useState("");

  // Live Meta Campaigns State
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Live Meta Analytics State
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

  const loadAgentCampaigns = async (agentId: string) => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`/api/agents/campaigns?agentId=${agentId}`);
      const data = await res.json();
      if (data.success) {
        setCampaignStats(data);
      }
    } catch (err) {
      console.error("Error fetching live Meta campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const openAgentStudio = async (agent: any, tab: "config" | "campaigns" | "chats" | "analytics") => {
    setSelectedToolAgent(agent);
    setActiveToolTab(tab);
    setSaveToast("");

    // Load saved channels
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

    // Load saved chatConfig JSON
    let parsedConfig: ChatConfigState = { ...DEFAULT_CHAT_CONFIG };
    if (agent.parsedChatConfig && Object.keys(agent.parsedChatConfig).length > 0) {
      parsedConfig = { ...DEFAULT_CHAT_CONFIG, ...agent.parsedChatConfig };
    } else if (agent.chatConfig) {
      try {
        const raw = typeof agent.chatConfig === "string" ? JSON.parse(agent.chatConfig) : agent.chatConfig;
        parsedConfig = { ...DEFAULT_CHAT_CONFIG, ...raw };
      } catch {
        parsedConfig = { ...DEFAULT_CHAT_CONFIG };
      }
    }
    setChatConfig(parsedConfig);

    if (tab === "campaigns") {
      setCampaignStats(null);
      await loadAgentCampaigns(agent.id);
    }

    if (tab === "chats") {
      try {
        const res = await fetch("/api/chat/sessions");
        const data = await res.json();
        if (data.success && data.sessions) {
          const filtered = agent.allChannelAccess
            ? data.sessions
            : data.sessions.filter(
                (s: any) =>
                  s.assignedTo === agent.userId ||
                  s.assignedTo === agent.name ||
                  s.assignedTo === agent.email
              );
          setAgentChats(filtered);
        } else {
          setAgentChats([]);
        }
      } catch (err) {
        console.error("Error fetching agent chats:", err);
        setAgentChats([]);
      }
    }

    if (tab === "analytics") {
      setLoadingAnalytics(true);
      setAnalyticsData(null);
      try {
        const res = await fetch(`/api/agents/analytics?agentId=${agent.id}`);
        const data = await res.json();
        if (data.success) {
          setAnalyticsData(data.analytics);
        }
      } catch (err) {
        console.error("Error fetching agent analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    }
  };

  const handleSaveChannelAndChatConfig = async () => {
    if (!selectedToolAgent) return;
    setSavingConfig(true);
    setSaveToast("");
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
        setSaveToast("Chat Config & Channel Isolation Matrix saved!");
        setTimeout(() => setSaveToast(""), 3500);
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Config save error:", err);
      alert("Error saving agent configuration");
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

        let parsedChatCfg = DEFAULT_CHAT_CONFIG;
        if (data.agent?.chatConfig) {
          try {
            parsedChatCfg = { ...DEFAULT_CHAT_CONFIG, ...JSON.parse(data.agent.chatConfig) };
          } catch {
            parsedChatCfg = DEFAULT_CHAT_CONFIG;
          }
        }

        localStorage.setItem(
          "currentAgent",
          JSON.stringify({
            ...data.agent,
            assignedChannelsList: permittedChannels,
            parsedChatConfig: parsedChatCfg,
          })
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

  // Sleek Tactile Gradient Toggle Switch
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

    const dotColor =
      accent === "indigo"
        ? "bg-indigo-600"
        : accent === "amber"
        ? "bg-amber-500"
        : "bg-emerald-600";

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
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              checked ? dotColor : "bg-slate-300"
            }`}
          />
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
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Agent List & Command Studio</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {agents.length} / 5 Seats Active
            </span>
          </div>
          <p className="text-slate-400 mt-0.5">WhatsApp &gt; Agent Workforce, Chat Routing & Live Meta Campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl font-bold text-xs shadow-2xs hidden lg:block">
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
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20"
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <span className="font-bold text-slate-700 text-sm">Filter Records</span>
          <input
            type="text"
            placeholder="Search by Name, User ID, Email or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 bg-white text-xs w-full sm:w-72 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Registration & Expiry</th>
                <th className="p-4">Permissions & Access</th>
                <th className="p-4 text-center">Agent Studio (Chat & Meta)</th>
                <th className="p-4 text-center">Actions</th>
                <th className="p-4 text-right">Login As</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {loading ? "Loading agents..." : "No agents found."}
                  </td>
                </tr>
              ) : (
                filteredAgents.map((ag) => {
                  let chCount = 0;
                  if (typeof ag.assignedChannels === "string") {
                    try {
                      chCount = JSON.parse(ag.assignedChannels).length;
                    } catch {
                      chCount = 0;
                    }
                  } else if (Array.isArray(ag.assignedChannelsList)) {
                    chCount = ag.assignedChannelsList.length;
                  }

                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold flex items-center justify-center text-sm shadow-2xs shrink-0">
                            {ag.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{ag.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {ag.userId}</div>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                  chCount > 0
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {chCount > 0 ? `🔒 ${chCount} Channel(s) Permitted` : "🌐 All Channels"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600 space-y-0.5">
                        <div>📞 {ag.phone || "N/A"}</div>
                        <div className="text-[10px] text-slate-400">✉️ {ag.email}</div>
                      </td>

                      <td className="p-4 space-y-1">
                        <div className="text-[10px] text-slate-400">
                          Reg: {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString() : "16 Nov 2026"}
                        </div>
                        <div className="font-bold text-slate-800">
                          Exp: {ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "30/10/2026"}
                        </div>
                        <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[9px]">
                          ACTIVE
                        </span>
                      </td>

                      <td className="p-4 space-y-2">
                        {/* Toggle 1: All Chats Access */}
                        <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="font-semibold text-slate-700">All Chats Access</span>
                          <PremiumToggle
                            checked={ag.allChannelAccess ?? true}
                            onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                          />
                        </div>

                        {/* Toggle 2: Send Templates */}
                        <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="font-semibold text-slate-700">Send Templates</span>
                          <PremiumToggle
                            accent="indigo"
                            checked={ag.sendTemplate ?? false}
                            onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                          />
                        </div>

                        {/* Toggle 3: Send Campaigns */}
                        <div className="flex items-center justify-between max-w-[195px] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="font-semibold text-slate-700">Send Campaigns</span>
                          <PremiumToggle
                            accent="amber"
                            checked={ag.sendCampaign ?? false}
                            onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                          />
                        </div>
                      </td>

                      {/* Interactive Studio Buttons (Chat Config + Live Meta Campaigns + Chats + Analytics) */}
                      <td className="p-4">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => openAgentStudio(ag, "config")}
                            className="px-3 py-2 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition font-bold text-[11px] flex items-center gap-1.5 shadow-2xs"
                            title="Chat Config, SLA Routing & Channel Isolation"
                          >
                            <span>⚙️</span>
                            <span>Chat Config</span>
                          </button>

                          <button
                            onClick={() => openAgentStudio(ag, "campaigns")}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-xl cursor-pointer transition font-bold text-[11px] flex items-center gap-1.5"
                            title="Live Meta-Synced Agent Campaigns & WABA Quality"
                          >
                            <span>🚀</span>
                            <span>Campaigns</span>
                          </button>

                          <button
                            onClick={() => openAgentStudio(ag, "chats")}
                            className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-xl cursor-pointer transition border border-slate-200"
                            title="Assigned Chats"
                          >
                            💬
                          </button>

                          <button
                            onClick={() => openAgentStudio(ag, "analytics")}
                            className="p-2 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-xl cursor-pointer transition border border-slate-200"
                            title="Agent Analytics"
                          >
                            📊
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
                            title="Edit Agent"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(ag.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition border border-rose-200"
                            title="Delete Agent"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleLoginAs(ag)}
                          className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer border border-emerald-200 shadow-2xs"
                        >
                          🔓 Login
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER COMMAND STUDIO DRAWER (CHAT CONFIG + LIVE META CAMPAIGNS + CHATS + ANALYTICS) */}
      {activeToolTab && selectedToolAgent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end transition-opacity">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
                    {selectedToolAgent.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold tracking-tight">{selectedToolAgent.name}</h2>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-mono">
                        @{selectedToolAgent.userId}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5">
                      Agent Command Studio • Channel Isolation, SLA Routing & Live Meta Campaigns
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveToolTab(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {/* Studio Navigation Pills */}
              <div className="flex items-center gap-2 mt-5 bg-slate-950/50 p-1.5 rounded-xl border border-white/10 overflow-x-auto">
                <button
                  onClick={() => openAgentStudio(selectedToolAgent, "config")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                    activeToolTab === "config"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  ⚙️ Chat Config & SLA
                </button>
                <button
                  onClick={() => openAgentStudio(selectedToolAgent, "campaigns")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                    activeToolTab === "campaigns"
                      ? "bg-indigo-500 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🚀 Meta Campaigns (Live)
                </button>
                <button
                  onClick={() => openAgentStudio(selectedToolAgent, "chats")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                    activeToolTab === "chats"
                      ? "bg-blue-500 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  💬 Assigned Chats
                </button>
                <button
                  onClick={() => openAgentStudio(selectedToolAgent, "analytics")}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                    activeToolTab === "analytics"
                      ? "bg-purple-500 text-white shadow"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  📊 Analytics
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/70">
              {/* TAB 1: CHAT CONFIG & CHANNEL ISOLATION */}
              {activeToolTab === "config" && (
                <div className="space-y-6">
                  {saveToast && (
                    <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-between shadow-md">
                      <span>✅ {saveToast}</span>
                    </div>
                  )}

                  {/* 1. Multi-Channel Isolation Matrix */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">1. WABA Channel Isolation Matrix</h3>
                        <p className="text-[11px] text-slate-400">
                          Agent will only access chats, templates, and campaigns for selected WABA numbers.
                        </p>
                      </div>
                      {selectedChannelsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedChannelsList([])}
                          className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    {wabaChannels.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 border rounded-xl bg-slate-50">
                        No WABA channels connected yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
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
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-50/60 shadow-2xs"
                                  : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div className="font-extrabold text-slate-800 text-xs">{ch.displayName || "WABA Channel"}</div>
                                <div className="font-mono text-[11px] text-slate-500 mt-0.5">📱 {phoneKey}</div>
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
                    <div className="text-[10px] text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                      💡 <strong>Tip:</strong> Leave all unselected to grant global access across all connected WABA channels.
                    </div>
                  </div>

                  {/* 2. Smart Routing & Behavioral Toggles */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-sm">2. Intelligent Chat Routing & Controls</h3>

                    <div className="divide-y divide-slate-100">
                      <div className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-800">Auto-Assign Incoming Chats</div>
                          <div className="text-[11px] text-slate-400">
                            Automatically route new customer WhatsApp messages to this agent via round-robin
                          </div>
                        </div>
                        <PremiumToggle
                          checked={chatConfig.autoAssign}
                          onChange={() => setChatConfig({ ...chatConfig, autoAssign: !chatConfig.autoAssign })}
                        />
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-800">Ticket Resolution Authority</div>
                          <div className="text-[11px] text-slate-400">
                            Allow agent to mark chats as RESOLVED and close active customer sessions
                          </div>
                        </div>
                        <PremiumToggle
                          accent="indigo"
                          checked={chatConfig.canResolveTickets}
                          onChange={() =>
                            setChatConfig({ ...chatConfig, canResolveTickets: !chatConfig.canResolveTickets })
                          }
                        />
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-800">Customer Number Privacy Masking</div>
                          <div className="text-[11px] text-slate-400">
                            Mask middle digits of customer mobile numbers (e.g. +91 98XXXX3210) in chat UI
                          </div>
                        </div>
                        <PremiumToggle
                          accent="amber"
                          checked={chatConfig.maskCustomerPhone}
                          onChange={() =>
                            setChatConfig({ ...chatConfig, maskCustomerPhone: !chatConfig.maskCustomerPhone })
                          }
                        />
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-800">Internal Team Whisper Notes</div>
                          <div className="text-[11px] text-slate-400">
                            Enable private yellow sticky notes inside chat threads visible only to team members
                          </div>
                        </div>
                        <PremiumToggle
                          checked={chatConfig.whisperNotesEnabled}
                          onChange={() =>
                            setChatConfig({ ...chatConfig, whisperNotesEnabled: !chatConfig.whisperNotesEnabled })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Workload Capacity Slider & Shift Hours */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">3. Workload Capacity & Shift SLA</h3>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Max Concurrent Open Chats</span>
                        <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-lg text-xs">
                          {chatConfig.maxConcurrentChats} Chats
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={chatConfig.maxConcurrentChats}
                        onChange={(e) =>
                          setChatConfig({ ...chatConfig, maxConcurrentChats: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>1 (Focused)</span>
                        <span>25 (Balanced)</span>
                        <span>50 (High Volume)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Shift Start Time</label>
                        <input
                          type="time"
                          value={chatConfig.shiftStart}
                          onChange={(e) => setChatConfig({ ...chatConfig, shiftStart: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Shift End Time</label>
                        <input
                          type="time"
                          value={chatConfig.shiftEnd}
                          onChange={(e) => setChatConfig({ ...chatConfig, shiftEnd: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Off-Shift Fallback</label>
                        <select
                          value={chatConfig.offlineFallback}
                          onChange={(e) => setChatConfig({ ...chatConfig, offlineFallback: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-semibold"
                        >
                          <option value="QUEUE_NEXT_AGENT">Route to Active Agent</option>
                          <option value="BOT_TAKEOVER">AI Bot Auto-Reply</option>
                          <option value="HOLD_IN_QUEUE">Hold Until Shift</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE META-SYNCED AGENT CAMPAIGNS */}
              {activeToolTab === "campaigns" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-indigo-950 text-white p-4 rounded-2xl shadow-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-300">
                          Live Meta Graph API v21.0 Synced
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200 mt-1">
                        Real-time WABA quality ratings, messaging tiers & broadcast delivery metrics for{" "}
                        <strong>{selectedToolAgent.name}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => loadAgentCampaigns(selectedToolAgent.id)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-[11px] cursor-pointer transition"
                    >
                      🔄 Refresh Meta
                    </button>
                  </div>

                  {loadingCampaigns ? (
                    <div className="p-12 text-center space-y-2 bg-white rounded-2xl border">
                      <div className="text-lg animate-spin inline-block">⏳</div>
                      <div className="font-bold text-slate-600">Fetching live WABA Health & Campaign Logs from Meta...</div>
                    </div>
                  ) : (
                    <>
                      {/* Live Meta Channel Health Cards */}
                      <div className="space-y-2.5">
                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                          Permitted WABA Numbers (Live Meta Status)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(campaignStats?.metaChannels || []).map((ch: any) => (
                            <div
                              key={ch.id}
                              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-extrabold text-slate-900 text-xs">{ch.verifiedName}</div>
                                  <div className="font-mono text-[11px] text-slate-500">📱 {ch.displayPhone}</div>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                    ch.metaConnected
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {ch.metaConnected ? "● META LIVE" : "● CACHED"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                                <div>
                                  <span className="text-slate-400">Quality: </span>
                                  <span
                                    className={`font-extrabold ${
                                      ch.qualityRating === "GREEN"
                                        ? "text-emerald-600"
                                        : ch.qualityRating === "YELLOW"
                                        ? "text-amber-600"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {ch.qualityRating}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Limit: </span>
                                  <span className="font-mono font-bold text-indigo-700">{ch.messagingLimit}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Campaign Funnel KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border text-center">
                          <div className="text-xl font-black text-slate-800">
                            {campaignStats?.summary?.totalSent ?? 0}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">TOTAL SENT</div>
                        </div>
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-center">
                          <div className="text-xl font-black text-emerald-700">
                            {campaignStats?.summary?.deliveryRate ?? 0}%
                          </div>
                          <div className="text-[10px] font-bold text-emerald-800 mt-0.5">DELIVERY RATE</div>
                        </div>
                        <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-center">
                          <div className="text-xl font-black text-blue-700">
                            {campaignStats?.summary?.readRate ?? 0}%
                          </div>
                          <div className="text-[10px] font-bold text-blue-800 mt-0.5">BLUE TICK READ</div>
                        </div>
                        <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl text-center">
                          <div className="text-xl font-black text-purple-700">
                            ₹{campaignStats?.summary?.totalSpend ?? "0.00"}
                          </div>
                          <div className="text-[10px] font-bold text-purple-800 mt-0.5">META CREDITS</div>
                        </div>
                      </div>

                      {/* Recent Campaigns Breakdown */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                        <div className="p-3.5 border-b bg-slate-50 flex justify-between items-center">
                          <span className="font-extrabold text-slate-700 text-xs">
                            Recent Broadcasts on Agent Channels
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Permission:{" "}
                            {selectedToolAgent.sendCampaign ? (
                              <span className="text-emerald-600 font-bold">ENABLED</span>
                            ) : (
                              <span className="text-rose-500 font-bold">VIEW ONLY</span>
                            )}
                          </span>
                        </div>
                        {(campaignStats?.recentCampaigns || []).length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            No campaigns executed on these WABA channels yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {campaignStats.recentCampaigns.map((camp: any, i: number) => {
                              const delPct = camp.total > 0 ? Math.round((camp.delivered / camp.total) * 100) : 0;
                              return (
                                <div key={i} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                                  <div>
                                    <div className="font-bold text-slate-800">{camp.campaignName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Tpl: {camp.templateName} • 📱 {camp.channel}
                                    </div>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <div className="font-bold text-emerald-700">
                                      {camp.delivered}/{camp.total} Delivered ({delPct}%)
                                    </div>
                                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                                      <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${delPct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGNED CHATS */}
              {activeToolTab === "chats" && (
                <div className="bg-white rounded-2xl border p-4 space-y-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Assigned Customer Threads</h3>
                  {agentChats.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      No active chats assigned to {selectedToolAgent.name} right now.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {agentChats.map((chat: any) => (
                        <div key={chat.id} className="py-3 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-800">{chat.customerName || chat.customerPhone}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {chat.lastMessage || "No messages yet"}
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {chat.status || "OPEN"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LIVE META-SYNCED ANALYTICS */}
              {activeToolTab === "analytics" && (
                <div className="space-y-4">
                  {loadingAnalytics ? (
                    <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-2xl border">
                      Fetching live Meta WABA stats...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border p-5 rounded-2xl text-center shadow-2xs">
                        <div className="text-3xl font-black text-emerald-600">{analyticsData?.totalChats ?? 0}</div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">Total Chats Handled</div>
                      </div>
                      <div className="bg-white border p-5 rounded-2xl text-center shadow-2xs">
                        <div className="text-3xl font-black text-blue-600">{analyticsData?.resolvedChats ?? 0}</div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">Resolved Chats</div>
                      </div>
                      <div className="bg-white border p-5 rounded-2xl text-center shadow-2xs">
                        <div className="text-3xl font-black text-amber-600">
                          {analyticsData?.avgResponseTime ?? "0s"}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">Avg First Response</div>
                      </div>
                      <div className="bg-white border p-5 rounded-2xl text-center shadow-2xs">
                        <div className="text-3xl font-black text-purple-600">
                          {analyticsData?.metaDeliveryRate ?? "0%"}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">Meta Delivery / Read Rate</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Sticky Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setActiveToolTab(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer"
              >
                Close Studio
              </button>

              {activeToolTab === "config" && (
                <button
                  onClick={handleSaveChannelAndChatConfig}
                  disabled={savingConfig}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold cursor-pointer shadow-md disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "💾 Save Chat Config & Permissions"}
                </button>
              )}

              {activeToolTab === "campaigns" && (
                <button
                  onClick={() => handleLoginAs(selectedToolAgent)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  🚀 Launch Campaign as {selectedToolAgent.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT AGENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800">
                {editId ? "Edit Agent" : "Add Agent"}
              </h3>
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
                  placeholder="Enter agent Name"
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
                      placeholder="Enter the password"
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
                <label className="block font-medium text-slate-700 mb-1">EmailId</label>
                <input
                  type="email"
                  required
                  placeholder="Enter the email"
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}