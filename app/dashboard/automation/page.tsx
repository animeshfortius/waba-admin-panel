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

interface BranchOption {
  id: string;
  label: string;
  description?: string;
  nextNodeKey?: string;
}

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
    body: "Thanks for showing interest with us! Check our featured offer.",
    button1Text: "Know More",
    button2Text: "Buy Now",
    urlText: "Visit Now",
    urlLink: "https://example.com",
  },
  {
    title: "Card 2",
    body: "Special package available with instant support.",
    button1Text: "Details",
    button2Text: "Contact",
    urlText: "View Offer",
    urlLink: "https://example.com",
  },
];

const STARTER_NODES: VisualNodeItem[] = [
  {
    id: "n_welcome",
    nodeKey: "welcome_msg",
    title: "Welcome & Options",
    messageType: "QUESTION_BUTTON_MESSAGE",
    bodyText: "Thanks for showing interest with us! How can we help you today?",
    posX: 350,
    posY: 130,
    parentKey: "start_trigger",
    config: {
      options: [
        { id: "opt_pricing", label: "Pricing & Plans", nextNodeKey: "pricing_node" },
        { id: "opt_support", label: "Talk to Agent", nextNodeKey: "agent_node" },
      ],
    },
  },
  {
    id: "n_pricing",
    nodeKey: "pricing_node",
    title: "Pricing Details",
    messageType: "SEND_A_MESSAGE",
    bodyText: "Our plans start with flexible business messaging & automation. Reply 'hi' to restart.",
    posX: 650,
    posY: 95,
    parentKey: "welcome_msg",
    config: {},
  },
  {
    id: "n_agent",
    nodeKey: "agent_node",
    title: "Agent Notification",
    messageType: "AGENT_NOTIFICATION",
    bodyText: "Customer requested live support.",
    posX: 650,
    posY: 245,
    parentKey: "welcome_msg",
    config: {
      providerType: "SMTP",
      toEmail: "",
      subject: "New WhatsApp Lead / Support Request",
    },
  },
];

