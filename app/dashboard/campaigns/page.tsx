"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { getAgentPermittedChannels } from "@/lib/agentChannelFilter";

function normalizePhone(rawVal: any): string {
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

function parseSpreadsheetRows(rows: any[][]) {
  if (!rows || rows.length === 0) {
    return {
      numbers: [] as string[],
      columns: [] as string[],
      rowObjects: [] as Record<string, string>[],
      totalRows: 0,
    };
  }

  const firstRow = rows[0].map((c) => String(c ?? "").trim());
  const hasHeader = firstRow.some((cell) =>
    /(phone|mobile|number|contact|wa|whatsapp|name|var\d*|col)/i.test(cell)
  );

  const headers = hasHeader
    ? firstRow.map((h, idx) => h || `Col_${idx + 1}`)
    : firstRow.map((_, idx) => `Col_${idx + 1}`);

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const phoneColIdx = headers.findIndex((h) =>
    /(phone|mobile|number|contact|whatsapp|wa)/i.test(h)
  );

  const numbers: string[] = [];
  const rowObjects: Record<string, string>[] = [];

  for (const r of dataRows) {
    if (!Array.isArray(r) || r.length === 0) continue;

    let phone = "";
    if (phoneColIdx >= 0) {
      phone = normalizePhone(r[phoneColIdx]);
    }
    if (!phone) {
      for (const cell of r) {
        const candidate = normalizePhone(cell);
        if (candidate) {
          phone = candidate;
          break;
        }
      }
    }

    if (phone) {
      numbers.push(phone);
      const rowObj: Record<string, string> = { _phone: phone };
      headers.forEach((col, idx) => {
        rowObj[col] = r[idx] !== undefined && r[idx] !== null ? String(r[idx]).trim() : "";
      });
      rowObjects.push(rowObj);
    }
  }

  return {
    numbers,
    columns: headers,
    rowObjects,
    totalRows: dataRows.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== "")).length,
  };
}

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

  // User Pricing Rates State
  const [userRates, setUserRates] = useState({
    marketing: 0.135,
    utility: 0.100,
    authentication: 0.080,
    service: 0.090,
  });

  // Audience & Numbers Processing
  const [numbersInput, setNumbersInput] = useState("");
  const [selectedSourceChips, setSelectedSourceChips] = useState<string[]>([]);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [removeBlacklist, setRemoveBlacklist] = useState(true);
  const [customBlacklist, setCustomBlacklist] = useState<string[]>([
    "910000000000",
    "0000000000",
  ]);

  // Group Contacts Modal State
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [addingGroupContacts, setAddingGroupContacts] = useState(false);

  // File Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState("Single Number Column");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedColumns, setUploadedColumns] = useState<string[]>([]);
  const [uploadedRows, setUploadedRows] = useState<Record<string, string>[]>([]);
  const [pendingFileData, setPendingFileData] = useState<{
    fileName: string;
    numbers: string[];
    columns: string[];
    rowObjects: Record<string, string>[];
    totalRows: number;
    duplicatesCount: number;
    blacklistedCount: number;
  } | null>(null);

  // Schedule Options State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  // Template Selection States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [templateType, setTemplateType] = useState("All");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Header Media State
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [overrideFileName, setOverrideFileName] = useState("");
  const [uploadingHeaderMedia, setUploadingHeaderMedia] = useState(false);

  // Dynamic Variable Mapping States
  const [variableMappings, setVariableMappings] = useState<{
    [key: string]: { type: string; value: string };
  }>({});

  const activeTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || null;
  }, [allTemplates, selectedTemplateId]);

  const filteredApprovedTemplates = useMemo(() => {
    const activeAcc = wabaAccounts.find(
      (a) =>
        a.phoneNumberId === selectedChannel ||
        a.wabaId === selectedChannel ||
        a.id === selectedChannel
    );

    return allTemplates.filter((tpl) => {
      const isApproved = tpl.status?.toUpperCase() === "APPROVED";
      const matchesWaba =
        !selectedChannel ||
        tpl.wabaId === selectedChannel ||
        tpl.phoneNumberId === selectedChannel ||
        (activeAcc &&
          (tpl.wabaId === activeAcc.wabaId ||
            tpl.wabaNumber === activeAcc.displayPhone));
      const matchesCat =
        !selectedCategory ||
        tpl.category?.toUpperCase() === selectedCategory.toUpperCase();
      return isApproved && matchesWaba && matchesCat;
    });
  }, [allTemplates, wabaAccounts, selectedChannel, selectedCategory]);

  // Default media auto-fetched whenever activeTemplate changes
  useEffect(() => {
    if (activeTemplate) {
      setHeaderMediaUrl(activeTemplate.headerMediaUrl || "");
      setOverrideFileName("");
    } else {
      setHeaderMediaUrl("");
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
      const mapping = variableMappings[v];
      let replacement = mapping?.value || "";
      if (mapping?.type === "Map Column Value" && mapping.value && uploadedRows.length > 0) {
        replacement = uploadedRows[0][mapping.value] || replacement;
      }
      if (replacement) {
        text = text.split(v).join(replacement);
      }
    });
    return text;
  }, [activeTemplate, detectedVariables, variableMappings, uploadedRows]);

  // Fetch user WABA, templates & optional blacklist
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
    const activeUid = storedUserId || "admin";

    fetch(`/api/configuration/blacklist?userId=${encodeURIComponent(activeUid)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.blacklist || data?.numbers || data?.data || [];
        const normalized = list
          .map((item: any) =>
            normalizePhone(typeof item === "string" ? item : item.number || item.phone || item.mobile)
          )
          .filter(Boolean);
        if (normalized.length > 0) {
          setCustomBlacklist((prev) => Array.from(new Set([...prev, ...normalized])));
        }
      })
      .catch(() => {});

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
          } else {
            fetchWabaAndTemplates("");
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
        const rawAccounts = data.wabaAccounts || [];
        const permittedAccounts = getAgentPermittedChannels(rawAccounts);
        const accountsToUse = permittedAccounts.length > 0 ? permittedAccounts : rawAccounts;

        const permittedWabaIds = accountsToUse.map((a: any) => a.wabaId);
        const permittedPhones = accountsToUse.map((a: any) => a.displayPhone);

        const rawTpls = data.templates || [];
        const permittedTpls = rawTpls.filter(
          (t: any) =>
            permittedWabaIds.includes(t.wabaId) ||
            permittedPhones.includes(t.wabaNumber)
        );

        setWabaAccounts(accountsToUse);
        setAllTemplates(permittedTpls);

        if (data.userRates) {
          setUserRates(data.userRates);
        }

        const urlChannelId = searchParams?.get("channelId");
        const urlWaba = searchParams?.get("wabaNumber");
        const urlTplId = searchParams?.get("templateId");

        if (accountsToUse.length > 0) {
          if (urlChannelId) {
            const matchedAcc = accountsToUse.find(
              (a: any) =>
                a.id === urlChannelId ||
                a.phoneNumberId === urlChannelId ||
                a.wabaId === urlChannelId
            );
            setSelectedChannel(
              matchedAcc
                ? matchedAcc.phoneNumberId || matchedAcc.wabaId
                : accountsToUse[0].phoneNumberId || accountsToUse[0].wabaId
            );
          } else if (urlWaba) {
            const matchedAcc = accountsToUse.find(
              (a: any) => a.displayPhone === urlWaba || a.wabaId === urlWaba
            );
            setSelectedChannel(
              matchedAcc
                ? matchedAcc.phoneNumberId || matchedAcc.wabaId
                : accountsToUse[0].phoneNumberId || accountsToUse[0].wabaId
            );
          } else {
            const defaultAcc =
              accountsToUse.find((a: any) => a.isDefault) || accountsToUse[0];
            setSelectedChannel(defaultAcc.phoneNumberId || defaultAcc.wabaId);
          }
        } else {
          setSelectedChannel("");
        }

        if (urlTplId && permittedTpls.length > 0) {
          const matchedTpl = permittedTpls.find((t: any) => t.id === urlTplId);
          if (matchedTpl) {
            setSelectedCategory(matchedTpl.category?.toUpperCase() || "");
            setSelectedTemplateId(matchedTpl.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch WABA channels & templates:", err);
    }
  };

  // Group Contacts Modal Handlers
  const openGroupContactsModal = async () => {
    setShowGroupsModal(true);
    setLoadingGroups(true);
    setSelectedGroupIds([]);

    try {
      const uid = userId || localStorage.getItem("userId") || "admin";
      const res = await fetch(`/api/configuration/groups?userId=${encodeURIComponent(uid)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const rawGroups = Array.isArray(data)
        ? data
        : data.groups || data.contactGroups || data.data || [];
      setGroupsList(rawGroups);
    } catch (err) {
      console.error("Failed to load groups:", err);
      setGroupsList([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupKey: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupKey) ? prev.filter((id) => id !== groupKey) : [...prev, groupKey]
    );
  };

  const handleLoadSelectedGroupContacts = async () => {
    if (selectedGroupIds.length === 0) return;

    setAddingGroupContacts(true);
    try {
      const uid = userId || localStorage.getItem("userId") || "admin";
      const collectedNumbers: string[] = [];
      const groupNamesAdded: string[] = [];

      for (const gid of selectedGroupIds) {
        const matchedGroup = groupsList.find(
          (g: any) => String(g.id ?? g.groupId ?? g.name) === gid
        );
        if (matchedGroup) {
          groupNamesAdded.push(matchedGroup.name || matchedGroup.groupName || gid);
        }

        if (Array.isArray(matchedGroup?.contacts)) {
          for (const c of matchedGroup.contacts) {
            const p = normalizePhone(
              typeof c === "string" ? c : c.phone || c.mobile || c.number || c.recipient
            );
            if (p) collectedNumbers.push(p);
          }
        }

        const res = await fetch(
          `/api/configuration/groups/contacts?groupId=${encodeURIComponent(gid)}&userId=${encodeURIComponent(uid)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : data.contacts || data.members || data.data || [];
          for (const item of list) {
            const p = normalizePhone(
              typeof item === "string"
                ? item
                : item.phone || item.mobile || item.number || item.recipient || item.contactNumber
            );
            if (p) collectedNumbers.push(p);
          }
        }
      }

      if (collectedNumbers.length === 0) {
        alert("No valid contact numbers found in selected group(s).");
        return;
      }

      setNumbersInput((prev) =>
        prev ? `${prev}, ${collectedNumbers.join(", ")}` : collectedNumbers.join(", ")
      );
      setSelectedSourceChips((prev) => Array.from(new Set([...prev, ...groupNamesAdded])));
      setShowGroupsModal(false);
    } catch (err) {
      console.error("Failed to load group contacts:", err);
      alert("Error loading group contacts.");
    } finally {
      setAddingGroupContacts(false);
    }
  };

  // Excel / CSV File Preview & Proceed
  const handleFileSelect = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");

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

      const parsed = parseSpreadsheetRows(rows);
      const seen = new Set<string>();
      let duplicatesCount = 0;
      let blacklistedCount = 0;

      for (const n of parsed.numbers) {
        if (seen.has(n)) duplicatesCount++;
        else seen.add(n);
        if (customBlacklist.includes(n)) blacklistedCount++;
      }

      setPendingFileData({
        fileName: baseName,
        numbers: parsed.numbers,
        columns: parsed.columns,
        rowObjects: parsed.rowObjects,
        totalRows: parsed.totalRows,
        duplicatesCount,
        blacklistedCount,
      });
    } catch (err) {
      console.error("Spreadsheet parse failed:", err);
      alert("Could not read Excel/CSV file.");
    }
  };

  const handleProceedUploadedFile = () => {
    if (!pendingFileData) return;
    setUploadedFileName(pendingFileData.fileName);
    setUploadedColumns(pendingFileData.columns);
    setUploadedRows(pendingFileData.rowObjects);

    if (pendingFileData.numbers.length > 0) {
      setNumbersInput((prev) =>
        prev ? `${prev}, ${pendingFileData.numbers.join(", ")}` : pendingFileData.numbers.join(", ")
      );
      setSelectedSourceChips((prev) =>
        prev.includes(pendingFileData.fileName)
          ? prev
          : [...prev, pendingFileData.fileName]
      );
    }

    setPendingFileData(null);
    setShowUploadModal(false);
  };

  // Change / Override Header Media Handler (keeps default or previous media if upload fails)
  const handleHeaderMediaChange = async (file: File) => {
    const previousMedia = headerMediaUrl || activeTemplate?.headerMediaUrl || "";
    const previousFileName = overrideFileName;

    setUploadingHeaderMedia(true);
    setOverrideFileName(file.name);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("wabaId", selectedChannel);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();

      if (data.success && data.mediaId) {
        setHeaderMediaUrl(data.mediaId);
      } else {
        setOverrideFileName(previousFileName);
        setHeaderMediaUrl(previousMedia);
        alert(`Failed to upload media: ${data.error}`);
      }
    } catch (err) {
      console.error("File upload error:", err);
      setOverrideFileName(previousFileName);
      setHeaderMediaUrl(previousMedia);
      alert("Network error uploading media file.");
    } finally {
      setUploadingHeaderMedia(false);
    }
  };

  // Working Remove Duplicates & Remove BlackList
  const processedNumbers = useMemo(() => {
    if (!numbersInput.trim()) return [];
    let list = numbersInput
      .split(/[\s,;\r\n]+/)
      .map((num) => normalizePhone(num))
      .filter((num) => num.length >= 10);

    if (removeBlacklist) {
      list = list.filter((num) => !customBlacklist.includes(num));
    }
    if (removeDuplicates) {
      list = Array.from(new Set(list));
    }
    return list;
  }, [numbersInput, removeDuplicates, removeBlacklist, customBlacklist]);

  const { ratePerMessage, totalEstimatedCost } = useMemo(() => {
    const cat = activeTemplate?.category?.toUpperCase() || "UTILITY";
    let rate = userRates.utility;
    if (cat === "MARKETING") rate = userRates.marketing;
    else if (cat === "AUTHENTICATION") rate = userRates.authentication;
    else if (cat === "SERVICE") rate = userRates.service;

    return {
      ratePerMessage: rate,
      totalEstimatedCost: (processedNumbers.length * rate).toFixed(3),
    };
  }, [activeTemplate, processedNumbers.length, userRates]);

  const handleNextStep1 = () => {
    if (!campaignName.trim()) {
      alert("Please enter a Campaign Name.");
      return;
    }
    if (!selectedChannel) {
      alert("Please select a permitted WABA Channel.");
      return;
    }
    if (processedNumbers.length === 0) {
      alert("Please enter or upload at least one valid mobile number.");
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
      const orderedVars = detectedVariables.map((v) => {
        const mapping = variableMappings[v];
        if (mapping?.type === "Map Column Value" && mapping.value && uploadedRows.length > 0) {
          return uploadedRows[0][mapping.value] || mapping.value;
        }
        return mapping?.value || "";
      });

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
      {/* Top Header */}
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
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
            1
          </span>
          <span>STEP 1: Campaign</span>
        </div>
        <span className="text-gray-300">────────</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 2 ? "text-emerald-600" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
            2
          </span>
          <span>STEP 2: Template</span>
        </div>
        <span className="text-gray-300">────────</span>
        <div className={`flex items-center space-x-2 font-bold ${step === 3 ? "text-emerald-600" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
            3
          </span>
          <span>STEP 3: Verify & Send</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
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
                  <label className="block font-bold text-gray-600 mb-1">WABA CHANNEL *</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      setSelectedChannel(e.target.value);
                      setSelectedTemplateId("");
                    }}
                    className="w-full border rounded-xl p-2.5 bg-gray-50 font-mono text-gray-700 focus:outline-none focus:border-emerald-500"
                  >
                    {wabaAccounts.length === 0 ? (
                      <option value="">No Permitted WABA Channel Assigned</option>
                    ) : (
                      wabaAccounts.map((acc) => {
                        const accKey = acc.phoneNumberId || acc.wabaId;
                        return (
                          <option key={acc.id} value={accKey}>
                            📱 {acc.displayPhone || acc.phoneNumberId} — {acc.displayName || "Active WABA"} {acc.isDefault ? "⭐ (Default)" : ""}
                          </option>
                        );
                      })
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

                {selectedSourceChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 bg-gray-50 border rounded-xl p-2">
                    {selectedSourceChips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 font-bold px-2.5 py-1 rounded-lg text-[11px]"
                      >
                        <span>{chip}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSourceChips((prev) => prev.filter((item) => item !== chip))
                          }
                          className="text-emerald-700 hover:text-red-600 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  rows={4}
                  placeholder="Enter comma-separated mobile numbers (e.g. 919876543210, 919123456789) or upload Excel/Group..."
                  value={numbersInput}
                  onChange={(e) => setNumbersInput(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-gray-50 text-xs font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={openGroupContactsModal}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold px-4 py-2 rounded-xl hover:bg-emerald-100 cursor-pointer"
                >
                  👥 Group Contacts
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingFileData(null);
                    setShowUploadModal(true);
                  }}
                  className="bg-blue-50 text-blue-700 border border-blue-300 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 cursor-pointer flex items-center space-x-1"
                >
                  <span>📁 Upload File (CSV / Excel)</span>
                  {uploadedFileName && (
                    <span className="text-emerald-600 font-bold ml-2">✓ ({uploadedFileName})</span>
                  )}
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

              {activeTemplate &&
                activeTemplate.headerType &&
                activeTemplate.headerType !== "TEXT" &&
                activeTemplate.headerType !== "NONE" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-blue-900 text-xs">
                        HEADER {activeTemplate.headerType} (Default Auto-Fetched & Changeable)
                      </label>
                      <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
                        {uploadingHeaderMedia
                          ? "Uploading..."
                          : overrideFileName
                          ? "Custom File Active"
                          : "Default Media Active"}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="truncate text-gray-700">
                        {overrideFileName
                          ? `Changed To: ${overrideFileName} (${headerMediaUrl || "Pending"})`
                          : `Default Media: ${headerMediaUrl || activeTemplate.headerMediaUrl || "Auto-attached from Template"}`}
                      </span>
                      {overrideFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideFileName("");
                            setHeaderMediaUrl(activeTemplate.headerMediaUrl || "");
                          }}
                          className="text-red-600 font-bold text-[10px] hover:underline ml-2 shrink-0 cursor-pointer"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>

                    <div className="pt-1 space-y-1.5">
                      <label className="block font-semibold text-gray-700 text-[11px]">
                        Change {activeTemplate.headerType.toLowerCase()} (Choose new file anytime to override default):
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
                            handleHeaderMediaChange(e.target.files[0]);
                            e.target.value = "";
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
                    detectedVariables.map((variableKey) => {
                      const currentType = variableMappings[variableKey]?.type || "Assign Const Value";
                      return (
                        <div key={variableKey} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          <div className="font-mono font-bold text-gray-700 text-xs bg-white border px-3 py-2 rounded-xl text-center">
                            {variableKey}
                          </div>
                          <select
                            value={currentType}
                            onChange={(e) =>
                              setVariableMappings((prev) => ({
                                ...prev,
                                [variableKey]: {
                                  type: e.target.value,
                                  value: "",
                                },
                              }))
                            }
                            className="border rounded-xl p-2 bg-white text-xs font-semibold focus:outline-none"
                          >
                            <option value="Assign Const Value">Assign Const Value</option>
                            <option value="Map Column Value">Map Column Value</option>
                          </select>

                          {currentType === "Map Column Value" && uploadedColumns.length > 0 ? (
                            <select
                              value={variableMappings[variableKey]?.value || ""}
                              onChange={(e) =>
                                setVariableMappings((prev) => ({
                                  ...prev,
                                  [variableKey]: {
                                    type: "Map Column Value",
                                    value: e.target.value,
                                  },
                                }))
                              }
                              className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">Select column</option>
                              {uploadedColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={
                                currentType === "Assign Const Value"
                                  ? `Enter value for ${variableKey}...`
                                  : `Enter column name...`
                              }
                              value={variableMappings[variableKey]?.value || ""}
                              onChange={(e) =>
                                setVariableMappings((prev) => ({
                                  ...prev,
                                  [variableKey]: {
                                    type: currentType,
                                    value: e.target.value,
                                  },
                                }))
                              }
                              className="border rounded-xl p-2 bg-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>
                      );
                    })
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
                  <div className="text-gray-400 font-semibold text-[10px]">
                    ESTIMATED COST (₹{ratePerMessage}/msg)
                  </div>
                  <div className="font-bold text-emerald-600 mt-0.5">
                    ₹{totalEstimatedCost} Credits
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

        {/* Right Live WhatsApp Preview */}
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

      {/* Group Contacts Modal */}
      {showGroupsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Select Contact Groups</h3>
              <button
                onClick={() => setShowGroupsModal(false)}
                className="text-gray-500 font-bold px-2 py-1 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {loadingGroups ? (
                <div className="p-6 text-center text-gray-500 text-xs">Loading panel groups...</div>
              ) : groupsList.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No contact groups found in panel.
                </div>
              ) : (
                groupsList.map((grp: any, idx: number) => {
                  const gKey = String(grp.id ?? grp.groupId ?? grp.name ?? idx);
                  const gName = grp.name || grp.groupName || `Group ${idx + 1}`;
                  const countLabel =
                    typeof grp.contactCount === "number"
                      ? `${grp.contactCount} contacts`
                      : Array.isArray(grp.contacts)
                      ? `${grp.contacts.length} contacts`
                      : "";

                  return (
                    <label
                      key={gKey}
                      className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(gKey)}
                          onChange={() => toggleGroupSelection(gKey)}
                          className="accent-emerald-600"
                        />
                        <span className="font-bold text-gray-800">{gName}</span>
                      </div>
                      {countLabel && (
                        <span className="text-[11px] font-mono text-gray-500">{countLabel}</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowGroupsModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingGroupContacts || selectedGroupIds.length === 0}
                onClick={handleLoadSelectedGroupContacts}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                {addingGroupContacts ? "Loading..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-sm">Select File</h3>
              <button
                onClick={() => {
                  setPendingFileData(null);
                  setShowUploadModal(false);
                }}
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
                <option value="Multiple Data Columns">Multiple Data Columns</option>
              </select>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-emerald-700 font-bold text-xs mb-1">📁 Browse File</div>
                <div className="text-gray-400 text-[10px]">Supports .csv, .xlsx, .xls files</div>
              </div>

              {pendingFileData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className="font-bold text-emerald-900">{pendingFileData.fileName}</div>
                  <div className="text-gray-700 font-mono text-[11px]">
                    Total Rows: {pendingFileData.totalRows} | Valid Numbers: {pendingFileData.numbers.length} | Duplicates: {pendingFileData.duplicatesCount} | Blacklisted: {pendingFileData.blacklistedCount}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setPendingFileData(null);
                  setShowUploadModal(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!pendingFileData}
                onClick={handleProceedUploadedFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                Proceed
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