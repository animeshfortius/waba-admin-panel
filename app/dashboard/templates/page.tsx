"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState([
    {
      id: "1",
      name: "otp_test",
      language: "English",
      templateId: "1758713771836411",
      wabaNumber: "28402710282733872",
      text: "{{1}} is your verification code. For your security...",
      category: "Authentication",
      status: "Approved",
      created: "08 Oct 2025 12:05 PM",
      modified: "26 Oct 2026 04:44 PM"
    },
    {
      id: "2",
      name: "feedback_collection",
      language: "English",
      templateId: "1764876244783508",
      wabaNumber: "28402710282733872",
      text: "Hi {{1}}, the service request we completed on...",
      category: "Utility",
      status: "Approved",
      created: "08 Oct 2025 12:04 PM",
      modified: "N/A"
    }
  ]);

  // Modal States
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [showPayloadDrawer, setShowPayloadDrawer] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const customTpls = JSON.parse(localStorage.getItem("custom_whatsapp_templates") || "[]");
      if (customTpls.length > 0) {
        setTemplates((prev) => [...customTpls, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    try {
      const customTpls = JSON.parse(localStorage.getItem("custom_whatsapp_templates") || "[]");
      const newCustom = customTpls.filter((t: any) => t.id !== id);
      localStorage.setItem("custom_whatsapp_templates", JSON.stringify(newCustom));
    } catch (e) {
      console.error(e);
    }
    setDeleteId(null);
  };

  const copyJsonPayload = (tpl: any) => {
    const jsonString = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "{{1}}",
      type: "template",
      template: {
        name: tpl.name,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: "{{1}}" }]
          }
        ]
      }
    }, null, 2);

    navigator.clipboard.writeText(jsonString);
    alert("Template JSON copied to clipboard successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 max-w-7xl mx-auto relative">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-4">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › WhatsApp Templates</div>
          <h1 className="text-xl font-bold text-gray-800">WhatsApp Templates</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/templates/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
          >
            <span>+ Create Templates</span>
          </Link>
          <button
            onClick={() => alert("Template Sync Successfully! Meta templates retrieved.")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            🔄 Retrieve Meta Templates
          </button>
          <button
            onClick={() => alert("Export in Progress! Your report is being generated.")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl border transition cursor-pointer"
          >
            📥 Download Templates
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border shadow-xs flex items-center justify-between">
        <input
          type="text"
          placeholder="Filter Records..."
          className="border rounded-lg px-3 py-2 text-xs w-72 bg-gray-50 focus:outline-none"
        />
        <div className="text-gray-500 font-semibold">Showing {templates.length} of {templates.length} records</div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/70 border-b text-gray-600 font-bold text-[11px]">
              <th className="p-3">INSIGHTS</th>
              <th className="p-3">NAME / LANG CODE</th>
              <th className="p-3">TEXT</th>
              <th className="p-3">CATEGORY / STATUS</th>
              <th className="p-3">CREATED / MODIFIED</th>
              <th className="p-3">API PAYLOAD</th>
              <th className="p-3 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {templates.map((tpl) => (
              <tr key={tpl.id} className="hover:bg-gray-50/80 transition">
                <td className="p-3 align-top">
                  <button className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-[10px] hover:bg-blue-100 cursor-pointer">
                    📊 Insights
                  </button>
                </td>
                <td className="p-3 align-top space-y-0.5">
                  <div className="font-bold text-gray-900">Name: {tpl.name}</div>
                  <div className="text-gray-500">Language Code: {tpl.language}</div>
                  <div className="text-gray-500">Template id: {tpl.templateId}</div>
                  <div className="text-gray-400 font-mono text-[10px]">WABABusinessId: {tpl.wabaNumber}</div>
                </td>
                <td className="p-3 align-top text-gray-600 max-w-xs truncate">
                  {tpl.text}
                </td>
                <td className="p-3 align-top space-y-1">
                  <div className="font-semibold text-gray-800">{tpl.category}</div>
                  <div className="inline-flex items-center space-x-1 font-bold text-[10px]">
                    <span className={tpl.status === "Approved" ? "text-emerald-600" : "text-amber-600"}>
                      {tpl.status === "Approved" ? "🟢 Approved" : "⏳ PENDING"}
                    </span>
                  </div>
                </td>
                <td className="p-3 align-top text-gray-500 space-y-0.5 text-[11px]">
                  <div>Created: {tpl.created}</div>
                  <div>Modified: {tpl.modified}</div>
                </td>
                <td className="p-3 align-top">
                  <button
                    onClick={() => {
                      setSelectedPayload(tpl);
                      setShowPayloadDrawer(true);
                    }}
                    className="border px-3 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 cursor-pointer"
                  >
                    👁️ View
                  </button>
                </td>
                <td className="p-3 align-top text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      title="Preview"
                      onClick={() => setPreviewTemplate(tpl)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs"
                    >
                      👁️
                    </button>
                    <button
                      title="Use in Campaign"
                      onClick={() => window.location.href = "/dashboard/campaigns"}
                      className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer text-xs font-bold"
                    >
                      🚀
                    </button>
                    <button
                      title="Edit"
                      onClick={() => alert(`Editing template: ${tpl.name}`)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs"
                    >
                      ✏️
                    </button>
                    <button
                      title="Copy"
                      onClick={() => copyJsonPayload(tpl)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-xs"
                    >
                      📋
                    </button>
                    <button
                      title="Delete"
                      onClick={() => setDeleteId(tpl.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Payload Drawer / Modal */}
      {showPayloadDrawer && selectedPayload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-start">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-4 animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-gray-800">Template Payload: {selectedPayload.name}</h2>
              <button
                onClick={() => setShowPayloadDrawer(false)}
                className="text-gray-500 font-bold px-2 py-1 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-[11px] space-y-1">
              <div className="font-bold">Notes:</div>
              <div>• {"{{1}}"} - contains the mobile number where the message will be sent.</div>
              <div>• {"{{2}}"}, {"{{3}}"} - replace these in body parameters with actual dynamic values.</div>
              <div>• {"{{url}}"} header - used when header contains media (image, video, or document) - replace with media URL.</div>
              <div>• {"{{url}}"} - replace with the actual link for URL buttons.</div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-700">Template JSON</span>
              <button
                onClick={() => copyJsonPayload(selectedPayload)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs cursor-pointer"
              >
                📋 Copy JSON
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner">
              {JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: "{{1}}",
                type: "template",
                template: {
                  name: selectedPayload.name,
                  language: { code: "en" },
                  components: [
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: "{{2}}" }
                      ]
                    }
                  ]
                }
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-3xl border-4 border-slate-700 shadow-2xl max-w-sm w-full text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-emerald-400">Template Preview: {previewTemplate.name}</span>
              <button onClick={() => setPreviewTemplate(null)} className="text-rose-400 font-bold">✕</button>
            </div>
            <div className="bg-emerald-950 p-4 rounded-2xl space-y-2 border border-emerald-800/50">
              <div className="text-xs text-slate-100 whitespace-pre-wrap">{previewTemplate.text}</div>
            </div>
            <div className="text-center text-[10px] text-slate-400">
              Status: <span className="text-emerald-400 font-bold">{previewTemplate.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="text-lg font-bold text-gray-800">Are you sure?</div>
            <p className="text-gray-500 text-xs">Do you want to delete this template?</p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => handleDelete(deleteId)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Yes, Delete It
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}