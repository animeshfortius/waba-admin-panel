"use client";

import { useState } from "react";

interface FlowComponent {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FlowScreen {
  id: string;
  title: string;
  nextScreenId?: string;
  components: FlowComponent[];
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "chatbot_flows" | "whatsapp_flows" | "qr_codes" | "form_builder">("overview");

  // Chatbot states
  const [showAddFlowModal, setShowAddFlowModal] = useState(false);
  const [flows, setFlows] = useState([
    { id: 1676, name: "Testing", channel: "15553945963", created: "10 Oct 2026", active: true, isLive: true }
  ]);
  const [botName, setBotName] = useState("");
  const [channelNumber, setChannelNumber] = useState("15553945963");

  // WhatsApp Flow states
  const [whatsappForms, setWhatsappForms] = useState<any[]>([
    { id: 1, name: "Lead Generation Flow", status: "Draft", channel: "15553945963" }
  ]);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [newFormName, setNewFormName] = useState("");

  // WhatsApp Form / Multi-Screen Builder States
  const [activeForm, setActiveForm] = useState<any>(null);
  const [screens, setScreens] = useState<FlowScreen[]>([
    {
      id: "SCREEN_1",
      title: "Personal Details",
      nextScreenId: "SCREEN_2",
      components: [
        { id: "comp_1", type: "text", label: "Full Name", placeholder: "Enter full name", required: true },
        { id: "comp_2", type: "text", label: "Phone Number", placeholder: "+91 9876543210", required: true },
      ]
    },
    {
      id: "SCREEN_2",
      title: "Service Selection",
      nextScreenId: "SUCCESS",
      components: [
        { id: "comp_3", type: "select", label: "Choose Requirement", required: true, options: ["WABA Onboarding", "Custom Chatbot", "API Integration"] },
        { id: "comp_4", type: "textarea", label: "Additional Remarks", placeholder: "Tell us more...", required: false }
      ]
    }
  ]);
  const [selectedScreenId, setSelectedScreenId] = useState<string>("SCREEN_1");
  const [selectedCompId, setSelectedCompId] = useState<string | null>("comp_1");
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreenTitle, setNewScreenTitle] = useState("");

  // QR CODE CREATOR STATES
  const [selectedWabaNumber, setSelectedWabaNumber] = useState("15553945963");
  const [qrName, setQrName] = useState("Storefront Contact QR");
  const [prefilledMessage, setPrefilledMessage] = useState("Hi, I want to inquire about your services.");
  const [showGenerateQrModal, setShowGenerateQrModal] = useState(false);
  const [qrCodesList, setQrCodesList] = useState([
    {
      id: 1,
      name: "Storefront Contact QR",
      number: "15553945963",
      message: "Hi, I want to inquire about your services.",
      created: "12 Oct 2026",
      clicks: 42,
    }
  ]);

  const currentScreen = screens.find((s) => s.id === selectedScreenId) || screens[0];
  const selectedComp = currentScreen?.components.find((c) => c.id === selectedCompId);

  const handleAddNewScreen = () => {
    if (!newScreenTitle) return alert("Please enter Screen Title!");
    const newScreenId = `SCREEN_${screens.length + 1}`;
    const newScreen: FlowScreen = { id: newScreenId, title: newScreenTitle, nextScreenId: "SUCCESS", components: [] };
    setScreens([...screens, newScreen]);
    setSelectedScreenId(newScreenId);
    setShowAddScreenModal(false);
    setNewScreenTitle("");
  };

  const addComponentToScreen = (type: FlowComponent["type"]) => {
    if (!currentScreen) return;
    const newComp: FlowComponent = {
      id: `comp_${Date.now()}`,
      type,
      label: type === "text" ? "Text Question" : type === "textarea" ? "Long Answer" : type === "select" ? "Dropdown Selection" : "Option Selection",
      placeholder: "Type placeholder here...",
      required: false,
      options: type === "select" || type === "radio" ? ["Option A", "Option B"] : undefined,
    };
    setScreens(
      screens.map((s) =>
        s.id === selectedScreenId ? { ...s, components: [...s.components, newComp] } : s
      )
    );
    setSelectedCompId(newComp.id);
  };

  const updateComponent = (field: string, value: any) => {
    if (!selectedCompId || !currentScreen) return;
    setScreens(
      screens.map((s) =>
        s.id === selectedScreenId
          ? {
              ...s,
              components: s.components.map((c) =>
                c.id === selectedCompId ? { ...c, [field]: value } : c
              ),
            }
          : s
      )
    );
  };

