"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// Declare global FB object for TypeScript
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

function normalizePhoneNumber(rawVal: any): string {
  if (rawVal === null || rawVal === undefined) return "";
  let digits = String(rawVal).trim().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }
  return "";
}

function parseGroupImportSpreadsheet(
  rows: any[][],
  importMode: "SINGLE_NUMBER" | "MULTI_COLUMN"
) {
  const nonEmptyRows = (rows || []).filter(
    (r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== "")
  );
  if (nonEmptyRows.length === 0) {
    return {
      ok: false as const,
      error: "No valid rows found in file.",
    };
  }

  const firstRow = nonEmptyRows[0].map((c) => String(c ?? "").trim());
  const hasHeader = firstRow.some((cell) =>
    /(phone|mobile|number|contact|wa|whatsapp|name|member)/i.test(cell)
  );

  const headers = hasHeader
    ? firstRow.map((h, idx) => h || `Col_${idx + 1}`)
    : firstRow.map((_, idx) => `Col_${idx + 1}`);

  const dataRows = hasHeader ? nonEmptyRows.slice(1) : nonEmptyRows;

  const activeColIndices: number[] = [];
  headers.forEach((_, idx) => {
    const hasValues = dataRows.some((r) => String(r[idx] ?? "").trim() !== "");
    if (hasValues || (hasHeader && firstRow[idx])) {
      activeColIndices.push(idx);
    }
  });

  if (importMode === "SINGLE_NUMBER" && activeColIndices.length > 1) {
    return {
      ok: false as const,
      error:
        "Single Number Column mode allows only 1 column ('number'). For Number & Name, select 'Multiple Columns (Number & Name)'.",
    };
  }

  const numberColIdx = headers.findIndex((h) =>
    /^(phone|mobile|number|contact|whatsapp|wa)$/i.test(h.trim())
  );
  const fallbackNumberColIdx =
    numberColIdx >= 0
      ? numberColIdx
      : headers.findIndex((h) => /(phone|mobile|number|contact|whatsapp|wa)/i.test(h));
  const targetNumberIdx = fallbackNumberColIdx >= 0 ? fallbackNumberColIdx : 0;

  const nameColIdx = headers.findIndex((h) =>
    /^(name|member\s*name|contact\s*name|full\s*name|profile\s*name)$/i.test(h.trim())
  );
  const fallbackNameColIdx =
    nameColIdx >= 0
      ? nameColIdx
      : headers.findIndex((h, idx) => idx !== targetNumberIdx && /name/i.test(h));

  const parsedContacts: { number: string; name: string }[] = [];

  for (const r of dataRows) {
    let phone = normalizePhoneNumber(r[targetNumberIdx]);
    if (!phone && importMode === "MULTI_COLUMN") {
      for (const cell of r) {
        const candidate = normalizePhoneNumber(cell);
        if (candidate) {
          phone = candidate;
          break;
        }
      }
    }

    if (!phone) continue;

    let memberName = "Member";
    if (importMode === "MULTI_COLUMN") {
      if (fallbackNameColIdx >= 0 && String(r[fallbackNameColIdx] ?? "").trim()) {
        memberName = String(r[fallbackNameColIdx]).trim();
      } else {
        const otherCol = r.find(
          (cell, idx) => idx !== targetNumberIdx && String(cell ?? "").trim() !== ""
        );
        if (otherCol !== undefined && String(otherCol).trim()) {
          memberName = String(otherCol).trim();
        }
      }
    }

    parsedContacts.push({
      number: phone,
      name: memberName || "Member",
    });
  }

  if (parsedContacts.length === 0) {
    return {
      ok: false as const,
      error: "No valid phone numbers found in the uploaded file.",
    };
  }

  return {
    ok: true as const,
    contacts: parsedContacts,
  };
}

function ConfigContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("tab") || "hub";

  const setActiveSection = (section: string) => {
    if (section === "hub") {
      router.push("/dashboard/configuration");
    } else {
      router.push(`/dashboard/configuration?tab=${section}`);
    }
  };

  const [channels, setChannels] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);

  // Modals & States
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");

  const [showContactModal, setShowContactModal] = useState(false);
  const [showUploadContactModal, setShowUploadContactModal] = useState(false);
  const [contactData, setContactData] = useState({ name: "", number: "", email: "", contactName: "", profileName: "" });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");

  const [manageGroupObj, setManageGroupObj] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [newMemberNumber, setNewMemberNumber] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  // Group Import Modal States (2 Options: Single Number Column & Multiple Columns Number & Name)
  const [importGroupObj, setImportGroupObj] = useState<any>(null);
  const [groupImportMode, setGroupImportMode] = useState<"SINGLE_NUMBER" | "MULTI_COLUMN">("SINGLE_NUMBER");
  const [groupImportFileName, setGroupImportFileName] = useState("");
  const [groupImportRows, setGroupImportRows] = useState<{ number: string; name: string }[]>([]);
  const [isImportingGroupFile, setIsImportingGroupFile] = useState(false);

  const [exportGroupObj, setExportGroupObj] = useState<any>(null);
  const [editGroupObj, setEditGroupObj] = useState<any>(null);
  const [editGroupNameVal, setEditGroupNameVal] = useState("");

  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showBlacklistExcelModal, setShowBlacklistExcelModal] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");

  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");

  // WABA Action Menu & Business Profile States
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [selectedProfileChannel, setSelectedProfileChannel] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    description: "",
    email: "",
    address: "",
    website: "",
    category: "PROFESSIONAL_SERVICES",
  });
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const metaCategories = [
    { value: "PROFESSIONAL_SERVICES", label: "Professional Services" },
    { value: "RETAIL", label: "Retail & Shopping" },
    { value: "AUTOMOTIVE", label: "Automotive" },
    { value: "ENTERTAINMENT", label: "Entertainment" },
    { value: "FINANCE", label: "Finance & Banking" },
    { value: "EDUCATION", label: "Education" },
    { value: "BEAUTY", label: "Beauty, Cosmetic & Personal Care" },
    { value: "HOTEL", label: "Hotel & Lodging" },
    { value: "RESTAURANT", label: "Restaurant" },
    { value: "OTHER", label: "Other Business" },
  ];

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1405995811146008',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    const loadFBSdk = () => {
      if (document.getElementById('facebook-jssdk')) return;
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      const fjs = document.getElementsByTagName('script')[0];
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    };
    loadFBSdk();

    fetchAllData();
  }, [activeSection]);

  const fetchAllData = () => {
    const userId = localStorage.getItem("userId") || "";

    fetch("/api/configuration/channels")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setChannels(data); })
      .catch(() => {});

    fetch(`/api/configuration/media?userId=${userId}`)
      .then(res => res.json())
      .then(data => { if(data.success && Array.isArray(data.media)) setMediaList(data.media); })
      .catch(() => {});

    fetch("/api/configuration/contacts")
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setContacts(data); })
      .catch(() => {});

    fetch("/api/configuration/groups")
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setGroups(data); })
      .catch(() => {});

    fetch("/api/configuration/blacklist")
      .then(res => res.json())
      .then(data => { if(Array.isArray(data)) setBlacklist(data); })
      .catch(() => {});
  };

  const resetGroupImportModal = () => {
    setImportGroupObj(null);
    setGroupImportMode("SINGLE_NUMBER");
    setGroupImportFileName("");
    setGroupImportRows([]);
    setIsImportingGroupFile(false);
  };

  const handleGroupImportFileSelect = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    setGroupImportFileName(file.name);
    setGroupImportRows([]);

    try {
      let rows: any[][] = [];
      if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
      } else {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
      }

      const parsed = parseGroupImportSpreadsheet(rows, groupImportMode);
      if (!parsed.ok) {
        alert(`⚠️ ${parsed.error}`);
        return;
      }

      setGroupImportRows(parsed.contacts);
    } catch (err) {
      console.error("Group import file parse error:", err);
      alert("❌ Could not parse file. Please upload a valid CSV or Excel file.");
    }
  };

  const handleConfirmGroupImport = async () => {
    if (!importGroupObj || groupImportRows.length === 0) return;

    setIsImportingGroupFile(true);
    try {
      const res = await fetch("/api/configuration/groups/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: importGroupObj.id,
          contacts: groupImportRows,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success !== false) {
        alert(`✅ Imported ${data.addedCount || groupImportRows.length} member(s) into "${importGroupObj.groupName}"!`);
        if (manageGroupObj && manageGroupObj.id === importGroupObj.id) {
          const mRes = await fetch(`/api/configuration/groups/contacts?groupId=${importGroupObj.id}`);
          const mData = await mRes.json();
          if (Array.isArray(mData)) setGroupMembers(mData);
        }
        fetchAllData();
        resetGroupImportModal();
      } else {
        alert("❌ Import failed: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("❌ Network error while importing group members.");
    } finally {
      setIsImportingGroupFile(false);
    }
  };

  const filteredMedia = useMemo(() => {
    if (!mediaSearchQuery.trim()) return mediaList;
    return mediaList.filter(
      (m) =>
        (m.mediaName || "").toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
        (m.wabaNumber || "").toLowerCase().includes(mediaSearchQuery.toLowerCase())
    );
  }, [mediaList, mediaSearchQuery]);

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      const res = await fetch(`/api/configuration/media?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMediaList((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete media: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Error deleting media file.");
    }
  };

  const handleSetDefaultChannel = async (id: string) => {
    try {
      const res = await fetch("/api/configuration/default-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert("Default channel updated successfully!");
        fetchAllData();
      } else {
        alert("Failed to set default channel");
      }
    } catch {
      alert("Error updating default channel.");
    }
  };

  const handleUpdateWebhook = async (channel: any) => {
    const newUrl = prompt("Enter new Webhook URL for this channel:", channel.webhookUrl === "NA" ? "" : channel.webhookUrl);
    if (newUrl === null) return;

    try {
      const res = await fetch("/api/configuration/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: channel.id, webhookUrl: newUrl }),
      });

      if (res.ok) {
        alert("Webhook URL updated successfully!");
        fetchAllData();
      } else {
        alert("Failed to update webhook URL.");
      }
    } catch {
      alert("Error updating webhook URL.");
    }
  };

  const handleOpenProfileModal = async (channel: any) => {
    setSelectedProfileChannel(channel);
    setOpenActionMenuId(null);
    setProfileImageFile(null);
    setProfileImagePreview("");

    setProfileForm({
      displayName: channel.displayName || channel.displayPhone || "Fortius Infocom",
      description: channel.description || "",
      email: channel.email || "",
      address: channel.address || "",
      website: channel.website || "",
      category: channel.category || "PROFESSIONAL_SERVICES",
    });

    if (channel.profilePicture) {
      setProfileImagePreview(channel.profilePicture);
    }

    try {
      const res = await fetch(`/api/configuration/business-profile?id=${channel.id}`);
      const result = await res.json();
      if (result.success && result.data) {
        setProfileForm({
          displayName: result.data.displayName || channel.displayName || "Fortius Infocom",
          description: result.data.description || channel.description || "",
          email: result.data.email || channel.email || "",
          address: result.data.address || channel.address || "",
          website: result.data.website || channel.website || "",
          category: result.data.category || channel.category || "PROFESSIONAL_SERVICES",
        });
        if (result.data.profilePicture) {
          setProfileImagePreview(result.data.profilePicture);
        }
      }
    } catch (err) {
      console.error("Failed to fetch live profile details", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImagePreview(base64String);
        setProfileImageFile(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!selectedProfileChannel) return;
    setIsSavingProfile(true);
    try {
      const finalLogoUrl = profileImageFile || profileImagePreview;

      const res = await fetch("/api/configuration/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProfileChannel.id,
          ...profileForm,
          profilePicture: finalLogoUrl
        }),
      });

      if (res.ok) {
        alert("✅ Business Profile updated successfully on Meta Cloud API!");
        setSelectedProfileChannel(null);
        fetchAllData();
      } else {
        alert("❌ Failed to update profile on Meta");
      }
    } catch {
      alert("❌ Error saving business profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFacebookSignup = () => {
    if (!window.FB) {
      alert("Facebook SDK is still loading. Please try again in a moment.");
      return;
    }
    setShowFacebookModal(false);
    window.FB.login(function (response: any) {
      if (response.authResponse) {
        const code = response.authResponse.code || response.authResponse.accessToken;
        fetch("/api/configuration/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, website: companyWebsite, name: companyName })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("WhatsApp channel connected successfully!");
            fetchAllData();
          } else {
            alert("Error: " + (data.error || "Failed to register channel"));
          }
        })
        .catch(() => alert("Error registering channel details."));
      } else {
        alert("User cancelled login or did not fully authorize.");
      }
    }, {
      config_id: '891599173270116',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: { solutionID: '891846553340614' },
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: 3
      }
    });
  };

  const handleFileUploadHelper = async (e: React.ChangeEvent<HTMLInputElement>, endpoint: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const records = lines
        .slice(1)
        .map((line) => {
          const parts = line.split(",");
          if (parts[0] && parts[0].trim()) {
            return endpoint === "contacts"
              ? { number: parts[0].trim(), profileName: parts[1]?.trim() || "", email: parts[2]?.trim() || "", contactName: parts[3]?.trim() || "" }
              : { number: parts[0].trim() };
          }
          return null;
        })
        .filter(Boolean);

      if (records.length > 0) {
        try {
          const res = await fetch(`/api/configuration/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(records),
          });
          if (res.ok) {
            alert(`Successfully imported ${records.length} records!`);
            fetchAllData();
            setShowUploadContactModal(false);
            setShowBlacklistExcelModal(false);
          } else {
            alert("Import failed.");
          }
        } catch {
          alert("Error sending file data.");
        }
      } else {
        alert("No valid records found in file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 w-full p-4 text-xs font-sans">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <div className="text-gray-400">
            Home › <span onClick={() => setActiveSection("hub")} className="cursor-pointer hover:text-emerald-600 font-medium">Configuration</span> {activeSection !== "hub" && `› ${activeSection.replace("_", " ").toUpperCase()}`}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {activeSection === "hub" && "Configuration"}
            {activeSection === "waba_channels" && "WABA Channels"}
            {activeSection === "onboarding" && "WhatsApp Coexistence Onboarding"}
            {activeSection === "media_library" && "Media Library"}
            {activeSection === "contacts" && "WhatsApp Contacts"}
            {activeSection === "groups" && "Group List"}
            {activeSection === "blacklist" && "Blacklisted Numbers"}
          </h1>
        </div>
        {activeSection !== "hub" && (
          <button onClick={() => setActiveSection("hub")} className="border px-3.5 py-1.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer shadow-sm">⬅ Back to Hub</button>
        )}
      </div>

      {activeSection === "hub" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div onClick={() => setActiveSection("waba_channels")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📡</div>
              <h3 className="font-bold text-sm text-gray-800">Waba Channels</h3>
              <p className="text-[11px] text-gray-400">Manage WABA Channels.</p>
            </div>
            <div onClick={() => setActiveSection("onboarding")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">💻</div>
              <h3 className="font-bold text-sm text-gray-800">WhatsApp Coexistence Onboarding</h3>
              <p className="text-[11px] text-gray-400">Onboard WhatsApp Business App users.</p>
            </div>
            <div onClick={() => setActiveSection("media_library")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📼</div>
              <h3 className="font-bold text-sm text-gray-800">Media Library</h3>
              <p className="text-[11px] text-gray-400">Browse and manage media assets.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3">
            <div onClick={() => setActiveSection("contacts")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📱</div>
              <h3 className="font-bold text-sm text-gray-800">WhatsApp Contacts</h3>
              <p className="text-[11px] text-gray-400">Manage contacts, add, upload file & delete.</p>
            </div>
            <div onClick={() => setActiveSection("groups")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">📲</div>
              <h3 className="font-bold text-sm text-gray-800">Manage Group</h3>
              <p className="text-[11px] text-gray-400">Manage, Import, Export, Edit, Delete groups.</p>
            </div>
            <div onClick={() => setActiveSection("blacklist")} className="bg-white p-6 rounded-2xl border shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2">
              <div className="text-3xl">🖥️</div>
              <h3 className="font-bold text-sm text-gray-800">Blacklist Numbers</h3>
              <p className="text-[11px] text-gray-400">Manage blocked numbers and Excel uploads.</p>
            </div>
          </div>
        </div>
      )}

      {/* WABA CHANNELS TABLE */}
      {activeSection === "waba_channels" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <button onClick={() => setShowFacebookModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
              + Register New WhatsApp
            </button>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b uppercase text-[11px]">
                  <th className="p-3 whitespace-nowrap">WABA NUMBER</th>
                  <th className="p-3 whitespace-nowrap">PHONENUMBER ID</th>
                  <th className="p-3 whitespace-nowrap">WABA BUSINESSID</th>
                  <th className="p-3 whitespace-nowrap">MESSAGING LIMIT</th>
                  <th className="p-3 whitespace-nowrap">QUALITY RATING</th>
                  <th className="p-3 whitespace-nowrap">DEFAULT</th>
                  <th className="p-3 whitespace-nowrap">DISPLAY NAME</th>
                  <th className="p-3 whitespace-nowrap">CONFIGURE DATE</th>
                  <th className="p-3 whitespace-nowrap">WEBHOOK URL</th>
                  <th className="p-3 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700 font-medium">
                {channels.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-gray-400">
                      No WABA channels found. Click "+ Register New WhatsApp" to connect your number.
                    </td>
                  </tr>
                ) : (
                  channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800 font-mono">{ch.displayPhone || ch.display_phone_number}</td>
                      <td className="p-3 font-mono text-gray-600">{ch.phoneNumberId || ch.phone_number_id}</td>
                      <td className="p-3 font-mono text-gray-600">{ch.wabaId || ch.waba_id}</td>
                      <td className="p-3 text-emerald-600 font-bold whitespace-nowrap">✔ {ch.messagingLimit || "Fetching..."}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-slate-700">✔ {ch.qualityRating || "N/A"}</td>
                      <td className="p-3">
                        <button onClick={() => handleSetDefaultChannel(ch.id)} className={`${ch.isDefault ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'} px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer`}>
                          {ch.isDefault ? "Default ★" : "Set Default"}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{ch.displayName || "100 App"}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(ch.createdAt || Date.now()).toLocaleString()}</td>
                      <td onClick={() => handleUpdateWebhook(ch)} className="p-3 text-emerald-600 underline cursor-pointer hover:text-emerald-800 font-mono" title="Click to edit Webhook URL">
                        {ch.webhookUrl || "NA"}
                      </td>
                      <td className="p-3 relative">
                        <button onClick={() => setOpenActionMenuId(openActionMenuId === ch.id ? null : ch.id)} className="p-1.5 rounded-lg hover:bg-slate-100 font-bold text-slate-700 text-sm cursor-pointer">
                          ⋮
                        </button>
                        {openActionMenuId === ch.id && (
                          <div className="absolute right-3 top-10 bg-white border rounded-xl shadow-lg z-30 w-44 p-1">
                            <button onClick={() => handleOpenProfileModal(ch)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg text-slate-700 font-semibold cursor-pointer">
                              <span>✏️</span> Business Profile
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WHATSAPP COEXISTENCE ONBOARDING TAB */}
      {activeSection === "onboarding" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium">
              <span>⚠️</span>
              <span>Important Notice for WhatsApp Business App Users (Coexistence)</span>
            </div>
            <div className="text-gray-600 space-y-1.5 pl-1">
              <p>If you are connecting a WhatsApp Business App number (Coexistence):</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li>Messages sent from WhatsApp Business App will appear in this panel inbox.</li>
                <li>Messages received from customers will sync to both WhatsApp App and this panel.</li>
                <li>If your number was previously connected to another WhatsApp API provider: Please disconnect / deactivate the existing API first. Wait for 5-10 minutes. Then start Embedded Signup again from this panel.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-sm flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-full max-w-md">
                <img src="https://illustrations.popsy.co/amber/digital-nomad.svg" alt="Coexistence Illustration" className="w-full h-48 object-contain" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-sm">WhatsApp Bridge with Facebook</h3>
                <p className="text-gray-400 max-w-md mx-auto">Connect your WhatsApp Business API or Coexistence number to our platform via Facebook Embedded Signup.</p>
              </div>
              <button
                onClick={() => setShowFacebookModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow cursor-pointer transition flex items-center gap-2"
              >
                <span>🌐</span> Connect WhatsApp with Facebook
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-bold text-gray-800">WhatsApp Business Info</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">WHATSAPP BUSINESS ID</span>
                  <span className="font-mono text-gray-700">{channels[0]?.wabaId || "--"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">PHONE NUMBER ID</span>
                  <span className="font-mono text-gray-700">{channels[0]?.phoneNumberId || "--"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">CONNECTION STATUS</span>
                  <span className={`font-bold ${channels.length > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {channels.length > 0 ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold text-[10px]">OVERALL HEALTH</span>
                  <span className="font-bold text-emerald-600">{channels.length > 0 ? '🟢 Excellent' : '--'}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800">
                💡 Your business info will be updated automatically after successful connection.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA LIBRARY TAB */}
      {activeSection === "media_library" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800">Media Library</h2>
              <p className="text-[11px] text-gray-400">Manage your templates and campaign media assets</p>
            </div>
            <button onClick={() => setShowMediaModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition">
              + Add Media
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl flex items-center space-x-3 text-[11px]">
            <span>ℹ️</span>
            <span>As per Meta WhatsApp media retention policies, only media files from the last 30 days are available in the Media Library.</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
            <input
              type="text"
              placeholder="Filter Records by name or WABA number..."
              value={mediaSearchQuery}
              onChange={(e) => setMediaSearchQuery(e.target.value)}
              className="w-full max-w-sm border rounded-xl p-2 bg-gray-50 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
            />
            <span className="text-gray-500 font-bold text-[11px]">Total: {filteredMedia.length} record(s)</span>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                  <th className="p-4">MEDIA</th>
                  <th className="p-4">FILE URL</th>
                  <th className="p-4">WABA NUMBER</th>
                  <th className="p-4">EXPIRES IN</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredMedia.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 font-medium">No media files found. Click "+ Add Media" to upload.</td>
                  </tr>
                ) : (
                  filteredMedia.map((m: any) => {
                    const expiryDate = m.expiresAt ? new Date(m.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const diffTime = expiryDate.getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const resolvedUrl = m.url?.startsWith("data:image") ? m.url : (m.url?.startsWith("http") || m.url?.startsWith("/") ? m.url : `/uploads/${m.url}`);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                            {m.fileType === "image" || resolvedUrl.startsWith("data:image") || resolvedUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                              <img src={resolvedUrl} alt={m.mediaName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{m.fileType || "doc"}</span>
                            )}
                          </div>
                          <span className="font-bold text-gray-800 truncate max-w-xs">{m.mediaName || "Unnamed File"}</span>
                        </td>
                        <td className="p-4 font-mono">
                          <a href={resolvedUrl} target="_blank" rel="noreferrer" onClick={(e) => {
                            if (m.url?.startsWith("data:image")) {
                              e.preventDefault();
                              const win = window.open();
                              win?.document.write(`<img src="${m.url}" style="max-width:100%;"/>`);
                            }
                          }} className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 hover:underline font-bold inline-block">
                            👁️ View File
                          </a>
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                          <span className="bg-gray-100 px-2.5 py-1 rounded text-[11px] font-mono">{m.wabaNumber || "All"}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-800 font-medium">{expiryDate.toLocaleDateString()}</div>
                          <div className={`text-[10px] font-bold ${diffDays <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>{diffDays > 0 ? `${diffDays} days left` : 'Expired'}</div>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              const raw = String(resolvedUrl || "").trim();
                              if (!raw) return;
                              const fullUrl = raw.startsWith("/")
                                ? `${window.location.origin}${raw}`
                                : raw;
                              navigator.clipboard.writeText(fullUrl);
                              alert("🔗 URL copied to clipboard!");
                            }}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[11px] cursor-pointer shadow-xs transition"
                          >
                            📋 Copy URL
                          </button>
                          <button onClick={() => handleDeleteMedia(m.id)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-[11px] cursor-pointer shadow-xs transition">🗑️ Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WHATSAPP CONTACTS TAB */}
      {activeSection === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800">WhatsApp Contacts</h2>
              <p className="text-[11px] text-gray-400">Manage individual contacts, add records, or bulk upload via CSV.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowContactModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition">+ Add Contact</button>
              <button onClick={() => setShowUploadContactModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition">📤 Upload Contacts (File)</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                  <th className="p-4">MOBILE NUMBER</th>
                  <th className="p-4">PROFILE NAME</th>
                  <th className="p-4">CONTACT NAME</th>
                  <th className="p-4">EMAIL</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {contacts.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-400">No contacts found. Add manually or upload a CSV file.</td></tr>
                ) : (
                  contacts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold font-mono text-slate-900">{c.number}</td>
                      <td className="p-4">{c.profileName || "-"}</td>
                      <td className="p-4">{c.contactName || "-"}</td>
                      <td className="p-4 text-gray-500">{c.email || "-"}</td>
                      <td className="p-4 text-right">
                        <button onClick={async () => {
                          if (!confirm("Delete this contact?")) return;
                          await fetch(`/api/configuration/contacts?id=${c.id}`, { method: "DELETE" });
                          fetchAllData();
                        }} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold">🗑️ Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANAGE GROUP TAB */}
      {activeSection === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800">Group List</h2>
              <p className="text-[11px] text-gray-400">Create, manage, import, export, and edit customer contact groups.</p>
            </div>
            <button onClick={() => setShowGroupModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer transition">+ Add Group</button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                  <th className="p-4">GROUP NAME</th>
                  <th className="p-4">TOTAL CONTACTS</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {groups.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-400">No contact groups created yet.</td></tr>
                ) : (
                  groups.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-emerald-700">{g.groupName}</td>
                      <td className="p-4 font-semibold">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">{g.totalContacts || 0} Contacts</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={async () => {
                          setManageGroupObj(g);
                          try {
                            const res = await fetch(`/api/configuration/groups/contacts?groupId=${g.id}`);
                            const data = await res.json();
                            if (Array.isArray(data)) setGroupMembers(data);
                          } catch (err) {
                            console.error("Failed to fetch group members", err);
                          }
                        }} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer">⚙️ Manage</button>
                        <button
                          type="button"
                          onClick={() => {
                            setImportGroupObj(g);
                            setGroupImportMode("SINGLE_NUMBER");
                            setGroupImportFileName("");
                            setGroupImportRows([]);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-bold cursor-pointer"
                        >
                          📥 Import
                        </button>
                        <button onClick={() => {
                          const csvContent = "data:text/csv;charset=utf-8,Mobile Number,Profile Name\n919876543210,Sample User";
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `${g.groupName}_contacts.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-bold cursor-pointer">📤 Export</button>
                        <button onClick={() => { setEditGroupObj(g); setEditGroupNameVal(g.groupName); }} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg font-bold cursor-pointer">✏️ Edit</button>
                        <button onClick={async () => {
                          if (!confirm(`Delete group "${g.groupName}"?`)) return;
                          await fetch(`/api/configuration/groups?id=${g.id}`, { method: "DELETE" });
                          fetchAllData();
                        }} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold cursor-pointer">🗑️ Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLACKLIST NUMBERS TAB */}
      {activeSection === "blacklist" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800">Blacklisted Numbers</h2>
              <p className="text-[11px] text-gray-400">Manage blocked mobile numbers to prevent automated campaign broadcasts.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBlacklistModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition">+ Block Number</button>
              <button onClick={() => setShowBlacklistExcelModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow cursor-pointer transition">📤 Upload Excel / File</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                  <th className="p-4">MOBILE NUMBER</th>
                  <th className="p-4">BLOCKED DATE</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {blacklist.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-400">No numbers currently blacklisted.</td></tr>
                ) : (
                  blacklist.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-red-600 font-mono">{b.number}</td>
                      <td className="p-4 text-gray-500">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={async () => {
                          await fetch(`/api/configuration/blacklist?id=${b.id}`, { method: "DELETE" });
                          fetchAllData();
                        }} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg font-bold">🔓 Unblock</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ALL MODALS & POPUPS --- */}

      {/* GROUP IMPORT MODAL (2 OPTIONS: SINGLE NUMBER COLUMN vs MULTIPLE COLUMNS NUMBER & NAME) */}
      {importGroupObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">
                  Import Members to <span className="text-emerald-600">{importGroupObj.groupName}</span>
                </h3>
                <p className="text-[11px] text-gray-400">Choose import format and upload CSV / Excel file.</p>
              </div>
              <button
                type="button"
                onClick={resetGroupImportModal}
                className="text-gray-400 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block font-bold text-gray-700 text-xs">SELECT IMPORT OPTION *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setGroupImportMode("SINGLE_NUMBER");
                    setGroupImportFileName("");
                    setGroupImportRows([]);
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    groupImportMode === "SINGLE_NUMBER"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-bold text-xs">1. Single Number Column</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Only phone numbers column</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGroupImportMode("MULTI_COLUMN");
                    setGroupImportFileName("");
                    setGroupImportRows([]);
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    groupImportMode === "MULTI_COLUMN"
                      ? "bg-blue-50 border-blue-500 text-blue-900"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-bold text-xs">2. Multiple Columns</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Number & Name columns</div>
                </button>
              </div>

              <div className="bg-slate-50 border rounded-xl p-3 text-[11px] text-gray-600">
                {groupImportMode === "SINGLE_NUMBER" ? (
                  <span>
                    <strong className="text-emerald-700">Single Number Column:</strong> File should have a single column (e.g., <span className="font-mono">number</span>) with mobile numbers.
                  </span>
                ) : (
                  <span>
                    <strong className="text-blue-700">Multiple Columns (Number & Name):</strong> File should include <span className="font-mono">number</span> and <span className="font-mono">name</span> columns.
                  </span>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleGroupImportFileSelect(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-emerald-700 font-bold text-xs mb-1">📁 Browse CSV / Excel File</div>
                <div className="text-gray-400 text-[10px]">
                  {groupImportFileName ? `Selected: ${groupImportFileName}` : "Supports .csv, .xlsx, .xls"}
                </div>
              </div>

              {groupImportRows.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className="font-bold text-emerald-900">
                    ✓ Ready to Import: {groupImportRows.length} valid contact(s)
                  </div>
                  <div className="text-[11px] font-mono text-gray-700 truncate">
                    Sample: {groupImportRows[0].number} — {groupImportRows[0].name}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={resetGroupImportModal}
                className="px-4 py-2 border rounded-xl font-bold cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={groupImportRows.length === 0 || isImportingGroupFile}
                onClick={handleConfirmGroupImport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer shadow disabled:opacity-50"
              >
                {isImportingGroupFile ? "Importing..." : `Import (${groupImportRows.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW WHATSAPP POPUP */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-sm font-bold text-gray-800">Get started with WhatsApp's Business API</h2>
              <button onClick={() => setShowFacebookModal(false)} className="text-gray-400 font-bold text-base cursor-pointer">✕</button>
            </div>

            <p className="text-gray-600 leading-relaxed text-[11px]">
              WhatsApp is one of the most popular communication applications in the world. WhatsApp is a Facebook company and requires a Facebook account and Facebook Business Manager to set up.
            </p>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <span>👉</span> What you will need
              </h4>
              <ul className="list-disc pl-6 space-y-1 text-gray-500 text-[11px]">
                <li>Access to Facebook Business Manager</li>
                <li>A viable Phone Number for WhatsApp</li>
                <li>Your business's legal address and details</li>
                <li>Verify your Facebook Business</li>
                <li>Full access to the WhatsApp Business account</li>
                <li>The ID should belong to the business you manage</li>
                <li>FB user ID must manage templates, phone numbers, QR codes</li>
              </ul>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Company Website:</label>
                <input type="text" placeholder="Company Website" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full border rounded-xl p-2.5 bg-white text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Company Name:</label>
                <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded-xl p-2.5 bg-white text-xs" />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <span>👉</span> To continue you need access to your Facebook business account, including:
              </h4>
              <ul className="list-disc pl-6 space-y-1 text-gray-500 text-[11px]">
                <li>Your company's <span className="text-emerald-600 font-semibold">legal name and address</span></li>
                <li>A display name and short description</li>
                <li>A valid email address</li>
                <li>A valid mobile number</li>
                <li>A business-owned phone number</li>
              </ul>
            </div>

            <div className="flex justify-start items-center gap-3 pt-3 border-t">
              <button onClick={handleFacebookSignup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs flex items-center gap-2">
                <span>🌐</span> Continue with Facebook
              </button>
              <button onClick={() => setShowFacebookModal(false)} className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl shadow cursor-pointer text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE GROUP MEMBERS MODAL */}
      {manageGroupObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Manage Members: <span className="text-emerald-600">{manageGroupObj.groupName}</span></h3>
                <p className="text-[10px] text-gray-400">Add or remove phone numbers associated with this group.</p>
              </div>
              <button onClick={() => { setManageGroupObj(null); setGroupMembers([]); }} className="text-gray-400 font-bold cursor-pointer text-sm">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
              <h4 className="font-bold text-slate-700 text-xs">Add New Member to Group</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Mobile Number (9198...)" value={newMemberNumber} onChange={(e) => setNewMemberNumber(e.target.value)} className="border rounded-xl p-2.5 bg-white font-mono" />
                <input type="text" placeholder="Member Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="border rounded-xl p-2.5 bg-white" />
              </div>
              <button onClick={async () => {
                if (!newMemberNumber) return alert("Please enter mobile number!");
                try {
                  const res = await fetch(`/api/configuration/groups/contacts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ groupId: manageGroupObj.id, number: newMemberNumber, name: newMemberName }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert("✅ Member added successfully!");
                    setNewMemberNumber("");
                    setNewMemberName("");
                    const mRes = await fetch(`/api/configuration/groups/contacts?groupId=${manageGroupObj.id}`);
                    const mData = await mRes.json();
                    if (Array.isArray(mData)) setGroupMembers(mData);
                    fetchAllData();
                  } else {
                    alert("❌ Error: " + (data.error || "Failed to add member"));
                  }
                } catch {
                  alert("❌ Network error.");
                }
              }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer transition w-full">+ Add Member</button>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-gray-500 font-bold text-[11px]">
                    <th className="p-3">MOBILE NUMBER</th>
                    <th className="p-3">NAME</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  {groupMembers.length === 0 ? (
                    <tr><td colSpan={3} className="p-6 text-center text-gray-400">No members found in this group yet. Add one above!</td></tr>
                  ) : (
                    groupMembers.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold font-mono text-slate-800">{m.number}</td>
                        <td className="p-3">{m.name || "Member"}</td>
                        <td className="p-3 text-right">
                          <button onClick={async () => {
                            if (!confirm("Remove this member from group?")) return;
                            const res = await fetch(`/api/configuration/groups/contacts?id=${m.id}&groupId=${manageGroupObj.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setGroupMembers((prev) => prev.filter((item) => item.id !== m.id));
                              fetchAllData();
                            } else {
                              alert("Failed to remove member.");
                            }
                          }} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold">🗑️ Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => { setManageGroupObj(null); setGroupMembers([]); }} className="px-5 py-2.5 border rounded-xl font-bold cursor-pointer hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA UPLOAD MODAL */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Media File</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">SELECT ONBOARDED WABA CHANNEL *</label>
                <select id="mediaUploadWabaSelect" className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs font-medium cursor-pointer">
                  {channels.length === 0 ? (
                    <option value="All">All / Default</option>
                  ) : (
                    channels.map((ch) => (
                      <option key={ch.id} value={ch.displayPhone || ch.phoneNumberId}>
                        {ch.displayName || "WABA"} ({ch.displayPhone || ch.phoneNumberId})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">SELECT FILE (IMAGE / VIDEO / PDF) *</label>
                <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setMediaFile(e.target.files?.[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowMediaModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={async () => {
                if(!mediaFile) return alert("Please select a file first!");
                const selectEl = document.getElementById("mediaUploadWabaSelect") as HTMLSelectElement;
                const formData = new FormData();
                formData.append("file", mediaFile);
                formData.append("userId", localStorage.getItem("userId") || "emergency_admin_id");
                formData.append("wabaNumber", selectEl ? selectEl.value : "All");

                try {
                  const res = await fetch("/api/configuration/media", { method: "POST", body: formData });
                  const data = await res.json();
                  if(data.success) {
                    alert("✅ Media uploaded successfully!");
                    setShowMediaModal(false);
                    setMediaFile(null);
                    fetchAllData();
                  } else {
                    alert("❌ Upload failed: " + (data.error || "Unknown error"));
                  }
                } catch {
                  alert("❌ Network error during upload.");
                }
              }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer shadow">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Add WhatsApp Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">Mobile Number (with country code) *</label>
                <input type="text" placeholder="919876543210" value={contactData.number} onChange={(e)=>setContactData({...contactData, number: e.target.value})} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">Profile Name</label>
                <input type="text" placeholder="John Doe" value={contactData.profileName || ""} onChange={(e)=>setContactData({...contactData, profileName: e.target.value})} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">Contact Name</label>
                <input type="text" placeholder="Johnny" value={contactData.contactName || ""} onChange={(e)=>setContactData({...contactData, contactName: e.target.value})} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 text-xs mb-1">Email Address</label>
                <input type="email" placeholder="john@example.com" value={contactData.email} onChange={(e)=>setContactData({...contactData, email: e.target.value})} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowContactModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={async () => {
                if(!contactData.number) return alert("Mobile number is required!");
                const res = await fetch("/api/configuration/contacts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(contactData),
                });
                if(res.ok) {
                  alert("✅ Contact added successfully!");
                  setShowContactModal(false);
                  setContactData({ name: "", number: "", email: "", contactName: "", profileName: "" });
                  fetchAllData();
                } else {
                  alert("Failed to add contact.");
                }
              }} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold cursor-pointer">Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD CONTACTS CSV MODAL */}
      {showUploadContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Contacts CSV</h3>
              <button onClick={() => setShowUploadContactModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <p className="text-[11px] text-gray-500">CSV format requirement: Header row (`Mobile Number,Profile Name,Email,Contact Name`) followed by data rows.</p>
            <input type="file" accept=".csv" onChange={(e) => handleFileUploadHelper(e, "contacts")} className="w-full text-xs text-gray-500 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer" />
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setShowUploadContactModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GROUP MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Create Contact Group</h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1">Group Name *</label>
              <input type="text" placeholder="VIP Customers" value={groupNameInput} onChange={(e)=>setGroupNameInput(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={async () => {
                if(!groupNameInput) return alert("Group name is required!");
                const res = await fetch("/api/configuration/groups", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ groupName: groupNameInput }),
                });
                if(res.ok) {
                  alert("✅ Group created successfully!");
                  setShowGroupModal(false);
                  setGroupNameInput("");
                  fetchAllData();
                } else {
                  alert("Failed to create group.");
                }
              }} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold cursor-pointer">Create Group</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editGroupObj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Edit Group Name</h3>
              <button onClick={() => setEditGroupObj(null)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1">New Group Name *</label>
              <input type="text" value={editGroupNameVal} onChange={(e)=>setEditGroupNameVal(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs font-bold" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setEditGroupObj(null)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={async () => {
                const res = await fetch("/api/configuration/groups", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: editGroupObj.id, groupName: editGroupNameVal }),
                });
                if(res.ok) {
                  alert("✅ Group updated successfully!");
                  setEditGroupObj(null);
                  fetchAllData();
                } else {
                  alert("Failed to update group.");
                }
              }} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK NUMBER MODAL */}
      {showBlacklistModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Block Mobile Number</h3>
              <button onClick={() => setShowBlacklistModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1">Mobile Number *</label>
              <input type="text" placeholder="919876543210" value={blacklistInput} onChange={(e)=>setBlacklistInput(e.target.value)} className="w-full border rounded-xl p-2.5 bg-gray-50 text-xs font-mono font-bold" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setShowBlacklistModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={async () => {
                if(!blacklistInput) return alert("Number is required!");
                const res = await fetch("/api/configuration/blacklist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ number: blacklistInput }),
                });
                if(res.ok) {
                  alert("✅ Number blacklisted successfully!");
                  setShowBlacklistModal(false);
                  setBlacklistInput("");
                  fetchAllData();
                } else {
                  alert("Failed to blacklist number.");
                }
              }} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold cursor-pointer">Block Number</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD BLACKLIST EXCEL MODAL */}
      {showBlacklistExcelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Upload Blacklist Numbers (CSV)</h3>
              <button onClick={() => setShowBlacklistExcelModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>
            <p className="text-[11px] text-gray-500">CSV format requirement: Header row (`Mobile Number`) followed by numbers column.</p>
            <input type="file" accept=".csv" onChange={(e) => handleFileUploadHelper(e, "blacklist")} className="w-full text-xs text-gray-500 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white cursor-pointer" />
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setShowBlacklistExcelModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS PROFILE MODAL */}
      {selectedProfileChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Business Profile Settings ({selectedProfileChannel.displayPhone})</h3>
              <button onClick={() => setSelectedProfileChannel(null)} className="text-gray-400 font-bold cursor-pointer text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border">
                  <div className="w-16 h-16 rounded-full border bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {profileImagePreview ? <img src={profileImagePreview} alt="Profile Logo" className="w-full h-full object-cover" /> : <span className="text-2xl">🏢</span>}
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Display Image / Logo</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-gray-500 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Display Name *</label>
                  <input type="text" value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50 font-bold" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description / About</label>
                  <textarea rows={3} value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50 resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Website URL</label>
                    <input type="text" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Business Address</label>
                  <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select value={profileForm.category} onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })} className="w-full border rounded-xl p-2.5 bg-gray-50 font-medium">
                    {metaCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-4 text-white flex flex-col items-center justify-between shadow-xl">
                <div className="w-full text-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">📱 Live WhatsApp Preview</span>
                </div>
                <div className="bg-white text-slate-800 rounded-2xl w-full p-4 space-y-3 my-4 shadow-lg text-xs">
                  <div className="flex items-center space-x-3 border-b pb-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border">
                      {profileImagePreview ? <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span>🏢</span>}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{profileForm.displayName || "Business Name"}</h4>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">Official Account</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-600">
                    <p className="italic">{profileForm.description || "Description..."}</p>
                    <div>📍 {profileForm.address || "Address"}</div>
                    <div>✉️ {profileForm.email || "Email"}</div>
                    <div>🌐 {profileForm.website || "Website"}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center">Changes sync instantly with Meta Cloud API.</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setSelectedProfileChannel(null)} className="px-5 py-2.5 border rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={handleSaveBusinessProfile} disabled={isSavingProfile} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer shadow disabled:opacity-50 transition">
                {isSavingProfile ? "Syncing with Meta..." : "💾 Save & Sync to Meta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading Configuration...</div>}>
      <ConfigContent />
    </Suspense>
  );
}