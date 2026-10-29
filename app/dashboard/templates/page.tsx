"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateWhatsAppTemplateModule() {
  const [step, setStep] = useState(1);

  // Step 1 States
  const [category, setCategory] = useState<"Marketing" | "Utility" | "Authentication">("Marketing");
  const [subType, setSubType] = useState("Default");

  // Step 2 General Form States
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("English");
  const [wabaAccount, setWabaAccount] = useState("28402710282733872");
  const [allowCategoryChange, setAllowCategoryChange] = useState(false);

  // Header, Body, Footer
  const [mediaType, setMediaType] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("Hello {{1}}, welcome to our service!");
  const [footerText, setFooterText] = useState("");

  // Buttons State
  const [buttons, setButtons] = useState<{ id: string; type: string; text: string; value?: string }[]>([]);
  const [showButtonMenu, setShowButtonMenu] = useState(false);

  // Authentication Specific States
  const [codeDeliveryOption, setCodeDeliveryOption] = useState("zero_tap");
  const [apps, setApps] = useState<{ packageName: string; signatureHash: string }[]>([
    { packageName: "com.example.myapp", signatureHash: "12345678901" },
  ]);
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState(10);
  const [addSecurityRecommendation, setAddSecurityRecommendation] = useState(true);

  // Carousel Cards State
  const [carouselCards, setCarouselCards] = useState([
    { id: 1, mediaType: "Image", mediaUrl: "", text: "Card 1 Offer Details", buttonText: "View Item" },
    { id: 2, mediaType: "Image", mediaUrl: "", text: "Card 2 Offer Details", buttonText: "View Item" },
  ]);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  // Helper Functions for Variables
  const addVariableToHeader = () => {
    const matches = headerText.match(/\{\{\d+\}\}/g);
    const nextVar = matches ? matches.length + 1 : 1;
    setHeaderText((prev) => prev + ` {{${nextVar}}}`);
  };

  const addVariableToBody = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g);
    const nextVar = matches ? matches.length + 1 : 1;
    setBodyText((prev) => prev + ` {{${nextVar}}}`);
  };

  const applyFormatting = (type: string) => {
    if (type === "bold") setBodyText((prev) => prev + " *bold* ");
    if (type === "italic") setBodyText((prev) => prev + " _italic_ ");
    if (type === "strike") setBodyText((prev) => prev + " ~strikethrough~ ");
    if (type === "code") setBodyText((prev) => prev + " ```code``` ");
    if (type === "emoji") setBodyText((prev) => prev + " 😊 ");
  };

  // Button Management
  const handleAddButton = (type: string) => {
    if (buttons.length >= 10) {
      alert("Maximum 10 buttons allowed");
      return;
    }
    const newBtn = {
      id: Date.now().toString(),
      type,
      text: type === "Custom" ? "Quick Reply" : type === "Visit website" ? "Visit Website" : type,
      value: "",
    };
    setButtons([...buttons, newBtn]);
    setShowButtonMenu(false);
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // App Setup Helpers (Auth)
  const handleAddApp = () => {
    setApps([...apps, { packageName: "", signatureHash: "" }]);
  };

  const handleRemoveApp = (idx: number) => {
    setApps(apps.filter((_, i) => i !== idx));
  };

  // Carousel Card Helpers
  const handleAddCarouselCard = () => {
    if (carouselCards.length >= 10) return alert("Maximum 10 Carousel cards allowed");
    const newCard = {
      id: Date.now(),
      mediaType: "Image",
      mediaUrl: "",
      text: `Card ${carouselCards.length + 1} Details`,
      buttonText: "Explore More",
    };
    setCarouselCards([...carouselCards, newCard]);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-3">
        <div>
          <div className="text-gray-400 font-medium">WhatsApp Manager › Templates</div>
          <h1 className="text-xl font-bold text-gray-800">Create & Edit Message Template</h1>
        </div>
        <Link
          href="/admin/templates"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl border transition"
        >
          📁 Template Library
        </Link>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border shadow-xs">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            step === 1 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          <span>Set up template</span>
        </button>
        <span className="text-gray-300">➔</span>
        <button
          onClick={() => setStep(2)}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            step === 2 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          <span>Edit template</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive Builder Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          
          {/* STEP 1: SET UP TEMPLATE */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800">Choose Template Category & Sub-type</h2>
                <p className="text-gray-500 mt-1">Select the intent and structure of your message template.</p>
              </div>

              {/* Category Tabs */}
              <div className="grid grid-cols-3 gap-3">
                {(["Marketing", "Utility", "Authentication"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setSubType(cat === "Marketing" ? "Default" : cat === "Utility" ? "None" : "Zero-tap OTP");
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      category === cat
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat === "Marketing" && "📣 "}
                    {cat === "Utility" && "🛠️ "}
                    {cat === "Authentication" && "🔐 "}
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sub-types List */}
              <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Available Formats for {category}
                </label>

                {category === "Marketing" && (
                  <div className="space-y-2">
                    {[
                      { id: "Default", label: "Default", desc: "Send messages with media and customized buttons to your customers." },
                      { id: "Catalogue", label: "Catalogue", desc: "Send messages with product catalog by connecting your products catalogue." },
                      { id: "Flows", label: "Flows", desc: "Send messages to capture customer interest, appointments requests or let surveys." },
                      { id: "Calling permissions request", label: "Calling permissions request", desc: "Ask if user can call them on WhatsApp." },
                      { id: "Limited Time Offer (LTO)", label: "Limited Time Offer (LTO)", desc: "Send messages with expiration date for high user engagement and conversion." },
                      { id: "Carousel", label: "Carousel", desc: "Carousel lets you showcase multiple products, services or variable formats in one banner." },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          subType === item.id ? "bg-emerald-50/80 border-emerald-400 shadow-xs" : "bg-white hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="m_subtype"
                          checked={subType === item.id}
                          onChange={() => setSubType(item.id)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="font-bold text-gray-800">{item.label}</div>
                          <div className="text-[11px] text-gray-500">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {category === "Utility" && (
                  <div className="space-y-2">
                    {[
                      { id: "None", label: "Default Utility", desc: "Send account updates, notifications or transactional alerts." },
                      { id: "Order status", label: "Order status", desc: "Send messages to keep customers updated about the progress of their orders." },
                      { id: "Order details", label: "Order details", desc: "Send detailed order confirmations and receipts." },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          subType === item.id ? "bg-emerald-50/80 border-emerald-400 shadow-xs" : "bg-white hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="u_subtype"
                          checked={subType === item.id}
                          onChange={() => setSubType(item.id)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="font-bold text-gray-800">{item.label}</div>
                          <div className="text-[11px] text-gray-500">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {category === "Authentication" && (
                  <div className="space-y-2">
                    {[
                      { id: "Zero-tap OTP", label: "Zero-tap OTP", desc: "Automatically send and verify OTP codes without manual user interaction." },
                      { id: "One-tap auto fill", label: "One-tap auto fill", desc: "Allow customers to autofill verification codes with a single tap button." },
                      { id: "Copy code", label: "Copy code button", desc: "Standard OTP template with a button to copy code directly." },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          subType === item.id ? "bg-emerald-50/80 border-emerald-400 shadow-xs" : "bg-white hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="a_subtype"
                          checked={subType === item.id}
                          onChange={() => setSubType(item.id)}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="font-bold text-gray-800">{item.label}</div>
                          <div className="text-[11px] text-gray-500">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Link
                  href="/admin/templates"
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                >
                  Go to Template Library
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1"
                >
                  <span>Next: Edit Template</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EDIT TEMPLATE */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Header Info Banner */}
              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border">
                <div>
                  <span className="font-bold text-gray-700">Category: </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                    {category} ({subType})
                  </span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={allowCategoryChange}
                    onChange={(e) => setAllowCategoryChange(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Allow Category Change</span>
                </label>
              </div>

              {/* BASIC DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. order_update_v1"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">SELECT LANGUAGE</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold"
                  >
                    <option value="English">English (en)</option>
                    <option value="Hindi">Hindi (hi)</option>
                    <option value="Spanish">Spanish (es)</option>
                    <option value="Arabic">Arabic (ar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">WABA ACCOUNT</label>
                  <select
                    value={wabaAccount}
                    onChange={(e) => setWabaAccount(e.target.value)}
                    className="w-full border rounded-xl p-2.5 bg-gray-100 font-mono text-gray-600"
                  >
                    <option value="28402710282733872">28402710282733872 (Default)</option>
                    <option value="9823410293841029">9823410293841029 (Backup)</option>
                  </select>
                </div>
              </div>

              {/* AUTHENTICATION SPECIFIC CONFIGURATION */}
              {category === "Authentication" && (
                <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/30 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm">🔐 Code Delivery Setup</h3>
                  
                  <div className="space-y-2">
                    {[
                      { id: "zero_tap", label: "Zero-tap OTP", desc: "Automatically verifies code without user opening app." },
                      { id: "one_tap", label: "One-tap auto fill", desc: "User taps one button in WhatsApp to auto fill code in your app." },
                      { id: "copy_code", label: "Copy code", desc: "Standard copy button to copy verification code." },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border cursor-pointer">
                        <input
                          type="radio"
                          name="codeDelivery"
                          checked={codeDeliveryOption === opt.id}
                          onChange={() => setCodeDeliveryOption(opt.id)}
                          className="accent-emerald-600"
                        />
                        <div>
                          <span className="font-bold text-gray-800">{opt.label}</span>
                          <span className="text-[11px] text-gray-500 ml-2">({opt.desc})</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* App Setup */}
                  <div className="space-y-3 pt-2">
                    <label className="block font-bold text-gray-700">App Setup (Android Package & Signature)</label>
                    {apps.map((app, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border relative">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold">PACKAGE NAME</label>
                          <input
                            type="text"
                            placeholder="com.example.app"
                            value={app.packageName}
                            onChange={(e) => {
                              const updated = [...apps];
                              updated[idx].packageName = e.target.value;
                              setApps(updated);
                            }}
                            className="w-full border rounded-lg p-2 mt-0.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold">APP SIGNATURE HASH (11 chars)</label>
                          <input
                            type="text"
                            placeholder="11-char hash"
                            value={app.signatureHash}
                            onChange={(e) => {
                              const updated = [...apps];
                              updated[idx].signatureHash = e.target.value;
                              setApps(updated);
                            }}
                            className="w-full border rounded-lg p-2 mt-0.5 text-xs font-mono"
                          />
                        </div>
                        {apps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveApp(idx)}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full font-bold text-[10px]"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddApp}
                      className="text-emerald-700 font-bold text-xs hover:underline flex items-center space-x-1"
                    >
                      <span>+ Add another app</span>
                    </button>
                  </div>

                  {/* Expiry Settings */}
                  <div className="flex items-center space-x-4 bg-white p-3 rounded-xl border">
                    <label className="font-bold text-gray-700">OTP Code Expiry (Minutes):</label>
                    <input
                      type="number"
                      value={otpExpiryMinutes}
                      onChange={(e) => setOtpExpiryMinutes(Number(e.target.value))}
                      className="border rounded-lg p-1.5 w-20 text-center font-bold"
                    />
                  </div>
                </div>
              )}

              {/* CAROUSEL SPECIFIC CONFIGURATION */}
              {subType === "Carousel" && (
                <div className="border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm">🎠 Carousel Cards Setup ({carouselCards.length}/10 Cards)</h3>
                    <button
                      type="button"
                      onClick={handleAddCarouselCard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs cursor-pointer"
                    >
                      + Add Carousel Card
                    </button>
                  </div>

                  {/* Card Selector Tabs */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {carouselCards.map((card, idx) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setActiveCarouselIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border whitespace-nowrap cursor-pointer ${
                          activeCarouselIndex === idx ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700"
                        }`}
                      >
                        Card {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active Card Fields */}
                  {carouselCards[activeCarouselIndex] && (
                    <div className="bg-white p-4 rounded-xl border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-gray-600">CARD MEDIA</label>
                          <select
                            value={carouselCards[activeCarouselIndex].mediaType}
                            onChange={(e) => {
                              const updated = [...carouselCards];
                              updated[activeCarouselIndex].mediaType = e.target.value;
                              setCarouselCards(updated);
                            }}
                            className="w-full border rounded-lg p-2 mt-1"
                          >
                            <option value="Image">Image</option>
                            <option value="Video">Video</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-gray-600">BUTTON TEXT</label>
                          <input
                            type="text"
                            value={carouselCards[activeCarouselIndex].buttonText}
                            onChange={(e) => {
                              const updated = [...carouselCards];
                              updated[activeCarouselIndex].buttonText = e.target.value;
                              setCarouselCards(updated);
                            }}
                            className="w-full border rounded-lg p-2 mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-600">CARD BODY TEXT</label>
                        <input
                          type="text"
                          value={carouselCards[activeCarouselIndex].text}
                          onChange={(e) => {
                            const updated = [...carouselCards];
                            updated[activeCarouselIndex].text = e.target.value;
                            setCarouselCards(updated);
                          }}
                          className="w-full border rounded-lg p-2 mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MEDIA HEADER (If not Auth or Carousel) */}
              {category !== "Authentication" && subType !== "Carousel" && (
                <div className="space-y-2 border-t pt-4">
                  <label className="block font-bold text-gray-600">MEDIA HEADER • OPTIONAL</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["None", "Image", "Video", "Document", "Location"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMediaType(m);
                          if (m !== "None") setHeaderText("");
                        }}
                        className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                          mediaType === m ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {mediaType === "None" && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-bold text-gray-600">HEADER TEXT</span>
                        <span>{headerText.length}/60</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Add a header text line..."
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
                      />
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={addVariableToHeader}
                          className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          + Add Variable
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BODY TEXT SECTION */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-600">MESSAGE BODY</label>
                  <span className="text-gray-400">{bodyText.length}/1024</span>
                </div>

                <div className="border rounded-2xl bg-gray-50 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                  <textarea
                    rows={4}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Enter message body content..."
                    className="w-full p-3 text-xs bg-transparent focus:outline-none resize-y"
                  />
                  <div className="flex items-center justify-between border-t bg-white px-3 py-2 text-xs">
                    <div className="flex items-center space-x-2 border-r pr-3">
                      <button type="button" onClick={() => applyFormatting("emoji")} className="hover:bg-gray-100 p-1 rounded font-bold">😊</button>
                      <button type="button" onClick={() => applyFormatting("bold")} className="hover:bg-gray-100 p-1 rounded font-bold">B</button>
                      <button type="button" onClick={() => applyFormatting("italic")} className="hover:bg-gray-100 p-1 rounded italic font-bold">I</button>
                      <button type="button" onClick={() => applyFormatting("strike")} className="hover:bg-gray-100 p-1 rounded line-through font-bold">S</button>
                      <button type="button" onClick={() => applyFormatting("code")} className="hover:bg-gray-100 p-1 rounded font-mono font-bold">{"</>"}</button>
                    </div>
                    <button
                      type="button"
                      onClick={addVariableToBody}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      + Add Variable
                    </button>
                  </div>
                </div>
              </div>

              {/* FOOTER SECTION */}
              <div className="space-y-1 border-t pt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-600">FOOTER TEXT • OPTIONAL</span>
                  <span>{footerText.length}/60</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Reply STOP to unsubscribe"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none"
                />
              </div>

              {/* BUTTONS SECTION */}
              <div className="space-y-3 border-t pt-4 relative">
                <label className="block font-bold text-gray-600">INTERACTIVE BUTTONS • OPTIONAL</label>
                
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setShowButtonMenu(!showButtonMenu)}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-100 flex items-center space-x-1"
                  >
                    <span>+ Add Button</span>
                  </button>

                  {showButtonMenu && (
                    <div className="absolute left-0 mt-2 w-60 bg-white border rounded-2xl shadow-2xl z-30 py-2 divide-y font-medium text-gray-700">
                      {[
                        { type: "Custom", label: "Custom (Quick Reply)" },
                        { type: "Visit website", label: "Visit Website" },
                        { type: "Call Phone Number", label: "Call Phone Number" },
                        { type: "Complete flow", label: "Complete Flow" },
                        { type: "Copy offer code", label: "Copy Offer Code" },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddButton(item.type)}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50 cursor-pointer text-xs"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Added Buttons List */}
                {buttons.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {buttons.map((btn, idx) => (
                      <div key={btn.id} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-xl border">
                        <span className="font-bold text-gray-500 w-24">{btn.type}:</span>
                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => {
                            const updated = [...buttons];
                            updated[idx].text = e.target.value;
                            setButtons(updated);
                          }}
                          className="border rounded-lg p-1.5 flex-1 bg-white font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => removeButton(btn.id)}
                          className="text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT ACTIONS */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  ⬅ Back
                </button>
                <button
                  type="button"
                  onClick={() => alert("WhatsApp Template submitted for review successfully!")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl shadow-md cursor-pointer transition"
                >
                  Submit for Review 🚀
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Live WhatsApp Phone Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-xs mx-auto text-white space-y-3">
            
            {/* Phone Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>WhatsApp Business</span>
              </span>
              <span>12:45 PM</span>
            </div>

            {/* Chat Bubble Container */}
            <div className="bg-emerald-900/60 p-3 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              
              {/* Media Preview */}
              {mediaType !== "None" && category !== "Authentication" && subType !== "Carousel" && (
                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-700">
                  📷 [{mediaType} Sample Header]
                </div>
              )}

              {/* Header Text */}
              {mediaType === "None" && headerText && (
                <div className="font-bold text-white text-xs border-b border-emerald-700/50 pb-1">
                  {headerText}
                </div>
              )}

              {/* Carousel Cards Preview */}
              {subType === "Carousel" && (
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 space-y-1.5">
                  <div className="h-24 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
                    🖼️ [{carouselCards[activeCarouselIndex]?.mediaType || "Image"}]
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200">
                    {carouselCards[activeCarouselIndex]?.text || "Carousel Card Details"}
                  </div>
                  <div className="bg-white text-emerald-800 text-center py-1 rounded-lg font-bold text-[10px]">
                    {carouselCards[activeCarouselIndex]?.buttonText || "Button"}
                  </div>
                </div>
              )}

              {/* Body Text */}
              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">
                {bodyText || "Your message body content will appear here..."}
              </div>

              {/* Footer Text */}
              {footerText && (
                <div className="text-[10px] text-slate-400 border-t border-emerald-800/80 pt-1">
                  {footerText}
                </div>
              )}

              {/* Buttons Preview */}
              {buttons.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  {buttons.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow-xs"
                    >
                      {b.type === "Visit website" && "↗️ "}
                      {b.type === "Call Phone Number" && "📞 "}
                      {b.type === "Copy offer code" && "📑 "}
                      {b.text || "Button"}
                    </div>
                  ))}
                </div>
              )}

              {/* Auth OTP Code Copy Button */}
              {category === "Authentication" && (
                <div className="pt-2 space-y-1">
                  <div className="bg-white text-emerald-800 text-center py-2 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center space-x-1">
                    <span>📑 Copy Code</span>
                  </div>
                </div>
              )}

            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Category: <span className="text-emerald-400 font-bold">{category}</span> | Language: <span className="text-emerald-400 font-bold">{language}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}