  const handleCreateQrCode = () => {
    if (!qrName || !selectedWabaNumber) return alert("Please fill QR Name & select WABA Number!");
    const newQr = {
      id: Date.now(),
      name: qrName,
      number: selectedWabaNumber,
      message: prefilledMessage,
      created: "12 Oct 2026",
      clicks: 0,
    };
    setQrCodesList([...qrCodesList, newQr]);
    setShowGenerateQrModal(false);
    setQrName("");
    alert("Official Meta WhatsApp QR Code generated successfully!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            WhatsApp Message › Automation {activeTab !== "overview" && `› ${activeTab === "chatbot_flows" ? "Chatbot Builder" : activeTab === "whatsapp_flows" ? "WhatsApp Flows" : activeTab === "form_builder" ? "Flow Multi-Screen Builder" : "QR Codes Creator"}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === "overview" && "Automation"}
            {activeTab === "chatbot_flows" && "WhatsApp Chatbot Flows"}
            {activeTab === "whatsapp_flows" && "WhatsApp Flows Manager"}
            {activeTab === "qr_codes" && "Official WhatsApp QR Codes Creator"}
            {activeTab === "form_builder" && `WhatsApp Flow Builder: ${activeForm?.name}`}
          </h1>
        </div>
        {activeTab !== "overview" && (
          <button
            onClick={() => setActiveTab(activeTab === "form_builder" ? "whatsapp_flows" : "overview")}
            className="text-xs border px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:bg-gray-50 flex items-center space-x-1"
          >
            <span>⬅</span>
            <span>Back</span>
          </button>
        )}
      </div>

      {/* 1. AUTOMATION OVERVIEW MENU */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automation Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              <div onClick={() => setActiveTab("chatbot_flows")} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer text-center space-y-3 group">
                <div className="text-4xl group-hover:scale-110 transition duration-200">🤖</div>
                <h3 className="font-bold text-sm text-gray-800">Chatbot Builder</h3>
                <p className="text-xs text-gray-400">Build chatbots to automate conversations.</p>
              </div>

              <div onClick={() => setActiveTab("whatsapp_flows")} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer text-center space-y-3 group">
                <div className="text-4xl group-hover:scale-110 transition duration-200">🔀</div>
                <h3 className="font-bold text-sm text-gray-800">WhatsApp Flows</h3>
                <p className="text-xs text-gray-400">Design and control WhatsApp Flows.</p>
              </div>

              <div onClick={() => setActiveTab("qr_codes")} className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer text-center space-y-3 group">
                <div className="text-4xl group-hover:scale-110 transition duration-200">📲</div>
                <h3 className="font-bold text-sm text-gray-800">QR Codes</h3>
                <p className="text-xs text-gray-400">Design and control WhatsApp QR Codes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHATBOT MANAGER */}
      {activeTab === "chatbot_flows" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <button onClick={() => setShowAddFlowModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition">
              + Add Chatbot Flow
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {flows.map((fl) => (
              <div key={fl.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-gray-800">{fl.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${fl.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {fl.active ? "ACTIVE 🟢" : "INACTIVE 🔴"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono">Channel: {fl.channel}</p>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xs text-gray-400 italic">Chatbot Engine (Video review pending)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. WHATSAPP FLOW MANAGER */}
      {activeTab === "whatsapp_flows" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <span className="text-xs font-bold text-gray-600">Total Flows: {whatsappForms.length}</span>
            <button onClick={() => alert("Retrieving Meta Flows from Graph API...")} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
              🔄 Retrieve Meta Flows
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              onClick={() => setShowNewFormModal(true)}
              className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition flex flex-col items-center justify-center space-y-2 min-h-[160px]"
            >
              <span className="text-2xl font-bold text-emerald-600">+</span>
              <span className="text-xs font-bold text-gray-700">New Form</span>
            </div>

            {whatsappForms.map((frm) => (
              <div key={frm.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-800">{frm.name}</h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">{frm.status}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <button
                    onClick={() => { setActiveForm(frm); setActiveTab("form_builder"); }}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    Edit Multi-Screen Flow ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MULTI-SCREEN WHATSAPP FLOW BUILDER */}
      {activeTab === "form_builder" && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flow Screens:</span>
              <div className="flex items-center space-x-2">
                {screens.map((scr, idx) => (
                  <button
                    key={scr.id}
                    onClick={() => {
                      setSelectedScreenId(scr.id);
                      setSelectedCompId(scr.components[0]?.id || null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      selectedScreenId === scr.id
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>📱 Screen {idx + 1}: {scr.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddScreenModal(true)}
              className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition whitespace-nowrap"
            >
              + Add New Screen
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-5">
              <h3 className="font-bold text-sm text-gray-800 border-b pb-2">➕ Add Components</h3>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => addComponentToScreen("text")} className="w-full text-left p-3 border rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 flex items-center space-x-2">
                  <span>🔤</span><span>Text Input</span>
                </button>
                <button onClick={() => addComponentToScreen("textarea")} className="w-full text-left p-3 border rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 flex items-center space-x-2">
                  <span>📝</span><span>Text Area</span>
                </button>
                <button onClick={() => addComponentToScreen("select")} className="w-full text-left p-3 border rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 flex items-center space-x-2">
                  <span>🔽</span><span>Dropdown Menu</span>
                </button>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setWhatsappForms(whatsappForms.map(f => f.id === activeForm.id ? { ...f, status: "Published" } : f));
                    alert("Flow JSON Schema Published to Meta Cloud API!");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                >
                  🚀 Publish Flow JSON to Meta
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-sm text-gray-800">Canvas: {currentScreen?.title}</h3>
                  <span className="text-xs text-gray-400 font-mono">ID: {currentScreen?.id}</span>
                </div>

                <div className="space-y-3">
                  {currentScreen?.components.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed rounded-xl">
                      No components added in {currentScreen?.title}. Click left options.
                    </div>
                  ) : (
                    currentScreen?.components.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedCompId(comp.id)}
                        className={`p-4 border rounded-xl transition cursor-pointer flex justify-between items-center ${
                          selectedCompId === comp.id ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-gray-800">{comp.label}</span>
                            {comp.required && <span className="text-red-500 font-bold text-xs">*</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 capitalize mt-0.5">Type: {comp.type}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedComp && (
                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-gray-800 border-b pb-2 uppercase tracking-wider">⚙️ Field Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-600 mb-1">Field Label</label>
                      <input
                        type="text"
                        value={selectedComp.label}
                        onChange={(e) => updateComponent("label", e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-600 mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={selectedComp.placeholder || ""}
                        onChange={(e) => updateComponent("placeholder", e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-xl w-full max-w-sm mx-auto text-white space-y-4">
                <div className="text-center text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                  📱 Live Mobile Flow Preview
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm">{activeForm?.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-bold">{currentScreen?.title}</p>
                  <div className="space-y-3">
                    {currentScreen?.components.map((comp) => (
                      <div key={comp.id} className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-200">{comp.label}</label>
                        <input type="text" readOnly placeholder={comp.placeholder} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-[11px] text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. OFFICIAL META QR CODES CREATOR */}
      {activeTab === "qr_codes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📲</span>
              <div>
                <h3 className="font-bold text-sm text-gray-800">WhatsApp Business QR Code Generator</h3>
                <p className="text-xs text-gray-400">Generate trackable Meta QR codes linked to your WABA phone numbers.</p>
              </div>
            </div>
            <button
              onClick={() => setShowGenerateQrModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition"
            >
              + Generate New QR Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {qrCodesList.map((qr) => (
              <div key={qr.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-center">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-bold text-sm text-gray-800">{qr.name}</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Meta Verified</span>
                </div>

                <div className="bg-gray-50 border-2 border-slate-200 p-4 rounded-xl inline-block shadow-inner mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/${qr.number}?text=${encodeURIComponent(qr.message)}`}
                    alt="WhatsApp QR Code"
                    className="w-36 h-36 mx-auto rounded-lg"
                  />
                </div>

                <div className="space-y-1 text-xs text-gray-500 text-left bg-gray-50 p-3 rounded-xl border">
                  <p><span className="font-bold text-gray-700">WABA Number:</span> +{qr.number}</p>
                  <p className="truncate"><span className="font-bold text-gray-700">Message:</span> "{qr.message}"</p>
                </div>

                <div className="pt-2 border-t">
                  <button
                    onClick={() => alert(`Downloading QR Code Image for ${qr.name}...`)}
                    className="w-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold px-3 py-2 rounded-lg hover:bg-emerald-100 text-xs"
                  >
                    ⬇️ Download PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW SCREEN */}
      {showAddScreenModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Add New Flow Screen</h3>
              <button onClick={() => setShowAddScreenModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Screen Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Address Details"
                  value={newScreenTitle}
                  onChange={(e) => setNewScreenTitle(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowAddScreenModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={handleAddNewScreen} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">Add Screen</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW FORM */}
      {showNewFormModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Create New WhatsApp Form</h3>
              <button onClick={() => setShowNewFormModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Form Name *</label>
                <input type="text" placeholder="e.g. Lead Generation Flow" value={newFormName} onChange={(e) => setNewFormName(e.target.value)} className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowNewFormModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={() => {
                if (!newFormName) return alert("Please enter Form Name!");
                const createdForm = { id: Date.now(), name: newFormName, status: "Draft", channel: "15553945963" };
                setWhatsappForms([...whatsappForms, createdForm]);
                setShowNewFormModal(false);
                setNewFormName("");
                setActiveForm(createdForm);
                setActiveTab("form_builder");
              }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">Create Form</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE META QR CODE */}
      {showGenerateQrModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-gray-800">Generate Meta WhatsApp QR Code</h3>
              <button onClick={() => setShowGenerateQrModal(false)} className="text-gray-400">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Select WABA Phone Number *</label>
                <select
                  value={selectedWabaNumber}
                  onChange={(e) => setSelectedWabaNumber(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none font-bold text-gray-800"
                >
                  <option value="15553945963">+1 (555) 394-5963</option>
                  <option value="919876543210">+91 9876543210</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">QR Title / Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Store Banner QR Code"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Pre-filled Customer Welcome Message *</label>
                <textarea
                  rows={3}
                  value={prefilledMessage}
                  onChange={(e) => setPrefilledMessage(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setShowGenerateQrModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={handleCreateQrCode} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">
                📲 Generate Meta QR Code
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}