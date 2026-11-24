"use client";

import React, { useState, useEffect, useCallback } from "react";

type NodeKind =
  | "SEND_A_MESSAGE"
  | "WHATSAPP_TEMPLATE"
  | "ASK_A_QUESTION_MESSAGE"
  | "LOCATION_REQUEST"
  | "QUESTION_BUTTON_MESSAGE"
  | "ACTION_BUTTON"
  | "WEBHOOK_CONFIG"
  | "MULTI_LIST"
  | "DYNAMIC_LIST"
  | "GOOGLE_SHEET_REPORT"
  | "AGENT_NOTIFICATION"
  | "SEND_FLOW_MESSAGE"
  | "DELAY"
  | "SEND_CAROUSEL_MESSAGE"
  | "GOOGLE_CALENDAR_BOOKING"
  | "CATALOG_MESSAGE";

interface VisualNodeItem {
  id: string;
  nodeKey: string;
  title: string;
  messageType: NodeKind;
  bodyText: string;
  headerText?: string;
  footerText?: string;
  flowId?: string;
  posX: number;
  posY: number;
  parentKey?: string | null;
  config: Record<string, any>;
}

const NODE_PALETTE: { type: NodeKind; label: string; icon: string }[] = [
  { type: "SEND_A_MESSAGE", label: "SEND A MESSAGE", icon: "💬" },
  { type: "WHATSAPP_TEMPLATE", label: "WHATSAPP TEMPLATE", icon: "📄" },
  { type: "ASK_A_QUESTION_MESSAGE", label: "ASK A QUESTION MESSAGE", icon: "❓" },
  { type: "LOCATION_REQUEST", label: "LOCATION REQUEST", icon: "📍" },
  { type: "QUESTION_BUTTON_MESSAGE", label: "QUESTION BUTTON MESSAGE", icon: "🔘" },
  { type: "ACTION_BUTTON", label: "ACTION BUTTON", icon: "⚡" },
  { type: "WEBHOOK_CONFIG", label: "WEBHOOK CONFIG", icon: "🔗" },
  { type: "MULTI_LIST", label: "MULTI LIST", icon: "📋" },
  { type: "DYNAMIC_LIST", label: "DYNAMIC LIST", icon: "📑" },
  { type: "GOOGLE_SHEET_REPORT", label: "GOOGLE SHEET REPORT", icon: "📊" },
  { type: "AGENT_NOTIFICATION", label: "AGENT NOTIFICATION", icon: "🔔" },
  { type: "SEND_FLOW_MESSAGE", label: "SEND FLOW MESSAGE", icon: "🔀" },
  { type: "DELAY", label: "DELAY", icon: "⏱️" },
  { type: "SEND_CAROUSEL_MESSAGE", label: "SEND CAROUSEL MESSAGE", icon: "🎠" },
  { type: "GOOGLE_CALENDAR_BOOKING", label: "GOOGLE CALENDAR BOOKING", icon: "📅" },
  { type: "CATALOG_MESSAGE", label: "CATALOG MESSAGE", icon: "🛍️" },
];

