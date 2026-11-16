"use client";

import { useState, useEffect } from "react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchAgents();
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

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert("Name and Email are required!");
      return;
    }

    try {
      const url = "/api/agents";
      const method = editId ? "PATCH" : "POST";
      const body = editId 
        ? { agentId: editId, name, email, phone }
        : { name, email, phone, password: password || "agent123" };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setName(""); setEmail(""); setPhone(""); setPassword(""); setEditId(null);
        fetchAgents();
      } else {
        alert(data.error || "Failed to save agent");
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleToggle = async (agentId: string, field: string, currentValue: boolean) => {
    setAgents((prev) =>
      prev.map((ag) => (ag.id === agentId ? { ...ag, [field]: !currentValue } : ag))
    );

    try {
      await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, [field]: !currentValue }),
      });
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

  return (
    <div className="p-6 space-y-6 font-sans text-xs">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agent Command Center</h1>
          <p className="text-gray-400">Manage live chat agents, permissions, and tool access.</p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setName(""); setEmail(""); setPhone(""); setPassword("");
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          + Add New Agent
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
              <th className="p-4">Agent Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Status</th>
              <th className="p-4">Permissions & Access (Toggles)</th>
              <th className="p-4 text-center">Actions</th>
              <th className="p-4 text-center">Agent Tools</th>
              <th className="p-4 text-right">Login As</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  {loading ? "Loading agents..." : "No agents found. Click '+ Add New Agent' above to create one."}
                </td>
              </tr>
            ) : (
              agents.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{ag.name}</td>
                  <td className="p-4 text-gray-600">
                    <div>📞 {ag.phone || "N/A"}</div>
                    <div className="text-[10px] text-gray-400">✉️ {ag.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 space-y-2">
                    {/* Toggle 1: Chats (allChannelAccess) */}
                    <label className="flex items-center justify-between cursor-pointer max-w-[180px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Chats (All)</span>
                      <input
                        type="checkbox"
                        checked={ag.allChannelAccess ?? true}
                        onChange={() => handleToggle(ag.id, "allChannelAccess", ag.allChannelAccess ?? true)}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    {/* Toggle 2: Send Templates */}
                    <label className="flex items-center justify-between cursor-pointer max-w-[180px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Send Templates</span>
                      <input
                        type="checkbox"
                        checked={ag.sendTemplate ?? false}
                        onChange={() => handleToggle(ag.id, "sendTemplate", ag.sendTemplate ?? false)}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    {/* Toggle 3: Send Campaigns */}
                    <label className="flex items-center justify-between cursor-pointer max-w-[180px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Send Campaigns</span>
                      <input
                        type="checkbox"
                        checked={ag.sendCampaign ?? false}
                        onChange={() => handleToggle(ag.id, "sendCampaign", ag.sendCampaign ?? false)}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditId(ag.id);
                          setName(ag.name); setEmail(ag.email); setPhone(ag.phone || "");
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                        title="Edit Agent"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(ag.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                        title="Delete Agent"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Configuration">⚙️</span>
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Assign Channels">👤</span>
                      <span className="p-1.5 bg-gray-100 rounded-lg cursor-pointer" title="Analytics">📊</span>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleLoginAs(ag)}
                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border border-emerald-200"
                    >
                      Login ➜
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT AGENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editId ? "✏️ Edit Agent Details" : "➕ Add New Live Chat Agent"}
              </h3>
              <button onClick={() => setShowModal(false)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Email Address (Username)</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@fortius.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!editId && (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Enter agent password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow"
                >
                  {editId ? "Update Agent" : "Create Agent 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}