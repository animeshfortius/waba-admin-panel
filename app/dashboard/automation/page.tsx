"use client";

import React, { useState, useEffect, useCallback } from "react";

interface FlowNodeDraft {
  nodeKey: string;
  title: string;
  messageType: "TEXT" | "BUTTONS" | "LIST" | "FLOW";
  bodyText: string;
  flowId?: string;
  nextLabel?: string;
  nextNodeKey?: string;
}

export default function AutomationToolsPage() {
  const [activeTool, setActiveTool] = useState<"chatbot" | "flows" | "qr">("chatbot");

  // Chatbot Builder & AI Chatbot state
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [botId, setBotId] = useState<string>("");
  const [botName, setBotName] = useState<string>("Main Customer Bot");
  const [botMode, setBotMode] = useState<"CHAT_FLOW" | "AI_CHATBOT">("CHAT_FLOW");
  const [triggerType, setTriggerType] = useState<string>("KEYWORD");
  const [keywords, setKeywords] = useState<string>("hi, hello, start, menu");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [aiProvider, setAiProvider] = useState<string>("OPENAI");
  const [aiModel, setAiModel] = useState<string>("gpt-4o-mini");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(
    "You are a helpful WhatsApp assistant for our business. Answer clearly and concisely."
  );
  const [nodes, setNodes] = useState<FlowNodeDraft[]>([
    {
      nodeKey: "welcome",
      title: "Welcome & Menu",
      messageType: "BUTTONS",
      bodyText: "Welcome! How can we help you today?",
      nextLabel: "Support",
      nextNodeKey: "support",
    },
    {
      nodeKey: "support",
      title: "Support Reply",
      messageType: "TEXT",
      bodyText: "Our support team has received your request and will reply shortly.",
    },
  ]);

  // WhatsApp Flows state
  const [flows, setFlows] = useState<any[]>([]);
  const [flowName, setFlowName] = useState<string>("");
  const [flowCategory, setFlowCategory] = useState<string>("LEAD_GENERATION");
  const [flowEndpoint, setFlowEndpoint] = useState<string>("");
  const [publishFlow, setPublishFlow] = useState<boolean>(false);

  // QR Codes state
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [qrMessage, setQrMessage] = useState<string>("Hi! I want more details about your services.");
  const [qrFormat, setQrFormat] = useState<"PNG" | "SVG">("PNG");

  const [statusMsg, setStatusMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const loadAllData = useCallback(async (syncMeta = false) => {
    setLoading(true);
    try {
      const [botRes, flowRes, qrRes] = await Promise.all([
        fetch("/api/automation/chatbots", { cache: "no-store" }),
        fetch(`/api/automation/flows?sync=${syncMeta ? "true" : "false"}`, { cache: "no-store" }),
        fetch(`/api/automation/qr-codes?sync=${syncMeta ? "true" : "false"}`, { cache: "no-store" }),
      ]);

      const [botJson, flowJson, qrJson] = await Promise.all([
        botRes.json(),
        flowRes.json(),
        qrRes.json(),
      ]);

      if (botJson.success) setChatbots(botJson.chatbots || []);
      if (flowJson.success) setFlows(flowJson.flows || []);
      if (qrJson.success) setQrCodes(qrJson.qrCodes || []);
    } catch (err: any) {
      setStatusMsg(err.message || "Error loading automation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  const handleSaveChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    const payloadNodes = nodes.map((n) => ({
      nodeKey: n.nodeKey,
      title: n.title,
      messageType: n.messageType,
      bodyText: n.bodyText,
      flowId: n.flowId || null,
      options:
        n.nextLabel && n.nextNodeKey
          ? [{ id: n.nextNodeKey, label: n.nextLabel, nextNodeKey: n.nextNodeKey }]
          : [],
    }));

    const res = await fetch("/api/automation/chatbots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: botId || undefined,
        name: botName,
        mode: botMode,
        triggerType,
        keywords,
        isActive,
        aiProvider,
        aiModel,
        aiApiKey,
        aiSystemPrompt,
        nodes: payloadNodes,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setBotId(data.chatbot.id);
      setStatusMsg("Chatbot saved to database!");
      loadAllData(false);
    } else {
      setStatusMsg(data.error || "Failed to save chatbot");
    }
  };

  const handleEditBot = (bot: any) => {
    setBotId(bot.id);
    setBotName(bot.name);
    setBotMode(bot.mode || "CHAT_FLOW");
    setTriggerType(bot.triggerType || "KEYWORD");
    setKeywords(bot.keywords || "");
    setIsActive(Boolean(bot.isActive));
    setAiProvider(bot.aiProvider || "OPENAI");
    setAiModel(bot.aiModel || "gpt-4o-mini");
    setAiApiKey(bot.aiApiKey || "");
    setAiSystemPrompt(bot.aiSystemPrompt || "");
    if (Array.isArray(bot.nodes) && bot.nodes.length > 0) {
      setNodes(
        bot.nodes.map((n: any) => {
          let opts: any[] = [];
          try {
            opts = JSON.parse(n.optionsJson || "[]");
          } catch {
            opts = [];
          }
          return {
            nodeKey: n.nodeKey,
            title: n.title,
            messageType: n.messageType || "TEXT",
            bodyText: n.bodyText,
            flowId: n.flowId || "",
            nextLabel: opts[0]?.label || "",
            nextNodeKey: opts[0]?.nextNodeKey || "",
          };
        })
      );
    }
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    const res = await fetch("/api/automation/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: flowName,
        categories: [flowCategory],
        endpointUri: flowEndpoint || undefined,
        publish: publishFlow,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setFlowName("");
      setStatusMsg("WhatsApp Flow created & saved!");
      loadAllData(false);
    } else {
      setStatusMsg(data.error || "Failed to create flow");
    }
  };

  const handleCreateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    const res = await fetch("/api/automation/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prefilledText: qrMessage,
        generateQrImg: qrFormat,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setStatusMsg("WhatsApp QR Code generated & saved!");
      loadAllData(false);
    } else {
      setStatusMsg(data.error || "Failed to generate QR code");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Automation Tools
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Chatbot Builder, WhatsApp Flows & QR Codes
          </h1>
        </div>

        <button
          onClick={() => loadAllData(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
        >
          {loading ? "Syncing..." : "🔄 Live Sync From Meta"}
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {/* 3 Tool Cards matching Automation Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTool("chatbot")}
          className={`text-left p-5 rounded-2xl border transition cursor-pointer ${
            activeTool === "chatbot"
              ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-2xl mb-2">🤖</div>
          <div className="font-bold text-slate-900">Chatbot Builder</div>
          <p className="text-xs text-slate-500 mt-1">
            Build Chat Flows & configure AI Chatbot with API keys and live automation.
          </p>
        </button>

        <button
          onClick={() => setActiveTool("flows")}
          className={`text-left p-5 rounded-2xl border transition cursor-pointer ${
            activeTool === "flows"
              ? "bg-white border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-2xl mb-2">🔀</div>
          <div className="font-bold text-slate-900">WhatsApp Flows</div>
          <p className="text-xs text-slate-500 mt-1">
            Design, sync, and control Meta WhatsApp Flows with live status.
          </p>
        </button>

        <button
          onClick={() => setActiveTool("qr")}
          className={`text-left p-5 rounded-2xl border transition cursor-pointer ${
            activeTool === "qr"
              ? "bg-white border-purple-500 ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="text-2xl mb-2">📱</div>
          <div className="font-bold text-slate-900">QR Codes</div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, sync, and manage WhatsApp QR codes & prefilled messages.
          </p>
        </button>
      </div>

      {/* 1. CHATBOT BUILDER (CHAT FLOW + AI CHATBOT) */}
      {activeTool === "chatbot" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSaveChatbot}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {botId ? "Edit Chatbot" : "Create Chatbot"}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBotMode("CHAT_FLOW")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    botMode === "CHAT_FLOW"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Chat Flow
                </button>
                <button
                  type="button"
                  onClick={() => setBotMode("AI_CHATBOT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    botMode === "AI_CHATBOT"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  AI Chatbot
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chatbot Name
                </label>
                <input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="KEYWORD">Keyword Match</option>
                  <option value="ALL_MESSAGES">All Incoming Messages</option>
                  <option value="WELCOME">Welcome Trigger</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active on Live Webhook</span>
                </label>
              </div>
            </div>

            {botMode === "AI_CHATBOT" ? (
              <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <div className="text-sm font-bold text-indigo-900">
                  AI Chatbot Configuration (API Key & Prompt)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      AI Provider
                    </label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="OPENAI">OpenAI</option>
                      <option value="GEMINI">Google Gemini</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Model
                    </label>
                    <input
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API key or leave blank to use server env key"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    System Instructions / Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-800">
                    Chat Flow Steps
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNodes((prev) => [
                        ...prev,
                        {
                          nodeKey: `step_${prev.length + 1}`,
                          title: `Step ${prev.length + 1}`,
                          messageType: "TEXT",
                          bodyText: "",
                        },
                      ])
                    }
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>

                {nodes.map((node, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <input
                        placeholder="Node Key (e.g. welcome)"
                        value={node.nodeKey}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].nodeKey = e.target.value;
                          setNodes(copy);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 bg-white font-mono"
                      />
                      <input
                        placeholder="Step Title"
                        value={node.title}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].title = e.target.value;
                          setNodes(copy);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 bg-white"
                      />
                      <select
                        value={node.messageType}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].messageType = e.target.value as any;
                          setNodes(copy);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="TEXT">Text Message</option>
                        <option value="BUTTONS">Interactive Buttons</option>
                        <option value="LIST">Interactive List</option>
                        <option value="FLOW">WhatsApp Flow CTA</option>
                      </select>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Message body text..."
                      value={node.bodyText}
                      onChange={(e) => {
                        const copy = [...nodes];
                        copy[i].bodyText = e.target.value;
                        setNodes(copy);
                      }}
                      className="w-full border rounded-lg px-2.5 py-1.5 bg-white text-xs"
                    />

                    {node.messageType === "FLOW" && (
                      <input
                        placeholder="Meta Flow ID"
                        value={node.flowId || ""}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].flowId = e.target.value;
                          setNodes(copy);
                        }}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white text-xs font-mono"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        placeholder="Button/Option Label (optional)"
                        value={node.nextLabel || ""}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].nextLabel = e.target.value;
                          setNodes(copy);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 bg-white"
                      />
                      <input
                        placeholder="Next Node Key (optional)"
                        value={node.nextNodeKey || ""}
                        onChange={(e) => {
                          const copy = [...nodes];
                          copy[i].nextNodeKey = e.target.value;
                          setNodes(copy);
                        }}
                        className="border rounded-lg px-2.5 py-1.5 bg-white font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
              >
                Save Chatbot
              </button>
              {botId && (
                <button
                  type="button"
                  onClick={() => {
                    setBotId("");
                    setBotName("New Bot");
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm cursor-pointer"
                >
                  New Bot
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-slate-900">Saved Chatbots ({chatbots.length})</h3>
            {chatbots.length === 0 ? (
              <p className="text-xs text-slate-400">No chatbots saved yet.</p>
            ) : (
              chatbots.map((b) => (
                <div
                  key={b.id}
                  className="border border-slate-100 rounded-xl p-3 space-y-1.5 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{b.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {b.mode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Trigger: {b.triggerType} {b.keywords ? `(${b.keywords})` : ""}
                  </div>
                  <button
                    onClick={() => handleEditBot(b)}
                    className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Configure / Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. WHATSAPP FLOWS */}
      {activeTool === "flows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleCreateFlow}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-bold text-slate-900">Create WhatsApp Flow</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Flow Name</label>
              <input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                required
                placeholder="e.g. Lead_Capture_Flow"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={flowCategory}
                onChange={(e) => setFlowCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="LEAD_GENERATION">Lead Generation</option>
                <option value="APPOINTMENT_BOOKING">Appointment Booking</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="CUSTOMER_SUPPORT">Customer Support</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Endpoint URI (optional)
              </label>
              <input
                value={flowEndpoint}
                onChange={(e) => setFlowEndpoint(e.target.value)}
                placeholder="https://your-domain.com/api/flow-endpoint"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={publishFlow}
                onChange={(e) => setPublishFlow(e.target.checked)}
              />
              <span>Publish immediately on Meta</span>
            </label>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
            >
              Create Flow
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-bold text-slate-900">Synced WhatsApp Flows ({flows.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-slate-500 uppercase">
                    <th className="py-2 px-3">Flow Name</th>
                    <th className="py-2 px-3">Meta Flow ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No WhatsApp Flows found. Click "Live Sync From Meta".
                      </td>
                    </tr>
                  ) : (
                    flows.map((f) => (
                      <tr key={f.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{f.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{f.metaFlowId || "—"}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                            {f.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{f.categories}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. QR CODES */}
      {activeTool === "qr" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleCreateQr}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-bold text-slate-900">Create WhatsApp QR Code</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Prefilled Message
              </label>
              <textarea
                rows={3}
                value={qrMessage}
                onChange={(e) => setQrMessage(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Image Format</label>
              <select
                value={qrFormat}
                onChange={(e) => setQrFormat(e.target.value as "PNG" | "SVG")}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="PNG">PNG</option>
                <option value="SVG">SVG</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold cursor-pointer"
            >
              Generate QR Code
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-bold text-slate-900">WhatsApp QR Codes ({qrCodes.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qrCodes.length === 0 ? (
                <p className="text-xs text-slate-400">No QR codes found yet.</p>
              ) : (
                qrCodes.map((q) => (
                  <div key={q.id} className="border rounded-xl p-3.5 space-y-2 bg-slate-50/40">
                    <div className="text-xs font-mono text-slate-500">Code: {q.code || "—"}</div>
                    <div className="text-sm font-medium text-slate-800">{q.prefilledText}</div>
                    {q.qrImageUrl && (
                      <img
                        src={q.qrImageUrl}
                        alt={q.code || "WhatsApp QR"}
                        className="w-32 h-32 object-contain border rounded-lg bg-white p-1"
                      />
                    )}
                    {q.deepLinkUrl && (
                      <div className="text-[11px] font-mono text-blue-600 break-all">
                        {q.deepLinkUrl}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}