const DEFAULT_CAROUSEL_CARDS = [
  {
    title: "Card 1",
    body: "Explore our featured offer",
    button1Text: "Know More",
    button2Text: "Buy Now",
    urlText: "Visit Now",
    urlLink: "https://example.com",
  },
  {
    title: "Card 2",
    body: "Special bundle available",
    button1Text: "Details",
    button2Text: "Contact",
    urlText: "View Offer",
    urlLink: "https://example.com",
  },
];

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "flows" | "qr">("builder");

  // Saved Chatbots & Flow Metadata
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [botId, setBotId] = useState<string>("");
  const [botName, setBotName] = useState<string>("Testing");
  const [channelNumber, setChannelNumber] = useState<string>("110.225.103.5");
  const [botMode, setBotMode] = useState<"CHAT_FLOW" | "AI_CHATBOT">("CHAT_FLOW");
  const [triggerType, setTriggerType] = useState<string>("KEYWORD");
  const [keywords, setKeywords] = useState<string>("hi, hello, test");
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // AI Chatbot config
  const [aiProvider, setAiProvider] = useState<string>("OPENAI");
  const [aiModel, setAiModel] = useState<string>("gpt-4o-mini");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(
    "You are a helpful WhatsApp assistant. Keep answers clear, friendly, and concise."
  );

  // Visual Flow Nodes & Selection / Menu / Drawer
  const [nodes, setNodes] = useState<VisualNodeItem[]>([
    {
      id: "n_msg",
      nodeKey: "message_1",
      title: "Message",
      messageType: "SEND_A_MESSAGE",
      bodyText: "Hello Welcome! How can we help you today?",
      posX: 340,
      posY: 110,
      parentKey: "start_trigger",
      config: {},
    },
    {
      id: "n_tpl",
      nodeKey: "template_1",
      title: "Whatsapp Template",
      messageType: "WHATSAPP_TEMPLATE",
      bodyText: "Welcome template message",
      posX: 430,
      posY: 215,
      parentKey: "start_trigger",
      config: {},
    },
    {
      id: "n_btn",
      nodeKey: "action_btn_1",
      title: "Action Button",
      messageType: "ACTION_BUTTON",
      bodyText: "Tap below to proceed",
      posX: 690,
      posY: 205,
      parentKey: "template_1",
      config: { buttons: [{ id: "act_1", label: "Get Started", nextNodeKey: "webhook_1" }] },
    },
    {
      id: "n_hook",
      nodeKey: "webhook_1",
      title: "Webhook Config",
      messageType: "WEBHOOK_CONFIG",
      bodyText: "Webhook trigger node",
      posX: 930,
      posY: 255,
      parentKey: "action_btn_1",
      config: { webhookUrl: "", method: "POST" },
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [paletteOpenForParent, setPaletteOpenForParent] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [validationPopup, setValidationPopup] = useState<string>("");
  const [carouselCardIdx, setCarouselCardIdx] = useState<number>(0);

  // Test Preview Tab / Modal state
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewInput, setPreviewInput] = useState<string>("");
  const [previewStep, setPreviewStep] = useState<number>(0);
  const [previewChat, setPreviewChat] = useState<{ from: "user" | "bot"; text: string }[]>([]);

  // WhatsApp Flows & QR Codes
  const [flows, setFlows] = useState<any[]>([]);
  const [flowName, setFlowName] = useState<string>("");
  const [flowCategory, setFlowCategory] = useState<string>("LEAD_GENERATION");
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [qrMessage, setQrMessage] = useState<string>("Hi! I want more details.");

  const [statusMsg, setStatusMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const loadData = useCallback(async (syncMeta = false) => {
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
    } catch (e: any) {
      setStatusMsg(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const addNodeFromPalette = (type: NodeKind) => {
    const label = NODE_PALETTE.find((p) => p.type === type)?.label || type;
    const idx = nodes.length;
    const newNode: VisualNodeItem = {
      id: `n_${Date.now()}_${idx}`,
      nodeKey: `${type.toLowerCase()}_${idx + 1}`,
      title: label
        .split(" ")
        .map((w) => w[0] + w.slice(1).toLowerCase())
        .join(" "),
      messageType: type,
      bodyText: "",
      posX: 340 + (idx % 4) * 230,
      posY: 130 + Math.floor(idx / 4) * 145,
      parentKey: paletteOpenForParent || "start_trigger",
      config:
        type === "SEND_CAROUSEL_MESSAGE"
          ? {
              headerMediaType: "IMAGE",
              buttonType: "QUICK_REPLIES",
              cards: [...DEFAULT_CAROUSEL_CARDS],
            }
          : type === "DELAY"
          ? { delaySeconds: 5 }
          : type === "CATALOG_MESSAGE"
          ? { catalogType: "FULL_CATALOG" }
          : {},
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setPaletteOpenForParent(null);
    setCarouselCardIdx(0);
  };

  const updateSelectedNode = (patch: Partial<VisualNodeItem>) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, ...patch } : n))
    );
  };

  const updateSelectedConfig = (patch: Record<string, any>) => {
    if (!selectedNode) return;
    updateSelectedNode({ config: { ...selectedNode.config, ...patch } });
  };

  const handleSaveFlow = async (publishNow = false) => {
    setStatusMsg("");
    const payloadNodes = nodes.map((n, idx) => ({
      nodeKey: n.nodeKey,
      title: n.title,
      messageType: n.messageType,
      bodyText: n.bodyText,
      headerText: n.headerText || null,
      footerText: n.footerText || null,
      flowId: n.flowId || null,
      posX: n.posX,
      posY: n.posY,
      parentKey: n.parentKey || "start_trigger",
      config: n.config,
      sortOrder: idx,
    }));

    const res = await fetch("/api/automation/chatbots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: botId || undefined,
        name: botName,
        channelNumber,
        mode: botMode,
        triggerType,
        keywords,
        isActive,
        isPublished: publishNow ? true : isPublished,
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
      if (publishNow) setIsPublished(true);
      setStatusMsg(publishNow ? "Flow published & saved!" : "Flow saved to database!");
      loadData(false);
    } else {
      setStatusMsg(data.error || "Error saving flow");
    }
  };

  const handleLoadSavedBot = (bot: any) => {
    setBotId(bot.id);
    setBotName(bot.name || "Flow");
    setChannelNumber(bot.channelNumber || "110.225.103.5");
    setBotMode(bot.mode === "AI_CHATBOT" ? "AI_CHATBOT" : "CHAT_FLOW");
    setTriggerType(bot.triggerType || "KEYWORD");
    setKeywords(bot.keywords || "");
    setIsActive(Boolean(bot.isActive));
    setIsPublished(Boolean(bot.isPublished));
    setAiProvider(bot.aiProvider || "OPENAI");
    setAiModel(bot.aiModel || "gpt-4o-mini");
    setAiApiKey(bot.aiApiKey || "");
    setAiSystemPrompt(bot.aiSystemPrompt || "");

    if (Array.isArray(bot.nodes) && bot.nodes.length > 0) {
      setNodes(
        bot.nodes.map((n: any, idx: number) => {
          let cfg: any = {};
          try {
            cfg = JSON.parse(n.optionsJson || "{}");
          } catch {
            cfg = {};
          }
          return {
            id: n.id || `loaded_${idx}`,
            nodeKey: n.nodeKey,
            title: n.title,
            messageType: n.messageType || "SEND_A_MESSAGE",
            bodyText: n.bodyText || "",
            headerText: n.headerText || "",
            footerText: n.footerText || "",
            flowId: n.flowId || "",
            posX: typeof n.posX === "number" ? n.posX : 340 + idx * 220,
            posY: typeof n.posY === "number" ? n.posY : 120 + (idx % 3) * 140,
            parentKey: n.parentKey || "start_trigger",
            config: cfg && typeof cfg === "object" ? cfg : {},
          };
        })
      );
    }
  };

  const handleDeleteBot = async (id: string) => {
    await fetch(`/api/automation/chatbots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (botId === id) setBotId("");
    loadData(false);
  };

  const handleAutoLayout = () => {
    setNodes((prev) =>
      prev.map((n, i) => ({
        ...n,
        posX: 350 + Math.floor(i / 4) * 260,
        posY: 90 + (i % 4) * 145,
      }))
    );
  };

  const handlePreviewSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewInput.trim()) return;
    const msg = previewInput.trim();
    setPreviewInput("");

    if (botMode === "AI_CHATBOT") {
      setPreviewChat((prev) => [
        ...prev,
        { from: "user", text: msg },
        { from: "bot", text: `[AI ${aiProvider} / ${aiModel}] ${aiSystemPrompt.slice(0, 80)}...` },
      ]);
      return;
    }

    const activeNode = nodes[previewStep] || nodes[0];
    setPreviewChat((prev) => [
      ...prev,
      { from: "user", text: msg },
      {
        from: "bot",
        text: activeNode ? `${activeNode.title}: ${activeNode.bodyText || "Triggered node"}` : "Done",
      },
    ]);
    if (previewStep < nodes.length - 1) setPreviewStep((s) => s + 1);
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/automation/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: flowName, categories: [flowCategory] }),
    });
    const d = await res.json();
    if (d.success) {
      setFlowName("");
      setStatusMsg("Flow created & saved!");
      loadData(false);
    }
  };

  const handleCreateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/automation/qr-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefilledText: qrMessage, generateQrImg: "PNG" }),
    });
    const d = await res.json();
    if (d.success) {
      setStatusMsg("QR code created & saved!");
      loadData(false);
    }
  };

  const triggerPos = { x: 80, y: 150 };

  return (
    <div
      className="min-h-screen bg-[#f4f7f9] text-slate-800 flex flex-col select-none"
      onMouseMove={(e) => {
        if (!draggingNodeId) return;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId
              ? { ...n, posX: Math.max(40, n.posX + e.movementX), posY: Math.max(40, n.posY + e.movementY) }
              : n
          )
        );
      }}
      onMouseUp={() => setDraggingNodeId(null)}
    >
      {/* Top Sub-Header: Channel, Tab Switcher, Publish, Test Preview, Save */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === "builder" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            WAChatBotFlowBuilder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("flows")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === "flows" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            WhatsApp Flows
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === "qr" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            QR Codes
          </button>

          <select
            value={channelNumber}
            onChange={(e) => setChannelNumber(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white"
          >
            <option value="110.225.103.5">110.225.103.5</option>
            <option value="91XXXXXXXXXX">Default WABA Number</option>
          </select>

          <select
            value={botMode}
            onChange={(e) => setBotMode(e.target.value as "CHAT_FLOW" | "AI_CHATBOT")}
            className="border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50"
          >
            <option value="CHAT_FLOW">Mode: Chat Flow</option>
            <option value="AI_CHATBOT">Mode: AI Chatbot</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveFlow(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewStep(0);
              setPreviewChat([]);
              setPreviewOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Test Preview
          </button>
          <button
            type="button"
            onClick={() => handleSaveFlow(false)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {loading ? "Syncing..." : "Sync Meta"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-1.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: VISUAL FLOW BUILDER & AI CHATBOT */}
      {activeTab === "builder" && (
        <div className="relative flex-1 flex overflow-hidden">
          {/* Flow Name Bar Top-Left on Canvas */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none w-36"
            />
            <span className="text-[11px] text-slate-400">
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>

          {botMode === "AI_CHATBOT" ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-indigo-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-indigo-950">AI Chatbot Configuration</h2>
                    <p className="text-xs text-slate-500">
                      Direct LLM replies for incoming WhatsApp messages matching keywords/triggers.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Provider</label>
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
                    <label className="block font-semibold text-slate-600 mb-1">Model</label>
                    <input
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-600 mb-1">API Key</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-... or Gemini API Key"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-600 mb-1">Trigger Keywords</label>
                  <input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-600 mb-1">System Prompt</label>
                  <textarea
                    rows={5}
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveFlow(true)}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save & Activate AI Chatbot
                </button>
              </div>
            </div>
          ) : (
            /* VISUAL FLOW CANVAS */
            <div className="relative flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] min-h-[620px]">
              <div
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                className="relative w-[1600px] h-[900px]"
              >
                {/* SVG Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {nodes.map((n) => {
                    const from =
                      n.parentKey && n.parentKey !== "start_trigger"
                        ? (() => {
                            const p = nodes.find((x) => x.nodeKey === n.parentKey || x.id === n.parentKey);
                            return p ? { x: p.posX + 190, y: p.posY + 28 } : { x: triggerPos.x + 190, y: triggerPos.y + 40 };
                          })()
                        : { x: triggerPos.x + 190, y: triggerPos.y + 40 };
                    const to = { x: n.posX, y: n.posY + 28 };
                    const midX = (from.x + to.x) / 2;
                    return (
                      <path
                        key={n.id}
                        d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.6"
                        strokeDasharray={n.parentKey === "start_trigger" ? "4 4" : undefined}
                      />
                    );
                  })}
                </svg>

                {/* START TRIGGER CARD */}
                <div
                  style={{ left: triggerPos.x, top: triggerPos.y }}
                  className="absolute w-52 bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2 z-10"
                >
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-bold text-slate-900">Start Trigger</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaletteOpenForParent(
                          paletteOpenForParent === "start_trigger" ? null : "start_trigger"
                        )
                      }
                      className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    Whatsapp Event Keyword
                  </div>
                  <div className="text-[10px] text-slate-500">Message contains</div>
                  <div className="flex flex-wrap gap-1">
                    {keywords
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                      .map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-1 pt-1">
                    <input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="+ keyword"
                      className="flex-1 border rounded px-1.5 py-0.5 text-[10px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newKeyword.trim()) return;
                        setKeywords((prev) =>
                          prev ? `${prev}, ${newKeyword.trim()}` : newKeyword.trim()
                        );
                        setNewKeyword("");
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* FLOW NODES */}
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <div
                      key={node.id}
                      style={{ left: node.posX, top: node.posY }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingNodeId(node.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setCarouselCardIdx(0);
                      }}
                      className={`absolute w-48 bg-white rounded-xl border p-3 shadow-sm cursor-grab active:cursor-grabbing transition ${
                        isSelected
                          ? "border-emerald-500 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {node.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaletteOpenForParent(
                              paletteOpenForParent === node.nodeKey ? null : node.nodeKey
                            );
                          }}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-1">
                        {node.bodyText || node.messageType}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* NODE TYPE POPUP MENU (Right side like video) */}
              {paletteOpenForParent && (
                <div className="fixed right-4 top-28 z-40 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 max-h-[75vh] overflow-y-auto space-y-0.5">
                  <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
                    <span className="text-[11px] font-bold text-slate-700">Add Node</span>
                    <button
                      onClick={() => setPaletteOpenForParent(null)}
                      className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {NODE_PALETTE.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => addNodeFromPalette(item.type)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* BOTTOM-LEFT CANVAS CONTROLS (Zoom, Fit, Minimap, Auto-layout) */}
              <div className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer font-bold"
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
                  title="Reset View"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setShowMinimap((m) => !m)}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
                  title="Toggle Minimap"
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={handleAutoLayout}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
                  title="Auto Layout"
                >
                  Layout
                </button>
              </div>

              {showMinimap && (
                <div className="fixed bottom-16 left-4 z-30 w-44 h-28 bg-white/95 border border-slate-300 rounded-xl shadow p-2 text-[10px]">
                  <div className="font-bold text-slate-600 mb-1">Flow Minimap</div>
                  <div className="text-slate-500">Nodes: {nodes.length + 1}</div>
                  <div className="text-slate-500">Zoom: {Math.round(zoom * 100)}%</div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT-SIDE NODE CONFIGURATION DRAWER */}
          {selectedNode && botMode === "CHAT_FLOW" && (
            <div className="w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-30 max-h-[calc(100vh-52px)]">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{selectedNode.title}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Node Title</label>
                  <input
                    value={selectedNode.title}
                    onChange={(e) => updateSelectedNode({ title: e.target.value })}
                    className="w-full border rounded-lg px-2.5 py-1.5"
                  />
                </div>

                {/* AGENT NOTIFICATION DRAWER */}
                {selectedNode.messageType === "AGENT_NOTIFICATION" && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Provider Type</label>
                      <select
                        value={selectedNode.config.providerType || ""}
                        onChange={(e) => updateSelectedConfig({ providerType: e.target.value })}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="">Select Email Provider</option>
                        <option value="SMTP">Custom SMTP</option>
                        <option value="SENDGRID">SendGrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">From Email ID</label>
                      <input
                        value={selectedNode.config.fromEmail || ""}
                        onChange={(e) => updateSelectedConfig({ fromEmail: e.target.value })}
                        placeholder="noreply@example.com"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Recipient Email</label>
                      <input
                        value={selectedNode.config.toEmail || ""}
                        onChange={(e) => updateSelectedConfig({ toEmail: e.target.value })}
                        placeholder="e.g. agent@example.com"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">CC Email</label>
                      <input
                        value={selectedNode.config.ccEmail || ""}
                        onChange={(e) => updateSelectedConfig({ ccEmail: e.target.value })}
                        placeholder="e.g. manager@example.com"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Email Subject</label>
                      <input
                        value={selectedNode.config.subject || ""}
                        onChange={(e) => updateSelectedConfig({ subject: e.target.value })}
                        placeholder="Enter email subject"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}

                {/* SEND FLOW MESSAGE DRAWER */}
                {selectedNode.messageType === "SEND_FLOW_MESSAGE" && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Flow Header Text</label>
                      <input
                        value={selectedNode.headerText || ""}
                        onChange={(e) => updateSelectedNode({ headerText: e.target.value })}
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Select Flow</label>
                      <select
                        value={selectedNode.flowId || ""}
                        onChange={(e) => updateSelectedNode({ flowId: e.target.value })}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="">-- Select Flow --</option>
                        {flows.map((f) => (
                          <option key={f.id} value={f.metaFlowId || f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Button Text</label>
                      <input
                        value={selectedNode.config.buttonText || ""}
                        onChange={(e) => updateSelectedConfig({ buttonText: e.target.value })}
                        placeholder="Please Enter Button Text"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Save answer in a variable
                      </label>
                      <input
                        value={selectedNode.config.saveVar || ""}
                        onChange={(e) => updateSelectedConfig({ saveVar: e.target.value })}
                        placeholder="e.g. flow_response"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </>
                )}

                {/* DELAY DRAWER */}
                {selectedNode.messageType === "DELAY" && (
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Delay Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.config.delaySeconds ?? 5}
                      onChange={(e) =>
                        updateSelectedConfig({ delaySeconds: Number(e.target.value) })
                      }
                      className="w-full border rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                )}

                {/* SEND CAROUSEL MESSAGE DRAWER (Min 2 Cards Validation + Add Card + Prev/Next) */}
                {selectedNode.messageType === "SEND_CAROUSEL_MESSAGE" && (() => {
                  const cards: any[] = Array.isArray(selectedNode.config.cards)
                    ? selectedNode.config.cards
                    : [...DEFAULT_CAROUSEL_CARDS];
                  const activeCard = cards[carouselCardIdx] || cards[0];

                  return (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Header Media Type
                        </label>
                        <select
                          value={selectedNode.config.headerMediaType || "IMAGE"}
                          onChange={(e) =>
                            updateSelectedConfig({ headerMediaType: e.target.value })
                          }
                          className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                        >
                          <option value="IMAGE">Image</option>
                          <option value="VIDEO">Video</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Button Type</label>
                        <select
                          value={selectedNode.config.buttonType || "QUICK_REPLIES"}
                          onChange={(e) => updateSelectedConfig({ buttonType: e.target.value })}
                          className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                        >
                          <option value="QUICK_REPLIES">Quick Replies</option>
                          <option value="URL_BUTTON">URL Button</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold text-slate-700">
                          Cards: Min 2, Max 10 ({cards.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (cards.length >= 10) return;
                            const nextCards = [
                              ...cards,
                              {
                                title: `Card ${cards.length + 1}`,
                                body: "",
                                button1Text: "Option 1",
                                button2Text: "Option 2",
                                urlText: "Visit",
                                urlLink: "https://example.com",
                              },
                            ];
                            updateSelectedConfig({ cards: nextCards });
                            setCarouselCardIdx(nextCards.length - 1);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          + Add Card
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-slate-100 rounded-lg px-2.5 py-1.5">
                        <button
                          type="button"
                          disabled={carouselCardIdx <= 0}
                          onClick={() => setCarouselCardIdx((i) => Math.max(0, i - 1))}
                          className="font-bold disabled:opacity-40 cursor-pointer"
                        >
                          ← Prev
                        </button>
                        <span className="font-bold">
                          Card {carouselCardIdx + 1} / {cards.length}
                        </span>
                        <button
                          type="button"
                          disabled={carouselCardIdx >= cards.length - 1}
                          onClick={() =>
                            setCarouselCardIdx((i) => Math.min(cards.length - 1, i + 1))
                          }
                          className="font-bold disabled:opacity-40 cursor-pointer"
                        >
                          Next →
                        </button>
                      </div>

                      {activeCard && (
                        <div className="border rounded-xl p-2.5 space-y-2 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Card {carouselCardIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (cards.length <= 2) {
                                  setValidationPopup("At least 2 cards required");
                                  return;
                                }
                                const filtered = cards.filter((_, idx) => idx !== carouselCardIdx);
                                updateSelectedConfig({ cards: filtered });
                                setCarouselCardIdx(0);
                              }}
                              className="text-red-600 font-bold cursor-pointer"
                            >
                              🗑
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={activeCard.body || ""}
                            onChange={(e) => {
                              const nextCards = [...cards];
                              nextCards[carouselCardIdx] = { ...activeCard, body: e.target.value };
                              updateSelectedConfig({ cards: nextCards });
                            }}
                            placeholder="Describe this card..."
                            className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                          />

                          {selectedNode.config.buttonType === "URL_BUTTON" ? (
                            <>
                              <input
                                value={activeCard.urlText || ""}
                                onChange={(e) => {
                                  const nextCards = [...cards];
                                  nextCards[carouselCardIdx] = {
                                    ...activeCard,
                                    urlText: e.target.value,
                                  };
                                  updateSelectedConfig({ cards: nextCards });
                                }}
                                placeholder="e.g. Visit Now (max 20 chars)"
                                className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                              />
                              <input
                                value={activeCard.urlLink || ""}
                                onChange={(e) => {
                                  const nextCards = [...cards];
                                  nextCards[carouselCardIdx] = {
                                    ...activeCard,
                                    urlLink: e.target.value,
                                  };
                                  updateSelectedConfig({ cards: nextCards });
                                }}
                                placeholder="https://example.com"
                                className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                              />
                            </>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                value={activeCard.button1Text || ""}
                                onChange={(e) => {
                                  const nextCards = [...cards];
                                  nextCards[carouselCardIdx] = {
                                    ...activeCard,
                                    button1Text: e.target.value,
                                  };
                                  updateSelectedConfig({ cards: nextCards });
                                }}
                                placeholder="Button 1 Text"
                                className="border rounded-lg px-2 py-1 bg-white"
                              />
                              <input
                                value={activeCard.button2Text || ""}
                                onChange={(e) => {
                                  const nextCards = [...cards];
                                  nextCards[carouselCardIdx] = {
                                    ...activeCard,
                                    button2Text: e.target.value,
                                  };
                                  updateSelectedConfig({ cards: nextCards });
                                }}
                                placeholder="Button 2 Text"
                                className="border rounded-lg px-2 py-1 bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CATALOG MESSAGE DRAWER */}
                {selectedNode.messageType === "CATALOG_MESSAGE" && (
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Catalog Message Type
                    </label>
                    <select
                      value={selectedNode.config.catalogType || "FULL_CATALOG"}
                      onChange={(e) => updateSelectedConfig({ catalogType: e.target.value })}
                      className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                    >
                      <option value="FULL_CATALOG">Full Catalog</option>
                      <option value="CATALOG_WITH_THUMBNAIL">Catalog with Thumbnail</option>
                      <option value="SINGLE_PRODUCT">Single Product</option>
                      <option value="MULTI_PRODUCT_LIST">Multi-Product List</option>
                    </select>
                  </div>
                )}

                {/* COMMON BODY TEXT FOR OTHER NODES */}
                {selectedNode.messageType !== "DELAY" &&
                  selectedNode.messageType !== "SEND_CAROUSEL_MESSAGE" && (
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Body / Content
                      </label>
                      <textarea
                        rows={3}
                        value={selectedNode.bodyText}
                        onChange={(e) => updateSelectedNode({ bodyText: e.target.value })}
                        placeholder="Enter message or configuration text..."
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  )}
              </div>

              <div className="p-3 border-t flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSaveFlow(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WHATSAPP FLOWS */}
      {activeTab === "flows" && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateFlow} className="bg-white rounded-2xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">Create WhatsApp Flow</h2>
            <input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              required
              placeholder="Flow Name"
              className="w-full border rounded-lg px-3 py-2 text-xs"
            />
            <select
              value={flowCategory}
              onChange={(e) => setFlowCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="LEAD_GENERATION">Lead Generation</option>
              <option value="APPOINTMENT_BOOKING">Appointment Booking</option>
              <option value="SIGN_UP">Sign Up</option>
              <option value="OTHER">Other</option>
            </select>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
            >
              Create Flow
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">WhatsApp Flows ({flows.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Flow ID</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flows.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 px-3 font-semibold">{f.name}</td>
                      <td className="py-2 px-3 font-mono">{f.metaFlowId || "—"}</td>
                      <td className="py-2 px-3">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QR CODES */}
      {activeTab === "qr" && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateQr} className="bg-white rounded-2xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">Generate QR Code</h2>
            <textarea
              rows={3}
              value={qrMessage}
              onChange={(e) => setQrMessage(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-purple-600 text-white text-xs font-bold cursor-pointer"
            >
              Generate QR
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {qrCodes.map((q) => (
              <div key={q.id} className="border rounded-xl p-3 space-y-2 text-xs">
                <div className="font-mono text-slate-500">{q.code}</div>
                <div className="font-semibold">{q.prefilledText}</div>
                {q.qrImageUrl && (
                  <img src={q.qrImageUrl} alt={q.code || "QR"} className="w-28 h-28 object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVED FLOWS QUICK BAR AT BOTTOM */}
      {chatbots.length > 0 && activeTab === "builder" && (
        <div className="bg-white border-t px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">Saved Flows:</span>
          {chatbots.map((b) => (
            <div key={b.id} className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleLoadSavedBot(b)}
                className="font-semibold text-slate-800 hover:text-emerald-700 cursor-pointer"
              >
                {b.name} ({b.mode})
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBot(b.id)}
                className="text-red-500 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MINIMUM 2 CARDS VALIDATION POPUP */}
      {validationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center space-y-4 shadow-xl">
            <div className="text-3xl">⚠️</div>
            <div className="font-bold text-base text-slate-900">Minimum Required</div>
            <div className="text-xs text-slate-600">{validationPopup}</div>
            <button
              type="button"
              onClick={() => setValidationPopup("")}
              className="px-6 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* TEST PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between">
              <div className="font-bold text-sm">Test Preview — {botName}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewStep(0);
                    setPreviewChat([]);
                  }}
                  className="px-2.5 py-1 rounded bg-amber-400 text-slate-900 text-xs font-bold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 h-72 overflow-y-auto bg-[#efeae2] space-y-2 text-xs">
              <div className="bg-white rounded-xl p-3 max-w-xs shadow-sm space-y-1">
                <div className="font-bold text-slate-800">{botName}</div>
                <div className="text-slate-600">Trigger Condition: MessageIs</div>
                <div className="text-slate-600">Keyword: {keywords}</div>
              </div>

              {previewChat.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl max-w-[75%] ${
                    m.from === "user"
                      ? "ml-auto bg-[#d9fdd3] text-slate-900"
                      : "bg-white text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handlePreviewSend} className="p-3 bg-white border-t flex gap-2">
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-full px-4 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#00a884] text-white text-xs font-bold cursor-pointer"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}