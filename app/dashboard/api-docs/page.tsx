"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type HttpMethod = "GET" | "POST";

interface ChannelOption {
  id: string;
  label: string;
  phoneNumberId: string;
  wabaId: string;
  hasToken: boolean;
}

interface TemplateOption {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  bodyText: string;
  variableCount: number;
}

interface EndpointField {
  key: string;
  label: string;
  placeholder: string;
  location: "path" | "body";
}

interface ApiEndpointItem {
  id: string;
  group: "Messaging & Media" | "Templates & Marketing" | "Account & Webhooks";
  title: string;
  description: string;
  method: HttpMethod;
  pathTemplate: string;
  supportsAutoTemplate?: boolean;
  fields: EndpointField[];
}

const ENDPOINTS: ApiEndpointItem[] = [
  {
    id: "send-message",
    group: "Messaging & Media",
    title: "Send WhatsApp Message",
    description:
      "Select a template to auto-fill the JSON payload, enter recipient number, and click Send Request.",
    method: "POST",
    pathTemplate: "/api/{version}/{phoneNumberId}/messages",
    supportsAutoTemplate: true,
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
    ],
  },
  {
    id: "upload-media",
    group: "Messaging & Media",
    title: "Upload WhatsApp Media",
    description: "Upload media from a URL to Meta WhatsApp Media API.",
    method: "POST",
    pathTemplate: "/api/v1/media/upload",
    fields: [
      {
        key: "mediaType",
        label: "Media Type",
        placeholder: "image / video / document",
        location: "body",
      },
      {
        key: "mediaUrl",
        label: "Media URL",
        placeholder: "https://...",
        location: "body",
      },
    ],
  },
  {
    id: "get-templates",
    group: "Templates & Marketing",
    title: "Get Message Templates",
    description: "Fetch message templates for the active WABA.",
    method: "GET",
    pathTemplate: "/api/v1/meta/templates",
    fields: [],
  },
  {
    id: "create-template",
    group: "Templates & Marketing",
    title: "Create Message Template",
    description: "Submit a new message template to Meta WABA.",
    method: "POST",
    pathTemplate: "/api/v1/meta/templates",
    fields: [
      {
        key: "name",
        label: "Template Name",
        placeholder: "template_name",
        location: "body",
      },
      {
        key: "language",
        label: "Language Code",
        placeholder: "en_US",
        location: "body",
      },
      {
        key: "category",
        label: "Category",
        placeholder: "UTILITY / MARKETING",
        location: "body",
      },
      {
        key: "bodyText",
        label: "Body Text",
        placeholder: "Enter template body text",
        location: "body",
      },
    ],
  },
  {
    id: "get-template-by-id",
    group: "Templates & Marketing",
    title: "Get Template by ID",
    description: "Fetch details of a specific template ID.",
    method: "GET",
    pathTemplate: "/api/v1/meta/templates/{id}",
    fields: [
      {
        key: "id",
        label: "Template ID",
        placeholder: "Enter Template ID",
        location: "path",
      },
    ],
  },
  {
    id: "sync-templates",
    group: "Templates & Marketing",
    title: "Sync Templates",
    description: "Sync all templates from Meta WABA account.",
    method: "POST",
    pathTemplate: "/api/v1/meta/templates/sync",
    fields: [],
  },
  {
    id: "clevertap",
    group: "Templates & Marketing",
    title: "CleverTap Template Send",
    description: "Send WhatsApp template via CleverTap endpoint.",
    method: "POST",
    pathTemplate: "/api/v1/meta/clevertap",
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Select or enter template name",
        location: "body",
      },
      {
        key: "language",
        label: "Language Code",
        placeholder: "en_US",
        location: "body",
      },
    ],
  },
  {
    id: "moengage",
    group: "Templates & Marketing",
    title: "MoEngage Template Send",
    description: "Send WhatsApp template via MoEngage endpoint.",
    method: "POST",
    pathTemplate: "/api/v1/meta/moengage",
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Select or enter template name",
        location: "body",
      },
      {
        key: "language",
        label: "Language Code",
        placeholder: "en_US",
        location: "body",
      },
    ],
  },
  {
    id: "webengage",
    group: "Templates & Marketing",
    title: "WebEngage Template Send",
    description: "Send WhatsApp template via WebEngage endpoint.",
    method: "POST",
    pathTemplate: "/api/v1/meta/webengage",
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Select or enter template name",
        location: "body",
      },
      {
        key: "language",
        label: "Language Code",
        placeholder: "en_US",
        location: "body",
      },
    ],
  },
  {
    id: "wallet-balance",
    group: "Account & Webhooks",
    title: "Get Wallet Balance",
    description: "Check wallet balance for the active token.",
    method: "GET",
    pathTemplate: "/api/v1/user/balance",
    fields: [],
  },
  {
    id: "webhook-test",
    group: "Account & Webhooks",
    title: "Webhook Event",
    description: "Send a test event to /api/v1/webhook.",
    method: "POST",
    pathTemplate: "/api/v1/webhook",
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "eventType",
        label: "Event Type",
        placeholder: "Enter event type",
        location: "body",
      },
    ],
  },
];

