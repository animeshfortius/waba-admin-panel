"use client";

import { useState } from "react";

export default function CreateTemplatePage() {
  const [step, setStep] = useState(2);
  const [category, setCategory] = useState("Marketing");
  
  // Form States
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("English");
  const [wabaAccount] = useState("28402710282733872");
  const [mediaType, setMediaType] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("Hello");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<string[]>([]);
  const [showButtonMenu, setShowButtonMenu] = useState(false);

  // Function to insert variable in Body
  const addVariableToBody = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g);
    const nextVarIndex = matches ? matches.length + 1 : 1;
    setBodyText((prev) => prev + ` {{${nextVarIndex}}}`);
  };

  // Function to insert variable in Header
  const addVariableToHeader = () => {
    const matches = headerText.match(/\{\{\d+\}\}/g);
    const nextVarIndex = matches ? matches.length + 1 : 1;
    setHeaderText((prev) => prev + ` {{${nextVarIndex}}}`);
  };

  // Formatting helper functions
  const applyFormatting = (symbol: string) => {
    if (symbol === "bold") setBodyText((prev) => prev + " *bold_text* ");
    if (symbol === "italic") setBodyText((prev) => prev + " _italic_text_ ");
    if (symbol === "strike") setBodyText((prev) => prev + " ~strikethrough~ ");
    if (symbol === "code") setBodyText((prev) => prev + " ```monospace``` ");
    if (symbol === "emoji") setBodyText((prev) => prev + " 😊 ");
  };

  const handleAddButton = (btnName: string) => {
    setButtons([...buttons, btnName]);
    setShowButtonMenu(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div>
        <div className="text-xs text-gray-400 mb-1">
          WA Template <span className="mx-1">›</span> Add Template
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Create WhatsApp Template</h1>
      </div>

      {/* Step Tabs */}
      <div className="flex space-x-4 bg-white p-4 rounded-xl border shadow-sm items-center">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            step === 1 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>1️⃣</span>
          <span>Set up template</span>
        </button>
        <button
          onClick={() => setStep(2)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            step === 2 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>2️⃣</span>
          <span>Edit template</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-800">Set up your Template</h3>
                <p className="text-xs text-gray-500">Choose the category and type for your message template.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["Marketing", "Utility", "Authentication"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition text-center ${
                      category === cat
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow transition"
                >
                  Next ➔
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Template Name & Language Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold uppercase">Template Name</span>
                    <span>{templateName.length}/512</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter a template name..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">WABA Account</label>
                <input
                  type="text"
                  readOnly
                  value={wabaAccount}
                  className="w-full border rounded-lg p-2.5 text-sm bg-gray-100 font-mono text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Media Sample Option */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Media sample • Optional</label>
                <select
                  value={mediaType}
                  onChange={(e) => {
                    setMediaType(e.target.value);
                    if (e.target.value !== "None") {
                      setHeaderText("");
                    }
                  }}
                  className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                >
                  <option value="None">None</option>
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="Document">Document</option>
                  <option value="Location">Location</option>
                </select>
              </div>

              {/* HEADER SECTION */}
              {mediaType === "None" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-semibold uppercase">Header • Optional</span>
                    <span>{headerText.length}/60</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Add a short line of text to the header of your message in English"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={addVariableToHeader}
                      className="text-xs text-blue-600 font-medium hover:underline flex items-center space-x-1"
                    >
                      <span>+ Add Variable</span>
                    </button>
                  </div>
                </div>
              )}

              {/* BODY SECTION */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-semibold uppercase">Body</span>
                  <span>{bodyText.length}/1024</span>
                </div>
                <div className="border rounded-lg bg-gray-50 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                  <textarea
                    rows={4}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Enter your message text..."
                    className="w-full p-3 text-sm bg-transparent focus:outline-none resize-y"
                  />
                  
                  {/* Rich Formatting Toolbar & + Add Variable */}
                  <div className="flex items-center justify-end border-t bg-white px-3 py-1.5 space-x-3 text-xs">
                    <div className="flex items-center space-x-2 border-r pr-3 text-gray-600 font-semibold">
                      <button onClick={() => applyFormatting("emoji")} title="Add Emoji" className="hover:bg-gray-100 p-1 rounded">😊</button>
                      <button onClick={() => applyFormatting("bold")} title="Bold" className="hover:bg-gray-100 p-1 rounded font-bold">B</button>
                      <button onClick={() => applyFormatting("italic")} title="Italic" className="hover:bg-gray-100 p-1 rounded italic">I</button>
                      <button onClick={() => applyFormatting("strike")} title="Strikethrough" className="hover:bg-gray-100 p-1 rounded line-through">S</button>
                      <button onClick={() => applyFormatting("code")} title="Code Monospace" className="hover:bg-gray-100 p-1 rounded font-mono">{"</>"}</button>
                    </div>

                    <button
                      onClick={addVariableToBody}
                      className="text-blue-600 font-medium hover:underline flex items-center space-x-1"
                    >
                      <span>+ Add Variable</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER SECTION */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-semibold uppercase">Footer • Optional</span>
                  <span>{footerText.length}/60</span>
                </div>
                <input
                  type="text"
                  placeholder="Enter footer text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none"
                />
              </div>

              {/* BUTTONS SECTION WITH OFFICIAL OPTIONS & ICONS */}
              <div className="space-y-2 pt-2 border-t relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Buttons • Optional</label>
                
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowButtonMenu(!showButtonMenu)}
                    className="border bg-emerald-50 text-emerald-700 border-emerald-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center space-x-1.5"
                  >
                    <span>+ Add Button</span>
                  </button>

                  {/* Dropdown Menu for Official WhatsApp Buttons */}
                  {showButtonMenu && (
                    <div className="absolute left-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-20 py-2 text-xs font-medium text-gray-700 space-y-1">
                      <button
                        onClick={() => handleAddButton("Custom")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>↩️</span>
                        <span>Custom (Quick Reply)</span>
                      </button>
                      <button
                        onClick={() => handleAddButton("Visit website")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>↗️</span>
                        <span>Visit website</span>
                      </button>
                      <button
                        onClick={() => handleAddButton("Call on WhatsApp")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>💬</span>
                        <span>Call on WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleAddButton("Call Phone Number")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>📞</span>
                        <span>Call Phone Number</span>
                      </button>
                      <button
                        onClick={() => handleAddButton("Complete flow")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>📋</span>
                        <span>Complete flow</span>
                      </button>
                      <button
                        onClick={() => handleAddButton("Copy offer code")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2.5"
                      >
                        <span>📑</span>
                        <span>Copy offer code</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Added Buttons List */}
                {buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="bg-gray-50 border px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 shadow-sm">
                        <span>
                          {btn === "Custom" && "↩️"}
                          {btn === "Visit website" && "↗️"}
                          {btn === "Call on WhatsApp" && "💬"}
                          {btn === "Call Phone Number" && "📞"}
                          {btn === "Complete flow" && "📋"}
                          {btn === "Copy offer code" && "📑"}
                        </span>
                        <span className="font-bold text-gray-800">{btn}</span>
                        <button
                          onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 ml-1 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Submit Row */}
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="border px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  ⬅ Previous
                </button>
                <button
                  onClick={() => alert("Template Submitted for Review!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow transition"
                >
                  Submit for Review
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right WhatsApp Mobile Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-xl w-full max-w-sm mx-auto text-white space-y-4">
            <div className="text-center text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
              📱 WhatsApp Preview
            </div>

            <div className="bg-emerald-800 p-3 rounded-2xl space-y-2 text-xs shadow-inner">
              {mediaType !== "None" && (
                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-semibold text-xs border border-slate-700">
                  📷 [{mediaType} Sample]
                </div>
              )}
              {mediaType === "None" && headerText && (
                <p className="font-bold text-white text-sm">{headerText}</p>
              )}
              <p className="whitespace-pre-wrap text-slate-100 leading-relaxed">{bodyText}</p>
              {footerText && <p className="text-[10px] text-slate-300 pt-1 border-t border-emerald-700">{footerText}</p>}

              {/* Buttons Preview */}
              {buttons.length > 0 && (
                <div className="pt-2 space-y-1">
                  {buttons.map((b, i) => (
                    <div key={i} className="bg-white text-emerald-800 text-center py-1.5 rounded-lg font-bold text-xs shadow flex items-center justify-center space-x-1.5">
                      <span>
                        {b === "Custom" && "↩️"}
                        {b === "Visit website" && "↗️"}
                        {b === "Call on WhatsApp" && "💬"}
                        {b === "Call Phone Number" && "📞"}
                        {b === "Complete flow" && "📋"}
                        {b === "Copy offer code" && "📑"}
                      </span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-2">
              Language: <span className="text-emerald-400 font-semibold">{language}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}