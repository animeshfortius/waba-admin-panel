"use client";

import { useState } from "react";

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "live" | "history" | "list">("list");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modals States for Agent Tools
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Add Agent Form State
  const [agentName, setAgentName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("2026-10-30");

  // Sample Agents Data
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

  const handleSaveAgent = () => {
    if (!agentName || !email) {
      alert("Please fill Agent Name and Email!");
      return;
    }
    const newAgent = {
      id: Date.now(),
      name: agentName,
      phone: mobile || "+91 9999999999",
      email: email,
      registrationDate: "10 Oct 2026 06:20 PM",
      expiryDate: expiryDate || "30 Oct 2026",
      status: "Valid",
      allChannelAccess: true,
      sendTemplate: false,
      sendCampaign: false,
    };
    setAgents([...agents, newAgent]);
    setShowAddModal(false);
    setAgentName("");
    setPassword("");
    setMobile("");
    setEmail("");
    alert("Agent added successfully.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">WhatsApp › Agent List</div>
          <h1 className="text-xl font-bold text-gray-800">Agent List</h1>
        </div>
        {activeTab !== "overview" && (
          <button
            onClick={() => setActiveTab("overview")}
            className="text-xs border px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-50 flex items-center space-x-1"
          >
            <span>⬅</span>
            <span>Back to Overview</span>
          </button>
        )}
      </div>

      {/* OVERVIEW GRID VIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div
            onClick={() => setActiveTab("live")}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer text-center space-y-3 group"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">🎧</div>
            <h3 className="font-bold text-sm text-gray-800">Live Agents</h3>
            <p className="text-xs text-gray-400">Manage your active live chats.</p>
          </div>

          <div
            onClick={() => setActiveTab("history")}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer text-center space-y-3 group"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📑</div>
            <h3 className="font-bold text-sm text-gray-800">Live Agents History</h3>
            <p className="text-xs text-gray-400">View and search agent chat history.</p>
          </div>

          <div
            onClick={() => setActiveTab("list")}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer text-center space-y-3 group"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📱</div>
            <h3 className="font-bold text-sm text-gray-800">Agent List</h3>
            <p className="text-xs text-gray-400">View and search agents.</p>
          </div>

          <div
            onClick={() => setShowConfigModal(true)}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer text-center space-y-3 group"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">⚙️</div>
            <h3 className="font-bold text-sm text-gray-800">Chat Config</h3>
            <p className="text-xs text-gray-400">Manage chat configurations.</p>
          </div>

          <div
            onClick={() => alert("Agent Campaign Section")}
            className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer text-center space-y-3 group"
          >
            <div className="text-4xl group-hover:scale-110 transition duration-200">📊</div>
            <h3 className="font-bold text-sm text-gray-800">Agent Campaign</h3>
            <p className="text-xs text-gray-400">Manage Agent Campaigns.</p>
          </div>
        </div>
      )}

      {/* AGENT LIST VIEW */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center space-x-1"
            >
              <span>+ Add Agent</span>
            </button>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg">
              ⚠️ Maximum 5 agents can be created
            </span>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Contact Info</th>
                  <th className="p-3">Registration Date</th>
                  <th className="p-3">Account Expiry</th>
                  <th className="p-3">Permissions</th>
                  <th className="p-3">Actions</th>
                  <th className="p-3">Agent Tools</th>
                  <th className="p-3">Login As</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{ag.name}</td>
                    <td className="p-3 space-y-0.5">
                      <p>📞 {ag.phone}</p>
                      <p className="text-gray-400">✉️ {ag.email}</p>
                    </td>
                    <td className="p-3 text-gray-500">{ag.registrationDate}</td>
                    <td className="p-3">
                      <p>{ag.expiryDate}</p>
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded mt-0.5">
                        {ag.status}
                      </span>
                    </td>
                    <td className="p-3 space-y-1">
                      <div className="flex items-center justify-between space-x-2">
                        <span>All Channels Access</span>
                        <input type="checkbox" defaultChecked={ag.allChannelAccess} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Send Template</span>
                        <input type="checkbox" defaultChecked={ag.sendTemplate} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <span>Send Campaign</span>
                        <input type="checkbox" defaultChecked={ag.sendCampaign} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2 text-base">
                        <button title="Edit" className="text-amber-600 hover:scale-110">✏️</button>
                        <button title="Delete" className="text-red-600 hover:scale-110">🗑️</button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2 text-base">
                        <button
                          onClick={() => setShowConfigModal(true)}
                          title="Chat Configurations"
                          className="hover:scale-110 bg-gray-100 p-1.5 rounded"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => setShowAssignmentsModal(true)}
                          title="Assignments"
                          className="hover:scale-110 bg-gray-100 p-1.5 rounded"
                        >
                          👤
                        </button>
                        <button
                          onClick={() => setShowAnalyticsModal(true)}
                          title="Agent Analytics"
                          className="hover:scale-110 bg-gray-100 p-1.5 rounded"
                        >
                          📊
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => alert(`Logging in as ${ag.name}...`)}
                        className="border p-1.5 rounded hover:bg-gray-100 text-sm bg-gray-50"
                        title="Login as Agent"
                      >
                        🔊
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD AGENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Add Agent</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Agent Name</label>
                <input
                  type="text"
                  placeholder="Enter agent name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter the password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Mobile Number</label>
                <div className="flex border rounded-lg bg-gray-50 overflow-hidden">
                  <span className="p-2.5 bg-gray-100 text-gray-500 border-r">🇮🇳 +91</span>
                  <input
                    type="text"
                    placeholder="Enter the mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full p-2.5 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Email Id</label>
                <input
                  type="email"
                  placeholder="Enter the email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Account Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleSaveAgent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. CHAT CONFIGURATIONS MODAL (⚙️) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Agent Chat Configurations</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-emerald-800 text-white p-4 rounded-xl space-y-1">
              <h4 className="font-bold text-sm">🔗 CHANNEL ASSIGNMENT</h4>
              <p className="text-xs text-emerald-100">Manage default agent channel mapping</p>
            </div>

            <div className="border p-4 rounded-xl space-y-3 bg-gray-50">
              <label className="block text-xs font-bold text-gray-700">Select Channel</label>
              <select className="w-full border rounded-lg p-2.5 text-xs bg-white focus:outline-none">
                <option value="">Select Channel</option>
                <option value="15553945963">15553945963</option>
              </select>
              <button
                onClick={() => alert("Configuration Saved!")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow"
              >
                💾 Save Configuration
              </button>
            </div>

            <div className="border rounded-xl p-4 bg-white space-y-2">
              <h4 className="font-bold text-xs text-gray-800">📋 Assigned Channels</h4>
              <p className="text-[11px] text-gray-500 bg-blue-50 p-2 rounded-lg border border-blue-200">
                ℹ️ Note: Channels cannot be deleted when <b>All Channel Access</b> is assigned to the agent.
              </p>
              <div className="text-center text-xs text-gray-400 py-4">No data found</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ASSIGNMENTS MODAL (👤) */}
      {showAssignmentsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Assigned Chat List</h3>
              <button onClick={() => setShowAssignmentsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="flex justify-between items-center">
              <input
                type="text"
                placeholder="Search mobile number..."
                className="border rounded-lg px-3 py-2 text-xs w-72 bg-gray-50 focus:outline-none"
              />
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                Total Assignments : 0
              </span>
            </div>

            <p className="text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
              ℹ️ Below are the WhatsApp chats assigned to this agent. Removing an assignment will stop the agent from receiving those chats.
            </p>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
                  <tr>
                    <th className="p-3">Number</th>
                    <th className="p-3">Created Date</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-400">No data found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. AGENT ANALYTICS MODAL (📊) */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Agent Analytics</h3>
              <div className="flex items-center space-x-3">
                <select className="border rounded-lg px-3 py-1.5 text-xs bg-gray-50 focus:outline-none font-medium">
                  <option value="All">All Channels</option>
                  <option value="15553945963">15553945963</option>
                </select>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border">
              <span>🟢 Live data (24 hours)</span>
              <button className="text-emerald-600 font-bold hover:underline">🔄 Refresh</button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "All Chats", val: 0 },
                { label: "Unread", val: 0 },
                { label: "Pending", val: 0 },
                { label: "Solved", val: 0 },
                { label: "Assigned", val: 0 },
                { label: "Unassigned", val: 0 },
                { label: "Open", val: 0 },
                { label: "Blocked", val: 0 },
              ].map((m, idx) => (
                <div key={idx} className="bg-white border p-4 rounded-xl text-center shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{m.val}</p>
                </div>
              ))}
            </div>

            {/* Charts Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border p-4 rounded-xl text-center space-y-3 bg-gray-50">
                <h4 className="font-bold text-xs text-gray-700">Chat status breakdown</h4>
                <div className="h-32 flex items-center justify-center text-xs text-gray-400 border bg-white rounded-lg">
                  No data available
                </div>
              </div>
              <div className="border p-4 rounded-xl text-center space-y-3 bg-gray-50">
                <h4 className="font-bold text-xs text-gray-700">Assignment overview</h4>
                <div className="h-32 flex items-center justify-center text-xs text-gray-400 border bg-white rounded-lg">
                  No data available
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}