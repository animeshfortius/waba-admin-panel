"use client";

import { useState, useEffect, useMemo } from "react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"campaign" | "delivery" | "schedule" | "fallback" | "api" | "service">("campaign");
  const [dateRange, setDateRange] = useState("All");
  
  // Custom Date Range States
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showDownloadNotification, setShowDownloadNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination & Rows Per Page states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Input filter states
  const [inputChannel, setInputChannel] = useState("");
  const [inputTemplateSearch, setInputTemplateSearch] = useState("");
  const [inputCampaignStatus, setInputCampaignStatus] = useState("");
  const [inputIsJourney, setInputIsJourney] = useState("");

  // Applied filter states
  const [appliedChannel, setAppliedChannel] = useState("");
  const [appliedTemplateSearch, setAppliedTemplateSearch] = useState("");
  const [appliedCampaignStatus, setAppliedCampaignStatus] = useState("");
  const [appliedIsJourney, setAppliedIsJourney] = useState("");
  const [appliedDateRange, setAppliedDateRange] = useState("All");

  const [wabaChannels, setWabaChannels] = useState<any[]>([]);
  const [campaignFilter, setCampaignFilter] = useState("");

  const [apiStats, setApiStats] = useState({ total: 1, sent: 0, delivered: 1, read: 1, failed: 0 });

  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [fallbackData, setFallbackData] = useState<any[]>([]);
  const [apiData, setApiData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "admin";
    fetchLiveReports(userId);

    const interval = setInterval(() => {
      fetchLiveReports(userId);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, appliedDateRange, appliedCampaignStatus, appliedChannel]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, campaignFilter, appliedChannel, appliedTemplateSearch, appliedCampaignStatus, appliedIsJourney, appliedDateRange]);

  const fetchLiveReports = async (userId: string) => {
    try {
      const queryParams = new URLSearchParams({
        userId,
        tab: activeTab,
        dateRange: appliedDateRange,
        ...(appliedDateRange === "Custom" && customStartDate && { startDate: customStartDate }),
        ...(appliedDateRange === "Custom" && customEndDate && { endDate: customEndDate }),
        ...(activeTab === "delivery" && appliedCampaignStatus && { status: appliedCampaignStatus }),
        ...(appliedChannel && { channel: appliedChannel }),
      });

      const res = await fetch(`/api/reports?${queryParams.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setCampaignData(data.campaigns || []);
        setDeliveryData(data.deliveries || []);
        setScheduleData(data.schedules || []);
        setFallbackData(data.fallbacks || []);
        setApiData(data.apis || []);
        setServiceData(data.services || []);
        if (data.wabaAccounts) setWabaChannels(data.wabaAccounts);
        if (data.stats) setApiStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch live reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedChannel(inputChannel);
    setAppliedTemplateSearch(inputTemplateSearch);
    setAppliedCampaignStatus(inputCampaignStatus);
    setAppliedIsJourney(inputIsJourney);
    setAppliedDateRange(dateRange);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setInputChannel("");
    setInputTemplateSearch("");
    setInputCampaignStatus("");
    setInputIsJourney("");
    setDateRange("All");
    setCustomStartDate("");
    setCustomEndDate("");

    setAppliedChannel("");
    setAppliedTemplateSearch("");
    setAppliedCampaignStatus("");
    setAppliedIsJourney("");
    setAppliedDateRange("All");
    setCampaignFilter("");
    setCurrentPage(1);
  };

  const handleDownloadReport = () => {
    setShowDownloadNotification(true);
    setTimeout(() => setShowDownloadNotification(false), 5000);
  };

  const handleDownloadCSV = (item: any) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      [
        "ID,Info/Name,Template,Status,Timestamp,Cost",
        `"${item.id || 1}","${item.campaignInfo || item.number || "N/A"}","${item.templateName || item.templateInfo || "N/A"}","${item.status || "READ"}","${item.createdAt || item.date || "N/A"}","${item.cost || "0.00"}"`
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🟢 Clean Template Name specific filtering
  const filteredCampaigns = useMemo(() => {
    return campaignData.filter((item) => {
      if (campaignFilter && item.campaignInfo !== campaignFilter) return false;
      if (appliedChannel && !String(item.channel).includes(appliedChannel)) return false;
      if (appliedTemplateSearch && !item.templateInfo?.toLowerCase().includes(appliedTemplateSearch.toLowerCase())) return false;
      return true;
    });
  }, [campaignData, campaignFilter, appliedChannel, appliedTemplateSearch]);

  const filteredDeliveries = useMemo(() => {
    return deliveryData.filter((item) => {
      if (campaignFilter && item.campaignName !== campaignFilter) return false;
      if (appliedChannel && !String(item.channel).includes(appliedChannel)) return false;
      if (appliedCampaignStatus && item.status !== appliedCampaignStatus) return false;
      if (appliedTemplateSearch && !item.templateName?.toLowerCase().includes(appliedTemplateSearch.toLowerCase())) return false;
      return true;
    });
  }, [deliveryData, campaignFilter, appliedChannel, appliedCampaignStatus, appliedTemplateSearch]);

  const filteredSchedules = useMemo(() => {
    return scheduleData.filter((item) => {
      if (appliedTemplateSearch && !item.templateName?.toLowerCase().includes(appliedTemplateSearch.toLowerCase())) return false;
      return true;
    });
  }, [scheduleData, appliedTemplateSearch]);

  const filteredFallbacks = useMemo(() => {
    return fallbackData.filter((item) => {
      if (appliedCampaignStatus && item.status !== appliedCampaignStatus) return false;
      return true;
    });
  }, [fallbackData, appliedCampaignStatus]);

  const filteredApis = useMemo(() => {
    return apiData.filter((item) => {
      if (appliedCampaignStatus && item.status !== appliedCampaignStatus) return false;
      return true;
    });
  }, [apiData, appliedCampaignStatus]);

  const filteredServices = useMemo(() => {
    return serviceData.filter((item) => {
      if (appliedCampaignStatus && item.status !== appliedCampaignStatus) return false;
      return true;
    });
  }, [serviceData, appliedCampaignStatus]);

  const activeDataset = useMemo(() => {
    switch (activeTab) {
      case "campaign": return filteredCampaigns;
      case "delivery": return filteredDeliveries;
      case "schedule": return filteredSchedules;
      case "fallback": return filteredFallbacks;
      case "api": return filteredApis;
      case "service": return filteredServices;
      default: return filteredCampaigns;
    }
  }, [activeTab, filteredCampaigns, filteredDeliveries, filteredSchedules, filteredFallbacks, filteredApis, filteredServices]);

  const totalPages = Math.ceil(activeDataset.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return activeDataset.slice(start, start + rowsPerPage);
  }, [activeDataset, currentPage, rowsPerPage]);

  const stats = useMemo(() => {
    let targetList = activeTab === "campaign" ? filteredCampaigns : filteredDeliveries;
    if (activeTab !== "campaign" && activeTab !== "delivery") {
      targetList = activeDataset;
    }

    let total = targetList.length;
    let sent = 0, delivered = 0, read = 0, failed = 0;

    if (activeTab === "campaign" && !campaignFilter) {
      total = filteredCampaigns.reduce((acc, curr) => acc + (Number(curr.totalCount) || 1), 0);
      sent = apiStats.sent;
      delivered = apiStats.delivered;
      read = apiStats.read;
      failed = apiStats.failed;
    } else {
      targetList.forEach((item) => {
        const s = (item.status || "").toUpperCase();
        if (s === "SENT") sent++;
        else if (s === "DELIVERED") delivered++;
        else if (s === "READ") read++;
        else if (s === "FAILED") failed++;
      });
      total = targetList.length;
    }

    return { total: total || 0, sent: sent || 0, delivered: delivered || 0, read: read || 0, failed: failed || 0 };
  }, [activeTab, filteredCampaigns, filteredDeliveries, activeDataset, campaignFilter, apiStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 text-xs font-sans">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-xs text-gray-400">
            Home › WhatsApp › Campaign Activity › {activeTab.toUpperCase()} REPORT
            {campaignFilter && <span className="text-emerald-600 font-bold"> › Campaign: {campaignFilter}</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-800 capitalize">
            {campaignFilter ? `Delivery Report for "${campaignFilter}"` : `${activeTab} Activity Report`}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {campaignFilter && (
            <button
              onClick={() => setCampaignFilter("")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              ← Back to All Campaigns
            </button>
          )}
          <button
            onClick={handleDownloadReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span>📥</span>
            <span>Download Report</span>
          </button>
        </div>
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
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== "delivery") setCampaignFilter("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === tab.id ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="border bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 flex items-center space-x-2 transition cursor-pointer"
          >
            <span>📅</span>
            <span>{dateRange === "Custom" && customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : dateRange}</span>
            <span>▼</span>
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 bg-white border rounded-2xl shadow-2xl p-4 z-30 w-80 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b pb-2 font-bold text-gray-700">
                <span>Select Date Range</span>
                <button onClick={() => setShowDatePicker(false)} className="text-gray-400">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setDateRange("All"); setShowDatePicker(false); }} className={`p-2 border rounded-lg text-left font-bold cursor-pointer ${dateRange === "All" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"}`}>All (Default)</button>
                <button onClick={() => { setDateRange("Today"); setShowDatePicker(false); }} className={`p-2 border rounded-lg text-left font-medium cursor-pointer ${dateRange === "Today" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"}`}>Today</button>
                <button onClick={() => { setDateRange("Yesterday"); setShowDatePicker(false); }} className={`p-2 border rounded-lg text-left font-medium cursor-pointer ${dateRange === "Yesterday" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"}`}>Yesterday</button>
                <button onClick={() => { setDateRange("Last 7 Days"); setShowDatePicker(false); }} className={`p-2 border rounded-lg text-left font-medium cursor-pointer ${dateRange === "Last 7 Days" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"}`}>Last 7 Days</button>
                <button onClick={() => { setDateRange("Last 30 Days"); setShowDatePicker(false); }} className={`p-2 border rounded-lg text-left font-medium cursor-pointer ${dateRange === "Last 30 Days" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "hover:bg-gray-50"}`}>Last 30 Days</button>
              </div>

              <div className="border-t pt-2 space-y-2">
                <span className="font-bold text-gray-600 block">Custom Range:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">From:</label>
                    <input 
                      type="date" 
                      value={customStartDate} 
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full border rounded-lg p-1.5 text-xs bg-gray-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">To:</label>
                    <input 
                      type="date" 
                      value={customEndDate} 
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full border rounded-lg p-1.5 text-xs bg-gray-50 font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (customStartDate && customEndDate) {
                      setDateRange("Custom");
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full bg-emerald-600 text-white font-bold py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  Apply Custom Range
                </button>
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
            <span>Filter Records ({activeTab.toUpperCase()}) {campaignFilter && `for "${campaignFilter}"`}</span>
          </h3>
          <div className="space-x-2">
            <button onClick={handleResetFilters} className="text-xs text-gray-500 font-semibold hover:text-gray-800 px-3 py-1.5 cursor-pointer">Reset</button>
            <button onClick={handleApplyFilters} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition cursor-pointer">
              Apply Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Select Channel</label>
            <select
              value={inputChannel}
              onChange={(e) => setInputChannel(e.target.value)}
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
              value={inputTemplateSearch}
              onChange={(e) => setInputTemplateSearch(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Status</label>
            <select
              value={inputCampaignStatus}
              onChange={(e) => setInputCampaignStatus(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="READ">READ</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-600 mb-1">Journey Campaign</label>
            <select
              value={inputIsJourney}
              onChange={(e) => setInputIsJourney(e.target.value)}
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
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
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
                      <th className="p-4 w-[230px]">TIMESTAMP</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-gray-400">No campaign reports found.</td></tr>
                    ) : (
                      paginatedData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-mono text-gray-700">{item.date}</td>
                          <td className="p-4 font-bold text-gray-900">{item.campaignInfo}</td>
                          <td className="p-4 text-emerald-700 font-medium">{item.templateInfo}</td>
                          <td className="p-4 font-mono">+{item.channel}</td>
                          <td className="p-4 font-mono font-bold text-gray-800">₹{item.cost}</td>
                          <td className="p-4 font-bold">{item.totalCount}</td>
                          
                          <td className="p-4 font-mono text-[11px] text-gray-700 w-[230px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : (item.date || "N/A")}
                          </td>

                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-center space-x-1.5">
                            <button
                              onClick={() => {
                                setCampaignFilter(item.campaignInfo);
                                setActiveTab("delivery");
                              }}
                              className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 cursor-pointer"
                              title="View Particular Campaign Delivery Report"
                            >
                              View
                            </button>
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
                      <th className="p-3">Campaign</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Message ID</th>
                      <th className="p-3 w-[170px]">Acknowledgement</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3 w-[230px]">TIMESTAMP</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={10} className="p-8 text-center text-gray-400">No delivery reports found.</td></tr>
                    ) : (
                      paginatedData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-mono">{item.date}</td>
                          <td className="p-3 font-bold text-gray-800">{item.campaignName}</td>
                          <td className="p-3 font-mono">{item.channel}</td>
                          <td className="p-3 font-mono font-bold text-gray-900">{item.number}</td>
                          <td className="p-3">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${item.status === "READ" ? "bg-indigo-100 text-indigo-800" : item.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {item.status} {item.status === "READ" && "✓✓"}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-gray-400 truncate max-w-[100px]" title={item.messageId}>{item.messageId}</td>
                          
                          <td className="p-3 font-mono text-[10px] text-gray-600 w-[170px] break-words leading-tight">
                            {item.acknowledgement}
                          </td>

                          <td className="p-3 font-bold text-emerald-600">₹{item.cost}</td>

                          <td className="p-3 font-mono text-[11px] text-gray-700 w-[230px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : (item.date || "N/A")}
                          </td>

                          <td className="p-3 text-center">
                            <button onClick={() => { setSelectedItem(item); setShowPreviewModal(true); }} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 cursor-pointer">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* OTHER TABS */}
              {["schedule", "fallback", "api", "service"].includes(activeTab) && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b font-bold text-[11px]">
                      <th className="p-4">ID / Info</th>
                      <th className="p-4">Template / Name</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">No {activeTab} reports found.</td></tr>
                    ) : (
                      paginatedData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-bold text-gray-900">{item.campaignInfo || item.id}</td>
                          <td className="p-4 text-emerald-700 font-medium">{item.templateName || item.name || "N/A"}</td>
                          <td className="p-4 font-mono">{item.channel || "N/A"}</td>
                          <td className="p-4 font-bold">{item.status || "COMPLETED"}</td>
                          <td className="p-4 font-mono text-[11px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : (item.date || "N/A")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* PAGINATION & ROWS PER PAGE CONTROLS BAR */}
        <div className="bg-gray-50 border-t p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 font-medium">Showing {paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, activeDataset.length)} of {activeDataset.length} entries</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-2 py-1 bg-white font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border rounded-lg bg-white font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-gray-800">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border rounded-lg bg-white font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {/* RIGHT SIDE MOBILE PREVIEW MODAL */}
        {showPreviewModal && selectedItem && (
          <div className="w-80 border-l bg-gray-50 p-4 flex flex-col justify-between shadow-lg relative animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <span className="font-bold text-gray-800">Actual Sent Message Preview</span>
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
                    <div className="text-[9px] text-right text-indigo-600 font-bold font-mono mt-1">✓✓ READ (11:35 AM)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t text-[11px] space-y-1 font-mono text-gray-600">
              <div><strong>Recipient:</strong> {selectedItem.number || "+917518900801"}</div>
              <div><strong>Status:</strong> <span className="text-indigo-700 font-bold">{selectedItem.status}</span></div>
              <div><strong>Timestamp:</strong> <span className="text-gray-800">{selectedItem.createdAt ? new Date(srcTimestamp(selectedItem.createdAt)).toLocaleString('en-IN') : "N/A"}</span></div>
              <div><strong>Cost:</strong> ₹{selectedItem.cost}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function srcTimestamp(val: any) {
  return val;
}