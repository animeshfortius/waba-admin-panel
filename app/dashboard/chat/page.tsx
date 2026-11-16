"use client";

import { useState, useEffect, useRef, useMemo } from "react";

const CANNED_RESPONSES = [
  { shortcut: "/hello", text: "Namaste! Fortius Infocom Support mein aapka swagat hai. Bataiye main aapki kya sahayata kar sakta hoon?" },
  { shortcut: "/pricing", text: "Hamare WhatsApp Business API plans ₹999/month se shuru hote hain. Zero markup charges par Meta rates milenge." },
  { shortcut: "/docs", text: "Onboarding ke liye kripya apna GST Certificate, PAN Card, aur ek fresh mobile number (jispar WhatsApp na bana ho) share karein." },
  { shortcut: "/bank", text: "Account Name: Fortius Infocom Private Limited | A/C: 50200012345678 | IFSC: HDFC0001234" },
];

export default function LiveChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentAgent, setCurrentAgent] = useState<any>(null);

  const [tabFilter, setTabFilter] = useState<"ACTIVE" | "INACTIVE" | "HISTORY">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const [inputMode, setInputMode] = useState<"REPLY" | "NOTE">("REPLY");
  const [inputText, setInputText] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSessionRef = useRef(activeSession);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    // Check if logged in as an Agent
    const agentStr = localStorage.getItem("currentAgent");
    if (agentStr) {
      try {
        setCurrentAgent(JSON.parse(agentStr));
      } catch (e) {
        console.error(e);
      }
    }

    fetchSessions(true);
    fetchTemplates();
    const interval = setInterval(() => fetchSessions(false), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSession?.id) {
      fetchMessagesAndNotes(activeSession.id);
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
        let newSessions = data.sessions || [];

        // AGENT CHANNEL RESTRICTION FILTER
        const agentStr = localStorage.getItem("currentAgent");
        if (agentStr) {
          const agent = JSON.parse(agentStr);
          // If agent does not have allChannelAccess, filter chats by their assigned channel or ID
          if (agent.allChannelAccess === false && agent.assignedChannelId) {
            newSessions = newSessions.filter((s: any) => 
              String(s.channel) === String(agent.assignedChannelId) || 
              String(s.assignedAgentId) === String(agent.id)
            );
          }
        }

        setSessions(newSessions);

        if (isInitial && !activeSession && newSessions.length > 0) {
          setActiveSession(newSessions[0]);
        } else if (activeSessionRef.current) {
          const currentId = activeSessionRef.current.id;
          const updatedCurrent = newSessions.find((s: any) => s.id === currentId);
          if (
            updatedCurrent &&
            (updatedCurrent.lastMessageAt !== activeSessionRef.current.lastMessageAt ||
              updatedCurrent.status !== activeSessionRef.current.status)
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

  const getProxiedMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("blob:")) return url;
    if (url.includes("graph.facebook.com")) {
      const parts = url.split("/");
      const mediaId = parts[parts.length - 1];
      if (mediaId && !isNaN(Number(mediaId))) {
        return `/api/media/${mediaId}`;
      }
    }
    return url;
  };

  const getSessionWindowStatus = (session: any) => {
    if (!session) return { isOpen: false, hoursLeft: 0 };
    
    const customerMessages = messages.filter((m) => m.senderType === "CUSTOMER");
    const lastCustomerMsg = customerMessages.length > 0 ? customerMessages[customerMessages.length - 1] : null;

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
      const isResolved = s.status === "RESOLVED";
      const isInactive = !isResolved && !getSessionWindowStatus(s).isOpen;
      const isActive = !isResolved && getSessionWindowStatus(s).isOpen;

      if (tabFilter === "ACTIVE" && !isActive) return false;
      if (tabFilter === "INACTIVE" && !isInactive) return false;
      if (tabFilter === "HISTORY" && !isResolved) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = s.customerName?.toLowerCase().includes(q);
        const matchPhone = s.customerPhone?.includes(q);
        if (!matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [sessions, tabFilter, searchQuery, messages]);

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
    if ((!finalBody.trim() && !selectedMedia) || !activeSession || sending) return;

    const localMedia = selectedMedia;
    const isImage = localMedia?.type.startsWith("image/");
    const isVideo = localMedia?.type.startsWith("video/");
    const localPreviewUrl = localMedia ? URL.createObjectURL(localMedia) : null;
    const senderDisplayName = currentAgent ? currentAgent.name : "Admin Agent";

    setSending(true);
    setShowSlashMenu(false);

    const optimisticMsg = {
      id: "temp-" + Date.now(),
      senderType: "AGENT",
      senderName: senderDisplayName,
      messageBody: localMedia ? `📎 [${isImage ? "IMAGE" : isVideo ? "VIDEO" : "DOCUMENT"}: ${localMedia.name}]${finalBody ? " - " + finalBody : ""}` : finalBody,
      messageType: localMedia ? (isImage ? "image" : isVideo ? "video" : "document") : customType,
      mediaUrl: localPreviewUrl,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSelectedMedia(null);

    try {
      const formData = new FormData();
      formData.append("action", inputMode === "NOTE" ? "NOTE" : "SEND");
      formData.append("sessionId", activeSession.id);
      formData.append("messageBody", finalBody);
      formData.append("messageType", localMedia ? "media" : customType);
      formData.append("agentName", senderDisplayName);

      if (localMedia) {
        formData.append("mediaFile", localMedia);
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        if (inputMode === "NOTE") {
          setNotes((prev) => [data.note, ...prev]);
        } else {
          const serverMsg = {
            ...data.message,
            mediaUrl: data.message.mediaUrl || (localMedia ? localPreviewUrl : null)
          };
          setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? serverMsg : m)));
          fetchSessions(false);
        }
      } else {
        alert("Failed to send: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
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

  return (
    <div className="w-full h-[calc(100vh-60px)] flex bg-gray-100 font-sans text-xs overflow-hidden m-0 p-0">
      
      {/* COLUMN 1: CONVERSATION LIST */}
      <div className="w-80 bg-white border-r flex flex-col shrink-0 h-full">
        <div className="p-3.5 border-b space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <span>💬</span> {currentAgent ? `${currentAgent.name}'s Chats` : "Live Chats"}
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {sessions.length} Total
            </span>
          </div>

          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-emerald-500"
          />

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl font-bold text-[10px]">
            {(["ACTIVE", "INACTIVE", "HISTORY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTabFilter(t)}
                className={`py-1.5 rounded-lg transition cursor-pointer text-center ${tabFilter === t ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
              >
                {t === "ACTIVE" ? "🟢 Active" : t === "INACTIVE" ? "⏰ Inactive" : "📂 History"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No chats found in this view.</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`p-3.5 cursor-pointer transition hover:bg-gray-50 flex items-start space-x-3 ${activeSession?.id === session.id ? "bg-emerald-50/80 border-l-4 border-emerald-600" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                  {session.customerName ? session.customerName[0].toUpperCase() : "C"}
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
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${session.status === "RESOLVED" ? "bg-gray-200 text-gray-650" : "bg-emerald-100 text-emerald-800"}`}>
                      {session.status === "RESOLVED" ? "Resolved" : "Open"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: ACTIVE CHAT WINDOW */}
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
                  onClick={() => handleSessionUpdate({ status: activeSession.status === "RESOLVED" ? "OPEN" : "RESOLVED" })}
                  className={`font-bold px-3 py-1.5 rounded-xl text-[11px] transition cursor-pointer ${activeSession.status === "RESOLVED" ? "bg-gray-200 text-gray-800" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  {activeSession.status === "RESOLVED" ? "↺ Reopen Chat" : "✓ Mark Resolved"}
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/40">
              {messages.map((msg) => {
                const isCustomer = msg.senderType === "CUSTOMER";
                const bodyStr = msg.messageBody || "";
                const isImg = msg.messageType === "image" || bodyStr.includes("[IMAGE:") || bodyStr.match(/\.(jpg|jpeg|png|webp|gif)/i);
                const isVid = msg.messageType === "video" || bodyStr.includes("[VIDEO:") || bodyStr.match(/\.(mp4|mov|webm)/i);
                const isDoc = msg.messageType === "document" || bodyStr.includes("[DOCUMENT:") || bodyStr.match(/\.(pdf|docx|xlsx|txt)/i);
                
                const proxiedUrl = getProxiedMediaUrl(msg.mediaUrl);

                return (
                  <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 shadow-xs text-xs space-y-1.5 ${
                        isCustomer
                          ? "bg-white text-gray-900 border rounded-bl-none"
                          : "bg-emerald-600 text-white rounded-br-none"
                      }`}
                    >
                      <div className={`text-[10px] font-bold ${isCustomer ? "text-emerald-700" : "text-white/80"}`}>
                        {isCustomer ? (activeSession.customerName || "Customer") : `👤 ${msg.senderName || "Agent"}`}
                      </div>

                      {proxiedUrl && isImg && (
                        <img src={proxiedUrl} alt="media" className="rounded-xl max-h-48 object-cover mt-1 border" />
                      )}

                      {proxiedUrl && isVid && (
                        <video controls className="rounded-xl max-h-48 w-full object-cover mt-1 border">
                          <source src={proxiedUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}

                      {(isDoc || bodyStr.includes("📎")) && !isImg && !isVid && (
                        <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isCustomer ? "bg-gray-50 border-gray-200 text-gray-800" : "bg-emerald-700/60 border-emerald-500 text-white"}`}>
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{bodyStr}</p>
                            <span className="text-[9px] opacity-80">Document File Attachment</span>
                          </div>
                        </div>
                      )}

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
              <div className="mx-4 mb-1 bg-white border rounded-2xl shadow-xl overflow-hidden z-25">
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
              {selectedMedia && (
                <div className="mb-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-emerald-900 text-xs">
                  <span className="truncate">📎 Attached File: <strong>{selectedMedia.name}</strong></span>
                  <button type="button" onClick={() => setSelectedMedia(null)} className="font-bold text-red-500 hover:text-red-700 ml-2 cursor-pointer">✕ Remove</button>
                </div>
              )}

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
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedMedia(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    📎 Attach Media / File
                  </button>

                  {/* Show Template button only if agent has permission OR if admin */}
                  {(!currentAgent || currentAgent.sendTemplate) && (
                    <button
                      type="button"
                      onClick={() => setShowTemplateModal(true)}
                      className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      📋 Send Template
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => handleSend(e, "text")} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={
                    inputMode === "NOTE"
                      ? "Write a private internal note for team members..."
                      : selectedMedia ? "Add a caption for file (optional)..." : "Type a message or '/' for canned responses..."
                  }
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none text-xs ${inputMode === "NOTE" ? "bg-white border-amber-300" : "bg-gray-50 focus:border-emerald-500"}`}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className={`font-bold px-6 py-3 rounded-xl shadow transition cursor-pointer text-white ${inputMode === "NOTE" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {sending ? "Sending..." : inputMode === "NOTE" ? "Save Note 📌" : "Send 🚀"}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <span className="text-4xl">💬</span>
            <p className="font-bold text-sm">Select a conversation from the left sidebar</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: CUSTOMER CRM & NOTES */}
      {activeSession && (
        <div className="w-80 bg-white border-l flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 h-full">
          <div className="text-center border-b pb-4 space-y-1.5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center mx-auto">
              {activeSession.customerName ? activeSession.customerName[0].toUpperCase() : "C"}
            </div>
            <h3 className="font-bold text-sm text-gray-900">{activeSession.customerName || "WhatsApp Customer"}</h3>
            <p className="font-mono text-gray-500">+{activeSession.customerPhone}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border">
            <div className="font-bold text-gray-700 border-b pb-1">Session Info</div>
            <div className="flex justify-between">
              <span className="text-gray-500">Channel:</span>
              <span className="font-mono font-bold">+{activeSession.channel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">24h Window:</span>
              <span className={`font-bold ${windowStatus.isOpen ? "text-emerald-600" : "text-red-600"}`}>
                {windowStatus.isOpen ? "ACTIVE" : "EXPIRED"}
              </span>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="font-bold text-gray-800">
              <span>📌 Internal Notes ({notes.length})</span>
            </div>
            {notes.length === 0 ? (
              <p className="text-gray-400 text-[11px] bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                No internal notes yet.
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-amber-900">
                      <span>{n.agentName}</span>
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
                <div className="p-4 text-center">
                  <button
                    onClick={(e) => {
                      handleSend(e, "template", "hello_world");
                      setShowTemplateModal(false);
                    }}
                    className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl cursor-pointer"
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