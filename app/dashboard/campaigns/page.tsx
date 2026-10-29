"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CampaignsPage() {
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("Campaign_000000");
  const [numbersInput, setNumbersInput] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("28402710282733872");
  
  // File Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("Single Number Column");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Schedule Options State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  // Template Selection States (Exact match as per screenshots)
  const [selectedCategory, setSelectedCategory] = useState("");
  const [templateType, setTemplateType] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Variable Mapping States
  const [mappingType1, setMappingType1] = useState("Assign Const Value");
  const [val1, setVal1] = useState("");
  const [mappingType2, setMappingType2] = useState("Assign Const Value");
  const [val2, setVal2] = useState("");
  const [mappingType3, setMappingType3] = useState("Assign Const Value");
  const [val3, setVal3] = useState("");

  // Fix prerender error by generating dynamic name client-side
  useEffect(() => {
    setCampaignName(`Campaign_${Date.now().toString().slice(-6)}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 max-w-7xl mx-auto relative">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-3">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › Campaigns & Broadcast</div>
          <h1 className="text-xl font-bold text-gray-800">Start Your Campaign</h1>
        </div>
        <div className="text-gray-500 font-semibold">Configure audience, customize templates, and broadcast messages seamlessly.</div>
      </div>

      {/* Step Indicator Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-xs max-w-2xl mx-auto">
        <div className={`flex items-center space-x-2 font-bold ${step === 1 ? "text-emerald-600" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>1</span>
          <span>STEP 1: Campaign</span>
        </div>
        <span className="text-gray-300">───</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 2 ? "text-emerald-600" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>2</span>
          <span>STEP 2: Template</span>
        </div>
        <span className="text-gray-300">───</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 3 ? "text-emerald-600" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>3</span>
          <span>STEP 3: Verify & Send</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Content */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          
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
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">WABA CHANNEL *</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none"
                  >
                    <option value="28402710282733872">28402710282733872 (Active - 580)</option>
                    <option value="9823410293841029">9823410293841029 (Backup)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-600">NUMBERS *</label>
                  <span className="text-gray-400 text-[11px]">Total Count: {numbersInput ? numbersInput.split(',').filter(Boolean).length : 0}</span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Enter up to 5,000 comma-separated mobile numbers..."
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-gray-50 text-xs font-mono focus:outline-none focus:bg-white"
                />
              </div>

              {/* Action Buttons for Contacts / File Upload */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert("Group Contacts feature selected.")}
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
                    <input type="checkbox" defaultChecked className="accent-emerald-600 rounded" />
                    <span>Remove Duplicates</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-emerald-600 rounded" />
                    <span>Remove BlackList</span>
                  </label>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer text-emerald-700">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Schedule Now</span>
                </label>
              </div>

              {/* Schedule Date Input if enabled */}
              {isScheduled && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center space-x-3">
                  <label className="font-bold text-gray-700">Select Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="border rounded-lg p-2 bg-white text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep(2)}
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
                      setSelectedTemplate(""); // Reset template when category changes
                    }}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
                  >
                    <option value="">Select Category[cite: 9]</option>
                    <option value="Marketing">Marketing[cite: 9]</option>
                    <option value="Utility">Utility[cite: 9]</option>
                    <option value="Authentication">Authentication[cite: 9]</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE TYPE *</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
                  >
                    <option value="All">All[cite: 10]</option>
                    <option value="Default">Default[cite: 10]</option>
                    <option value="Flows">Flows[cite: 12]</option>
                    <option value="LimitedTimeOffer">Limited Time Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">META TEMPLATE *</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none font-bold disabled:opacity-50"
                  >
                    <option value="">Select Template[cite: 8]</option>
                    {selectedCategory === "Utility" && (
                      <option value="feedback_collection">feedback_collection[cite: 13]</option>
                    )}
                    {selectedCategory === "Authentication" && (
                      <option value="otp_test">otp_test</option>
                    )}
                    {selectedCategory === "Marketing" && (
                      <option value="promotional_offer">promotional_offer</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic Body Variable Mapping Section (Appears when template is selected) */}
              {selectedTemplate && (
                <div className="bg-gray-50 border rounded-2xl p-4 space-y-4">
                  <div className="font-bold text-gray-700 border-b pb-2">Body ⓘ</div>

                  {/* Variable 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="font-mono font-bold text-gray-600 text-xs">{"{{1}}"}[cite: 14, 15]</div>
                    <select
                      value={mappingType1}
                      onChange={(e) => setMappingType1(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="Assign Const Value">Assign Const Value[cite: 15]</option>
                      <option value="Map Column Value">Map Column Value[cite: 15]</option>
                    </select>
                    <input
                      type="text"
                      placeholder={mappingType1 === "Assign Const Value" ? "Enter value..." : "Enter column name..."}
                      value={val1}
                      onChange={(e) => setVal1(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none"
                    />
                  </div>

                  {/* Variable 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="font-mono font-bold text-gray-600 text-xs">{"{{2}}"}[cite: 14]</div>
                    <select
                      value={mappingType2}
                      onChange={(e) => setMappingType2(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="Assign Const Value">Assign Const Value</option>
                      <option value="Map Column Value">Map Column Value</option>
                    </select>
                    <input
                      type="text"
                      placeholder={mappingType2 === "Assign Const Value" ? "Enter value..." : "Enter column name..."}
                      value={val2}
                      onChange={(e) => setVal2(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none"
                    />
                  </div>

                  {/* Variable 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="font-mono font-bold text-gray-600 text-xs">{"{{3}}"}[cite: 14]</div>
                    <select
                      value={mappingType3}
                      onChange={(e) => setMappingType3(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="Assign Const Value">Assign Const Value</option>
                      <option value="Map Column Value">Map Column Value</option>
                    </select>
                    <input
                      type="text"
                      placeholder={mappingType3 === "Assign Const Value" ? "Enter value..." : "Enter column name..."}
                      value={val3}
                      onChange={(e) => setVal3(e.target.value)}
                      className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none"
                    />
                  </div>
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
                  onClick={() => setStep(3)}
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
                  <div className="font-bold text-gray-800 mt-0.5">{campaignName}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">TEMPLATE</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{selectedTemplate || "None"}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">TOTAL RECIPIENTS</div>
                  <div className="font-bold text-gray-800 mt-0.5">{numbersInput ? numbersInput.split(',').filter(Boolean).length : 1}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold text-[10px]">ESTIMATED COST</div>
                  <div className="font-bold text-emerald-600 mt-0.5">₹0.135 Credits</div>
                </div>
              </div>

              {isScheduled && scheduleDate && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-800 font-semibold text-center text-xs">
                  ⏰ Campaign scheduled for: {scheduleDate}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-emerald-900 font-semibold text-center">
                ✅ Sufficient credit available to broadcast this campaign successfully.
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ⬅ Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(isScheduled ? "Campaign Scheduled Successfully! ⏰" : "Campaign Launched Successfully! 🚀");
                    window.location.href = "/dashboard/campaigns";
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg cursor-pointer transition"
                >
                  {isScheduled ? "⏰ Schedule Campaign" : "🚀 Launch Campaign"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Live WhatsApp Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-xs mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Active WA Business Account</span>
              </span>
              <span>12:45 PM</span>
            </div>

            <div className="bg-emerald-900/60 p-3 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">
                {selectedTemplate === "feedback_collection"
                  ? `Hi ${val1 || "{{1}}"}, the service request we completed on ${val2 || "{{2}}"} is now closed. Please rate your experience from 1-5 and share any feedback to help us improve your recent request with us at the link below:`
                  : selectedTemplate
                  ? `${val1 || "{{1}}"} is your template preview content here.`
                  : "There is no template added yet"}
              </div>
              {selectedTemplate && (
                <div className="pt-2">
                  <div className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow-xs">
                    Copy Code
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Template: <span className="text-emerald-400 font-bold">{selectedTemplate || "None"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* File Upload Modal (Popup) matching original panel */}
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
                      setUploadedFileName(e.target.files[0].name);
                      alert("File uploaded successfully: " + e.target.files[0].name);
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