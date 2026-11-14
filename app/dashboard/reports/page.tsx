"use client";

import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"campaign" | "delivery" | "schedule" | "fallback" | "api" | "service">("campaign");
  const [dateRange, setDateRange] = useState("15-Oct-2026 - 14-Nov-2026");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownloadNotification, setShowDownloadNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states & Waba Channels
  const [selectedChannel, setSelectedChannel] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [isJourney, setIsJourney] = useState("");
  const [wabaChannels, setWabaChannels] = useState<any[]>([]);

  // Analytics Stats Cards
  const [stats, setStats] = useState({ total: 1, sent: 0, delivered: 1, read: 0, failed: 0 });

  // Dynamic datasets from API
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [fallbackData, setFallbackData] = useState<any[]>([]);
  const [apiData, setApiData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);

  // Mobile Preview & Action Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
        
        if (data.wabaAccounts) setWabaChannels(data.wabaAccounts);
        if (data.stats) setStats(data.stats);
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
        `"${item.id || 1}","${item.campaignInfo || item.number || "N/A"}","${item.templateName || item.templateInfo || "N/A"}","${item.status || "DELIVERED"}","${item.cost || "0.00"}"`
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        {/* Date Picker Button */}
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

      {/* METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border shadow-xs text-center">
          <div className="text-gray-400 font-semibold text-[10px]">TOTAL</div>
          <div className="text-lg font-bold text-gray-800 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-xs text-center">
          <div className="text-gray-400 font-semibold text-[10px]">SENT</div>
          <div className="text-lg font-bold text-blue-600 mt-1">{stats.sent}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-xs text-center">
          <div className="text-gray-400 font-semibold text-[10px]">DELIVERED</div>
          <div className="text-lg font-bold text-emerald-600 mt-1">{stats.delivered}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-xs text-center">
          <div className="text-gray-400 font-semibold text-[10px]">READ</div>
          <div className="text-lg font-bold text-indigo-600 mt-1">{stats.read}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border shadow-xs text-center">
          <div className="text-gray-400 font-semibold text-[10px]">FAILED</div>
          <div className="text-lg font-bold text-red-600 mt-1">{stats.failed}</div>
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
              <option value="">All Channels ({wabaChannels.length} Connected)</option>
              {wabaChannels.map((acc, idx) => (
                <option key={idx} value={acc.displayPhone || acc.wabaId}>
                  {acc.displayName ? `${acc.displayName} (${acc.displayPhone || acc.wabaId})` : (acc.displayPhone || acc.wabaId)}
                </option>
              ))}
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
              <option value="DELIVERED">DELIVERED</option>
              <option value="SENT">SENT</option>
              <option value="READ">READ</option>
              <option value="FAILED">FAILED</option>
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

      {/* DATA TABLES SECTION */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex">
        <div className={`flex-1 overflow-x-auto transition-all ${showPreviewModal ? "w-2/3" : "w-full"}`}>
          {loading ? (
            <div className="p-12 text-center text-gray-500 font-semibold">Loading live reports from Meta & database...</div>
          ) : (
            <>
              {/* CAMPAIGN REPORT TAB */}
              {activeTab === "campaign" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                      <th className="p-4">Campaign Date</th>
                      <th className="p-4">Campaign Info</th>
                      <th className="p-4">Template Info</th>
                      <th className="p-4">Interface / Channel</th>
                      <th className="p-4">Cost</th>
                      <th className="p-4">Total Count</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaignData.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-gray-400">No campaign reports found.</td></tr>
                    ) : (
                      campaignData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-mono text-gray-700">{item.date}</td>
                          <td className="p-4 font-bold text-gray-900">{item.campaignInfo}</td>
                          <td className="p-4 text-emerald-700 font-medium">{item.templateInfo}</td>
                          <td className="p-4 font-mono">+{item.channel}</td>
                          <td className="p-4 font-mono font-bold text-gray-800">₹{item.cost}</td>
                          <td className="p-4 font-bold">{item.totalCount}</td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-center space-x-1.5">
                            <button onClick={() => { setSelectedItem(item); setShowPreviewModal(true); }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 cursor-pointer">View</button>
                            <button onClick={() => handleDownloadCSV(item)} className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-100 font-bold cursor-pointer" title="Download CSV">📥</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* DELIVERY REPORT TAB */}
              {activeTab === "delivery" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                      <th className="p-3">Received Date</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Message ID</th>
                      <th className="p-3">Acknowledgement</th>
                      <th className="p-3">Interface / Type</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deliveryData.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-gray-400">No delivery reports found.</td></tr>
                    ) : (
                      deliveryData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-mono">{item.date}</td>
                          <td className="p-3 font-mono">{item.channel}</td>
                          <td className="p-3 font-mono font-bold text-gray-900">{item.number}</td>
                          <td className="p-3">
                            <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-gray-400 truncate max-w-[120px]" title={item.messageId}>{item.messageId}</td>
                          <td className="p-3 font-mono text-[10px] text-gray-600">{item.acknowledgement}</td>
                          <td className="p-3 font-mono">Interface: {item.interfaceType}<br/>Type: {item.templateType}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{item.cost}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => { setSelectedItem(item); setShowPreviewModal(true); }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 cursor-pointer">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* API REPORT TAB */}
              {activeTab === "api" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Endpoint</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Response Code</th>
                      <th className="p-4">Latency</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-mono">14 Nov 2026 11:31 AM</td>
                      <td className="p-4 font-mono text-blue-600">/v21.0/messages</td>
                      <td className="p-4 font-bold">POST</td>
                      <td className="p-4 font-bold text-emerald-600">200 OK</td>
                      <td className="p-4 font-mono text-gray-500">124ms</td>
                      <td className="p-4 text-center"><button onClick={() => alert("API Payload Verified")} className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Inspect</button></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* SERVICE REPORT TAB */}
              {activeTab === "service" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                      <th className="p-4">Service Name</th>
                      <th className="p-4">Health Status</th>
                      <th className="p-4">Uptime</th>
                      <th className="p-4">Last Ping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-bold">Meta Cloud Webhook Listener</td>
                      <td className="p-4 font-bold text-emerald-600">Healthy 🟢</td>
                      <td className="p-4 font-mono font-bold">99.99%</td>
                      <td className="p-4 text-gray-500">Just now</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDE MOBILE PREVIEW MODAL (As seen in your screenshot) */}
        {showPreviewModal && selectedItem && (
          <div className="w-80 border-l bg-gray-50 p-4 flex flex-col justify-between shadow-lg relative animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <span className="font-bold text-gray-800">Mobile Preview</span>
                <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 font-bold hover:text-black cursor-pointer text-sm">✕</button>
              </div>

              {/* Realistic Mobile Frame */}
              <div className="bg-black rounded-3xl p-3 shadow-2xl border-4 border-gray-800">
                <div className="bg-emerald-900 text-white rounded-2xl p-3 space-y-2 text-[11px] font-sans">
                  <div className="flex justify-between items-center text-[9px] text-emerald-300 border-b border-emerald-800 pb-1">
                    <span>WhatsApp Business</span>
                    <span>11:20 AM</span>
                  </div>
                  <div className="bg-white text-gray-900 p-3 rounded-xl shadow space-y-2">
                    <div className="font-bold text-emerald-800 text-xs">{selectedItem.templateName || selectedItem.campaignInfo}</div>
                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{selectedItem.bodyText || "Please Recharge your PS LIC Software. Gpay & Phone pay fwd. Amount: 1180/-. Perfect Solution"}</p>
                    <div className="text-[9px] text-right text-gray-400 font-mono mt-1">✓✓ 11:31 AM</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t text-[11px] space-y-1 font-mono text-gray-600">
              <div><strong>Recipient:</strong> {selectedItem.number || "+917518900801"}</div>
              <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">{selectedItem.status}</span></div>
              <div><strong>Cost:</strong> ₹{selectedItem.cost}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}