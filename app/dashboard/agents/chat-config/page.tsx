"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AgentChatConfigPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [saving, setSaving] = useState(false);

  // Welcome & Off-Hours States
  const [welcomeMsgEnabled, setWelcomeMsgEnabled] = useState(false);
  const [welcomeMsgText, setWelcomeMsgText] = useState("Welcome!, thanks for visiting.");
  const [editingWelcome, setEditingWelcome] = useState(false);

  const [offHoursMsgEnabled, setOffHoursMsgEnabled] = useState(false);
  const [offHoursMsgText, setOffHoursMsgText] = useState("We're currently offline.");
  const [editingOffHours, setEditingOffHours] = useState(false);

  // Day-wise Operational Hours
  const [operationalHours, setOperationalHours] = useState<{
    [key: string]: { isOpen: boolean; start: string; end: string };
  }>({
    Sunday: { isOpen: false, start: "09:00", end: "18:00" },
    Monday: { isOpen: true, start: "09:00", end: "18:00" },
    Tuesday: { isOpen: true, start: "09:00", end: "18:00" },
    Wednesday: { isOpen: true, start: "09:00", end: "18:00" },
    Thursday: { isOpen: true, start: "09:00", end: "18:00" },
    Friday: { isOpen: true, start: "09:00", end: "18:00" },
    Saturday: { isOpen: false, start: "09:00", end: "18:00" },
  });

  useEffect(() => {
    fetchWabaChannels();
    fetchAgentsList();
  }, []);

  const fetchWabaChannels = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success && Array.isArray(data.wabaAccounts)) {
        setChannels(data.wabaAccounts);
        if (data.wabaAccounts.length > 0) {
          setSelectedChannel(
            (prev) =>
              prev ||
              data.wabaAccounts[0].displayPhone ||
              data.wabaAccounts[0].phoneNumberId
          );
        }
      }
    } catch (err) {
      console.error("Error fetching WABA channels:", err);
    }
  };

  const fetchSavedAgentConfig = async (agentIdParam: string) => {
    try {
      const res = await fetch(`/api/agents/chat-config?agentId=${agentIdParam}`);
      const data = await res.json();
      if (data.success && data.config) {
        if (data.config.channel) setSelectedChannel(data.config.channel);
        setWelcomeMsgEnabled(Boolean(data.config.welcomeMsgEnabled));
        if (data.config.welcomeMsgText) setWelcomeMsgText(data.config.welcomeMsgText);
        setOffHoursMsgEnabled(Boolean(data.config.offHoursMsgEnabled));
        if (data.config.offHoursMsgText) setOffHoursMsgText(data.config.offHoursMsgText);
        if (data.config.operationalHours) setOperationalHours(data.config.operationalHours);
      }
    } catch (err) {
      console.error("Error fetching saved agent config:", err);
    }
  };

  const fetchAgentsList = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
        if (data.agents.length > 0) {
          const firstAgentId = data.agents[0].id;
          setSelectedAgent(firstAgentId);
          fetchSavedAgentConfig(firstAgentId);
        }
      }
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const handleAgentChange = (newAgentId: string) => {
    setSelectedAgent(newAgentId);
    if (newAgentId) {
      fetchSavedAgentConfig(newAgentId);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedChannel || !selectedAgent) {
      alert("Please select both a Channel and an Agent.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/agents/chat-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          channel: selectedChannel,
          welcomeMsgEnabled,
          welcomeMsgText,
          offHoursMsgEnabled,
          offHoursMsgText,
          operationalHours,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Chat message configuration saved successfully!");
      } else {
        alert(data.error || "Failed to save configuration.");
      }
    } catch {
      alert("Network error while saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans text-xs bg-slate-50/40 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
        <div>
          <div className="text-slate-400 font-medium">WhatsApp › Agents › Chat Message Config</div>
          <h1 className="text-xl font-extrabold text-slate-800">Chat Message Config</h1>
        </div>
        <Link
          href="/dashboard/agents"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
        >
          ⬅ Back to Agents
        </Link>
      </div>

      {/* Top Dropdowns: Channel (with Display Name) & Agent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <label className="block font-bold text-slate-600 mb-1.5">Channel *</label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full border rounded-xl p-3 bg-slate-50 font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="">Select Channel</option>
            {channels.map((ch: any) => (
              <option key={ch.id} value={ch.displayPhone || ch.phoneNumberId}>
                📱 {ch.displayName || "WABA Channel"} ({ch.displayPhone || ch.phoneNumberId})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1.5">Agent *</label>
          <select
            value={selectedAgent}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="w-full border rounded-xl p-3 bg-slate-50 font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-bold"
          >
            <option value="">Select Agent</option>
            {agents.map((ag: any) => (
              <option key={ag.id} value={ag.id}>
                👤 {ag.name} (@{ag.userId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Welcome & Off Hours Messages */}
        <div className="space-y-6">
          {/* Welcome Message Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Welcome Message</h3>
                <p className="text-[11px] text-slate-400">
                  Configure automated reply for user&apos;s first query during working hours
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWelcomeMsgEnabled(!welcomeMsgEnabled)}
                className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                  welcomeMsgEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform ${
                    welcomeMsgEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditingWelcome(!editingWelcome)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>✏️</span> {editingWelcome ? "Done" : "Configure"}
              </button>
            </div>

            {editingWelcome && (
              <textarea
                rows={3}
                value={welcomeMsgText}
                onChange={(e) => setWelcomeMsgText(e.target.value)}
                className="w-full border rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-xs"
                placeholder="Enter welcome message..."
              />
            )}

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs max-w-[85%] space-y-1">
                <div className="text-emerald-700 font-bold text-[10px]">WhatsApp</div>
                <div className="text-slate-800 whitespace-pre-wrap">{welcomeMsgText}</div>
                <div className="text-[9px] text-slate-400 text-right">9:10 AM</div>
              </div>
            </div>
          </div>

          {/* Off Hours Message Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Off Hours Message</h3>
                <p className="text-[11px] text-slate-400">
                  Configure automated reply for user&apos;s first query during off hours
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOffHoursMsgEnabled(!offHoursMsgEnabled)}
                className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                  offHoursMsgEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform ${
                    offHoursMsgEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setEditingOffHours(!editingOffHours)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <span>✏️</span> {editingOffHours ? "Done" : "Configure"}
              </button>
            </div>

            {editingOffHours && (
              <textarea
                rows={3}
                value={offHoursMsgText}
                onChange={(e) => setOffHoursMsgText(e.target.value)}
                className="w-full border rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 text-xs"
                placeholder="Enter off-hours message..."
              />
            )}

            <div className="bg-[#EFEAE2] p-4 rounded-2xl border">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs max-w-[85%] space-y-1">
                <div className="text-emerald-700 font-bold text-[10px]">WhatsApp</div>
                <div className="text-slate-800 whitespace-pre-wrap">{offHoursMsgText}</div>
                <div className="text-[9px] text-slate-400 text-right">9:10 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Working / Operational Hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs h-fit">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Working / Operational Hours</h3>
            <p className="text-[11px] text-slate-400">Configure day-wise working hours for automated replies</p>
          </div>

          <div className="divide-y divide-slate-100">
            {Object.keys(operationalHours).map((day) => {
              const dayCfg = operationalHours[day];
              return (
                <div key={day} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs w-24">{day}</span>

                  {dayCfg.isOpen && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <input
                        type="time"
                        value={dayCfg.start}
                        onChange={(e) =>
                          setOperationalHours({
                            ...operationalHours,
                            [day]: { ...dayCfg, start: e.target.value },
                          })
                        }
                        className="border rounded-lg px-2 py-1 bg-slate-50"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={dayCfg.end}
                        onChange={(e) =>
                          setOperationalHours({
                            ...operationalHours,
                            [day]: { ...dayCfg, end: e.target.value },
                          })
                        }
                        className="border rounded-lg px-2 py-1 bg-slate-50"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={() =>
                        setOperationalHours({
                          ...operationalHours,
                          [day]: { ...dayCfg, isOpen: !dayCfg.isOpen },
                        })
                      }
                      className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                        dayCfg.isOpen ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition transform ${
                          dayCfg.isOpen ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                    <span
                      className={`w-12 text-right font-bold text-[11px] ${
                        dayCfg.isOpen ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {dayCfg.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Configurations"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}