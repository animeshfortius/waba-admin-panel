"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const CANNED_RESPONSES = [
  { shortcut: "/hello", text: "Namaste! Fortius Infocom Support mein aapka swagat hai. Bataiye main aapki kya sahayata kar sakta hoon?" },
  { shortcut: "/pricing", text: "Hamare WhatsApp Business API plans ₹999/month se shuru hote hain. Zero markup charges par Meta rates milenge." },
  { shortcut: "/docs", text: "Onboarding ke liye kripya apna GST Certificate, PAN Card, aur ek fresh mobile number (jispar WhatsApp na bana ho) share karein." },
  { shortcut: "/bank", text: "Account Name: Fortius Infocom Private Limited | A/C: 50200012345678 | IFSC: HDFC0001234" },
];

export default function UltimateLiveChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Filters & Search
  const [tabFilter, setTabFilter] = useState<"ALL" | "OPEN" | "BOT" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Input & Modes
  const [inputMode, setInputMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [inputText, setInputText] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef(activeSession);

  // Keep ref updated to avoid stale closures inside intervals
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    fetchSessions(true);
    fetchTemplates();
    const interval = setInterval(() => fetchSessions(false), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSession?.id) {
      fetchMessagesAndNotes(activeSession.id);
      setAiSummary("");
      const interval = setInterval(() => {
        if (activeSessionRef.current?.id) {
          fetchMessagesAndNotes(activeSessionRef.current.id);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async (isInitial = false) => {
    try {
      const userId = localStorage.getItem("userId") || "admin";
      const res = await fetch(`/api/chat/sessions?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const newSessions = data.sessions || [];
        setSessions(newSessions);

        if (isInitial && !activeSession && newSessions.length > 0) {
          setActiveSession(newSessions[0]);
        } else if (activeSessionRef.current) {
          const currentId = activeSessionRef.current.id;
          const updatedCurrent = newSessions.find((s: any) => s.id === currentId);
          // Only update if metadata actually changed to prevent infinite loops
          if (
            updatedCurrent &&
            (updatedCurrent.lastMessageAt !== activeSessionRef.current.lastMessageAt ||
              updatedCurrent.status !== activeSessionRef.current.status ||
              updatedCurrent.isBotActive !== activeSessionRef.current.isBotActive)
          ) {
            setActiveSession(updatedCurrent);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchMessagesAndNotes = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (e) {}
  };

  const getSessionWindowStatus = (session: any) => {
    if (!session) return { isOpen: false, hoursLeft: 0 };
    const lastCustomerMsg = [...messages].reverse().find((m) => m.senderType === "CUSTOMER");
    const refTime = lastCustomerMsg ? new Date(lastCustomerMsg.createdAt).getTime() : new Date(session.lastMessageAt).getTime();
    const diffHours = (Date.now() - refTime) / (1000 * 60 * 60);
    const remaining = Math.max(0, 24 - diffHours);
    return {
      isOpen: remaining > 0,
      hoursLeft: remaining.toFixed(1),
    };
  };

  const windowStatus = useMemo(() => getSessionWindowStatus(activeSession), [activeSession, messages]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (tabFilter === "OPEN" && s.status !== "OPEN") return false;
      if (tabFilter === "BOT" && !s.isBotActive) return false;
      if (tabFilter === "RESOLVED" && s.status !== "RESOLVED") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = s.customerName?.toLowerCase().includes(q);
        const matchPhone = s.customerPhone?.includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [sessions, tabFilter, searchQuery]);

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (val.startsWith("/") && inputMode === "REPLY") {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSend = async (e: React.FormEvent, customType = "text", customText?: string) => {
    e.preventDefault();
    const finalBody = customText || inputText;
    if (!finalBody.trim() || !activeSession) return;

    setInputText("");
    setShowSlashMenu(false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: inputMode === "NOTE" ? "NOTE" : "SEND",
          sessionId: activeSession.id,
          messageBody: finalBody,
          messageType: customType,
          agentName: "Admin Agent",
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (inputMode === "NOTE") {
          setNotes((prev) => [data.note, ...prev]);
        } else {
          setMessages((prev) => [...prev, data.message]);
          fetchSessions(false);
        }
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleSessionUpdate = async (updates: any) => {
    if (!activeSession) return;
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        fetchSessions(false);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleAiAssist = async (assistType: "SUMMARY" | "SUGGEST") => {
    if (!activeSession) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AI_ASSIST",
          sessionId: activeSession.id,
          assistType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (assistType === "SUMMARY") {
          setAiSummary(data.aiOutput);
        } else {
          setInputMode("REPLY");
          setInputText(data.aiOutput);
        }
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] flex bg-gray-100 font-sans text-xs overflow-hidden m-0 p-0">
      
      {/* COLUMN 1: LEFT CONVERSATION INBOX */}
      <div className="w-80 bg-white border-r flex flex-col shrink-0 h-full">
        <div className="p-3.5 border-b space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <span>💬</span> Team Inbox
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {sessions.length} Chats
            </span>
          </div>

          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
          />

          <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl font-bold text-[10px]">
            {(["ALL", "OPEN", "BOT", "RESOLVED"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTabFilter(t)}
                className={`py-1.5 rounded-lg transition cursor-pointer ${tabFilter === t ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No conversations in this tab.</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`p-3.5 cursor-pointer transition hover:bg-gray-50 flex items-start space-x-3 ${activeSession?.id === session.id ? "bg-emerald-50/80 border-l-4 border-emerald-600" : ""}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                    {session.customerName ? session.customerName[0].toUpperCase() : "C"}
                  </div>
                  <span
                    title={session.isBotActive ? "AI Bot Active" : "Human Agent Handling"}
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] ${session.isBotActive ? "bg-indigo-600 text-white" : "bg-emerald-500"}`}
                  >
                    {session.isBotActive ? "🤖" : ""}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-gray-900 truncate">
                      {session.customerName || `+${session.customerPhone}`}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(session.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-gray-500 truncate text-[11px]">{session.lastMessage || "No messages yet"}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${session.status === "RESOLVED" ? "bg-gray-200 text-gray-600" : "bg-emerald-100 text-emerald-800"}`}>
                      {session.status}
                    </span>
                    {session.assignedTo && (
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                        👤 {session.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: CENTER ACTIVE CHAT + AI COPILOT */}
      <div className="flex-1 flex flex-col bg-white min-w-0 relative h-full">
        {activeSession ? (
          <>
            <div className="p-3.5 border-b flex flex-wrap justify-between items-center gap-2 bg-white shadow-xs z-10">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-gray-900">
                      {activeSession.customerName || `+${activeSession.customerPhone}`}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${windowStatus.isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      <span>⏱️</span>
                      {windowStatus.isOpen ? `24h Window: ${windowStatus.hoursLeft}h left` : "Window Expired (Template Only)"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] font-mono">
                    Customer: +{activeSession.customerPhone} | Channel: +{activeSession.channel}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAiAssist("SUMMARY")}
                  disabled={aiLoading}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer"
                >
                  ✨ AI Summary
                </button>

                <button
                  onClick={() => handleSessionUpdate({ isBotActive: !activeSession.isBotActive })}
                  className={`font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${activeSession.isBotActive ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"}`}
                >
                  {activeSession.isBotActive ? "🤖 Bot Active (Click to Intervene)" : "👤 Human Mode (Resume Bot)"}
                </button>

                <button
                  onClick={() => handleSessionUpdate({ status: activeSession.status === "RESOLVED" ? "OPEN" : "RESOLVED" })}
                  className={`font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${activeSession.status === "RESOLVED" ? "bg-gray-200 text-gray-800" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  {activeSession.status === "RESOLVED" ? "↺ Reopen" : "✓ Resolve"}
                </button>
              </div>
            </div>

            {aiSummary && (
              <div className="bg-purple-50 border-b border-purple-200 px-4 py-2.5 flex justify-between items-center text-purple-900 text-xs">
                <span>{aiSummary}</span>
                <button onClick={() => setAiSummary("")} className="font-bold text-purple-500 hover:text-purple-800 cursor-pointer">✕</button>
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/40">
              {messages.map((msg) => {
                const isCustomer = msg.senderType === "CUSTOMER";
                const isBot = msg.senderType === "BOT" || msg.senderType === "AI";
                return (
                  <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 shadow-xs text-xs space-y-1 ${
                        isCustomer
                          ? "bg-white text-gray-900 border rounded-bl-none"
                          : isBot
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-emerald-600 text-white rounded-br-none"
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${isCustomer ? "text-emerald-700" : "text-white/80"}`}>
                        {isCustomer ? (activeSession.customerName || "Customer") : isBot ? "🤖 AI Auto-Responder" : `👤 ${msg.senderName || "Agent"}`}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.messageBody}</p>
                      <div className={`text-[9px] text-right font-mono ${isCustomer ? "text-gray-400" : "text-white/80"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {!isCustomer && " ✓✓"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {showSlashMenu && (
              <div className="mx-4 mb-1 bg-white border rounded-2xl shadow-xl overflow-hidden z-20">
                <div className="bg-gray-50 px-3 py-1.5 font-bold text-[10px] text-gray-500 border-b">
                  ⚡ Quick Canned Responses (Click to insert)
                </div>
                {CANNED_RESPONSES.filter((c) => c.shortcut.includes(inputText.toLowerCase())).map((item) => (
                  <div
                    key={item.shortcut}
                    onClick={() => {
                      setInputText(item.text);
                      setShowSlashMenu(false);
                    }}
                    className="p-2.5 hover:bg-emerald-50 cursor-pointer border-b last:border-b-0 flex flex-col"
                  >
                    <span className="font-bold text-emerald-700 font-mono">{item.shortcut}</span>
                    <span className="text-gray-600 truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={`border-t p-3 ${inputMode === "NOTE" ? "bg-amber-50/70" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setInputMode("REPLY")}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${inputMode === "REPLY" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  >
                    💬 Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("NOTE")}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${inputMode === "NOTE" ? "bg-amber-500 text-white" : "text-gray-600 hover:bg-amber-100"}`}
                  >
                    🔒 Internal Whisper Note
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAiAssist("SUGGEST")}
                    disabled={aiLoading}
                    className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    🪄 AI Suggest Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(true)}
                    className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    📋 Send Template
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => handleSend(e, "text")} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={
                    inputMode === "NOTE"
                      ? "Write a private internal note for team members..."
                      : "Type a message or type '/' for quick canned responses..."
                  }
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none text-xs ${inputMode === "NOTE" ? "bg-white border-amber-300" : "bg-gray-50 focus:border-emerald-500"}`}
                />
                <button
                  type="submit"
                  className={`font-bold px-6 py-3 rounded-xl shadow transition cursor-pointer text-white ${inputMode === "NOTE" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {inputMode === "NOTE" ? "Save Note 📌" : "Send 🚀"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <span className="text-4xl">💬</span>
            <p className="font-bold text-sm">Select a conversation from the left sidebar to open Live Agent Workspace</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: RIGHT CUSTOMER CRM & INTERNAL NOTES */}
      {activeSession && (
        <div className="w-80 bg-white border-l flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 h-full">
          <div className="text-center border-b pb-4 space-y-1.5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center mx-auto">
              {activeSession.customerName ? activeSession.customerName[0].toUpperCase() : "C"}
            </div>
            <h3 className="font-bold text-sm text-gray-900">{activeSession.customerName || "WhatsApp Customer"}</h3>
            <p className="font-mono text-gray-500">+{activeSession.customerPhone}</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-600 block">Assign Conversation To</label>
            <select
              value={activeSession.assignedTo || ""}
              onChange={(e) => handleSessionUpdate({ assignedTo: e.target.value })}
              className="w-full border rounded-xl p-2.5 bg-gray-50 font-bold text-gray-800 focus:outline-none"
            >
              <option value="">Unassigned (Queue)</option>
              <option value="Admin">Admin (Fortius)</option>
              <option value="Sales Team">Sales Team</option>
              <option value="Support Desk">Support Desk</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border">
            <div className="font-bold text-gray-700 border-b pb-1">Session Metadata</div>
            <div className="flex justify-between">
              <span className="text-gray-500">WABA Channel:</span>
              <span className="font-mono font-bold">+{activeSession.channel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">AI Auto-Bot:</span>
              <span className={`font-bold ${activeSession.isBotActive ? "text-indigo-600" : "text-gray-500"}`}>
                {activeSession.isBotActive ? "ON" : "PAUSED"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">24h Session:</span>
              <span className={`font-bold ${windowStatus.isOpen ? "text-emerald-600" : "text-red-600"}`}>
                {windowStatus.isOpen ? "ACTIVE" : "EXPIRED"}
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="font-bold text-gray-800 flex items-center justify-between">
              <span>📌 Internal Whisper Notes ({notes.length})</span>
            </div>
            {notes.length === 0 ? (
              <p className="text-gray-400 text-[11px] bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                No internal notes yet. Switch to "Internal Whisper Note" below to add private team notes.
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-amber-900">
                      <span>{n.agentName}</span>
                      <span className="font-mono font-normal">
                        {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <p className="text-gray-800 leading-snug">{n.noteBody}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-gray-800">📋 Send Approved WhatsApp Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="font-bold text-gray-400 hover:text-black cursor-pointer">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y">
              {templates.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No synced templates found. Default template: <strong>hello_world</strong>
                  <button
                    onClick={(e) => {
                      handleSend(e, "template", "hello_world");
                      setShowTemplateModal(false);
                    }}
                    className="mt-3 w-full bg-emerald-600 text-white font-bold py-2 rounded-xl cursor-pointer"
                  >
                    Send "hello_world" Template
                  </button>
                </div>
              ) : (
                templates.map((tpl: any, idx: number) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{tpl.name}</div>
                      <div className="text-[10px] text-gray-400">{tpl.category} | {tpl.language}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        handleSend(e, "template", tpl.name);
                        setShowTemplateModal(false);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Send
                    </button>
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