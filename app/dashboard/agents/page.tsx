"use client";

import { useState, useEffect } from "react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAgent, setEditAgent] = useState<any>(null);

  // Form states
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

  const handleToggle = async (agentId: string, field: string, currentValue: boolean) => {
    // Optimistic UI update
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
      fetchAgents(); // Rollback on failure
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
            setEditAgent(null);
            setName(""); setEmail(""); setPhone(""); setPassword("");
            setShowAddModal(true);
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
                  {loading ? "Loading agents..." : "No agents found. Add your first agent above."}
                </td>
              </tr>
            ) : (
              agents.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{ag.name}</td>
                  <td className="p-4 text-gray-600">
                    <div>📞 {ag.phone}</div>
                    <div className="text-[10px] text-gray-400">✉️ {ag.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 space-y-2">
                    {/* Toggle 1: All Chats */}
                    <label className="flex items-center justify-between cursor-pointer max-w-[180px] bg-gray-50 px-2.5 py-1 rounded-lg border">
                      <span className="font-medium text-gray-700">Chats (All)</span>
                      <input
                        type="checkbox"
                        checked={ag.allChatsAccess ?? true}
                        onChange={() => handleToggle(ag.id, "allChatsAccess", ag.allChatsAccess ?? true)}
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
                          setEditAgent(ag);
                          setName(ag.name); setEmail(ag.email); setPhone(ag.phone);
                          setShowAddModal(true);
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
    </div>
  );
}