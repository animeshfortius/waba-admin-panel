"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CreateWhatsAppTemplateModule() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [loadingWabas, setLoadingWabas] = useState(true);

  // Step 1 States
  const [category, setCategory] = useState<"Marketing" | "Utility" | "Authentication">("Marketing");
  const [subType, setSubType] = useState("Default");

  // Step 2 General Form States
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("English");
  const [wabaAccount, setWabaAccount] = useState("");
  const [allowCategoryChange, setAllowCategoryChange] = useState(false);

  // Header, Body, Footer
  const [mediaType, setMediaType] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
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
  const [submitting, setSubmitting] = useState(false);

  // Fetch Onboarded WABA Accounts on Load
  useEffect(() => {
    const fetchWabas = async () => {
      setLoadingWabas(true);
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        if (data.success && Array.isArray(data.wabaAccounts)) {
          setWabaAccounts(data.wabaAccounts);
          if (data.wabaAccounts.length > 0) {
            setWabaAccount(data.wabaAccounts[0].wabaId);
          }
        }
      } catch (err) {
        console.error("Error fetching WABA accounts:", err);
      } finally {
        setLoadingWabas(false);
      }
    };
    fetchWabas();
  }, []);

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

  const handleAddApp = () => {
    setApps([...apps, { packageName: "", signatureHash: "" }]);
  };

  const handleRemoveApp = (idx: number) => {
    setApps(apps.filter((_, i) => i !== idx));
  };

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

  const handleSubmitForReview = async () => {
    if (!templateName.trim()) {
      alert("Please enter template name");
      return;
    }
    if (!wabaAccount) {
      alert("Please select an onboarded WABA account");
      return;
    }

    const selectedAccountObj = wabaAccounts.find((acc) => acc.wabaId === wabaAccount);

    setSubmitting(true);
    const payload = {
      userId: selectedAccountObj?.userId || "default_user",
      wabaId: wabaAccount,
      wabaNumber: selectedAccountObj?.displayPhone || selectedAccountObj?.phoneNumberId || "",
      name: templateName.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
      language: language === "Hindi" ? "hi" : language === "Spanish" ? "es" : language === "Arabic" ? "ar" : "en_US",
      category: category.toUpperCase(),
      subType,
      allowCategoryChange,
      headerType: mediaType !== "None" ? mediaType.toUpperCase() : headerText ? "TEXT" : "NONE",
      headerText: headerText || null,
      mediaUrl: mediaUrl || null,
      bodyText,
      footerText: footerText || null,
      buttons: buttons.map((b) => ({
        type: b.type === "Visit website" ? "URL" : b.type === "Call Phone Number" ? "PHONE_NUMBER" : b.type === "Copy offer code" ? "COPY_CODE" : "QUICK_REPLY",
        text: b.text,
        value: b.value || "",
      })),
      authConfig: category === "Authentication" ? { codeDeliveryOption, apps, otpExpiryMinutes, addSecurityRecommendation } : null,
      carouselCards: subType === "Carousel" ? carouselCards : null,
    };

    try {
      const res = await fetch("/api/templates/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ WhatsApp Template submitted successfully to Meta! Status: PENDING ⏳");
        window.location.href = "/dashboard/templates";
      } else {
        alert("❌ Meta API Error: " + (data.error || "Failed to submit template"));
      }
    } catch (err) {
      console.error("Error submitting template:", err);
      alert("Network error while submitting template to Meta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-3">
        <div>
          <div className="text-gray-400 font-medium">WhatsApp Manager › Templates › Create</div>
          <h1 className="text-xl font-bold text-gray-800">Create & Edit Message Template</h1>
        </div>
        <Link href="/dashboard/templates" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl border transition">
          📁 Template Library
        </Link>
      </div>

      {/* Step Tabs */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border shadow-xs">
        <button onClick={() => setStep(1)} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${step === 1 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          <span>Set up template</span>
        </button>
        <span className="text-gray-300">➔</span>
        <button onClick={() => setStep(2)} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${step === 2 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          <span>Edit template</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800">Choose Template Category & Sub-type</h2>
                <p className="text-gray-500 mt-1">Select the intent and structure of your message template.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["Marketing", "Utility", "Authentication"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setSubType(cat === "Marketing" ? "Default" : cat === "Utility" ? "None" : "Zero-tap OTP");
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${category === cat ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                  >
                    {cat === "Marketing" && "📣 "}
                    {cat === "Utility" && "🛠️ "}
                    {cat === "Authentication" && "🔐 "}
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Available Formats for {category}</label>
                {category === "Marketing" && (
                  <div className="space-y-2">
                    {[
                      { id: "Default", label: "Default", desc: "Send messages with media and customized buttons." },
                      { id: "Carousel", label: "Carousel", desc: "Showcase multiple products or services in one banner." },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${subType === item.id ? "bg-emerald-50/80 border-emerald-400 shadow-xs" : "bg-white hover:bg-gray-100 border-gray-200"}`}>
                        <input type="radio" name="m_subtype" checked={subType === item.id} onChange={() => setSubType(item.id)} className="mt-0.5 accent-emerald-600" />
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
                <Link href="/dashboard/templates" className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Go to Template Library</Link>
                <button type="button" onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1">
                  <span>Next: Edit Template</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border">
                <div>
                  <span className="font-bold text-gray-700">Category: </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">{category} ({subType})</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-600">
                  <input type="checkbox" checked={allowCategoryChange} onChange={(e) => setAllowCategoryChange(e.target.checked)} className="accent-emerald-600 rounded" />
                  <span>Allow Category Change</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE NAME *</label>
                  <input type="text" placeholder="e.g. order_update_v1" value={templateName} onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono" required />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">SELECT LANGUAGE *</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold">
                    <option value="English">English (en_US)</option>
                    <option value="Hindi">Hindi (hi)</option>
                    <option value="Spanish">Spanish (es)</option>
                    <option value="Arabic">Arabic (ar)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">ONBOARDED WABA ACCOUNT *</label>
                  <select value={wabaAccount} onChange={(e) => setWabaAccount(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-800 font-bold">
                    {loadingWabas ? (
                      <option value="">Loading onboarded numbers...</option>
                    ) : wabaAccounts.length === 0 ? (
                      <option value="">No WABA accounts found in configuration</option>
                    ) : (
                      wabaAccounts.map((acc) => (
                        <option key={acc.id || acc.wabaId} value={acc.wabaId}>
                          {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "WhatsApp Account"} (ID: {acc.wabaId})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* MEDIA HEADER WITH UPLOAD BUTTON & SIZE GUIDELINES */}
              {category !== "Authentication" && subType !== "Carousel" && (
                <div className="space-y-3 border-t pt-4">
                  <label className="block font-bold text-gray-600">MEDIA HEADER • OPTIONAL</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["None", "Image", "Video", "Document", "Location"].map((m) => (
                      <button key={m} type="button" onClick={() => setMediaType(m)} className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${mediaType === m ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-700"}`}>
                        {m}
                      </button>
                    ))}
                  </div>

                  {mediaType === "None" && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-bold text-gray-600">HEADER TEXT • OPTIONAL</span>
                        <span>{headerText.length}/60</span>
                      </div>
                      <input type="text" placeholder="Add an optional header text line..." value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none" />
                      <div className="flex justify-end pt-1">
                        <button type="button" onClick={addVariableToHeader} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Add Variable</button>
                      </div>
                    </div>
                  )}

                  {mediaType !== "None" && mediaType !== "Location" && (
                    <div className="bg-emerald-50/50 border-2 border-emerald-200 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900 text-xs">Upload Sample {mediaType} for Meta Review</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                          {mediaType === "Image" && "JPG / PNG • Max 5MB"}
                          {mediaType === "Video" && "MP4 / 3GP • Max 16MB"}
                          {mediaType === "Document" && "PDF / DOCX • Max 100MB"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept={mediaType === "Image" ? "image/jpeg,image/png" : mediaType === "Video" ? "video/mp4,video/3gp" : ".pdf,.docx"}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setMediaFile(e.target.files[0]);
                            setMediaUrl(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        className="w-full border rounded-xl p-2 bg-white text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                      {mediaFile && <div className="text-[11px] text-emerald-800 font-semibold">📎 Attached: {mediaFile.name}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* BODY TEXT SECTION */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-600">MESSAGE BODY *</label>
                  <span className="text-gray-400">{bodyText.length}/1024</span>
                </div>
                <div className="border rounded-2xl bg-gray-50 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                  <textarea rows={4} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Enter message body content..." className="w-full p-3 text-xs bg-transparent focus:outline-none resize-y" required />
                  <div className="flex items-center justify-between border-t bg-white px-3 py-2 text-xs">
                    <div className="flex items-center space-x-2 border-r pr-3">
                      <button type="button" onClick={() => applyFormatting("emoji")} className="hover:bg-gray-100 p-1 rounded font-bold">😊</button>
                      <button type="button" onClick={() => applyFormatting("bold")} className="hover:bg-gray-100 p-1 rounded font-bold">B</button>
                      <button type="button" onClick={() => applyFormatting("italic")} className="hover:bg-gray-100 p-1 rounded italic font-bold">I</button>
                      <button type="button" onClick={() => applyFormatting("strike")} className="hover:bg-gray-100 p-1 rounded line-through font-bold">S</button>
                      <button type="button" onClick={() => applyFormatting("code")} className="hover:bg-gray-100 p-1 rounded font-mono font-bold">{"</>"}</button>
                    </div>
                    <button type="button" onClick={addVariableToBody} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Add Variable</button>
                  </div>
                </div>
              </div>

              {/* FOOTER SECTION */}
              <div className="space-y-1 border-t pt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-600">FOOTER TEXT • OPTIONAL</span>
                  <span>{footerText.length}/60</span>
                </div>
                <input type="text" placeholder="e.g. Reply STOP to unsubscribe" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none" />
              </div>

              {/* BUTTONS SECTION */}
              <div className="space-y-3 border-t pt-4 relative">
                <label className="block font-bold text-gray-600">INTERACTIVE BUTTONS • OPTIONAL</label>
                <div className="relative inline-block">
                  <button type="button" onClick={() => setShowButtonMenu(!showButtonMenu)} className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-100 flex items-center space-x-1">
                    <span>+ Add Button</span>
                  </button>
                  {showButtonMenu && (
                    <div className="absolute left-0 mt-2 w-60 bg-white border rounded-2xl shadow-2xl z-30 py-2 divide-y font-medium text-gray-700">
                      {[
                        { type: "Custom", label: "Custom (Quick Reply)" },
                        { type: "Visit website", label: "Visit Website" },
                        { type: "Call Phone Number", label: "Call Phone Number" },
                        { type: "Copy offer code", label: "Copy Offer Code" },
                      ].map((item) => (
                        <button key={item.type} type="button" onClick={() => handleAddButton(item.type)} className="w-full text-left px-4 py-2 hover:bg-emerald-50 cursor-pointer text-xs">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {buttons.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {buttons.map((btn, idx) => (
                      <div key={btn.id} className="flex flex-wrap items-center gap-2 bg-gray-50 p-2.5 rounded-xl border">
                        <span className="font-bold text-gray-500 w-28">{btn.type}:</span>
                        <input type="text" placeholder="Button Text" value={btn.text} onChange={(e) => { const updated = [...buttons]; updated[idx].text = e.target.value; setButtons(updated); }} className="border rounded-lg p-1.5 flex-1 bg-white font-medium" />
                        {(btn.type === "Visit website" || btn.type === "Call Phone Number" || btn.type === "Copy offer code") && (
                          <input type="text" placeholder={btn.type === "Visit website" ? "https://example.com" : btn.type === "Call Phone Number" ? "+919876543210" : "OFFER20"} value={btn.value || ""} onChange={(e) => { const updated = [...buttons]; updated[idx].value = e.target.value; setButtons(updated); }} className="border rounded-lg p-1.5 flex-1 bg-white font-mono" />
                        )}
                        <button type="button" onClick={() => removeButton(btn.id)} className="text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT ACTIONS */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer">⬅ Back</button>
                <button type="button" onClick={handleSubmitForReview} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50">
                  {submitting ? "Submitting to Meta..." : "Submit for Review to Meta 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Live WhatsApp Phone Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-xs mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>WhatsApp Business</span>
              </span>
              <span>12:45 PM</span>
            </div>

            <div className="bg-emerald-900/60 p-3 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              {mediaType !== "None" && category !== "Authentication" && subType !== "Carousel" && (
                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-700 overflow-hidden">
                  {mediaUrl ? <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" /> : `📷 [${mediaType} Sample Header]`}
                </div>
              )}

              {mediaType === "None" && headerText && (
                <div className="font-bold text-white text-xs border-b border-emerald-700/50 pb-1">{headerText}</div>
              )}

              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">{bodyText || "Your message body content will appear here..."}</div>

              {footerText && <div className="text-[10px] text-slate-400 border-t border-emerald-800/80 pt-1">{footerText}</div>}

              {buttons.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  {buttons.map((b) => (
                    <div key={b.id} className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow-xs">
                      {b.text || "Button"}
                    </div>
                  ))}
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
}"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CreateWhatsAppTemplateModule() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [loadingWabas, setLoadingWabas] = useState(true);

  // Step 1 States
  const [category, setCategory] = useState<"Marketing" | "Utility" | "Authentication">("Marketing");
  const [subType, setSubType] = useState("Default");

  // Step 2 General Form States
  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("English");
  const [wabaAccount, setWabaAccount] = useState("");
  const [allowCategoryChange, setAllowCategoryChange] = useState(false);

  // Header, Body, Footer
  const [mediaType, setMediaType] = useState("None");
  const [headerText, setHeaderText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
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
  const [submitting, setSubmitting] = useState(false);

  // Fetch Onboarded WABA Accounts on Load
  useEffect(() => {
    const fetchWabas = async () => {
      setLoadingWabas(true);
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        if (data.success && Array.isArray(data.wabaAccounts)) {
          setWabaAccounts(data.wabaAccounts);
          if (data.wabaAccounts.length > 0) {
            setWabaAccount(data.wabaAccounts[0].wabaId);
          }
        }
      } catch (err) {
        console.error("Error fetching WABA accounts:", err);
      } finally {
        setLoadingWabas(false);
      }
    };
    fetchWabas();
  }, []);

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

  const handleAddApp = () => {
    setApps([...apps, { packageName: "", signatureHash: "" }]);
  };

  const handleRemoveApp = (idx: number) => {
    setApps(apps.filter((_, i) => i !== idx));
  };

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

  const handleSubmitForReview = async () => {
    if (!templateName.trim()) {
      alert("Please enter template name");
      return;
    }
    if (!wabaAccount) {
      alert("Please select an onboarded WABA account");
      return;
    }

    const selectedAccountObj = wabaAccounts.find((acc) => acc.wabaId === wabaAccount);

    setSubmitting(true);
    const payload = {
      userId: selectedAccountObj?.userId || "default_user",
      wabaId: wabaAccount,
      wabaNumber: selectedAccountObj?.displayPhone || selectedAccountObj?.phoneNumberId || "",
      name: templateName.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
      language: language === "Hindi" ? "hi" : language === "Spanish" ? "es" : language === "Arabic" ? "ar" : "en_US",
      category: category.toUpperCase(),
      subType,
      allowCategoryChange,
      headerType: mediaType !== "None" ? mediaType.toUpperCase() : headerText ? "TEXT" : "NONE",
      headerText: headerText || null,
      mediaUrl: mediaUrl || null,
      bodyText,
      footerText: footerText || null,
      buttons: buttons.map((b) => ({
        type: b.type === "Visit website" ? "URL" : b.type === "Call Phone Number" ? "PHONE_NUMBER" : b.type === "Copy offer code" ? "COPY_CODE" : "QUICK_REPLY",
        text: b.text,
        value: b.value || "",
      })),
      authConfig: category === "Authentication" ? { codeDeliveryOption, apps, otpExpiryMinutes, addSecurityRecommendation } : null,
      carouselCards: subType === "Carousel" ? carouselCards : null,
    };

    try {
      const res = await fetch("/api/templates/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ WhatsApp Template submitted successfully to Meta! Status: PENDING ⏳");
        window.location.href = "/dashboard/templates";
      } else {
        alert("❌ Meta API Error: " + (data.error || "Failed to submit template"));
      }
    } catch (err) {
      console.error("Error submitting template:", err);
      alert("Network error while submitting template to Meta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border shadow-xs gap-3">
        <div>
          <div className="text-gray-400 font-medium">WhatsApp Manager › Templates › Create</div>
          <h1 className="text-xl font-bold text-gray-800">Create & Edit Message Template</h1>
        </div>
        <Link href="/dashboard/templates" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl border transition">
          📁 Template Library
        </Link>
      </div>

      {/* Step Tabs */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border shadow-xs">
        <button onClick={() => setStep(1)} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${step === 1 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          <span>Set up template</span>
        </button>
        <span className="text-gray-300">➔</span>
        <button onClick={() => setStep(2)} className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${step === 2 ? "bg-emerald-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          <span>Edit template</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-800">Choose Template Category & Sub-type</h2>
                <p className="text-gray-500 mt-1">Select the intent and structure of your message template.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(["Marketing", "Utility", "Authentication"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setSubType(cat === "Marketing" ? "Default" : cat === "Utility" ? "None" : "Zero-tap OTP");
                    }}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${category === cat ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                  >
                    {cat === "Marketing" && "📣 "}
                    {cat === "Utility" && "🛠️ "}
                    {cat === "Authentication" && "🔐 "}
                    {cat}
                  </button>
                ))}
              </div>

              <div className="border rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Available Formats for {category}</label>
                {category === "Marketing" && (
                  <div className="space-y-2">
                    {[
                      { id: "Default", label: "Default", desc: "Send messages with media and customized buttons." },
                      { id: "Carousel", label: "Carousel", desc: "Showcase multiple products or services in one banner." },
                    ].map((item) => (
                      <label key={item.id} className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${subType === item.id ? "bg-emerald-50/80 border-emerald-400 shadow-xs" : "bg-white hover:bg-gray-100 border-gray-200"}`}>
                        <input type="radio" name="m_subtype" checked={subType === item.id} onChange={() => setSubType(item.id)} className="mt-0.5 accent-emerald-600" />
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
                <Link href="/dashboard/templates" className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Go to Template Library</Link>
                <button type="button" onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1">
                  <span>Next: Edit Template</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border">
                <div>
                  <span className="font-bold text-gray-700">Category: </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">{category} ({subType})</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-gray-600">
                  <input type="checkbox" checked={allowCategoryChange} onChange={(e) => setAllowCategoryChange(e.target.checked)} className="accent-emerald-600 rounded" />
                  <span>Allow Category Change</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">TEMPLATE NAME *</label>
                  <input type="text" placeholder="e.g. order_update_v1" value={templateName} onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono" required />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">SELECT LANGUAGE *</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold">
                    <option value="English">English (en_US)</option>
                    <option value="Hindi">Hindi (hi)</option>
                    <option value="Spanish">Spanish (es)</option>
                    <option value="Arabic">Arabic (ar)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">ONBOARDED WABA ACCOUNT *</label>
                  <select value={wabaAccount} onChange={(e) => setWabaAccount(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-800 font-bold">
                    {loadingWabas ? (
                      <option value="">Loading onboarded numbers...</option>
                    ) : wabaAccounts.length === 0 ? (
                      <option value="">No WABA accounts found in configuration</option>
                    ) : (
                      wabaAccounts.map((acc) => (
                        <option key={acc.id || acc.wabaId} value={acc.wabaId}>
                          {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "WhatsApp Account"} (ID: {acc.wabaId})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* MEDIA HEADER WITH UPLOAD BUTTON & SIZE GUIDELINES */}
              {category !== "Authentication" && subType !== "Carousel" && (
                <div className="space-y-3 border-t pt-4">
                  <label className="block font-bold text-gray-600">MEDIA HEADER • OPTIONAL</label>
                  <div className="grid grid-cols-5 gap-2">
                    {["None", "Image", "Video", "Document", "Location"].map((m) => (
                      <button key={m} type="button" onClick={() => setMediaType(m)} className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${mediaType === m ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-700"}`}>
                        {m}
                      </button>
                    ))}
                  </div>

                  {mediaType === "None" && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-bold text-gray-600">HEADER TEXT • OPTIONAL</span>
                        <span>{headerText.length}/60</span>
                      </div>
                      <input type="text" placeholder="Add an optional header text line..." value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none" />
                      <div className="flex justify-end pt-1">
                        <button type="button" onClick={addVariableToHeader} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Add Variable</button>
                      </div>
                    </div>
                  )}

                  {mediaType !== "None" && mediaType !== "Location" && (
                    <div className="bg-emerald-50/50 border-2 border-emerald-200 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900 text-xs">Upload Sample {mediaType} for Meta Review</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                          {mediaType === "Image" && "JPG / PNG • Max 5MB"}
                          {mediaType === "Video" && "MP4 / 3GP • Max 16MB"}
                          {mediaType === "Document" && "PDF / DOCX • Max 100MB"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept={mediaType === "Image" ? "image/jpeg,image/png" : mediaType === "Video" ? "video/mp4,video/3gp" : ".pdf,.docx"}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setMediaFile(e.target.files[0]);
                            setMediaUrl(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                        className="w-full border rounded-xl p-2 bg-white text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                      {mediaFile && <div className="text-[11px] text-emerald-800 font-semibold">📎 Attached: {mediaFile.name}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* BODY TEXT SECTION */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-gray-600">MESSAGE BODY *</label>
                  <span className="text-gray-400">{bodyText.length}/1024</span>
                </div>
                <div className="border rounded-2xl bg-gray-50 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                  <textarea rows={4} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Enter message body content..." className="w-full p-3 text-xs bg-transparent focus:outline-none resize-y" required />
                  <div className="flex items-center justify-between border-t bg-white px-3 py-2 text-xs">
                    <div className="flex items-center space-x-2 border-r pr-3">
                      <button type="button" onClick={() => applyFormatting("emoji")} className="hover:bg-gray-100 p-1 rounded font-bold">😊</button>
                      <button type="button" onClick={() => applyFormatting("bold")} className="hover:bg-gray-100 p-1 rounded font-bold">B</button>
                      <button type="button" onClick={() => applyFormatting("italic")} className="hover:bg-gray-100 p-1 rounded italic font-bold">I</button>
                      <button type="button" onClick={() => applyFormatting("strike")} className="hover:bg-gray-100 p-1 rounded line-through font-bold">S</button>
                      <button type="button" onClick={() => applyFormatting("code")} className="hover:bg-gray-100 p-1 rounded font-mono font-bold">{"</>"}</button>
                    </div>
                    <button type="button" onClick={addVariableToBody} className="text-blue-600 font-bold hover:underline cursor-pointer">+ Add Variable</button>
                  </div>
                </div>
              </div>

              {/* FOOTER SECTION */}
              <div className="space-y-1 border-t pt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-600">FOOTER TEXT • OPTIONAL</span>
                  <span>{footerText.length}/60</span>
                </div>
                <input type="text" placeholder="e.g. Reply STOP to unsubscribe" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none" />
              </div>

              {/* BUTTONS SECTION */}
              <div className="space-y-3 border-t pt-4 relative">
                <label className="block font-bold text-gray-600">INTERACTIVE BUTTONS • OPTIONAL</label>
                <div className="relative inline-block">
                  <button type="button" onClick={() => setShowButtonMenu(!showButtonMenu)} className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-100 flex items-center space-x-1">
                    <span>+ Add Button</span>
                  </button>
                  {showButtonMenu && (
                    <div className="absolute left-0 mt-2 w-60 bg-white border rounded-2xl shadow-2xl z-30 py-2 divide-y font-medium text-gray-700">
                      {[
                        { type: "Custom", label: "Custom (Quick Reply)" },
                        { type: "Visit website", label: "Visit Website" },
                        { type: "Call Phone Number", label: "Call Phone Number" },
                        { type: "Copy offer code", label: "Copy Offer Code" },
                      ].map((item) => (
                        <button key={item.type} type="button" onClick={() => handleAddButton(item.type)} className="w-full text-left px-4 py-2 hover:bg-emerald-50 cursor-pointer text-xs">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {buttons.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {buttons.map((btn, idx) => (
                      <div key={btn.id} className="flex flex-wrap items-center gap-2 bg-gray-50 p-2.5 rounded-xl border">
                        <span className="font-bold text-gray-500 w-28">{btn.type}:</span>
                        <input type="text" placeholder="Button Text" value={btn.text} onChange={(e) => { const updated = [...buttons]; updated[idx].text = e.target.value; setButtons(updated); }} className="border rounded-lg p-1.5 flex-1 bg-white font-medium" />
                        {(btn.type === "Visit website" || btn.type === "Call Phone Number" || btn.type === "Copy offer code") && (
                          <input type="text" placeholder={btn.type === "Visit website" ? "https://example.com" : btn.type === "Call Phone Number" ? "+919876543210" : "OFFER20"} value={btn.value || ""} onChange={(e) => { const updated = [...buttons]; updated[idx].value = e.target.value; setButtons(updated); }} className="border rounded-lg p-1.5 flex-1 bg-white font-mono" />
                        )}
                        <button type="button" onClick={() => removeButton(btn.id)} className="text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMIT ACTIONS */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button type="button" onClick={() => setStep(1)} className="px-5 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer">⬅ Back</button>
                <button type="button" onClick={handleSubmitForReview} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-2.5 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50">
                  {submitting ? "Submitting to Meta..." : "Submit for Review to Meta 🚀"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Live WhatsApp Phone Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-900 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-xs mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>WhatsApp Business</span>
              </span>
              <span>12:45 PM</span>
            </div>

            <div className="bg-emerald-900/60 p-3 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              {mediaType !== "None" && category !== "Authentication" && subType !== "Carousel" && (
                <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-700 overflow-hidden">
                  {mediaUrl ? <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" /> : `📷 [${mediaType} Sample Header]`}
                </div>
              )}

              {mediaType === "None" && headerText && (
                <div className="font-bold text-white text-xs border-b border-emerald-700/50 pb-1">{headerText}</div>
              )}

              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">{bodyText || "Your message body content will appear here..."}</div>

              {footerText && <div className="text-[10px] text-slate-400 border-t border-emerald-800/80 pt-1">{footerText}</div>}

              {buttons.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  {buttons.map((b) => (
                    <div key={b.id} className="bg-white text-emerald-800 text-center py-1.5 rounded-xl font-bold text-xs shadow-xs">
                      {b.text || "Button"}
                    </div>
                  ))}
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