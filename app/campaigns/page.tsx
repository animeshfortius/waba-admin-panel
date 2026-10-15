"use client";

import { useState } from "react";

export default function CampaignsPage() {
  const [step, setStep] = useState(1); // 1: Campaign, 2: Template, 3: Verify & Send

  // Step 1 States
  const [campaignName, setCampaignName] = useState("10 Oct 2026 18:10:57");
  const [numbers, setNumbers] = useState("");
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeBlacklist, setRemoveBlacklist] = useState(true);
  const [scheduleNow, setScheduleNow] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Step 2 States
  const [templateCategory, setTemplateCategory] = useState("Utility");
  const [templateType, setTemplateType] = useState("All");
  const [metaTemplate, setMetaTemplate] = useState("feedback_collection");
  const [var1, setVar1] = useState("123");
  const [var2, setVar2] = useState("123");
  const [var3, setVar3] = useState("123");

  const totalCount = numbers ? numbers.split(",").filter(n => n.trim() !== "").length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div>
        <div className="text-xs text-gray-400 mb-1">
          WA Message <span className="mx-1">›</span> WASendMessage <span className="mx-1">›</span> Index
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Start Your Campaign</h1>
        <p className="text-xs text-gray-500">Configure your audience, customize templates, and broadcast messages seamlessly.</p>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0"></div>
          
          <div className={`relative z-10 flex flex-col items-center cursor-pointer`} onClick={() => setStep(1)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow ${step >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              📢
            </div>
            <span className="text-xs font-bold text-gray-700 mt-2">STEP 1: Campaign</span>
          </div>

          <div className={`relative z-10 flex flex-col items-center cursor-pointer`} onClick={() => setStep(2)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow ${step >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              📄
            </div>
            <span className="text-xs font-bold text-gray-700 mt-2">STEP 2: Template</span>
          </div>

          <div className={`relative z-10 flex flex-col items-center cursor-pointer`} onClick={() => setStep(3)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow ${step >= 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              🚀
            </div>
            <span className="text-xs font-bold text-gray-700 mt-2">STEP 3: Verify & Send</span>
          </div>
        </div>
      </div>

      {/* Main Grid with Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Content */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          
          {/* STEP 1: Campaign Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Campaign Details</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Numbers *</label>
                  <span className="text-xs font-bold text-gray-600">Total Count ({totalCount})</span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Enter up to 5,000 comma-separated mobile numbers..."
                  value={numbers}
                  onChange={(e) => setNumbers(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm bg-gray-50 focus:outline-none font-mono"
                />
                <div className="flex gap-3 mt-2">
                  <button onClick={() => alert("Group Contacts selected")} className="border px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                    👥 Group Contacts
                  </button>
                  <button onClick={() => alert("Upload CSV / Excel")} className="border px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100">
                    📂 Upload File (CSV / Excel)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2 border-t text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-gray-700">Remove Duplicates</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeBlacklist}
                    onChange={(e) => setRemoveBlacklist(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-gray-700">Remove BlackList</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleNow}
                    onChange={(e) => setScheduleNow(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-gray-700">Schedule Now</span>
                </label>
              </div>

              {scheduleNow && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow transition"
                >
                  Next ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Template Information & Variable Mapping */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Template Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Template Category *</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Utility">Utility</option>
                    <option value="Authentication">Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Template Type *</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Default">Default</option>
                    <option value="Flows">Flows</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Template *</label>
                  <select
                    value={metaTemplate}
                    onChange={(e) => setMetaTemplate(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                  >
                    <option value="feedback_collection">feedback_collection</option>
                    <option value="otp_test">otp_test</option>
                  </select>
                </div>
              </div>

              {/* Variable Mapping Section */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-gray-700">Body Variables Mapping</h4>
                
                <div className="grid grid-cols-3 gap-3 items-center bg-gray-50 p-3 rounded-xl border text-sm">
                  <span className="font-mono text-emerald-700 font-bold">{"{{1}}"}</span>
                  <select className="border rounded-lg p-2 bg-white text-xs">
                    <option>Assign Const Value</option>
                    <option>Map Column Value</option>
                  </select>
                  <input
                    type="text"
                    value={var1}
                    onChange={(e) => setVar1(e.target.value)}
                    className="border rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 items-center bg-gray-50 p-3 rounded-xl border text-sm">
                  <span className="font-mono text-emerald-700 font-bold">{"{{2}}"}</span>
                  <select className="border rounded-lg p-2 bg-white text-xs">
                    <option>Assign Const Value</option>
                    <option>Map Column Value</option>
                  </select>
                  <input
                    type="text"
                    value={var2}
                    onChange={(e) => setVar2(e.target.value)}
                    className="border rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 items-center bg-gray-50 p-3 rounded-xl border text-sm">
                  <span className="font-mono text-emerald-700 font-bold">{"{{3}}"}</span>
                  <select className="border rounded-lg p-2 bg-white text-xs">
                    <option>Assign Const Value</option>
                    <option>Map Column Value</option>
                  </select>
                  <input
                    type="text"
                    value={var3}
                    onChange={(e) => setVar3(e.target.value)}
                    className="border rounded-lg p-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="border px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ⬅ Previous
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow transition"
                >
                  Next ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Verify & Send Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3">Campaign Summary</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Campaign Name</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{campaignName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Template</p>
                  <p className="text-sm font-bold text-emerald-700">{metaTemplate}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Category</p>
                  <p className="text-sm font-bold text-gray-800">{templateCategory}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs text-gray-400 font-semibold uppercase">Total Audience</p>
                  <p className="text-sm font-bold text-blue-600">{totalCount || 1}</p>
                </div>
              </div>

              {/* Credit breakdown */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-emerald-900">Total Credit Required:</span>
                  <span className="font-bold text-emerald-700 text-base">₹0.135</span>
                </div>
                <p className="text-xs text-emerald-700">🟢 Sufficient Credit Available in your wallet.</p>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="border px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ⬅ Previous
                </button>
                <button
                  onClick={() => alert("Campaign Launched Successfully!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg transition"
                >
                  🚀 Launch Campaign
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right WhatsApp Preview Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-xl w-full max-w-sm mx-auto text-white space-y-4">
            <div className="text-center text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
              📱 Active-08 Business Account
            </div>

            <div className="bg-emerald-800 p-3 rounded-2xl space-y-2 text-xs shadow-inner">
              <p className="font-bold text-white">Hi {var1},</p>
              <p className="text-slate-100 leading-relaxed">
                the service request we completed on {var2} is now closed. Please rate your experience from 1-5 and share any feedback to help us improve your recent {var3} with us at the link below.
              </p>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2">
              Template: <span className="text-emerald-400 font-semibold">{metaTemplate}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}