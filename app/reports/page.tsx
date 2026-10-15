"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"campaign" | "delivery" | "schedule" | "fallback" | "api" | "service">("campaign");
  const [dateRange, setDateRange] = useState("11-Oct-2026 - 12-Oct-2026");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownloadNotification, setShowDownloadNotification] = useState(false);

  // Filter states
  const [selectedChannel, setSelectedChannel] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [isJourney, setIsJourney] = useState("");

  // Dynamic datasets per tab matching your video
  const [campaignData, setCampaignData] = useState([
    {
      id: 1,
      date: "12-Oct-2026 12:00",
      campaignInfo: "Diwali Special Offer",
      templateInfo: "Utility: Festival_Greeting",
      channel: "15553945963",
      scheduledInfo: "Instant",
      isJourney: "No",
      cost: "$0.005",
      totalCount: 1250,
      error: "-",
      status: "Completed"
    },
    {
      id: 2,
      date: "11-Oct-2026 14:30",
      campaignInfo: "Abandoned Cart Reminder",
      templateInfo: "Marketing: Cart_Alert",
      channel: "15553945963",
      scheduledInfo: "Automated",
      isJourney: "Yes",
      cost: "$0.008",
      totalCount: 430,
      error: "-",
      status: "Completed"
    }
  ]);

  const [deliveryData] = useState([
    { id: 1, date: "12-Oct-2026 12:01", channel: "15553945963", number: "919876543210", profileName: "Rahul Sharma", status: "READ", msgId: "wamid.HBgL...", ackTime: "12-Oct 12:01:05", cost: "$0.005" },
    { id: 2, date: "12-Oct-2026 12:02", channel: "15553945963", number: "919123456789", profileName: "Priya Verma", status: "DELIVERED", msgId: "wamid.HBgL...", ackTime: "12-Oct 12:02:10", cost: "$0.005" }
  ]);

  const [scheduleData] = useState([
    { id: 1, name: "Weekend Blast", channel: "15553945963", sendAt: "15-Oct-2026 10:00 AM", template: "Offer_V2", recipients: 3500, status: "Pending" }
  ]);

  const [fallbackData] = useState([
    { id: 1, date: "10-Oct-2026", triggerEvent: "API Timeout", fallbackAction: "Send SMS Gateway", status: "Triggered" }
  ]);

  const [apiData] = useState([
    { id: 1, endpoint: "/v21.0/messages", method: "POST", responseCode: 200, latency: "142ms", timestamp: "12-Oct-2026 12:10" }
  ]);

  const [serviceData] = useState([
    { id: 1, serviceName: "Meta Cloud Webhook Listener", health: "Healthy 🟢", uptime: "99.98%", lastPing: "1 min ago" }
  ]);

  const handleDownloadReport = () => {
    setShowDownloadNotification(true);
    setTimeout(() => setShowDownloadNotification(false), 5000);
  };

  const handleApplyFilter = () => {
    alert(`Applying filters for tab: ${activeTab.toUpperCase()} | Channel: ${selectedChannel || "All"} | Status: ${campaignStatus || "All"}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center space-x-1.5 transition"
        >
          <span>📥</span>
          <span>Download Report</span>
        </button>
      </div>

      {/* Expert in Progress Notification Banner matching video */}
      {showDownloadNotification && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-bold text-sm">Expert in Progress</p>
              <p className="text-sky-700">Your report is being generated in the background. A download link will be sent via email once it is ready. You can access it anytime from the Download Center.</p>
            </div>
          </div>
          <button onClick={() => setShowDownloadNotification(false)} className="text-sky-500 font-bold hover:text-sky-700 text-base">✕</button>
        </div>
      )}

      {/* Sub-Tabs Bar matching video */}
      <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("campaign")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "campaign" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            📊 Campaign Report
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "delivery" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            🚚 Delivery Report
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "schedule" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            📅 Schedule Report
          </button>
          <button
            onClick={() => setActiveTab("fallback")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "fallback" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            🔀 Fallback Report
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "api" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            🔌 API Report
          </button>
          <button
            onClick={() => setActiveTab("service")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "service" ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
          >
            🛠️ Service Report
          </button>
        </div>

        {/* Calendar Date Picker Modal Toggle matching your video */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="border bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center space-x-2 transition"
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
                <button onClick={() => { setDateRange("Today (12-Oct-2026)"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium">Today</button>
                <button onClick={() => { setDateRange("Yesterday"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium">Yesterday</button>
                <button onClick={() => { setDateRange("Last 7 Days"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium">Last 7 Days</button>
                <button onClick={() => { setDateRange("Last 30 Days"); setShowDatePicker(false); }} className="p-2 border rounded-lg hover:bg-emerald-50 text-left font-medium">Last 30 Days</button>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-[10px] text-gray-400">{dateRange}</span>
                <button onClick={() => setShowDatePicker(false)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold">Apply</button>
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
            <button onClick={() => { setSelectedChannel(""); setTemplateSearch(""); setCampaignStatus(""); }} className="text-xs text-gray-500 font-semibold hover:text-gray-800 px-3 py-1.5">Reset</button>
            <button onClick={handleApplyFilter} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition">
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
              <option value="">All Channels (+1 555 394-5963)</option>
              <option value="15553945963">+1 (555) 394-5963</option>
              <option value="919876543210">+91 9876543210</option>
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
                {campaignData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono text-gray-700">{item.date}</td>
                    <td className="p-4 font-bold text-gray-900">{item.campaignInfo}</td>
                    <td className="p-4 text-emerald-700 font-medium">{item.templateInfo}</td>
                    <td className="p-4 font-mono">+{item.channel}</td>
                    <td className="p-4">{item.scheduledInfo}</td>
                    <td className="p-4">{item.isJourney}</td>
                    <td className="p-4 font-mono font-bold text-gray-800">{item.cost}</td>
                    <td className="p-4 font-bold">{item.totalCount}</td>
                    <td className="p-4 text-red-500">{item.error}</td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => alert(`Viewing details for ${item.campaignInfo}`)} className="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 font-bold" title="View">👁️</button>
                      <button onClick={() => alert(`Downloading CSV for ${item.campaignInfo}`)} className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-100 font-bold" title="Download">📥</button>
                    </td>
                  </tr>
                ))}
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
                    <td className="p-4 font-bold">{item.cost}</td>
                    <td className="p-4">
                      <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] ${item.status === "READ" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
                  <th className="p-4 text-center">Action</th>
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
                    <td className="p-4 text-center">
                      <button onClick={() => alert(`Cancelling schedule for ${item.name}`)} className="text-red-500 font-bold hover:underline">Cancel Schedule</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "fallback" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Trigger Event</th>
                  <th className="p-4">Fallback Action Executed</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fallbackData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono">{item.date}</td>
                    <td className="p-4 font-bold text-red-600">{item.triggerEvent}</td>
                    <td className="p-4 font-bold text-emerald-700">{item.fallbackAction}</td>
                    <td className="p-4"><span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "api" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">API Endpoint</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Response Code</th>
                  <th className="p-4">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apiData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-mono">{item.timestamp}</td>
                    <td className="p-4 font-mono text-blue-600">{item.endpoint}</td>
                    <td className="p-4 font-bold">{item.method}</td>
                    <td className="p-4 font-bold text-emerald-600">{item.responseCode}</td>
                    <td className="p-4 font-mono text-gray-500">{item.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
                {serviceData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold">{item.serviceName}</td>
                    <td className="p-4 font-bold text-emerald-600">{item.health}</td>
                    <td className="p-4 font-mono font-bold">{item.uptime}</td>
                    <td className="p-4 text-gray-500">{item.lastPing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer Pagination */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-500">
          <span>Showing entries for {activeTab.toUpperCase()} report</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border rounded bg-white font-bold disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border rounded bg-emerald-600 text-white font-bold">1</button>
            <button className="px-3 py-1 border rounded bg-white font-bold">Next</button>
          </div>
        </div>
      </div>

    </div>
  );
}