function buildTemplatePayload(tpl: TemplateOption, toValue: string) {
  const parameters = Array.from({ length: tpl.variableCount }, (_, idx) => ({
    type: "text",
    text: `{{${idx + 1}}}`,
  }));

  const templateObj: Record<string, unknown> = {
    name: tpl.name,
    language: {
      code: tpl.language || "en_US",
    },
  };

  if (parameters.length > 0) {
    templateObj.components = [
      {
        type: "body",
        parameters,
      },
    ];
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    ...(toValue ? { to: toValue } : {}),
    type: "template",
    template: templateObj,
  };
}

export default function ApiDocsPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);

  const [graphVersion] = useState("v21.0");
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [selectedWabaId, setSelectedWabaId] = useState("");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextNotice, setContextNotice] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [rawJsonText, setRawJsonText] = useState("{}");
  const [jsonEditedManually, setJsonEditedManually] = useState(false);

  const [loading, setLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [responseBox, setResponseBox] = useState<{
    status: number | null;
    durationMs: number | null;
    data: unknown;
  } | null>(null);

  const selectedEndpoint =
    ENDPOINTS.find((ep) => ep.id === selectedId) || ENDPOINTS[0];

  const currentValues = formValues[selectedEndpoint.id] || {};

  const loadAccountContext = useCallback(async (tokenToUse: string) => {
    if (!tokenToUse.trim()) return;
    setLoadingContext(true);
    setContextNotice(null);

    try {
      const res = await fetch("/api/v1/user/context", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenToUse.trim()}`,
        },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        setContextNotice(json?.error || "Could not auto-load WABA/templates.");
        return;
      }

      const fetchedChannels: ChannelOption[] = Array.isArray(json.channels)
        ? json.channels
        : [];
      const fetchedTemplates: TemplateOption[] = Array.isArray(json.templates)
        ? json.templates
        : [];

      setChannels(fetchedChannels);
      setTemplates(fetchedTemplates);

      const defaultPhone =
        fetchedChannels[0]?.phoneNumberId || json.defaultPhoneNumberId || "";
      const defaultWaba =
        fetchedChannels[0]?.wabaId || json.defaultWabaId || "";

      setSelectedPhoneId(defaultPhone);
      setSelectedWabaId(defaultWaba);

      if (fetchedTemplates.length > 0) {
        setSelectedTemplateName(fetchedTemplates[0].name);
      }

      if (json.templateFetchError) {
        setContextNotice(String(json.templateFetchError));
      }
    } catch {
      setContextNotice("Network error while loading WABA and templates.");
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    if (activeToken) {
      loadAccountContext(activeToken);
    }
  }, [activeToken, loadAccountContext]);

  const activeTemplateObj = useMemo(() => {
    return templates.find((t) => t.name === selectedTemplateName) || null;
  }, [templates, selectedTemplateName]);

  const resolvedPath = useMemo(() => {
    let url = selectedEndpoint.pathTemplate;
    url = url.replace("{version}", graphVersion);
    url = url.replace(
      "{phoneNumberId}",
      selectedPhoneId ? encodeURIComponent(selectedPhoneId) : "{phoneNumberId}"
    );
    for (const f of selectedEndpoint.fields) {
      if (f.location === "path") {
        const raw = (currentValues[f.key] || "").trim();
        url = url.replace(
          `{${f.key}}`,
          raw ? encodeURIComponent(raw) : `{${f.key}}`
        );
      }
    }
    return url;
  }, [selectedEndpoint, graphVersion, selectedPhoneId, currentValues]);

  const generatedPayload = useMemo(() => {
    if (selectedEndpoint.method === "GET") return null;

    if (selectedEndpoint.id === "send-message") {
      const toVal = (currentValues.to || "").trim();
      if (activeTemplateObj) {
        return buildTemplatePayload(activeTemplateObj, toVal);
      }
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        ...(toVal ? { to: toVal } : {}),
        type: "template",
        template: {
          name: "",
          language: {
            code: "",
          },
        },
      };
    }

    const payload: Record<string, unknown> = {};
    if (selectedPhoneId && selectedEndpoint.id === "upload-media") {
      payload.phoneNumberId = selectedPhoneId;
    }
    if (
      selectedWabaId &&
      (selectedEndpoint.id === "create-template" ||
        selectedEndpoint.id === "sync-templates")
    ) {
      payload.wabaId = selectedWabaId;
    }
    if (
      selectedPhoneId &&
      (selectedEndpoint.id === "clevertap" ||
        selectedEndpoint.id === "moengage" ||
        selectedEndpoint.id === "webengage")
    ) {
      payload.phoneNumberId = selectedPhoneId;
    }

    for (const f of selectedEndpoint.fields) {
      if (f.location === "body") {
        const val = (currentValues[f.key] ?? "").trim();
        if (val !== "") {
          payload[f.key] = val;
        }
      }
    }

    if (
      (selectedEndpoint.id === "clevertap" ||
        selectedEndpoint.id === "moengage" ||
        selectedEndpoint.id === "webengage") &&
      !payload.templateName &&
      selectedTemplateName
    ) {
      payload.templateName = selectedTemplateName;
    }

    return payload;
  }, [
    selectedEndpoint,
    currentValues,
    activeTemplateObj,
    selectedPhoneId,
    selectedWabaId,
    selectedTemplateName,
  ]);

  useEffect(() => {
    if (selectedEndpoint.method === "POST" && !jsonEditedManually) {
      setRawJsonText(JSON.stringify(generatedPayload || {}, null, 2));
    }
  }, [selectedEndpoint.method, generatedPayload, jsonEditedManually]);

  const curlSnippet = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const fullUrl = `${origin}${resolvedPath}`;
    const authPart = activeToken
      ? ` \\\n  -H "Authorization: Bearer ${activeToken}"`
      : ` \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`;
    const phoneHdr = selectedPhoneId
      ? ` \\\n  -H "x-phone-number-id: ${selectedPhoneId}"`
      : "";

    if (selectedEndpoint.method === "GET") {
      return `curl -X GET "${fullUrl}"${authPart}${phoneHdr}`;
    }

    return `curl -X POST "${fullUrl}"${authPart}${phoneHdr} \\\n  -H "Content-Type: application/json" \\\n  -d '${rawJsonText}'`;
  }, [
    resolvedPath,
    activeToken,
    selectedPhoneId,
    selectedEndpoint.method,
    rawJsonText,
  ]);

  const filteredEndpoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ENDPOINTS;
    return ENDPOINTS.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.pathTemplate.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, ApiEndpointItem[]> = {
      "Messaging & Media": [],
      "Templates & Marketing": [],
      "Account & Webhooks": [],
    };
    for (const ep of filteredEndpoints) {
      groups[ep.group].push(ep);
    }
    return groups;
  }, [filteredEndpoints]);

  function handleFieldChange(key: string, value: string) {
    setJsonEditedManually(false);
    setFormValues((prev) => ({
      ...prev,
      [selectedEndpoint.id]: {
        ...(prev[selectedEndpoint.id] || {}),
        [key]: value,
      },
    }));
  }

  function handleApplyToken(e: React.FormEvent) {
    e.preventDefault();
    setJsonEditedManually(false);
    setActiveToken(tokenInput.trim());
  }

  function handleSelectTemplate(tplName: string) {
    setJsonEditedManually(false);
    setSelectedTemplateName(tplName);
    const tpl = templates.find((t) => t.name === tplName);
    if (tpl) {
      setFormValues((prev) => ({
        ...prev,
        [selectedEndpoint.id]: {
          ...(prev[selectedEndpoint.id] || {}),
          templateName: tpl.name,
          language: tpl.language,
        },
      }));
    }
  }

  async function handleTryRequest() {
    setLoading(true);
    const started = performance.now();

    try {
      let bodyToSend: string | undefined;
      if (selectedEndpoint.method === "POST") {
        JSON.parse(rawJsonText);
        bodyToSend = rawJsonText;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }
      if (selectedPhoneId) {
        headers["x-phone-number-id"] = selectedPhoneId;
      }

      const res = await fetch(resolvedPath, {
        method: selectedEndpoint.method,
        headers,
        body: bodyToSend,
      });

      const contentType = res.headers.get("content-type") || "";
      const parsed = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      setResponseBox({
        status: res.status,
        durationMs: Math.round(performance.now() - started),
        data: parsed,
      });
    } catch (err: unknown) {
      setResponseBox({
        status: null,
        durationMs: Math.round(performance.now() - started),
        data: {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : "Invalid JSON payload or network error",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCurl() {
    try {
      await navigator.clipboard.writeText(curlSnippet);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1800);
    } catch {
      setCopiedCurl(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Developer API Console
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              WhatsApp Business API Reference & Instant Tester
            </h1>
          </div>

          <form
            onSubmit={handleApplyToken}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter Bearer API Token"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:w-72"
            />
            <button
              type="submit"
              disabled={loadingContext}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loadingContext ? "Loading..." : "Set Token"}
            </button>
            {activeToken ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {templates.length} Templates Loaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                No Token Set
              </span>
            )}
          </form>
        </div>
      </header>

      {contextNotice && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
            {contextNotice}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter endpoints..."
              className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />

            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
              {Object.entries(groupedEndpoints).map(([groupName, items]) =>
                items.length === 0 ? null : (
                  <div key={groupName}>
                    <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {groupName}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const isSelected = item.id === selectedEndpoint.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(item.id);
                              setJsonEditedManually(false);
                              setResponseBox(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                              isSelected
                                ? "bg-indigo-50 font-medium text-indigo-950 ring-1 ring-indigo-200"
                                : "text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="truncate pr-2">{item.title}</span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                item.method === "GET"
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.method}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </aside>

        <main className="space-y-6 lg:col-span-8 xl:col-span-9">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      selectedEndpoint.method === "GET"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <code className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                    {resolvedPath}
                  </code>
                </div>
                <h2 className="mt-2.5 text-lg font-bold text-slate-900">
                  {selectedEndpoint.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedEndpoint.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleTryRequest}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>

            {/* Auto-Loaded WABA / Channel & Template Dropdowns */}
            {(channels.length > 0 || templates.length > 0) && (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5 sm:grid-cols-2">
                {channels.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Auto-Detected WABA / Number
                    </label>
                    <select
                      value={selectedPhoneId}
                      onChange={(e) => {
                        const phone = e.target.value;
                        setSelectedPhoneId(phone);
                        const ch = channels.find((c) => c.phoneNumberId === phone);
                        if (ch?.wabaId) setSelectedWabaId(ch.wabaId);
                        setJsonEditedManually(false);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {channels.map((ch) => (
                        <option key={ch.id} value={ch.phoneNumberId}>
                          {ch.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {templates.length > 0 &&
                  (selectedEndpoint.supportsAutoTemplate ||
                    selectedEndpoint.id === "clevertap" ||
                    selectedEndpoint.id === "moengage" ||
                    selectedEndpoint.id === "webengage") && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Select Template (Auto-Fills Payload)
                      </label>
                      <select
                        value={selectedTemplateName}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                      >
                        {templates.map((tpl) => (
                          <option key={`${tpl.id}-${tpl.name}`} value={tpl.name}>
                            {tpl.name} ({tpl.language})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>
            )}

            {/* Minimal Inputs */}
            {selectedEndpoint.fields.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedEndpoint.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={currentValues[field.key] ?? ""}
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Editable Auto-Generated JSON Payload */}
            {selectedEndpoint.method === "POST" && (
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Request JSON Payload (Auto-Generated & Editable)
                  </label>
                  {jsonEditedManually && (
                    <button
                      type="button"
                      onClick={() => setJsonEditedManually(false)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Reset to Auto Payload
                    </button>
                  )}
                </div>
                <textarea
                  rows={10}
                  value={rawJsonText}
                  onChange={(e) => {
                    setJsonEditedManually(true);
                    setRawJsonText(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-slate-950 p-3.5 font-mono text-xs leading-relaxed text-emerald-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                cURL Snippet
              </h3>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {copiedCurl ? "Copied" : "Copy cURL"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              <code>{curlSnippet}</code>
            </pre>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Response Output
              </h3>

              {responseBox && (
                <div className="flex items-center gap-2">
                  {responseBox.status !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        responseBox.status >= 200 && responseBox.status < 300
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      HTTP {responseBox.status}
                    </span>
                  )}
                  {responseBox.durationMs !== null && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {responseBox.durationMs} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {!responseBox ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Response will appear here after sending a request.
              </div>
            ) : (
              <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
                <code>{JSON.stringify(responseBox.data, null, 2)}</code>
              </pre>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}