"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function TemplateCreateContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [wabaAccounts, setWabaAccounts] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");

  const [templateName, setTemplateName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [category, setCategory] = useState("UTILITY");
  const [allowCategoryChange, setAllowCategoryChange] = useState(false);

  // Header State
  const [headerType, setHeaderType] = useState("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  // Body State
  const [bodyText, setBodyText] = useState("");

  // Footer State
  const [footerText, setFooterText] = useState("");

  // Buttons State
  const [buttonsType, setButtonsType] = useState("NONE");
  const [callToActionType, setCallToActionType] = useState("PHONE_NUMBER");
  const [buttonText1, setButtonText1] = useState("");
  const [buttonValue1, setButtonValue1] = useState("");
  const [buttonText2, setButtonText2] = useState("");
  const [buttonValue2, setButtonValue2] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId") || "";
    if (storedUserId) {
      setUserId(storedUserId);
      fetchWabaAccounts(storedUserId);
    } else {
      fetch("/api/admin/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.id) {
            setUserId(data.user.id);
            fetchWabaAccounts(data.user.id);
          }
        })
        .catch(() => fetchWabaAccounts(""));
    }
  }, [searchParams]);

  const fetchWabaAccounts = async (uid: string) => {
    try {
      const res = await fetch(`/api/templates?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        const accounts = data.wabaAccounts || [];
        setWabaAccounts(accounts);

        // 🟢 Dashboard selected channel fallback check
        const urlChannelId = searchParams?.get("channelId");
        if (accounts.length > 0) {
          if (urlChannelId) {
            const matchedAcc = accounts.find(
              (a: any) => a.id === urlChannelId || a.phoneNumberId === urlChannelId || a.wabaId === urlChannelId
            );
            setSelectedChannel(matchedAcc ? (matchedAcc.phoneNumberId || matchedAcc.wabaId) : accounts[0].phoneNumberId || accounts[0].wabaId);
          } else {
            const defaultAcc = accounts.find((a: any) => a.isDefault) || accounts[0];
            setSelectedChannel(defaultAcc.phoneNumberId || defaultAcc.wabaId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load WABA accounts:", err);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      alert("Please enter a template name.");
      return;
    }
    if (!selectedChannel) {
      alert("Please select a WABA channel.");
      return;
    }
    if (!bodyText.trim()) {
      alert("Please enter body content for the template.");
      return;
    }

    setLoading(true);
    try {
      let headerMediaUrl = "";
      if (headerFile) {
        const uploadData = new FormData();
        uploadData.append("file", headerFile);
        uploadData.append("wabaId", selectedChannel);

        const uploadRes = await fetch("/api/media/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          headerMediaUrl = uploadResult.mediaId || uploadResult.url;
        } else {
          alert(`Media upload failed: ${uploadResult.error}`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        userId,
        wabaId: selectedChannel,
        name: templateName.toLowerCase().replace(/\s+/g, "_"),
        language,
        category,
        allowCategoryChange,
        headerType,
        headerText,
        headerMediaUrl,
        bodyText,
        footerText,
        buttonsType,
        callToActionType,
        buttonText1,
        buttonValue1,
        buttonText2,
        buttonValue2,
      };

      const res = await fetch("/api/templates/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Template submitted successfully and synced with Meta!");
        window.location.href = "/dashboard/templates";
      } else {
        alert(`❌ Failed to submit template: ${data.error}`);
      }
    } catch (err) {
      console.error("Template creation error:", err);
      alert("❌ Network error submitting template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 p-4 lg:p-6 text-xs font-sans space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border shadow-xs gap-3 w-full">
        <div>
          <div className="text-gray-400 font-medium">Dashboard › Templates › Create New</div>
          <h1 className="text-xl font-bold text-gray-800">Create Meta WhatsApp Template</h1>
        </div>
        <Link
          href="/dashboard/templates"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
        >
          ⬅ Back to Templates
        </Link>
      </div>

      <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border shadow-xs space-y-6">
          <h2 className="text-base font-bold text-gray-800 border-b pb-3">Template Core Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-600 mb-1">SELECT WABA ACCOUNT *</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none focus:border-emerald-500"
              >
                {wabaAccounts.length === 0 ? (
                  <option value="">No Onboarded Accounts Found</option>
                ) : (
                  wabaAccounts.map((acc) => (
                    <option key={acc.id} value={acc.phoneNumberId || acc.wabaId}>
                      📱 {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "Active WABA"} {acc.isDefault ? "⭐ (Default)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-600 mb-1">TEMPLATE NAME *</label>
              <input
                type="text"
                placeholder="e.g. order_update_alert"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-600 mb-1">LANGUAGE *</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
              >
                <option value="en_US">English (en_US)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="en">English (en)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-600 mb-1">CATEGORY *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
          </div>

          {/* Header Section */}
          <div className="space-y-3 pt-4 border-t">
            <label className="block font-bold text-gray-700">HEADER (OPTIONAL)</label>
            <select
              value={headerType}
              onChange={(e) => setHeaderType(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
            >
              <option value="NONE">None</option>
              <option value="TEXT">Text</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
            </select>

            {headerType === "TEXT" && (
              <input
                type="text"
                placeholder="Enter header title..."
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs focus:outline-none"
              />
            )}

            {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
              <input
                type="file"
                accept={headerType === "IMAGE" ? "image/*" : headerType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx"}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setHeaderFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
            )}
          </div>

          {/* Body Section */}
          <div className="space-y-2 pt-4 border-t">
            <label className="block font-bold text-gray-700">BODY CONTENT * (Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for variables)</label>
            <textarea
              rows={5}
              placeholder="Hello {{1}}, your order {{2}} has been shipped successfully..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full border rounded-xl p-3 bg-gray-50 text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>

          {/* Footer Section */}
          <div className="space-y-2 pt-4 border-t">
            <label className="block font-bold text-gray-700">FOOTER (OPTIONAL)</label>
            <input
              type="text"
              placeholder="Enter small footer text (e.g. Powered by Fortius Infocom)..."
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs focus:outline-none"
            />
          </div>

          {/* Buttons Section */}
          <div className="space-y-3 pt-4 border-t">
            <label className="block font-bold text-gray-700">BUTTONS (OPTIONAL)</label>
            <select
              value={buttonsType}
              onChange={(e) => setButtonsType(e.target.value)}
              className="w-full border rounded-xl p-2.5 bg-gray-50 focus:outline-none font-semibold text-gray-700"
            >
              <option value="NONE">None</option>
              <option value="CALL_TO_ACTION">Call to Action (Phone / URL)</option>
              <option value="QUICK_REPLY">Quick Reply</option>
            </select>

            {buttonsType !== "NONE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1 text-[11px]">Button 1 Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Call Us"
                    value={buttonText1}
                    onChange={(e) => setButtonText1(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1 text-[11px]">Button 1 Value (Phone / URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. +919876543210"
                    value={buttonValue1}
                    onChange={(e) => setButtonValue1(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg cursor-pointer transition disabled:opacity-50"
            >
              {loading ? "⏳ Submitting to Meta..." : "🚀 Submit Template for Approval"}
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-slate-900 p-5 rounded-3xl border-4 border-slate-700 shadow-2xl w-full max-w-sm mx-auto text-white space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-mono">
              <span>WhatsApp Live Preview</span>
              <span className="text-emerald-400 font-bold">{category}</span>
            </div>

            <div className="bg-emerald-900/60 p-3.5 rounded-2xl space-y-2 shadow-inner border border-emerald-800/50">
              {headerType !== "NONE" && (
                <div className="border-b border-emerald-800/60 pb-1.5 text-xs font-semibold text-slate-200">
                  {headerType === "TEXT" ? headerText || "Header Title" : `[Attached ${headerType} Header File]` }
                </div>
              )}
              <div className="text-slate-100 leading-relaxed text-xs whitespace-pre-wrap">
                {bodyText || "Your template body message will appear here..."}
              </div>
              {footerText && <div className="text-[10px] text-slate-300 pt-1">{footerText}</div>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function TemplateCreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading Template Form...</div>}>
      <TemplateCreateContent />
    </Suspense>
  );
}