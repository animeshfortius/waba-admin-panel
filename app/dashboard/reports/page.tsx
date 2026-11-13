"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"campaign" | "delivery" | "schedule" | "fallback" | "api" | "service">("campaign");
  const [dateRange, setDateRange] = useState("11-Oct-2026 - 12-Oct-2026");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownloadNotification, setShowDownloadNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedChannel, setSelectedChannel] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [isJourney, setIsJourney] = useState("");

  // Dynamic live datasets from API
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [fallbackData, setFallbackData] = useState<any[]>([]);
  const [apiData, setApiData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);

  // Action Modals State
  const [modalType, setModalType] = useState<string | null>(null); // "details" | "repush" | "cta"
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedWabaForRepush, setSelectedWabaForRepush] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "admin";
    fetchLiveReports(userId, activeTab);
  }, [activeTab]);

  const fetchLiveReports = async (userId: string, tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?userId=${userId}&tab=${tab}`);
      const data = await res.json();
      if (data.success) {
        if (tab === "campaign") setCampaignData(data.data || []);
        if (tab === "delivery") setDeliveryData(data.data || []);
        if (tab === "schedule") setScheduleData(data.data || []);
        if (tab === "fallback") setFallbackData(data.data || []);
        if (tab === "api") setApiData(data.data || []);
        if (tab === "service") setServiceData(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch live reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    setShowDownloadNotification(true);
    setTimeout(() => setShowDownloadNotification(false), 5000);
  };

  const handleDownloadCSV = (item: any) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      [
        "ID,Info/Name,Template,Status,Cost",
        `"${item.id}","${item.campaignInfo || item.name || item.number}","${item.templateInfo || item.template || "N/A"}","${item.status || "Completed"}","${item.cost || "0.00"}"`
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${activeTab}_${item.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRepushSubmit = async () => {
    if (!selectedWabaForRepush) {
      alert("Please select a WABA Number.");
      return;
    }
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESEND_CAMPAIGN",
          campaignId: selectedItem?.id,
          wabaNumber: selectedWabaForRepush,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setModalType(null);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (err) {
      alert("Network error while repushing campaign.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-xs font-sans">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Home › WhatsApp › Campaign Activity › {activeTab.toUpperCase()} REPORT
          </div>
          <h1 className="text-xl font-bold text-gray-800 capitalize">{activeTab} Activity Report</h1>
        </div>

        <button
          onClick={handleDownloadReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center space-x-1.5 transition cursor-pointer"
        >
          <span>📥</span>
          <span>Download Report</span>
        </button>
      </div>

      {/* Notification Banner */}
      {showDownloadNotification && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-bold text-sm">Report Generation in Progress</p>
              <p className="text-sky-700">Your report is being generated from Meta live logs. A download link will be available shortly.</p>
            </div>
          </div>
          <button onClick={() => setShowDownloadNotification(false)} className="text-sky-500 font-bold hover:text-sky-700 text-base cursor-pointer">✕</button>
        </div>
      )}

      {/* Sub-Tabs Bar */}
      <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "campaign", label: "📊 Campaign Report" },
            { id: "delivery", label: "🚚 Delivery Report" },
            { id: "schedule", label: "📅 Schedule Report" },
            { id: "fallback", label: "🔀 Fallback Report" },
            { id: "api", label: "🔌 API Report" },
            { id: "service", label: "🛠️ Service Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Date Picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="border bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center space-x-2 transition cursor-pointer"
          >
            <span>📅</span>
            <span>{dateRange}</span>
            <span>▼</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 bg-white border rounded-2xl shadow-2xl p-4 z-30 w-80 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b pb-2 font-bold text-gray-700">
                <span>Select Date Range</span>
                <button onClick={() => setShowDatePicker(false)} className="text-gray-400">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setDateRange("Today"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium cursor-pointer">Today</button>
                <button onClick={() => { setDateRange("Yesterday"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium cursor-pointer">Yesterday</button>
                <button onClick={() => { setDateRange("Last 7 Days"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium cursor-pointer">Last 7 Days</button>
                <button onClick={() => { setDateRange("Last 30 Days"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium cursor-pointer">Last 30 Days</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER RECORDS SECTION */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-sm text-gray-800 flex items-center space-x-2">
            <span>🔍</span>
            <span>Filter Records ({activeTab.toUpperCase()})</span>
          </h3>
          <div className="space-x-2">
            <button onClick={() => { setSelectedChannel(""); setTemplateSearch(""); setCampaignStatus(""); }} className="text-xs text-gray-500 font-semibold hover:text-gray-800 px-3 py-1.5 cursor-pointer">Reset</button>
            <button onClick={() => fetchLiveReports(localStorage.getItem("userId") || "admin", activeTab)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition cursor-pointer">
              Apply Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Select Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-bold"
            >
              <option value="">All Channels</option>
              <option value="17714127744">17714127744</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Template Name</label>
            <input
              type="text"
              placeholder="Search template..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Status</label>
            <select
              value={campaignStatus}
              onChange={(e) => setCampaignStatus(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Journey Campaign</label>
            <select
              value={isJourney}
              onChange={(e) => setIsJourney(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
            >
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* DYNAMIC DATA TABLE ACCORDING TO TAB */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-semibold">Loading live reports from database...</div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "campaign" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                    <th className="p-4">Campaign Date</th>
                    <th className="p-4">Campaign Info</th>
                    <th className="p-4">Template Info</th>
                    <th className="p-4">Interface / Channel</th>
                    <th className="p-4">Scheduled Info</th>
                    <th className="p-4">Is Journey</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Total Count</th>
                    <th className="p-4">Error</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaignData.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-gray-400">No campaign reports found.</td></tr>
                  ) : (
                    campaignData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-gray-700">{item.date || item.createdAt}</td>
                        <td className="p-4 font-bold text-gray-900">{item.campaignInfo}</td>
                        <td className="p-4 text-emerald-700 font-medium">{item.templateInfo}</td>
                        <td className="p-4 font-mono">+{item.channel}</td>
                        <td className="p-4">{item.scheduledInfo || "Instant"}</td>
                        <td className="p-4">{item.isJourney || "No"}</td>
                        <td className="p-4 font-mono font-bold text-gray-800">₹{item.cost}</td>
                        <td className="p-4 font-bold">{item.totalCount}</td>
                        <td className="p-4 text-red-500">{item.error || "-"}</td>
                        <td className="p-4">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-1.5">
                          <button onClick={() => { setSelectedItem(item); setModalType("details"); }} className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 font-bold cursor-pointer" title="View Details">👁️</button>
                          <button onClick={() => handleDownloadCSV(item)} className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-100 font-bold cursor-pointer" title="Download CSV">📥</button>
                          <button onClick={() => { setSelectedItem(item); setModalType("repush"); }} className="bg-amber-50 text-amber-600 p-1.5 rounded-lg hover:bg-amber-100 font-bold cursor-pointer" title="Resend / Repush">🔁</button>
                          <button onClick={() => { setSelectedItem(item); setModalType("cta"); }} className="bg-purple-50 text-purple-600 p-1.5 rounded-lg hover:bg-purple-100 font-bold cursor-pointer" title="CTA Report">📊</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "delivery" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                    <th className="p-4">Delivery Date</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Recipient Number</th>
                    <th className="p-4">Profile Name</th>
                    <th className="p-4">Message ID</th>
                    <th className="p-4">Acknowledgment Time</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveryData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono">{item.date}</td>
                      <td className="p-4 font-mono">+{item.channel}</td>
                      <td className="p-4 font-mono font-bold">+{item.number}</td>
                      <td className="p-4 font-bold">{item.profileName}</td>
                      <td className="p-4 font-mono text-gray-400">{item.msgId}</td>
                      <td className="p-4 font-mono">{item.ackTime}</td>
                      <td className="p-4 font-bold">₹{item.cost}</td>
                      <td className="p-4">
                        <span className="font-bold px-2.5 py-1 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Other tabs tables follow similar structure */}
            {activeTab === "schedule" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                    <th className="p-4">Campaign Name</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Scheduled Send Time</th>
                    <th className="p-4">Template</th>
                    <th className="p-4">Target Recipients</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-900">{item.name}</td>
                      <td className="p-4 font-mono">+{item.channel}</td>
                      <td className="p-4 font-mono text-emerald-700 font-bold">{item.sendAt}</td>
                      <td className="p-4">{item.template}</td>
                      <td className="p-4 font-bold">{item.recipients}</td>
                      <td className="p-4"><span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Action Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">
                {modalType === "details" && "📋 Campaign Summary & Details"}
                {modalType === "repush" && "🔁 Repush / Resend Failed Campaign"}
                {modalType === "cta" && "📊 CTA & Button Click Report"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-gray-500 font-bold cursor-pointer">✕</button>
            </div>

            {modalType === "details" && selectedItem && (
              <div className="space-y-2 text-xs font-mono bg-gray-50 p-4 rounded-xl border">
                <div><strong>Campaign Name:</strong> {selectedItem.campaignInfo}</div>
                <div><strong>Template Info:</strong> {selectedItem.templateInfo}</div>
                <div><strong>Status:</strong> {selectedItem.status}</div>
                <div><strong>Cost:</strong> ₹{selectedItem.cost}</div>
              </div>
            )}

            {modalType === "repush" && selectedItem && (
              <div className="space-y-4 text-xs">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 font-semibold">
                  Repush failed messages for campaign: <strong>{selectedItem.campaignInfo}</strong>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">SELECT WABA NUMBER *</label>
                  <select
                    value={selectedWabaForRepush}
                    onChange={(e) => setSelectedWabaForRepush(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono"
                  >
                    <option value="">Select WABA Account</option>
                    <option value="17714127744">17714127744 (Default)</option>
                  </select>
                </div>
                <div className="flex justify-end pt-3 border-t">
                  <button onClick={handleRepushSubmit} className="bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl cursor-pointer">
                    Repush Messages ➔
                  </button>
                </div>
              </div>
            )}

            {modalType === "cta" && (
              <div className="text-center py-6 text-gray-500 text-xs font-mono">
                No CTA button click records found for this campaign.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}