export default function AutomationPage() {
  // 3 Primary Modules: Chatbot Builder, Whatsapp Flows, QR Codes (No WhatsApp Widget)
  const [activeModule, setActiveModule] = useState<"builder" | "flows" | "qr">("builder");
  // Inside Chatbot Builder: "list" (+ Add Chatbot Flow) or "canvas" (Flow Builder)
  const [builderView, setBuilderView] = useState<"list" | "canvas">("list");

  // Add Chatbot Flow Modal
  const [addFlowModalOpen, setAddFlowModalOpen] = useState<boolean>(false);
  const [newFlowName, setNewFlowName] = useState<string>("");
  const [newFlowChannel, setNewFlowChannel] = useState<string>("110.225.103.5");
  const [newFlowMode, setNewFlowMode] = useState<"CHAT_FLOW" | "AI_CHATBOT">("CHAT_FLOW");
  const [newFlowKeywords, setNewFlowKeywords] = useState<string>("hi, hello");

  // Active Chatbot State
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [botId, setBotId] = useState<string>("");
  const [botName, setBotName] = useState<string>("New Chatbot Flow");
  const [channelNumber, setChannelNumber] = useState<string>("110.225.103.5");
  const [botMode, setBotMode] = useState<"CHAT_FLOW" | "AI_CHATBOT">("CHAT_FLOW");
  const [triggerType, setTriggerType] = useState<string>("KEYWORD");
  const [keywords, setKeywords] = useState<string>("hi, hello");
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // AI Chatbot Config
  const [aiProvider, setAiProvider] = useState<string>("OPENAI");
  const [aiModel, setAiModel] = useState<string>("gpt-4o-mini");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(
    "You are a helpful WhatsApp business assistant. Keep answers clear, polite, and concise."
  );

  // Visual Canvas State
  const [nodes, setNodes] = useState<VisualNodeItem[]>(STARTER_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [paletteOpenForParent, setPaletteOpenForParent] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [validationPopup, setValidationPopup] = useState<string>("");
  const [carouselCardIdx, setCarouselCardIdx] = useState<number>(0);

  // Test Preview State (with real branching simulation)
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewInput, setPreviewInput] = useState<string>("");
  const [previewCurrentNodeKey, setPreviewCurrentNodeKey] = useState<string | null>(null);
  const [previewChat, setPreviewChat] = useState<
    { from: "user" | "bot"; text: string; options?: BranchOption[] }[]
  >([]);

  // WhatsApp Flows & QR Codes
  const [flows, setFlows] = useState<any[]>([]);
  const [flowName, setFlowName] = useState<string>("");
  const [flowCategory, setFlowCategory] = useState<string>("LEAD_GENERATION");
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [qrMessage, setQrMessage] = useState<string>("Hi! Thanks for showing interest with us.");

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
      setStatusMsg(e.message || "Failed to load automation data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const hydrateBotIntoState = (bot: any) => {
    setBotId(bot.id || "");
    setBotName(bot.name || "Chatbot Flow");
    setChannelNumber(bot.channelNumber || "110.225.103.5");
    setBotMode(bot.mode === "AI_CHATBOT" ? "AI_CHATBOT" : "CHAT_FLOW");
    setTriggerType(bot.triggerType || "KEYWORD");
    setKeywords(bot.keywords || "hi, hello");
    setIsActive(Boolean(bot.isActive ?? true));
    setIsPublished(Boolean(bot.isPublished ?? false));
    setAiProvider(bot.aiProvider || "OPENAI");
    setAiModel(bot.aiModel || "gpt-4o-mini");
    setAiApiKey(bot.aiApiKey || "");
    setAiSystemPrompt(
      bot.aiSystemPrompt ||
        "You are a helpful WhatsApp business assistant. Keep answers clear, polite, and concise."
    );

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
            nodeKey: n.nodeKey || `node_${idx + 1}`,
            title: n.title || `Node ${idx + 1}`,
            messageType: n.messageType || "SEND_A_MESSAGE",
            bodyText: n.bodyText || "",
            headerText: n.headerText || "",
            footerText: n.footerText || "",
            flowId: n.flowId || "",
            posX: typeof n.posX === "number" ? n.posX : 350 + (idx % 3) * 260,
            posY: typeof n.posY === "number" ? n.posY : 100 + Math.floor(idx / 3) * 155,
            parentKey: n.parentKey || "start_trigger",
            config: cfg && typeof cfg === "object" ? cfg : {},
          };
        })
      );
    } else {
      setNodes(STARTER_NODES);
    }
    setSelectedNodeId(null);
    setPaletteOpenForParent(null);
  };

  const handleCreateNewChatbotFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    const payloadNodes = STARTER_NODES.map((n, idx) => ({
      nodeKey: n.nodeKey,
      title: n.title,
      messageType: n.messageType,
      bodyText: n.bodyText,
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
        name: newFlowName.trim(),
        channelNumber: newFlowChannel.trim() || "110.225.103.5",
        mode: newFlowMode,
        triggerType: "KEYWORD",
        keywords: newFlowKeywords.trim() || "hi, hello",
        isActive: true,
        isPublished: false,
        nodes: payloadNodes,
      }),
    });
    const data = await res.json();
    if (data.success && data.chatbot) {
      setAddFlowModalOpen(false);
      setNewFlowName("");
      hydrateBotIntoState(data.chatbot);
      setBuilderView("canvas");
      setStatusMsg(`Created "${data.chatbot.name}" — configure your nodes & branches!`);
      loadData(false);
    } else {
      setStatusMsg(data.error || "Could not create chatbot flow");
    }
  };

  const addNodeFromPalette = (type: NodeKind) => {
    const label = NODE_PALETTE.find((p) => p.type === type)?.label || type;
    const idx = nodes.length;
    const parentNode =
      paletteOpenForParent && paletteOpenForParent !== "start_trigger"
        ? nodes.find((n) => n.nodeKey === paletteOpenForParent || n.id === paletteOpenForParent)
        : null;

    const newNode: VisualNodeItem = {
      id: `n_${Date.now()}_${idx}`,
      nodeKey: `${type.toLowerCase()}_${idx + 1}`,
      title: label
        .split(" ")
        .map((w) => w[0] + w.slice(1).toLowerCase())
        .join(" "),
      messageType: type,
      bodyText: "",
      posX: parentNode ? parentNode.posX + 270 : 350 + (idx % 3) * 260,
      posY: parentNode ? parentNode.posY + (idx % 2 === 0 ? -40 : 120) : 120 + (idx % 4) * 145,
      parentKey: paletteOpenForParent || "start_trigger",
      config:
        type === "QUESTION_BUTTON_MESSAGE" || type === "ACTION_BUTTON"
          ? {
              options: [
                { id: `btn_${idx}_1`, label: "Option 1", nextNodeKey: "" },
                { id: `btn_${idx}_2`, label: "Option 2", nextNodeKey: "" },
              ],
            }
          : type === "MULTI_LIST" || type === "DYNAMIC_LIST"
          ? {
              menuLabel: "Select Option",
              sectionTitle: "Choices",
              options: [
                { id: `list_${idx}_1`, label: "Choice 1", description: "", nextNodeKey: "" },
                { id: `list_${idx}_2`, label: "Choice 2", description: "", nextNodeKey: "" },
              ],
            }
          : type === "WEBHOOK_CONFIG"
          ? {
              webhookUrl: "",
              method: "POST",
              apiHeaderName: "Authorization",
              apiKey: "",
              bodyTemplate: '{"phone":"{{customerPhone}}","message":"{{lastInput}}"}',
              responseVar: "api_reply",
              responsePath: "",
              nextNodeKey: "",
              errorNextNodeKey: "",
            }
          : type === "SEND_CAROUSEL_MESSAGE"
          ? {
              headerMediaType: "IMAGE",
              buttonType: "QUICK_REPLIES",
              cards: [...DEFAULT_CAROUSEL_CARDS],
            }
          : type === "DELAY"
          ? { delaySeconds: 3, nextNodeKey: "" }
          : type === "CATALOG_MESSAGE"
          ? { catalogType: "FULL_CATALOG" }
          : { nextNodeKey: "" },
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

  const handleDeleteBot = async (id: string) => {
    await fetch(`/api/automation/chatbots?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (botId === id) {
      setBotId("");
      setNodes(STARTER_NODES);
    }
    loadData(false);
  };

  const handleAutoLayout = () => {
    setNodes((prev) =>
      prev.map((n, i) => ({
        ...n,
        posX: 350 + Math.floor(i / 4) * 270,
        posY: 95 + (i % 4) * 150,
      }))
    );
  };

  const getNodeOptions = (node: VisualNodeItem): BranchOption[] => {
    if (Array.isArray(node.config?.options)) return node.config.options;
    if (Array.isArray(node.config?.buttons)) return node.config.buttons;
    if (Array.isArray(node.config?.rows)) return node.config.rows;
    return [];
  };

  const handlePreviewSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewInput.trim()) return;
    const raw = previewInput.trim();
    const clean = raw.toLowerCase();
    setPreviewInput("");

    if (botMode === "AI_CHATBOT") {
      setPreviewChat((prev) => [
        ...prev,
        { from: "user", text: raw },
        {
          from: "bot",
          text: `[AI ${aiProvider} • ${aiModel}] Processing "${raw}" with configured prompt.`,
        },
      ]);
      return;
    }

    const kws = keywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const isTrigger = kws.some((k) => clean === k || clean.includes(k));

    let nextNode: VisualNodeItem | undefined;
    if (isTrigger || !previewCurrentNodeKey) {
      nextNode = nodes[0];
    } else {
      const curNode = nodes.find((n) => n.nodeKey === previewCurrentNodeKey);
      if (curNode) {
        const opts = getNodeOptions(curNode);
        const matchedOpt = opts.find(
          (o) =>
            String(o.id || "").toLowerCase() === clean ||
            String(o.label || "").toLowerCase() === clean
        );
        if (matchedOpt?.nextNodeKey) {
          nextNode = nodes.find((n) => n.nodeKey === matchedOpt.nextNodeKey);
        } else if (curNode.config?.nextNodeKey) {
          nextNode = nodes.find((n) => n.nodeKey === curNode.config.nextNodeKey);
        } else {
          nextNode = nodes.find((n) => n.parentKey === curNode.nodeKey) || curNode;
        }
      }
    }

    const target = nextNode || nodes[0];
    if (!target) return;

    const targetOpts = getNodeOptions(target);
    setPreviewCurrentNodeKey(target.nodeKey);
    setPreviewChat((prev) => [
      ...prev,
      { from: "user", text: raw },
      {
        from: "bot",
        text: `[${target.title}] ${target.bodyText || target.messageType}`,
        options: targetOpts,
      },
    ]);
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
      setStatusMsg("WhatsApp Flow created & saved!");
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
      setStatusMsg("WhatsApp QR Code created & saved!");
      loadData(false);
    }
  };

  const triggerPos = { x: 75, y: 145 };

  return (
    <div
      className="min-h-screen bg-[#f4f7f9] text-slate-800 flex flex-col select-none"
      onMouseMove={(e) => {
        if (!draggingNodeId) return;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggingNodeId
              ? {
                  ...n,
                  posX: Math.max(40, n.posX + e.movementX),
                  posY: Math.max(40, n.posY + e.movementY),
                }
              : n
          )
        );
      }}
      onMouseUp={() => setDraggingNodeId(null)}
    >
      {/* Top Module Bar: ONLY 3 Modules (Chatbot Builder, Whatsapp Flows, QR Codes) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveModule("builder");
              setBuilderView("list");
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeModule === "builder"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Chatbot Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("flows")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeModule === "flows"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Whatsapp Flows
          </button>
          <button
            type="button"
            onClick={() => setActiveModule("qr")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              activeModule === "qr"
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            QR Codes
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeModule === "builder" && builderView === "canvas" && (
            <>
              <button
                type="button"
                onClick={() => setBuilderView("list")}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                ← All Flows
              </button>
              <select
                value={botMode}
                onChange={(e) => setBotMode(e.target.value as "CHAT_FLOW" | "AI_CHATBOT")}
                className="border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50"
              >
                <option value="CHAT_FLOW">Chat Flow</option>
                <option value="AI_CHATBOT">AI Chatbot</option>
              </select>
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
                  setPreviewCurrentNodeKey(null);
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
            </>
          )}

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
          <button onClick={() => setStatusMsg("")} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* MODULE 1: CHATBOT BUILDER */}
      {activeModule === "builder" && builderView === "list" && (
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* 3 Feature Summary Cards (No WhatsApp Widget) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm">
              <div className="font-bold text-sm text-slate-900">Chatbot Builder</div>
              <p className="text-xs text-slate-500 mt-1">
                Create multi-branch chat flows, buttons, lists, external APIs, and AI chatbots.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule("flows")}
              className="text-left bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-4 shadow-sm cursor-pointer"
            >
              <div className="font-bold text-sm text-slate-900">Whatsapp Flows</div>
              <p className="text-xs text-slate-500 mt-1">
                Design and control WhatsApp Flows ({flows.length} synced).
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule("qr")}
              className="text-left bg-white rounded-2xl border border-slate-200 hover:border-purple-400 p-4 shadow-sm cursor-pointer"
            >
              <div className="font-bold text-sm text-slate-900">QR Codes</div>
              <p className="text-xs text-slate-500 mt-1">
                Design and control WhatsApp QR codes ({qrCodes.length} active).
              </p>
            </button>
          </div>

          {/* Chatbot Flows Header + "+ Add Chatbot Flow" */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">WhatsApp Chatbot Flows</h1>
              <p className="text-xs text-slate-500">
                Create a chatbot flow and open its visual builder to configure triggers, options, APIs, and branches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddFlowModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              + Add Chatbot Flow
            </button>
          </div>

          {/* Saved Chatbot Flow Cards */}
          {chatbots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
              <div className="text-sm font-bold text-slate-800">No Chatbot Flow Created Yet</div>
              <p className="text-xs text-slate-500">
                Click &ldquo;+ Add Chatbot Flow&rdquo; to create your first bot flow.
              </p>
              <button
                type="button"
                onClick={() => setAddFlowModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                + Add Chatbot Flow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatbots.map((bot) => (
                <div
                  key={bot.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{bot.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          bot.isPublished
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bot.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Channel: <span className="font-semibold text-slate-700">{bot.channelNumber || "Default"}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Mode: <span className="font-semibold text-indigo-700">{bot.mode || "CHAT_FLOW"}</span> • Nodes:{" "}
                      <span className="font-semibold text-slate-700">{bot.nodes?.length || 0}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Keywords: <span className="font-mono text-slate-700">{bot.keywords || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        hydrateBotIntoState(bot);
                        setBuilderView("canvas");
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Open Flow Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBot(bot.id)}
                      className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODULE 1B: VISUAL FLOW BUILDER / AI CHATBOT CANVAS */}
      {activeModule === "builder" && builderView === "canvas" && (
        <div className="relative flex-1 flex overflow-hidden">
          {/* Flow Name & Channel Strip */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none w-36"
            />
            <span className="text-[11px] text-slate-400">|</span>
            <input
              value={channelNumber}
              onChange={(e) => setChannelNumber(e.target.value)}
              className="text-[11px] text-slate-600 bg-transparent outline-none w-28"
            />
          </div>

          {botMode === "AI_CHATBOT" ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-indigo-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-indigo-950">AI Chatbot Configuration</h2>
                    <p className="text-xs text-slate-500">
                      Configure provider, model, API key, trigger keywords, and system instructions.
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
                  <label className="block font-semibold text-slate-600 mb-1">Customer AI API Key</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-... or AIza..."
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
                  Save & Publish AI Chatbot
                </button>
              </div>
            </div>
          ) : (
            /* VISUAL FLOW CANVAS */
            <div className="relative flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] min-h-[640px]">
              <div
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                className="relative w-[1700px] h-[950px]"
              >
                {/* SVG Connection Lines (Parent + Option Branches) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {nodes.map((n) => {
                    const from =
                      n.parentKey && n.parentKey !== "start_trigger"
                        ? (() => {
                            const p = nodes.find(
                              (x) => x.nodeKey === n.parentKey || x.id === n.parentKey
                            );
                            return p
                              ? { x: p.posX + 200, y: p.posY + 32 }
                              : { x: triggerPos.x + 210, y: triggerPos.y + 45 };
                          })()
                        : { x: triggerPos.x + 210, y: triggerPos.y + 45 };
                    const to = { x: n.posX, y: n.posY + 32 };
                    const midX = (from.x + to.x) / 2;
                    return (
                      <path
                        key={`edge_${n.id}`}
                        d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.6"
                        strokeDasharray={n.parentKey === "start_trigger" ? "4 4" : undefined}
                      />
                    );
                  })}

                  {/* Option-level Branch Lines */}
                  {nodes.map((sourceNode) => {
                    const opts = getNodeOptions(sourceNode);
                    return opts.map((opt, idx) => {
                      if (!opt.nextNodeKey) return null;
                      const target = nodes.find((t) => t.nodeKey === opt.nextNodeKey);
                      if (!target) return null;
                      const from = { x: sourceNode.posX + 200, y: sourceNode.posY + 42 + idx * 14 };
                      const to = { x: target.posX, y: target.posY + 32 };
                      const midX = (from.x + to.x) / 2;
                      return (
                        <path
                          key={`branch_${sourceNode.id}_${idx}`}
                          d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.8"
                        />
                      );
                    });
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
                  const opts = getNodeOptions(node);
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
                      className={`absolute w-52 bg-white rounded-xl border p-3 shadow-sm cursor-grab active:cursor-grabbing transition ${
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
                      {opts.length > 0 && (
                        <div className="mt-2 space-y-1 border-t pt-1.5">
                          {opts.map((opt, idx) => (
                            <div
                              key={opt.id || idx}
                              className="text-[10px] bg-slate-50 border rounded px-1.5 py-0.5 flex items-center justify-between gap-1"
                            >
                              <span className="truncate font-medium text-slate-700">
                                {opt.label || `Option ${idx + 1}`}
                              </span>
                              <span className="text-emerald-700 font-mono truncate">
                                → {opt.nextNodeKey || "end"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* NODE SELECTOR MENU */}
              {paletteOpenForParent && (
                <div className="fixed right-4 top-28 z-40 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 max-h-[75vh] overflow-y-auto space-y-0.5">
                  <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
                    <span className="text-[11px] font-bold text-slate-700">Select Node Type</span>
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

              {/* BOTTOM-LEFT CANVAS CONTROLS */}
              <div className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm text-xs">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer font-bold"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setShowMinimap((m) => !m)}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={handleAutoLayout}
                  className="px-2 py-1 hover:bg-slate-100 rounded cursor-pointer text-[11px] font-semibold"
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

          {/* RIGHT-SIDE CONFIGURATION DRAWER */}
          {selectedNode && botMode === "CHAT_FLOW" && (
            <div className="w-[400px] bg-white border-l border-slate-200 shadow-xl flex flex-col z-30 max-h-[calc(100vh-52px)]">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedNode.title}</h3>
                  <div className="text-[10px] font-mono text-slate-400">{selectedNode.nodeKey}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Node Title</label>
                    <input
                      value={selectedNode.title}
                      onChange={(e) => updateSelectedNode({ title: e.target.value })}
                      className="w-full border rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Node Key</label>
                    <input
                      value={selectedNode.nodeKey}
                      onChange={(e) => updateSelectedNode({ nodeKey: e.target.value })}
                      className="w-full border rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>

                {/* BODY / MESSAGE TEXT */}
                {selectedNode.messageType !== "DELAY" &&
                  selectedNode.messageType !== "SEND_CAROUSEL_MESSAGE" && (
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Message Body (supports {"{{lastInput}}"}, {"{{customerPhone}}"}, {"{{api_reply}}"})
                      </label>
                      <textarea
                        rows={3}
                        value={selectedNode.bodyText}
                        onChange={(e) => updateSelectedNode({ bodyText: e.target.value })}
                        placeholder="e.g. Thanks for showing interest with us!"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  )}

                {/* MULTI-OPTION BRANCHING FOR BUTTONS & LISTS */}
                {(selectedNode.messageType === "QUESTION_BUTTON_MESSAGE" ||
                  selectedNode.messageType === "ACTION_BUTTON" ||
                  selectedNode.messageType === "MULTI_LIST" ||
                  selectedNode.messageType === "DYNAMIC_LIST") && (() => {
                  const opts: BranchOption[] = getNodeOptions(selectedNode);
                  const maxOpts =
                    selectedNode.messageType === "QUESTION_BUTTON_MESSAGE" ||
                    selectedNode.messageType === "ACTION_BUTTON"
                      ? 3
                      : 10;

                  return (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">
                          Options & Next Node Branching ({opts.length}/{maxOpts})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (opts.length >= maxOpts) return;
                            const nextOpts = [
                              ...opts,
                              {
                                id: `opt_${Date.now()}_${opts.length + 1}`,
                                label: `Option ${opts.length + 1}`,
                                description: "",
                                nextNodeKey: "",
                              },
                            ];
                            updateSelectedConfig({ options: nextOpts });
                          }}
                          className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>

                      {opts.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className="border rounded-xl p-2.5 bg-slate-50 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[11px] text-slate-700">
                              Option #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextOpts = opts.filter((_, i) => i !== idx);
                                updateSelectedConfig({ options: nextOpts });
                              }}
                              className="text-red-600 font-bold text-[11px] cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            value={opt.label || ""}
                            onChange={(e) => {
                              const nextOpts = [...opts];
                              nextOpts[idx] = { ...opt, label: e.target.value };
                              updateSelectedConfig({ options: nextOpts });
                            }}
                            placeholder="Button / List Label"
                            className="w-full border rounded-lg px-2 py-1 bg-white"
                          />

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                              Next Node on Selection
                            </label>
                            <select
                              value={opt.nextNodeKey || ""}
                              onChange={(e) => {
                                const nextOpts = [...opts];
                                nextOpts[idx] = { ...opt, nextNodeKey: e.target.value };
                                updateSelectedConfig({ options: nextOpts });
                              }}
                              className="w-full border rounded-lg px-2 py-1 bg-white"
                            >
                              <option value="">-- Stay / End Branch --</option>
                              {nodes
                                .filter((n) => n.nodeKey !== selectedNode.nodeKey)
                                .map((n) => (
                                  <option key={n.id} value={n.nodeKey}>
                                    {n.title} ({n.nodeKey})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* EXTERNAL API / WEBHOOK CONFIG DRAWER */}
                {selectedNode.messageType === "WEBHOOK_CONFIG" && (
                  <div className="space-y-2.5 border-t pt-3">
                    <div className="font-bold text-slate-800">Customer API / Webhook Settings</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block font-semibold text-slate-600 mb-1">API URL</label>
                        <input
                          value={selectedNode.config.webhookUrl || ""}
                          onChange={(e) => updateSelectedConfig({ webhookUrl: e.target.value })}
                          placeholder="https://api.yourcrm.com/lead"
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Method</label>
                        <select
                          value={selectedNode.config.method || "POST"}
                          onChange={(e) => updateSelectedConfig({ method: e.target.value })}
                          className="w-full border rounded-lg px-2 py-1.5 bg-white"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Auth Header</label>
                        <input
                          value={selectedNode.config.apiHeaderName || "Authorization"}
                          onChange={(e) => updateSelectedConfig({ apiHeaderName: e.target.value })}
                          placeholder="Authorization or x-api-key"
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">API Key / Token</label>
                        <input
                          type="password"
                          value={selectedNode.config.apiKey || ""}
                          onChange={(e) => updateSelectedConfig({ apiKey: e.target.value })}
                          placeholder="Bearer ..."
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">
                        Request Body Template
                      </label>
                      <textarea
                        rows={2}
                        value={selectedNode.config.bodyTemplate || ""}
                        onChange={(e) => updateSelectedConfig({ bodyTemplate: e.target.value })}
                        placeholder='{"phone":"{{customerPhone}}","input":"{{lastInput}}"}'
                        className="w-full border rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Save Response Variable
                        </label>
                        <input
                          value={selectedNode.config.responseVar || ""}
                          onChange={(e) => updateSelectedConfig({ responseVar: e.target.value })}
                          placeholder="api_reply"
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          JSON Field Path
                        </label>
                        <input
                          value={selectedNode.config.responsePath || ""}
                          onChange={(e) => updateSelectedConfig({ responsePath: e.target.value })}
                          placeholder="data.message"
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          On Success → Next Node
                        </label>
                        <select
                          value={selectedNode.config.nextNodeKey || ""}
                          onChange={(e) => updateSelectedConfig({ nextNodeKey: e.target.value })}
                          className="w-full border rounded-lg px-2 py-1.5 bg-white"
                        >
                          <option value="">-- Default --</option>
                          {nodes
                            .filter((n) => n.nodeKey !== selectedNode.nodeKey)
                            .map((n) => (
                              <option key={n.id} value={n.nodeKey}>
                                {n.title} ({n.nodeKey})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          On Error → Next Node
                        </label>
                        <select
                          value={selectedNode.config.errorNextNodeKey || ""}
                          onChange={(e) =>
                            updateSelectedConfig({ errorNextNodeKey: e.target.value })
                          }
                          className="w-full border rounded-lg px-2 py-1.5 bg-white"
                        >
                          <option value="">-- Default --</option>
                          {nodes
                            .filter((n) => n.nodeKey !== selectedNode.nodeKey)
                            .map((n) => (
                              <option key={n.id} value={n.nodeKey}>
                                {n.title} ({n.nodeKey})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* AGENT NOTIFICATION DRAWER */}
                {selectedNode.messageType === "AGENT_NOTIFICATION" && (
                  <div className="space-y-2 border-t pt-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Provider Type</label>
                      <select
                        value={selectedNode.config.providerType || "SMTP"}
                        onChange={(e) => updateSelectedConfig({ providerType: e.target.value })}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="SMTP">Custom SMTP</option>
                        <option value="SENDGRID">SendGrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Recipient Email</label>
                      <input
                        value={selectedNode.config.toEmail || ""}
                        onChange={(e) => updateSelectedConfig({ toEmail: e.target.value })}
                        placeholder="agent@example.com"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Subject</label>
                      <input
                        value={selectedNode.config.subject || ""}
                        onChange={(e) => updateSelectedConfig({ subject: e.target.value })}
                        placeholder="New WhatsApp Lead"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* SEND FLOW MESSAGE DRAWER */}
                {selectedNode.messageType === "SEND_FLOW_MESSAGE" && (
                  <div className="space-y-2 border-t pt-3">
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
                      <label className="block font-semibold text-slate-600 mb-1">CTA Button Text</label>
                      <input
                        value={selectedNode.config.buttonText || ""}
                        onChange={(e) => updateSelectedConfig({ buttonText: e.target.value })}
                        placeholder="Open Form"
                        className="w-full border rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* DELAY DRAWER */}
                {selectedNode.messageType === "DELAY" && (
                  <div className="border-t pt-3">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Delay Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.config.delaySeconds ?? 3}
                      onChange={(e) =>
                        updateSelectedConfig({ delaySeconds: Number(e.target.value) })
                      }
                      className="w-full border rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                )}

                {/* SEND CAROUSEL MESSAGE DRAWER (Min 2 Cards Validation) */}
                {selectedNode.messageType === "SEND_CAROUSEL_MESSAGE" && (() => {
                  const cards: any[] = Array.isArray(selectedNode.config.cards)
                    ? selectedNode.config.cards
                    : [...DEFAULT_CAROUSEL_CARDS];
                  const activeCard = cards[carouselCardIdx] || cards[0];

                  return (
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">
                          Carousel Cards: Min 2 ({cards.length})
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
                              Delete Card
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
                            placeholder="Card description..."
                            className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* CATALOG MESSAGE DRAWER */}
                {selectedNode.messageType === "CATALOG_MESSAGE" && (
                  <div className="border-t pt-3">
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

                {/* DEFAULT LINEAR NEXT NODE FOR SIMPLE / NON-OPTION NODES */}
                {selectedNode.messageType !== "QUESTION_BUTTON_MESSAGE" &&
                  selectedNode.messageType !== "ACTION_BUTTON" &&
                  selectedNode.messageType !== "MULTI_LIST" &&
                  selectedNode.messageType !== "DYNAMIC_LIST" &&
                  selectedNode.messageType !== "WEBHOOK_CONFIG" && (
                    <div className="border-t pt-3">
                      <label className="block font-semibold text-slate-600 mb-1">
                        Next Node After This Step
                      </label>
                      <select
                        value={selectedNode.config.nextNodeKey || ""}
                        onChange={(e) => updateSelectedConfig({ nextNodeKey: e.target.value })}
                        className="w-full border rounded-lg px-2.5 py-1.5 bg-white"
                      >
                        <option value="">-- End / Auto Child --</option>
                        {nodes
                          .filter((n) => n.nodeKey !== selectedNode.nodeKey)
                          .map((n) => (
                            <option key={n.id} value={n.nodeKey}>
                              {n.title} ({n.nodeKey})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
              </div>

              <div className="p-3 border-t flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSaveFlow(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save Node
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 2: WHATSAPP FLOWS */}
      {activeModule === "flows" && (
        <div className="p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* MODULE 3: QR CODES */}
      {activeModule === "qr" && (
        <div className="p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateQr} className="bg-white rounded-2xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">Generate WhatsApp QR Code</h2>
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

      {/* "+ ADD CHATBOT FLOW" MODAL */}
      {addFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form
            onSubmit={handleCreateNewChatbotFlow}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b pb-2.5">
              <h2 className="font-bold text-base text-slate-900">Add Chatbot Flow</h2>
              <button
                type="button"
                onClick={() => setAddFlowModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Bot / Flow Name</label>
              <input
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                required
                placeholder="e.g. Lead & Support Bot"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Channel Number</label>
              <input
                value={newFlowChannel}
                onChange={(e) => setNewFlowChannel(e.target.value)}
                required
                placeholder="110.225.103.5"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Bot Mode</label>
              <select
                value={newFlowMode}
                onChange={(e) => setNewFlowMode(e.target.value as "CHAT_FLOW" | "AI_CHATBOT")}
                className="w-full border rounded-lg px-3 py-2 bg-white"
              >
                <option value="CHAT_FLOW">Chat Flow (Visual Nodes & Branches)</option>
                <option value="AI_CHATBOT">AI Chatbot (OpenAI / Gemini)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Trigger Keywords (comma separated)
              </label>
              <input
                value={newFlowKeywords}
                onChange={(e) => setNewFlowKeywords(e.target.value)}
                placeholder="hi, hello, interest"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddFlowModalOpen(false)}
                className="px-4 py-2 rounded-lg border text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Create & Open Builder
              </button>
            </div>
          </form>
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
                    setPreviewCurrentNodeKey(null);
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

            <div className="p-4 h-80 overflow-y-auto bg-[#efeae2] space-y-2 text-xs">
              <div className="bg-white rounded-xl p-3 max-w-xs shadow-sm space-y-1">
                <div className="font-bold text-slate-800">{botName}</div>
                <div className="text-slate-600">Keywords: {keywords}</div>
                <div className="text-slate-500">
                  Tip: Type a keyword or button label to test branches.
                </div>
              </div>

              {previewChat.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div
                    className={`p-2.5 rounded-xl max-w-[78%] ${
                      m.from === "user"
                        ? "ml-auto bg-[#d9fdd3] text-slate-900"
                        : "bg-white text-slate-800"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.from === "bot" && m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {m.options.map((opt, oIdx) => (
                        <button
                          key={opt.id || oIdx}
                          type="button"
                          onClick={() => setPreviewInput(opt.label || opt.id)}
                          className="px-2.5 py-1 rounded-full bg-white border border-emerald-600 text-emerald-700 font-semibold text-[11px] hover:bg-emerald-50 cursor-pointer"
                        >
                          {opt.label || `Option ${oIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handlePreviewSend} className="p-3 bg-white border-t flex gap-2">
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder="Type a keyword or option..."
                className="flex-1 border rounded-full px-4 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#00a884] text-white text-xs font-bold cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}