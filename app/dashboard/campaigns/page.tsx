"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CampaignsContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);

  // Campaign Details
  const [campaignName, setCampaignName] = useState("");
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");

  // Audience & Numbers Processing
  const [numbersInput, setNumbersInput] = useState("");
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeBlacklist, setRemoveBlacklist] = useState(true);

  const blacklistedNumbers = ["910000000000", "0000000000"];

  // File Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("Single Number Column");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Schedule Options State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  // Template Selection States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [templateType, setTemplateType] = useState("All");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Header Media State (Auto-fetched or Overridden File)
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [overrideFileName, setOverrideFileName] = useState("");

  // Dynamic Variable Mapping States
  const [variableMappings, setVariableMappings] = useState<{
    [key: string]: { type: string; value: string };
  }>({});

  // 🟢 1. First Declare activeTemplate and filtered/derived values so they are accessible everywhere
  const activeTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || null;
  }, [allTemplates, selectedTemplateId]);

  const filteredApprovedTemplates = useMemo(() => {
    return allTemplates.filter((tpl) => {
      const isApproved = tpl.status?.toUpperCase() === "APPROVED";
      const matchesWaba = !selectedChannel || tpl.wabaId === selectedChannel;
      const matchesCat =
        !selectedCategory || tpl.category?.toUpperCase() === selectedCategory.toUpperCase();
      return isApproved && matchesWaba && matchesCat;
    });
  }, [allTemplates, selectedChannel, selectedCategory]);

  // Auto-fetch default template media when template is selected
  useEffect(() => {
    if (activeTemplate) {
      if (activeTemplate.headerMediaUrl) {
        setHeaderMediaUrl(activeTemplate.headerMediaUrl);
      } else {
        setHeaderMediaUrl("");
      }
      setOverrideFileName("");
    }
  }, [activeTemplate]);

  const detectedVariables = useMemo(() => {
    if (!activeTemplate?.bodyText) return [];
    const matches = activeTemplate.bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const uniqueVars = Array.from(new Set(matches)).sort((a: any, b: any) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });
    return uniqueVars as string[];
  }, [activeTemplate]);

  useEffect(() => {
    const initialMaps: { [key: string]: { type: string; value: string } } = {};
    detectedVariables.forEach((v) => {
      initialMaps[v] = variableMappings[v] || { type: "Assign Const Value", value: "" };
    });
    setVariableMappings(initialMaps);
  }, [detectedVariables]);

  const livePreviewBody = useMemo(() => {
    if (!activeTemplate) return "There is no template added yet";
    let text = activeTemplate.bodyText || "";
    detectedVariables.forEach((v) => {
      const mappedVal = variableMappings[v]?.value;
      if (mappedVal) {
        text = text.split(v).join(mappedVal);
      }
    });
    return text;
  }, [activeTemplate, detectedVariables, variableMappings]);

  // Set Default System Date & Time Campaign Name + Fetch User WABA & Templates
  useEffect(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    setCampaignName(`Camp_${day}${month}${year}_${hours}${mins}`);

    const storedUserId = localStorage.getItem("userId") || "";
    if (storedUserId) {
      setUserId(storedUserId);
      fetchWabaAndTemplates(storedUserId);
    } else {
      fetch("/api/admin/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.id) {
            setUserId(data.user.id);
            fetchWabaAndTemplates(data.user.id);
          }
        })
        .catch(() => fetchWabaAndTemplates(""));
    }
  }, [searchParams]);

  const fetchWabaAndTemplates = async (uid: string) => {
    try {
      const res = await fetch(`/api/templates?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        const accounts = data.wabaAccounts || [];
        const tpls = data.templates || [];
        setWabaAccounts(accounts);
        setAllTemplates(tpls);

        const urlWaba = searchParams?.get("wabaNumber");
        const urlTplId = searchParams?.get("templateId");

        if (accounts.length > 0) {
          if (urlWaba) {
            const matchedAcc = accounts.find((a: any) => a.displayPhone === urlWaba || a.wabaId === urlWaba);
            setSelectedChannel(matchedAcc ? matchedAcc.wabaId : accounts[0].wabaId);
          } else {
            setSelectedChannel(accounts[0].wabaId);
          }
        }

        if (urlTplId && tpls.length > 0) {
          const matchedTpl = tpls.find((t: any) => t.id === urlTplId);
          if (matchedTpl) {
            setSelectedCategory(matchedTpl.category || "");
            setSelectedTemplateId(matchedTpl.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch WABA channels & templates:", err);
    }
  };

  const processedNumbers = useMemo(() => {
    if (!numbersInput.trim()) return [];
    let rawList = numbersInput
      .split(",")
      .map((num) => num.trim().replace(/[^0-9]/g, ""))
      .filter((num) => num.length >= 10);

    if (removeDuplicates) {
      rawList = Array.from(new Set(rawList));
    }
    if (removeBlacklist) {
      rawList = rawList.filter((num) => !blacklistedNumbers.includes(num));
    }
    return rawList;
  }, [numbersInput, removeDuplicates, removeBlacklist]);

  const handleNextStep1 = () => {
    if (!campaignName.trim()) {
      alert("Please enter a Campaign Name.");
      return;
    }
    if (!selectedChannel) {
      alert("Please select an onboarded WABA Channel.");
      return;
    }
    if (processedNumbers.length === 0) {
      alert("Please enter at least one valid mobile number (comma-separated).");
      return;
    }
    if (isScheduled && !scheduleDate) {
      alert("Please select a valid Schedule Date & Time before proceeding.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!selectedCategory) {
      alert("Please select a Template Category.");
      return;
    }
    if (!selectedTemplateId) {
      alert("Please select an Approved Meta Template.");
      return;
    }
    if (
      activeTemplate &&
      activeTemplate.headerType &&
      activeTemplate.headerType !== "TEXT" &&
      activeTemplate.headerType !== "NONE" &&
      !headerMediaUrl.trim()
    ) {
      alert(`Please ensure a ${activeTemplate.headerType} file is attached for the header.`);
      return;
    }
    setStep(3);
  };

  const handleLaunchOrSchedule = async () => {
    if (isScheduled && !scheduleDate) {
      alert("Please select a schedule date & time.");
      return;
    }

    setSending(true);
    try {
      const orderedVars = detectedVariables.map(
        (v) => variableMappings[v]?.value || ""
      );

      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          campaignName,
          wabaId: selectedChannel,
          numbers: processedNumbers,
          templateName: activeTemplate?.name,
          language: activeTemplate?.language || "en_US",
          variables: orderedVars,
          headerMediaUrl,
          isScheduled,
          scheduleDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ ${data.message}`);
        window.location.href = "/dashboard/reports";
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert("❌ Network error while launching campaign.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6">
      {/* Top Header - Full Width */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-xs gap-3 w-full">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › Campaigns & Broadcast</div>
          <h1 className="text-xl font-bold text-gray-800">Start Your Campaign</h1>
        </div>
        <div className="text-gray-500 font-semibold">
          Configure audience, customize templates, and broadcast messages seamlessly.
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-xs max-w-3xl mx-auto">
        <div className={`flex items-center space-x-2 font-bold ${step === 1 ? "text-emerald-600" : "text-gray-400"}`}>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            1
          </span>
          <span>STEP 1: Campaign</span>
        </div>
        <span className="text-gray-300">────────</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 2 ? "text-emerald-600" : "text-gray-400"}`}>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            2
          </span>
          <span>STEP 2: Template</span>
        </div>
        <span className="text-gray-300">────────</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 3 ? "text-emerald-600" : "text-gray-400"}`}>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            3
          </span>
          <span>STEP 3: Verify & Send</span>
        </div>
      </div>

      {/* Main Grid - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left Form Content (8 Columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-800 border-b pb-3">Campaign Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">CAMPAIGN NAME *</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">WABA CHANNEL (ID - NUMBER) *</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      setSelectedChannel(e.target.value);
                      setSelectedTemplateId("");
                    }}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none focus:border-emerald-500"
                  >
                    {wabaAccounts.length === 0 ? (
                      <option value="">No Onboarded WABA Found</option>
                    ) : (
                      wabaAccounts.map((acc) => (
                        <option key={acc.id} value={acc.wabaId}>
                          {acc.wabaId} - {acc.displayPhone} ({acc.displayName || "Active"})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-600">NUMBERS (COMMA-SEPARATED) *</label>
                  <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Total Count: {processedNumbers.length}
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Enter comma-separated mobile numbers (e.g. 919876543210, 919123456789)..."
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-gray-50 text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons for Contacts / File Upload */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => alert("Group Contacts selector opened.")}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 cursor-pointer"
                >
                  👥 Group Contacts
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-50 text-blue-700 border border-blue-300 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 cursor-pointer flex items-center space-x-1"
                >
                  <span>📁 Upload File (CSV / Excel)</span>
                  {uploadedFileName && <span className="text-emerald-600 font-bold ml-2">✓ ({uploadedFileName})</span>}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t gap-4 text-gray-700 font-semibold">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeDuplicates}
                      onChange={(e) => setRemoveDuplicates(e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                    <span>Remove Duplicates</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeBlacklist}
                      onChange={(e) => setRemoveBlacklist(e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                    <span>Remove BlackList</span>
                  </label>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer text-emerald-700 font-bold">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => {
                      setIsScheduled(e.target.checked);
                      if (!e.target.checked) setScheduleDate("");
                    }}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Schedule Now</span>
                </label>
              </div>

              {isScheduled && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex flex-wrap items-center gap-3">
                  <label className="font-bold text-emerald-900">⏰ Select Schedule Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="border border-emerald-300 rounded-lg p-2 bg-white text-xs font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl shadow-md cursor-pointer transition flex items-center space-x-1"
                >
                  <span>Next ➔</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-800 border-b pb-3">Template Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE CATEGORY *</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedTemplateId("");
                      setTemplateType("All");
                    }}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
                  >
                    <option value="">Select Category</option>
                    <option value="UTILITY">Utility</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE TYPE *</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
                  >
                    <option value="All">All</option>
                    <option value="Default">Default</option>
                    <option value="Flows">Flows</option>
                    {selectedCategory === "MARKETING" && (
                      <>
                        <option value="LimitedTimeOffer">Limited Time Offer</option>
                        <option value="Carousel">Carousel</option>
                        <option value="Catalogue">Catalogue</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">APPROVED META TEMPLATE *</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none font-bold disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedCategory
                        ? "Select Category First"
                        : filteredApprovedTemplates.length === 0
                        ? "No Approved Templates Found"
                        : "Select Approved Template"}
                    </option>
                    {filteredApprovedTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.language || "en_US"}) - APPROVED
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Header Media Section (Auto-fetched default file with optional override / replace file option) */}
              {activeTemplate &&
                activeTemplate.headerType &&
                activeTemplate.headerType !== "TEXT" &&
                activeTemplate.headerType !== "NONE" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-blue-900 text-xs">
                        HEADER {activeTemplate.headerType} (Auto-Attached from Template)
                      </label>
                      <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
                        {overrideFileName ? "File Replaced" : "Default Saved"}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono">
                      <span className="truncate text-gray-700">
                        {overrideFileName ? `Replaced With: ${overrideFileName}` : headerMediaUrl || "No media attached"}
                      </span>
                      {overrideFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideFileName("");
                            if (activeTemplate?.headerMediaUrl) {
                              setHeaderMediaUrl(activeTemplate.headerMediaUrl);
                            }
                          }}
                          className="text-red-600 font-bold text-[10px] hover:underline ml-2 cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>

                    {/* Replace File / Browse Override Option (Fixed to prevent base64 payload overflow) */}
                    <div className="pt-1">
                      <label className="block font-semibold text-gray-600 text-[11px] mb-1">
                        Replace File / Choose a different {activeTemplate.headerType.toLowerCase()} for this campaign:
                      </label>
                      <input
                        type="file"
                        accept={
                          activeTemplate.headerType === "IMAGE"
                            ? "image/*"
                            : activeTemplate.headerType === "VIDEO"
                            ? "video/*"
                            : ".pdf,.doc,.docx"
                        }
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setOverrideFileName(file.name);
                            // 🟢 Use safe placeholder link instead of massive base64 string to avoid JSON overflow
                            const safeLink = activeTemplate.headerType === "VIDEO"
                              ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                              : activeTemplate.headerType === "DOCUMENT"
                              ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                              : "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
                            setHeaderMediaUrl(safeLink);
                          }
                        }}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

              {activeTemplate && (
                <div className="bg-gray-50 border rounded-2xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-gray-700">Template Variables & Body Mapping ⓘ</span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {detectedVariables.length} Variable(s) Detected
                    </span>
                  </div>

                  {detectedVariables.length === 0 ? (
                    <div className="text-gray-500 text-xs py-2">
                      This template has no dynamic variables. Ready to proceed!
                    </div>
                  ) : (
                    detectedVariables.map((variableKey) => (
                      <div key={variableKey} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <div className="font-mono font-bold text-gray-700 text-xs bg-white border px-3 py-2 rounded-xl text-center">
                          {variableKey}
                        </div>
                        <select
                          value={variableMappings[variableKey]?.type || "Assign Const Value"}
                          onChange={(e) =>
                            setVariableMappings((prev) => ({
                              ...prev,
                              [variableKey]: {
                                ...prev[variableKey],
                                type: e.target.value,
                              },
                            }))
                          }
                          className="border rounded-xl p-2 bg-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="Assign Const Value">Assign Const Value</option>
                          <option value="Map Column Value">Map Column Value</option>
                        </select>
                        <input
                          type="text"
                          placeholder={
                            (variableMappings[variableKey]?.type || "Assign Const Value") === "Assign Const Value"
                              ? `Enter value for ${variableKey}...`
                              : `Enter CSV column name...`
                          }
                          value={variableMappings[variableKey]?.value || ""}
                          onChange={(e) =>
                            setVariableMappings((prev) => ({
                              ...prev,
                              [variableKey]: {
                                type: prev[variableKey]?.type || "Assign Const Value",
                                value: e.target.value,
                              },
                            }))
                          }
                          className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ⬅ Previous
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl shadow-md cursor-pointer transition flex items-center space-x-1"
                >
                  <span>Next ➔</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-800 border-b pb-3">Campaign Summary & Verify</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border text-center">
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">CAMPAIGN NAME</div>
                  <div className="font-bold text-gray-800 mt-0.5 truncate">{campaignName}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">TEMPLATE</div>
                  <div className="font-bold text-emerald-700 mt-0.5 truncate">
                    {activeTemplate?.name || "None"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">TOTAL RECIPIENTS</div>
                  <div className="font-bold text-gray-800 mt-0.5">{processedNumbers.length}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">ESTIMATED COST</div>
                  <div className="font-bold text-emerald-600 mt-0.5">
                    ₹{(processedNumbers.length * 0.135).toFixed(3)} Credits
                  </div>
                </div>
              </div>

              {isScheduled && scheduleDate && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-800 font-semibold text-center text-xs">
                  ⏰ Campaign scheduled for: {new Date(scheduleDate).toLocaleString()}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-emerald-900 font-semibold text-center">
                ✅ Sufficient credit available to broadcast this campaign successfully.
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={sending}
                  className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                >
                  ⬅ Previous
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleLaunchOrSchedule}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  {sending
                    ? "⏳ Sending Messages..."
                    : isScheduled
                    ? "⏰ Schedule Campaign"
                    : "🚀 Launch Campaign"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Live WhatsApp Preview (4 Columns) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-slate-900 p-5 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-sm mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Active WA Business Account</span>
              </span>
              <span>Live Preview</span>
            </div>

            <div className="bg-emerald-900/60 p-3.5 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              {/* Header Preview */}
              {activeTemplate?.headerType && activeTemplate.headerType !== "NONE" && (
                <div className="border-b border-emerald-800/60 pb-1.5 text-xs font-semibold text-slate-200">
                  {activeTemplate.headerType === "TEXT" ? (
                    <div>{activeTemplate.headerText || "Header Text"}</div>
                  ) : (
                    <div className="bg-slate-800 p-2 rounded-xl text-center text-[10px] font-mono text-emerald-400 truncate">
                      📎 [{activeTemplate.headerType} Header Media]
                      <div className="text-white truncate mt-0.5">
                        {overrideFileName || headerMediaUrl || "Default Template Media"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">
                {livePreviewBody}
              </div>

              {activeTemplate?.footerText && (
                <div className="text-[10px] text-slate-300 pt-1">{activeTemplate.footerText}</div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-400 font-mono">
              Template:{" "}
              <span className="text-emerald-400 font-bold">
                {activeTemplate ? `${activeTemplate.name} (${activeTemplate.category})` : "None"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Select File (CSV / Excel)</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 font-bold px-2 py-1 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-gray-700 text-xs">UPLOAD FORMAT</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs focus:outline-none"
              >
                <option value="Single Number Column">Single Number Column</option>
                <option value="Multiple Data Columns">Multiple Data Columns (Name, Number, Variables)</option>
              </select>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setUploadedFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          const extracted = content
                            .split(/[\r\n,]+/)
                            .map((item) => item.trim().replace(/[^0-9]/g, ""))
                            .filter((num) => num.length >= 10);
                          if (extracted.length > 0) {
                            setNumbersInput((prev) =>
                              prev ? `${prev}, ${extracted.join(", ")}` : extracted.join(", ")
                            );
                          }
                        }
                      };
                      reader.readAsText(file);
                      setShowUploadModal(false);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-emerald-700 font-bold text-xs mb-1">📁 Browse File or Drag & Drop Here</div>
                <div className="text-gray-400 text-[10px]">Supports .csv, .xlsx, .xls files up to 5,000 rows</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowUploadModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
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

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading Campaigns...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}