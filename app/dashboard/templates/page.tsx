"use client";

import { useState } from "react";

export default function TemplatesPage() {
  const [activeView, setActiveView] = useState<"list" | "library" | "create">("list");
  const [selectedCategory, setSelectedCategory] = useState<"utility" | "auth">("utility");

  // Template Form States
  const [templateName, setTemplateName] = useState("");
  const [templateLang, setTemplateLang] = useState("English");
  const [templateCategory, setTemplateCategory] = useState("Utility");
  const [templateBody, setTemplateBody] = useState("");

  // Payload Modal State
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState("");

  // Sample User Templates matching your exact panel
  const [templates, setTemplates] = useState([
    {
      id: "175871377186411",
      name: "otp_test",
      lang: "English",
      text: "{{1}} is your verification code. For your security...",
      category: "Authentication",
      status: "Approved",
      created: "08 Oct 2026 12:05 PM",
      payload: `{\n  "messaging_product": "whatsapp",\n  "recipient_type": "individual",\n  "to": "{to}",\n  "type": "template",\n  "template": {\n    "name": "otp_test",\n    "language": {\n      "code": "en"\n    }\n  }\n}`
    },
    {
      id: "1764976244783568",
      name: "feedback_collection",
      lang: "English",
      text: "Hi {{1}}, the service request we completed on i...",
      category: "Utility",
      status: "Approved",
      created: "08 Oct 2026 12:04 PM",
      payload: `{\n  "messaging_product": "whatsapp",\n  "recipient_type": "individual",\n  "to": "{to}",\n  "type": "template",\n  "template": {\n    "name": "feedback_collection",\n    "language": {\n      "code": "en"\n    }\n  }\n}`
    },
  ]);

  // Pre-built Meta Template Library Cards Data
  const libraryTemplates = [
    {
      id: "lib1",
      name: "verify_code_1",
      category: "auth",
      subcategory: "Identity verification",
      body: "{{1}} is your verification code.",
      actionText: "Copy code",
    },
    {
      id: "lib2",
      name: "verify_password_recovery",
      category: "auth",
      subcategory: "In-person verification",
      body: "{{1}} is your password recovery code. If you have any concerns or questions, contact us at {{2}}.",
      actionText: "Copy code",
    },
    {
      id: "lib3",
      name: "order_confirmation",
      category: "utility",
      subcategory: "Order updates",
      body: "Hi {{1}}, your order {{2}} has been confirmed!",
      actionText: "Use Template",
    },
  ];

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !templateBody.trim()) {
      alert("Please fill template name and body text!");
      return;
    }

    const newTpl = {
      id: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      name: templateName,
      lang: templateLang,
      text: templateBody,
      category: templateCategory,
      status: "Pending",
      created: "12 Oct 2026 1:02 PM",
      payload: `{\n  "messaging_product": "whatsapp",\n  "template": {\n    "name": "${templateName}"\n  }\n}`
    };

    setTemplates([newTpl, ...templates]);
    setTemplateName("");
    setTemplateBody("");
    setActiveView("list");
    alert("Template created successfully!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Top Header & Breadcrumbs */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Dashboard › WhatsApp Templates {activeView === "library" && "› Meta Template Library"} {activeView === "create" && "› Create New Template"}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeView === "list" && "WhatsApp Templates"}
            {activeView === "library" && "Meta Pre-approved Template Library"}
            {activeView === "create" && "Create WhatsApp Template"}
          </h1>
        </div>

        {activeView !== "list" && (
          <button
            onClick={() => setActiveView("list")}
            className="border px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            ⬅ Back to Templates
          </button>
        )}
      </div>

      {/* Action Bar matching screenshot */}
      {activeView === "list" && (
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setActiveView("create")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>Create New Template</span>
            </button>

            <button
              onClick={() => alert("Retrieving Templates from Meta API...")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow"
            >
              🔄 Retrieve Meta Templates
            </button>

            <button
              onClick={() => alert("Downloading Templates CSV/Excel...")}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
            >
              📥 Download Templates
            </button>

            <button
              onClick={() => setActiveView("library")}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center space-x-1.5"
            >
              <span>📚</span>
              <span>Template Library</span>
            </button>
          </div>

          <div className="text-xs text-gray-400 font-medium">Last 7 days</div>
        </div>
      )}

      {/* VIEW 1: MY TEMPLATES TABLE */}
      {activeView === "list" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
            <span className="text-xs font-bold text-gray-600">🔍 Filter Records</span>
            <input
              type="text"
              placeholder="Search template name..."
              className="border text-xs rounded-xl px-3 py-1.5 w-64 focus:outline-none"
            />
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                <th className="p-4">Insights</th>
                <th className="p-4">Name / Lang Code</th>
                <th className="p-4">Text</th>
                <th className="p-4">Category / Status</th>
                <th className="p-4">Created / Modified</th>
                <th className="p-4">API Payload</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <button onClick={() => alert(`Insights for ${t.name}: Delivered 100%, Read 95%`)} className="bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200 hover:bg-blue-100 flex items-center space-x-1">
                      <span>📊</span>
                      <span>Insights</span>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{t.name}</div>
                    <div className="text-[10px] text-gray-400">Language Code: {t.lang}</div>
                    <div className="text-[10px] text-gray-400 font-mono">Template ID: {t.id}</div>
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate">{t.text}</td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-700">{t.category}</div>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${t.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      ● {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-[11px]">
                    <div>Created: {t.created}</div>
                    <div>Modified: NA</div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setSelectedPayload(t.payload);
                        setShowPayloadModal(true);
                      }}
                      className="border px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 shadow-sm"
                    >
                      View
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center space-x-1.5 text-sm">
                      <button title="Preview Template" onClick={() => alert(`Previewing template: ${t.name}`)} className="p-1 hover:bg-gray-100 rounded">👁️</button>
                      <button title="Send Campaign" onClick={() => alert(`Start campaign with ${t.name}?`)} className="p-1 hover:bg-gray-100 rounded">🚀</button>
                      <button title="Edit Template" onClick={() => alert(`Editing ${t.name}`)} className="p-1 hover:bg-gray-100 rounded">✏️</button>
                      <button title="Sync Status" onClick={() => alert(`Synced status with Meta!`)} className="p-1 hover:bg-gray-100 rounded">🔄</button>
                      <button title="Delete Template" onClick={() => setTemplates(templates.filter(x => x.id !== t.id))} className="p-1 hover:bg-red-50 text-red-600 rounded">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: CREATE NEW TEMPLATE FORM */}
      {activeView === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-800 border-b pb-3">New Template Details</h3>
            
            <div className="space-y-1">
              <label className="block font-semibold text-gray-600">Template Name</label>
              <input
                type="text"
                placeholder="e.g. order_update_alert"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Category</label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
                >
                  <option value="Utility">Utility</option>
                  <option value="Authentication">Authentication</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-600">Language</label>
                <select
                  value={templateLang}
                  onChange={(e) => setTemplateLang(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-600">Template Body Text</label>
              <textarea
                rows={4}
                placeholder="Hi {{1}}, your booking is confirmed..."
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setActiveView("list")}
                className="px-4 py-2 border rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow"
              >
                Submit to Meta
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-xl w-full max-w-sm mx-auto text-white space-y-4">
              <div className="text-center text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                📱 WhatsApp Preview
              </div>
              <div className="bg-emerald-800/40 p-4 rounded-2xl space-y-2 text-xs border border-emerald-500/30">
                <p className="text-white font-mono whitespace-pre-wrap">{templateBody || "Your message body will appear here..."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: META TEMPLATE LIBRARY */}
      {activeView === "library" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-white p-4 rounded-2xl border shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-500 uppercase text-[11px]">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("utility")}
                className={`w-full text-left p-2.5 rounded-xl font-bold flex justify-between items-center ${
                  selectedCategory === "utility" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>🛠️ Utility</span>
                <span className="text-[10px] opacity-70">(101)</span>
              </button>

              <button
                onClick={() => setSelectedCategory("auth")}
                className={`w-full text-left p-2.5 rounded-xl font-bold flex justify-between items-center ${
                  selectedCategory === "auth" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span>🔑 Authentication</span>
                <span className="text-[10px] opacity-70">(2)</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="bg-white p-3 rounded-xl border shadow-sm">
              <input
                type="text"
                placeholder={`Search ${selectedCategory} templates...`}
                className="w-full border rounded-xl p-2 text-xs focus:outline-none bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {libraryTemplates
                .filter((t) => t.category === selectedCategory)
                .map((lib) => (
                  <div key={lib.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{lib.subcategory}</div>
                      <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border font-mono">{lib.body}</p>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="font-bold text-xs text-gray-800">{lib.name}</span>
                      <button
                        onClick={() => {
                          setTemplateName(lib.name);
                          setTemplateBody(lib.body);
                          setActiveView("create");
                        }}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg text-xs border border-blue-200"
                      >
                        {lib.actionText}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* API PAYLOAD MODAL (Matching image_0b2ee8.jpg) */}
      {showPayloadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">Template Payload</h3>
              <button onClick={() => setShowPayloadModal(false)} className="text-gray-400 font-bold">✕</button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-80">
              <pre>{selectedPayload}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedPayload);
                  alert("Template JSON Payload copied to clipboard!");
                }}
                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl shadow text-xs"
              >
                📋 Copy JSON
              </button>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-2 border rounded-xl font-semibold text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}