"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ManageTemplatesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWabaFilter, setSelectedWabaFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [payloadTemplate, setPayloadTemplate] = useState<any>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    if (storedUserId) {
      setUserId(storedUserId);
      loadData(storedUserId);
    } else {
      fetch("/api/admin/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.id) {
            setUserId(data.user.id);
            loadData(data.user.id);
          }
        });
    }
  }, []);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        const dbTemplates = data.templates || [];
        if (dbTemplates.length === 0) {
          setTemplates([
            {
              id: "1",
              name: "otp_test",
              language: "en_US",
              metaTemplateId: "1758713771836411",
              wabaNumber: "919876543210",
              wabaId: "28402710282733872",
              bodyText: "{{1}} is your verification code. For your security, do not share this code.",
              category: "AUTHENTICATION",
              status: "APPROVED",
              createdAt: new Date().toISOString(),
            },
          ]);
        } else {
          setTemplates(dbTemplates);
        }
        setWabaAccounts(data.wabaAccounts || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  // Retrieve Meta Templates
  const handleRetrieveMetaTemplates = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRIEVE_ALL", userId, wabaId: wabaAccounts[0]?.wabaId || "DEFAULT" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ " + data.message);
        loadData(userId);
      } else {
        alert("❌ Error: " + (data.error || "Failed to retrieve"));
      }
    } catch (err) {
      alert("Network error syncing templates.");
    } finally {
      setSyncingAll(false);
    }
  };

  // Sync Single Template Status
  const handleSyncSingle = async (tpl: any) => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_SINGLE",
          userId,
          wabaId: tpl.wabaId,
          templateId: tpl.id,
          metaTemplateId: tpl.metaTemplateId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Synced! Status: ${data.template.status} | Category: ${data.template.category}`);
        loadData(userId);
      } else {
        alert("❌ Sync Error: " + data.error);
      }
    } catch (err) {
      alert("Network error syncing template.");
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (tpl: any) => {
    if (!confirm(`Delete template "${tpl.name}" permanently?`)) return;
    try {
      const res = await fetch(`/api/templates/manage?templateId=${tpl.id}&userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ " + data.message);
        loadData(userId);
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (err) {
      alert("Network error deleting template.");
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.bodyText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.wabaNumber?.includes(searchQuery);
    const matchesWaba = selectedWabaFilter === "ALL" || t.wabaId === selectedWabaFilter;
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    return matchesSearch && matchesWaba && matchesStatus && matchesCategory;
  });

  return (
    <div className="w-full p-6 space-y-6 text-xs font-sans bg-gray-50/50 min-h-screen">
      {/* Top Header - Full Width */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="text-gray-400 text-[11px]">Dashboard › WhatsApp Templates</div>
          <h1 className="text-xl font-bold text-gray-800">Manage WhatsApp Templates</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/templates/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
          >
            + Create Templates
          </Link>

          <button
            type="button"
            onClick={handleRetrieveMetaTemplates}
            disabled={syncingAll}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {syncingAll ? "⏳ Retrieving..." : "🔄 Retrieve Meta Templates"}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search by template name, text, or WABA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-xl px-3.5 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedWabaFilter}
          onChange={(e) => setSelectedWabaFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 bg-gray-50 font-medium text-gray-700 focus:outline-none"
        >
          <option value="ALL">All WABA Accounts</option>
          {wabaAccounts.map((acc) => (
            <option key={acc.id} value={acc.wabaId}>
              {acc.displayPhone} ({acc.displayName})
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-xl px-3 py-2 bg-gray-50 font-medium text-gray-700 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="UTILITY">UTILITY</option>
          <option value="MARKETING">MARKETING</option>
          <option value="AUTHENTICATION">AUTHENTICATION</option>
        </select>

        <div className="flex items-center justify-between gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 bg-gray-50 font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <span className="text-gray-400 whitespace-nowrap font-semibold">{filteredTemplates.length} records</span>
        </div>
      </div>

      {/* Full-Width Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 text-gray-700 uppercase border-b font-bold text-[10px] tracking-wider">
                <th className="p-4">Name / Lang</th>
                <th className="p-4">WABA Number & ID</th>
                <th className="p-4 max-w-sm">Body Text</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-center">API Payload</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    Loading templates...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 font-medium">
                    No templates found. Click "Retrieve Meta Templates" to sync.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-gray-50/80 transition align-top">
                    {/* Name & Language */}
                    <td className="p-4 space-y-1">
                      <div className="font-bold text-gray-900 text-xs">{tpl.name}</div>
                      <div className="text-[11px] text-gray-500">Lang: <span className="font-semibold">{tpl.language || "en_US"}</span></div>
                    </td>

                    {/* WABA Number & ID */}
                    <td className="p-4 space-y-1 font-mono text-[11px]">
                      <div className="font-bold text-emerald-700">📱 {tpl.wabaNumber || "N/A"}</div>
                      <div className="text-gray-400">ID: {tpl.wabaId || "N/A"}</div>
                    </td>

                    {/* Body Text */}
                    <td className="p-4 max-w-sm">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {tpl.bodyText}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tpl.category === "UTILITY"
                            ? "bg-blue-100 text-blue-700"
                            : tpl.category === "AUTHENTICATION"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {tpl.category || "MARKETING"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          tpl.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : tpl.status === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                            : tpl.status === "IN_REVIEW"
                            ? "bg-blue-100 text-blue-700 animate-pulse"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        ● {tpl.status || "PENDING"}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="p-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(tpl.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* API Payload View */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setPayloadTemplate(tpl)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] border cursor-pointer"
                      >
                        {"{ }"} View
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Sync */}
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(tpl)}
                          title="Sync Status with Meta"
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border cursor-pointer"
                        >
                          🔄
                        </button>

                        {/* Mobile Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(tpl)}
                          title="Real WhatsApp Customer Preview"
                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg border cursor-pointer"
                        >
                          👁️
                        </button>

                        {/* Use in Campaign */}
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/campaigns?templateId=${tpl.id}&templateName=${tpl.name}&wabaNumber=${tpl.wabaNumber}`
                            )
                          }
                          title="Use in Campaign"
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border cursor-pointer"
                        >
                          🚀
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          title="Delete Template"
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REAL WHATSAPP CUSTOMER PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#efeae2] rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border-4 border-slate-700">
            <div className="flex justify-between items-center border-b border-gray-300 pb-2">
              <span className="font-bold text-gray-700 text-xs">WhatsApp Customer Preview</span>
              <button onClick={() => setPreviewTemplate(null)} className="font-bold text-gray-600 text-sm">✕</button>
            </div>
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm space-y-2 max-w-[280px] text-xs">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{previewTemplate.bodyText}</p>
              <div className="text-right text-[9px] text-gray-400">12:45 PM ✓✓</div>
            </div>
            <div className="text-center text-[10px] text-gray-500">
              Template: <span className="font-bold text-emerald-700">{previewTemplate.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* API PAYLOAD MODAL */}
      {payloadTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">API Send Payload ({payloadTemplate.name})</h3>
              <button onClick={() => setPayloadTemplate(null)} className="font-bold text-gray-500">✕</button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto text-[11px] font-mono">
              {JSON.stringify(
                {
                  messaging_product: "whatsapp",
                  to: "919876543210",
                  type: "template",
                  template: {
                    name: payloadTemplate.name,
                    language: { code: payloadTemplate.language || "en_US" },
                    components: payloadTemplate.components || [],
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}