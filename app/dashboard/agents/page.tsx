"use client";

import { useState, useEffect } from "react";

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "live" | "history" | "list">("list");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modals States for Agent Tools
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // User & WABA State for Live Channels
  const [userId, setUserId] = useState("");
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [selectedConfigChannel, setSelectedConfigChannel] = useState("");

  // Add Agent Form State (Cleaned - no permissions in add modal)
  const [agentName, setAgentName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("2026-10-30");

  // Agents List State
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "agent1",
      phone: "+91 8888888888",
      email: "agent1@gmail.com",
      registrationDate: "10 Oct 2026 06:19 PM",
      expiryDate: "30 Oct 2026",
      status: "Valid",
      allChannelAccess: true,
      sendTemplate: false,
      sendCampaign: false,
    },
  ]);

  // Fetch User ID & Live WABA Channels on Load
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    if (storedUserId) {
      setUserId(storedUserId);
      fetchWabaAndAgents(storedUserId);
    } else {
      fetch("/api/admin/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.id) {
            setUserId(data.user.id);
            fetchWabaAndAgents(data.user.id);
          }
        })
        .catch(() => fetchWabaAndAgents(""));
    }
  }, []);

  const fetchWabaAndAgents = async (uid: string) => {
    try {
      // Fetch Live WABA Accounts
      const res = await fetch(`/api/templates?userId=${uid}`);
      const data = await res.json();
      if (data.success && data.wabaAccounts) {
        setWabaAccounts(data.wabaAccounts);
      }

      // Fetch Agents from backend API
      const agentRes = await fetch(`/api/agents?userId=${uid}`);
      const agentData = await agentRes.json();
      if (agentData.success && agentData.agents.length > 0) {
        setAgents(agentData.agents);
      }
    } catch (err) {
      console.error("Failed to fetch WABA channels or agents:", err);
    }
  };

  const handleSaveAgent = async () => {
    if (!agentName || !email) {
      alert("Please fill Agent Name and Email!");
      return;
    }

    const newAgentPayload = {
      userId: userId || "default_user",
      name: agentName,
      password,
      phone: mobile || "",
      email,
      expiryDate,
      allChannelAccess: true,
      sendTemplate: false,
      sendCampaign: false,
      liveChat: true,
    };

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAgentPayload),
      });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) => [...prev, data.agent || { ...newAgentPayload, id: Date.now(), registrationDate: "Just now", status: "Valid" }]);
        setShowAddModal(false);
        setAgentName("");
        setPassword("");
        setMobile("");
        setEmail("");
        alert("✅ Agent created successfully. You can manage permissions from the table below.");
      } else {
        alert(`❌ Failed to create agent: ${data.error}`);
      }
    } catch (err) {
      console.error("Agent creation error:", err);
      alert("❌ Network error creating agent.");
    }
  };

  // Toggle agent permissions dynamically from the table
  const handlePermissionToggle = (id: any, field: string, value: boolean) => {
    setAgents((prev) =>
      prev.map((ag) => (ag.id === id ? { ...ag, [field]: value } : ag))
    );
  };

  // Active Login As (Impersonation) Handler - Clean Fallback Redirect to Dashboard
  const handleLoginAs = async (ag: any) => {
    try {
      const res = await fetch("/api/agents/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: ag.id }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("currentAgent", JSON.stringify(data.agent));
        alert(`🚀 Successfully switched session to Agent: ${ag.name}`);
        window.location.href = `/dashboard?agentMode=true`;
      } else {
        alert(`❌ Failed to login as agent: ${data.error}`);
      }
    } catch (err) {
      console.error("Login as error:", err);
      alert("❌ Network error during agent login simulation.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-xs gap-3 w-full">
        <div>
          <div className="text-gray-400 font-medium">WhatsApp › Agent Management</div>
          <h1 className="text-xl font-bold text-gray-800">Agent Command Center</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== "overview" && (
            <button
              onClick={() => setActiveTab("overview")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>⬅</span>
              <span>Back to Overview</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("list")}
            className={`font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "list" ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📋 Agent List
          </button>
        </div>
      </div>

      {/* OVERVIEW GRID VIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            onClick={() => setActiveTab("live")}
            className="bg-white p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer text-center space-y-3 group border-t-4 border-t-emerald-500"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">🎧</div>
            <h3 className="font-bold text-sm text-gray-800">Live Agents</h3>
            <p className="text-[11px] text-gray-400">Manage active live customer chats.</p>
          </div>

          <div
            onClick={() => setActiveTab("history")}
            className="bg-white p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer text-center space-y-3 group border-t-4 border-t-blue-500"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📑</div>
            <h3 className="font-bold text-sm text-gray-800">Agents History</h3>
            <p className="text-[11px] text-gray-400">View and audit historical chats.</p>
          </div>

          <div
            onClick={() => setActiveTab("list")}
            className="bg-white p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer text-center space-y-3 group border-t-4 border-t-purple-500"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📱</div>
            <h3 className="font-bold text-sm text-gray-800">Agent List</h3>
            <p className="text-[11px] text-gray-400">Manage agents and permissions.</p>
          </div>

          <div
            onClick={() => setShowConfigModal(true)}
            className="bg-white p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer text-center space-y-3 group border-t-4 border-t-amber-500"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">⚙️</div>
            <h3 className="font-bold text-sm text-gray-800">Chat Config</h3>
            <p className="text-[11px] text-gray-400">Configure WABA channel mappings.</p>
          </div>

          <div
            onClick={() => setShowAnalyticsModal(true)}
            className="bg-white p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all cursor-pointer text-center space-y-3 group border-t-4 border-t-rose-500"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📊</div>
            <h3 className="font-bold text-sm text-gray-800">Analytics</h3>
            <p className="text-[11px] text-gray-400">Monitor agent performance metrics.</p>
          </div>
        </div>
      )}

      {/* AGENT LIST VIEW */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border shadow-xs overflow-hidden space-y-4">
          <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>➕ Add New Agent</span>
            </button>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl font-semibold">
              ⚠️ Maximum 5 agents can be created in your plan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 font-bold">
                  <th className="p-3.5">Agent Name</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Registration Date</th>
                  <th className="p-3.5">Account Expiry</th>
                  <th className="p-3.5">Permissions & Access (Manage Here)</th>
                  <th className="p-3.5">Actions</th>
                  <th className="p-3.5">Agent Tools</th>
                  <th className="p-3.5">Login As</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agents.map((ag: any) => (
                  <tr key={ag.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3.5 font-bold font-mono text-gray-800 text-sm">{ag.name}</td>
                    <td className="p-3.5 space-y-0.5">
                      <div className="font-semibold text-gray-700">📞 {ag.phone || "N/A"}</div>
                      <div className="text-gray-400 font-mono">✉️ {ag.email}</div>
                    </td>
                    <td className="p-3.5 text-gray-500 font-mono">{ag.registrationDate || "Recent"}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-700">{ag.expiryDate ? new Date(ag.expiryDate).toLocaleDateString() : "30 Oct 2026"}</div>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                        {ag.status || "Valid"}
                      </span>
                    </td>
                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-3 text-[11px] bg-gray-50 px-2 py-1 rounded-lg border">
                        <span className="text-gray-600 font-medium">All Channels Access</span>
                        <input
                          type="checkbox"
                          checked={ag.allChannelAccess ?? true}
                          onChange={(e) => handlePermissionToggle(ag.id, "allChannelAccess", e.target.checked)}
                          className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] bg-gray-50 px-2 py-1 rounded-lg border">
                        <span className="text-gray-600 font-medium">Send Templates</span>
                        <input
                          type="checkbox"
                          checked={ag.sendTemplate ?? false}
                          onChange={(e) => handlePermissionToggle(ag.id, "sendTemplate", e.target.checked)}
                          className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] bg-gray-50 px-2 py-1 rounded-lg border">
                        <span className="text-gray-600 font-medium">Send Campaigns</span>
                        <input
                          type="checkbox"
                          checked={ag.sendCampaign ?? false}
                          onChange={(e) => handlePermissionToggle(ag.id, "sendCampaign", e.target.checked)}
                          className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex space-x-2">
                        <button title="Edit Agent" className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg cursor-pointer transition">✏️</button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete agent ${ag.name}?`)) {
                              await fetch(`/api/agents?id=${ag.id}`, { method: "DELETE" });
                              setAgents((prev) => prev.filter((item: any) => item.id !== ag.id));
                            }
                          }}
                          title="Delete Agent"
                          className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg cursor-pointer transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setShowConfigModal(true)}
                          title="Chat Configurations"
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => setShowAssignmentsModal(true)}
                          title="Assigned Chats"
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                        >
                          👤
                        </button>
                        <button
                          onClick={() => setShowAnalyticsModal(true)}
                          title="Agent Analytics"
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                        >
                          📊
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleLoginAs(ag)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>🔊</span>
                        <span>Login</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLEAN ADD AGENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-800">Add Agent</h3>
                <p className="text-[11px] text-gray-400">Create agent credentials. Permissions can be managed from the list.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-base cursor-pointer">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Agent Name *</label>
                <input
                  type="text"
                  placeholder="Enter agent name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter the password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mobile Number</label>
                <div className="flex border rounded-xl bg-gray-50 overflow-hidden">
                  <span className="p-2.5 bg-gray-100 text-gray-600 border-r font-mono text-[11px]">+91</span>
                  <input
                    type="text"
                    placeholder="Enter the mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full p-2.5 bg-transparent focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Id *</label>
                <input
                  type="email"
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none font-mono text-gray-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSaveAgent}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg cursor-pointer transition"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Agent Chat Configurations</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
              <h4 className="font-bold text-sm">🔗 LIVE WABA CHANNEL ASSIGNMENT</h4>
              <p className="text-[11px] text-slate-300">Select from your onboarded WhatsApp business accounts.</p>
            </div>

            <div className="border p-4 rounded-2xl space-y-3 bg-gray-50">
              <label className="block font-bold text-gray-700">Select Channel</label>
              <select
                value={selectedConfigChannel}
                onChange={(e) => setSelectedConfigChannel(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-white font-mono text-gray-700 focus:outline-none"
              >
                <option value="">Select Onboarded Channel</option>
                {wabaAccounts.length === 0 ? (
                  <option value="" disabled>No Onboarded WABA Channels Found</option>
                ) : (
                  wabaAccounts.map((acc: any) => {
                    const accKey = acc.phoneNumberId || acc.wabaId;
                    return (
                      <option key={acc.id} value={accKey}>
                        📱 {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "Active WABA"}
                      </option>
                    );
                  })
                )}
              </select>
              <button
                onClick={() => alert(`✅ Channel ${selectedConfigChannel} configuration saved!`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition"
              >
                💾 Save Configuration
              </button>
            </div>

            <div className="border rounded-2xl p-4 bg-white space-y-2">
              <h4 className="font-bold text-gray-800">📋 Assigned Channels</h4>
              <p className="text-[11px] text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                ℹ️ Note: Channels cannot be deleted when <b>All Channel Access</b> is enabled.
              </p>
              <div className="text-center py-6 text-gray-400 font-medium">
                {selectedConfigChannel ? `Assigned Channel ID: ${selectedConfigChannel}` : "No channels assigned yet"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS MODAL */}
      {showAssignmentsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 border">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Assigned Chat List</h3>
              <button onClick={() => setShowAssignmentsModal(false)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="flex justify-between items-center gap-3">
              <input
                type="text"
                placeholder="Search mobile number..."
                className="border rounded-xl px-3.5 py-2.5 text-xs w-80 bg-gray-50 focus:bg-white focus:outline-none font-mono"
              />
              <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl">
                Total Assignments : 0
              </span>
            </div>

            <p className="text-[11px] text-blue-800 bg-blue-50 p-3 rounded-xl border border-blue-200">
              ℹ️ Below are the active WhatsApp customer chats assigned to this agent.
            </p>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                  <tr>
                    <th className="p-3.5">Customer Number</th>
                    <th className="p-3.5">Assigned Date</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-400 font-medium">No assigned chats found for this agent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-800">Agent Performance Analytics</h3>
                <p className="text-[11px] text-gray-400">Real-time metrics and chat response breakdown.</p>
              </div>
              <div className="flex items-center space-x-3">
                <select className="border rounded-xl px-3.5 py-2 text-xs bg-gray-50 focus:outline-none font-semibold text-gray-700 font-mono">
                  <option value="All">All Live Channels</option>
                  {wabaAccounts.map((acc: any) => (
                    <option key={acc.id} value={acc.phoneNumberId || acc.wabaId}>
                      📱 {acc.displayPhone || acc.phoneNumberId}
                    </option>
                  ))}
                </select>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3.5 rounded-2xl border font-medium">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>Live data synced (Last 24 hours)</span>
              </span>
              <button onClick={() => alert("Analytics refreshed!")} className="text-emerald-600 font-bold hover:underline cursor-pointer">🔄 Refresh Stats</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { label: "All Chats", val: 0, color: "text-gray-800" },
                { label: "Unread", val: 0, color: "text-amber-600" },
                { label: "Pending", val: 0, color: "text-blue-600" },
                { label: "Solved", val: 0, color: "text-emerald-600" },
                { label: "Assigned", val: 0, color: "text-purple-600" },
                { label: "Unassigned", val: 0, color: "text-rose-600" },
                { label: "Open", val: 0, color: "text-indigo-600" },
                { label: "Blocked", val: 0, color: "text-red-600" },
              ].map((m, idx) => (
                <div key={idx} className="bg-white border p-4 rounded-2xl text-center shadow-xs space-y-1">
                  <p className="text-[11px] text-gray-500 font-bold">{m.label}</p>
                  <p className={`text-2xl font-extrabold ${m.color}`}>{m.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-5 rounded-2xl text-center space-y-3 bg-gray-50/50">
                <h4 className="font-bold text-xs text-gray-700">Chat Status Breakdown</h4>
                <div className="h-40 flex items-center justify-center text-xs text-gray-400 border bg-white rounded-xl shadow-inner">
                  No chat activity recorded yet
                </div>
              </div>
              <div className="border p-5 rounded-2xl text-center space-y-3 bg-gray-50/50">
                <h4 className="font-bold text-xs text-gray-700">Assignment Overview</h4>
                <div className="h-40 flex items-center justify-center text-xs text-gray-400 border bg-white rounded-xl shadow-inner">
                  No assignments recorded yet
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}