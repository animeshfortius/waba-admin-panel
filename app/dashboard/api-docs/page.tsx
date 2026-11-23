"use client";

import React, { useMemo, useState } from "react";

type HttpMethod = "GET" | "POST";

interface EndpointField {
  key: string;
  label: string;
  placeholder: string;
  location: "path" | "body" | "query";
}

interface ApiEndpointItem {
  id: string;
  group: "Messaging & Media" | "Templates & Marketing" | "Account & Webhooks";
  title: string;
  description: string;
  method: HttpMethod;
  pathTemplate: string;
  fields: EndpointField[];
}

const ENDPOINTS: ApiEndpointItem[] = [
  {
    id: "send-message",
    group: "Messaging & Media",
    title: "Send WhatsApp Message",
    description: "Send a WhatsApp text message via Meta Graph API.",
    method: "POST",
    pathTemplate: "/api/{version}/{phoneNumberId}/messages",
    fields: [
      {
        key: "version",
        label: "Graph Version",
        placeholder: "v21.0",
        location: "path",
      },
      {
        key: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "Enter Phone Number ID",
        location: "path",
      },
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "messageText",
        label: "Message Body",
        placeholder: "Enter message text",
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
        key: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "Enter Phone Number ID",
        location: "body",
      },
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
    description: "Fetch message templates from configured WABA ID.",
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
        key: "wabaId",
        label: "WABA ID",
        placeholder: "Enter WABA ID",
        location: "body",
      },
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
    description: "Fetch a specific message template by its Meta ID.",
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
    description: "Sync templates from Meta WABA account.",
    method: "POST",
    pathTemplate: "/api/v1/meta/templates/sync",
    fields: [
      {
        key: "wabaId",
        label: "WABA ID",
        placeholder: "Enter WABA ID",
        location: "body",
      },
    ],
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
        key: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "Enter Phone Number ID",
        location: "body",
      },
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Enter approved template name",
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
        key: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "Enter Phone Number ID",
        location: "body",
      },
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Enter approved template name",
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
        key: "phoneNumberId",
        label: "Phone Number ID",
        placeholder: "Enter Phone Number ID",
        location: "body",
      },
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "templateName",
        label: "Template Name",
        placeholder: "Enter approved template name",
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
    description: "Fetch wallet balance for the authenticated user.",
    method: "GET",
    pathTemplate: "/api/v1/user/balance",
    fields: [],
  },
  {
    id: "webhook-test",
    group: "Account & Webhooks",
    title: "Webhook Event",
    description: "Send a payload to /api/v1/webhook.",
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

export default function ApiDocsPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);

  const initialFieldValues = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const ep of ENDPOINTS) {
      map[ep.id] = {};
      for (const f of ep.fields) {
        map[ep.id][f.key] = "";
      }
    }
    return map;
  }, []);

  const [formValues, setFormValues] =
    useState<Record<string, Record<string, string>>>(initialFieldValues);
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

  const resolvedPath = useMemo(() => {
    let url = selectedEndpoint.pathTemplate;
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
  }, [selectedEndpoint, currentValues]);

  const builtRequestBody = useMemo(() => {
    if (selectedEndpoint.method === "GET") return null;

    if (selectedEndpoint.id === "send-message") {
      const payload: Record<string, unknown> = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        type: "text",
      };
      const toVal = (currentValues.to || "").trim();
      const textVal = (currentValues.messageText || "").trim();
      if (toVal) payload.to = toVal;
      if (textVal) {
        payload.text = {
          preview_url: false,
          body: textVal,
        };
      }
      return payload;
    }

    const payload: Record<string, unknown> = {};
    for (const f of selectedEndpoint.fields) {
      if (f.location === "body") {
        const val = (currentValues[f.key] ?? "").trim();
        if (val !== "") {
          payload[f.key] = val;
        }
      }
    }
    return payload;
  }, [selectedEndpoint, currentValues]);

  const curlSnippet = useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const fullUrl = `${origin}${resolvedPath}`;
    const authPart = activeToken
      ? ` \\\n  -H "Authorization: Bearer ${activeToken}"`
      : ` \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`;

    if (selectedEndpoint.method === "GET") {
      return `curl -X GET "${fullUrl}"${authPart}`;
    }

    return `curl -X POST "${fullUrl}"${authPart} \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
      builtRequestBody || {},
      null,
      2
    )}'`;
  }, [resolvedPath, activeToken, selectedEndpoint.method, builtRequestBody]);

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
    setActiveToken(tokenInput.trim());
  }

  async function handleTryRequest() {
    setLoading(true);
    const started = performance.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeToken) {
        headers.Authorization = `Bearer ${activeToken}`;
      }

      const res = await fetch(resolvedPath, {
        method: selectedEndpoint.method,
        headers,
        body:
          selectedEndpoint.method === "POST"
            ? JSON.stringify(builtRequestBody || {})
            : undefined,
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
          error: err instanceof Error ? err.message : "Network request failed",
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
              WhatsApp Business API Reference & Live Tester
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
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Set Token
            </button>
            {activeToken ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Token Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                No Token Set
              </span>
            )}
          </form>
        </div>
      </header>

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

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Parameters
              </h3>

              {selectedEndpoint.fields.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No parameters required for this endpoint.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedEndpoint.fields.map((field) => (
                    <div key={field.key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">
                          {field.label}
                        </label>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                          {field.location}
                        </span>
                      </div>
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
            </div>
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