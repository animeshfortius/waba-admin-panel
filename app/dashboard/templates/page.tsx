"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateWhatsAppTemplateModule() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<"Marketing" | "Utility" | "Authentication">("Marketing");
  const [subType, setSubType] = useState("Default");

  // Form States
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("English");
  const [wabaAccount] = useState("28402710282733872");
  const [mediaType, setMediaType] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("Hello {{1}}, welcome to our service![cite: 6]");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<{ id: string; type: string; text: string }[]>([]);
  const [showButtonMenu, setShowButtonMenu] = useState(false);

  // Authentication Specific States
  const [codeDeliveryOption, setCodeDeliveryOption] = useState("zero_tap");
  const [apps, setApps] = useState<{ packageName: string; signatureHash: string }[]>([
    { packageName: "com.example.app", signatureHash: "12345678901" },
  ]);

  // Carousel Cards State
  const [carouselCards, setCarouselCards] = useState([
    { id: 1, text: "Card 1: Special Fresh Fruit Offer[cite: 5]", buttonText: "View Catalog" },
    { id: 2, text: "Card 2: 50% Off Electronics[cite: 5]", buttonText: "Shop Now" },
  ]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const addVariableToBody = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g);
    const nextVar = matches ? matches.length + 1 : 1;
    setBodyText((prev) => prev + ` {{${nextVar}}}`);
  };

  const handleAddButton = (type: string) => {
    if (buttons.length >= 3) return alert("Maximum 3 buttons allowed");
    setButtons([...buttons, { id: Date.now().toString(), type, text: type }]);
    setShowButtonMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-xs">
        <div>
          <div className="text-gray-400 font-medium">WhatsApp Manager › Templates[cite: 6]</div>
          <h1 className="text-xl font-bold text-gray-800">Create WhatsApp Template</h1>
        </div>
        <Link href="/admin/templates" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl border">
          📁 Template Library[cite: 4]
        </Link>
      </div>

      <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border shadow-xs">
        <button
          onClick={() => setStep(1)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            step === 1 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          1️⃣ Set up template[cite: 6]
        </button>
        <span className="text-gray-300">➔</span>
        <button
          onClick={() => setStep(2)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            step === 2 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          2️⃣ Edit template[cite: 6]
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800">Set up your Template</h2>
                <p className="text-gray-500 mt-1">Choose category and sub-type for your message template[cite: 6].</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["Marketing", "Utility", "Authentication"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setSubType(cat === "Marketing" ? "Default" : cat === "Utility" ? "Order status" : "Zero-tap OTP");
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      category === cat ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase">Sub-Type Formats</label>
                
                {category === "Marketing" && (
                  <div className="space-y-2">
                    {[
                      { id: "Default", label: "Default", desc: "Send messages with media and customized buttons[cite: 6]." },
                      { id: "Catalogue", label: "Catalogue", desc: "Send messages with product catalog links[cite: 5]." },
                      { id: "Flows", label: "Flows", desc: "Capture customer interest or appointments[cite: 5]." },
                      { id: "Carousel", label: "Carousel", desc: "Showcase multiple products or cards in a banner[cite: 5]." },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer ${subType === item.id ? "bg-emerald-50 border-emerald-400" : "bg-white"}`}>
                        <input type="radio" checked={subType === item.id} onChange={() => setSubType(item.id)} className="mt-0.5 accent-emerald-600" />
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
                      { id: "Order status", label: "Order status", desc: "Keep customers updated on order progress[cite: 5]." },
                      { id: "Order details", label: "Order details", desc: "Send itemized order summaries[cite: 5]." },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer ${subType === item.id ? "bg-emerald-50 border-emerald-400" : "bg-white"}`}>
                        <input type="radio" checked={subType === item.id} onChange={() => setSubType(item.id)} className="mt-0.5 accent-emerald-600" />
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
                      { id: "Zero-tap OTP", label: "Zero-tap OTP", desc: "Instant background verification[cite: 6]." },
                      { id: "One-tap auto fill", label: "One-tap auto fill", desc: "Autofill button for user verification[cite: 6]." },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer ${subType === item.id ? "bg-emerald-50 border-emerald-400" : "bg-white"}`}>
                        <input type="radio" checked={subType === item.id} onChange={() => setSubType(item.id)} className="mt-0.5 accent-emerald-600" />
                        <div>
                          <div className="font-bold text-gray-800">{item.label}</div>
                          <div className="text-[11px] text-gray-500">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer">
                  Next: Edit Template ➔
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE NAME</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. promo_diwali[cite: 6]" className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">LANGUAGE</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold">
                    <option value="English">English[cite: 6]</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              {category === "Authentication" && (
                <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-emerald-50/30 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm">🔐 Code Delivery Setup[cite: 6]</h3>
                  <div className="space-y-2">
                    {[
                      { id: "zero_tap", label: "Zero-tap OTP" },
                      { id: "one_tap", label: "One-tap auto fill" },
                      { id: "copy_code", label: "Copy code" },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border cursor-pointer">
                        <input type="radio" checked={codeDeliveryOption === opt.id} onChange={() => setCodeDeliveryOption(opt.id)} className="accent-emerald-600" />
                        <span className="font-bold text-gray-800">{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block font-bold text-gray-700">App Setup (Android Package & Hash)[cite: 6]</label>
                    {apps.map((app, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border">
                        <input type="text" placeholder="Package name" value={app.packageName} onChange={(e) => {
                          const updated = [...apps];
                          updated[idx].packageName = e.target.value;
                          setApps(updated);
                        }} className="border rounded-lg p-2 text-xs" />
                        <input type="text" placeholder="11-char hash" value={app.signatureHash} onChange={(e) => {
                          const updated = [...apps];
                          updated[idx].signatureHash = e.target.value;
                          setApps(updated);
                        }} className="border rounded-lg p-2 text-xs" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setApps([...apps, { packageName: "", signatureHash: "" }])} className="text-emerald-700 font-bold text-xs hover:underline cursor-pointer">
                      + Add another app[cite: 6]
                    </button>
                  </div>
                </div>
              )}

              {subType === "Carousel" && (
                <div className="border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Carousel Cards Setup[cite: 5]</h3>
                    <button type="button" onClick={() => setCarouselCards([...carouselCards, { id: Date.now(), text: "New Card", buttonText: "View" }])} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
                      + Add Carousel Card[cite: 5]
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    {carouselCards.map((card, idx) => (
                      <button key={card.id} type="button" onClick={() => setActiveCardIndex(idx)} className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${activeCardIndex === idx ? "bg-indigo-600 text-white" : "bg-white"}`}>
                        Card {idx + 1}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={carouselCards[activeCardIndex]?.text || ""} onChange={(e) => {
                    const updated = [...carouselCards];
                    if (updated[activeCardIndex]) {
                      updated[activeCardIndex].text = e.target.value;
                      setCarouselCards(updated);
                    }
                  }} className="w-full border rounded-lg p-2 bg-white" placeholder="Card message text..." />
                </div>
              )}

              {subType !== "Carousel" && category !== "Authentication" && (
                <div>
                  <label className="block font-bold text-gray-600 mb-1">MEDIA HEADER • OPTIONAL[cite: 6]</label>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50">
                    <option value="None">None</option>
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Document">Document[cite: 6]</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-gray-600">MESSAGE BODY[cite: 6]</label>
                <textarea rows={4} value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50 focus:outline-none text-xs" />
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={addVariableToBody} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Add Variable[cite: 6]</button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">FOOTER • OPTIONAL[cite: 6]</label>
                <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Footer text..." className="w-full border rounded-xl p-2.5 bg-gray-50" />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <label className="block font-bold text-gray-600">BUTTONS • OPTIONAL[cite: 6]</label>
                <button type="button" onClick={() => setShowButtonMenu(!showButtonMenu)} className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-xl font-bold cursor-pointer">
                  + Add Button[cite: 6]
                </button>
                {showButtonMenu && (
                  <div className="bg-white border rounded-xl p-2 shadow-lg space-y-1 w-48">
                    {["Visit website", "Call Phone Number", "Copy offer code"].map((btn) => (
                      <button key={btn} type="button" onClick={() => handleAddButton(btn)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded-lg cursor-pointer font-medium">
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
                {buttons.map((b, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded-xl border flex justify-between items-center">
                    <span className="font-bold">{b.type}</span>
                    <button type="button" onClick={() => setButtons(buttons.filter((_, index) => index !== i))} className="text-rose-600 font-bold cursor-pointer">✕</button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 border rounded-xl font-bold text-gray-600 cursor-pointer">⬅ Back</button>
                <button type="button" onClick={() => alert("Template submitted successfully!")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow cursor-pointer">Submit for Review 🚀[cite: 5]</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PREVIEW BOX WITH EXACT SUBTYPE RENDERING */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-xs mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span>WhatsApp Preview[cite: 6]</span>
              <span className="text-emerald-400 font-bold">{category} / {subType}</span>
            </div>

            <div className="bg-emerald-900/70 p-3 rounded-2xl space-y-2 border border-emerald-800/50 shadow-inner">
              {subType === "Catalogue" && (
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-center text-slate-300 font-bold text-[11px]">
                  🛍️ [Interactive Product Catalog Attached[cite: 5]]
                </div>
              )}

              {subType === "Flows" && (
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-center text-slate-300 font-bold text-[11px]">
                  📋 [WhatsApp Flow Form Attached[cite: 5]]
                </div>
              )}

              {subType === "Carousel" && carouselCards.length > 0 && (
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1">
                  <div className="h-20 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">🖼️ [Carousel Card Media[cite: 5]]</div>
                  <div className="text-xs font-bold text-white">{carouselCards[activeCardIndex]?.text}</div>
                  <div className="bg-white text-emerald-800 text-center py-1 rounded font-bold text-[10px]">{carouselCards[activeCardIndex]?.buttonText}</div>
                </div>
              )}

              {mediaType !== "None" && subType !== "Carousel" && (
                <div className="h-28 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-700">
                  📷 [{mediaType} Header[cite: 6]]
                </div>
              )}

              <div className="text-slate-100 text-xs whitespace-pre-wrap leading-relaxed">
                {bodyText}
              </div>

              {footerText && <div className="text-[10px] text-slate-400 border-t border-emerald-800 pt-1">{footerText}</div>}

              {category === "Authentication" && (
                <div className="pt-2">
                  <div className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow">
                    📑 Copy Code[cite: 6]
                  </div>
                </div>
              )}

              {buttons.map((b, i) => (
                <div key={i} className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow">
                  {b.type === "Visit website" && "↗️ "}
                  {b.type === "Call Phone Number" && "📞 "}
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}