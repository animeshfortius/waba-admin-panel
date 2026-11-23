"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HttpMethod = "GET" | "POST";

const META_LANGUAGES = [
  { code: "en_US", label: "English (US) - en_US" },
  { code: "en_GB", label: "English (UK) - en_GB" },
  { code: "hi", label: "Hindi - हिंदी (hi)" },
  { code: "bn", label: "Bengali - বাংলা (bn)" },
  { code: "mr", label: "Marathi - मराठी (mr)" },
  { code: "ta", label: "Tamil - தமிழ் (ta)" },
  { code: "te", label: "Telugu - తెలుగు (te)" },
  { code: "gu", label: "Gujarati - ગુજરાતી (gu)" },
  { code: "kn", label: "Kannada - ಕನ್ನಡ (kn)" },
  { code: "ml", label: "Malayalam - മലയാളം (ml)" },
  { code: "pa", label: "Punjabi - ਪੰਜਾਬੀ (pa)" },
  { code: "or", label: "Odia - ଓଡ଼ିଆ (or)" },
  { code: "as", label: "Assamese - অসমীয়া (as)" },
  { code: "ur", label: "Urdu - اردو (ur)" },
  { code: "ar", label: "Arabic - العربية (ar)" },
  { code: "es", label: "Spanish - Español (es)" },
  { code: "fr", label: "French - Français (fr)" },
  { code: "de", label: "German - Deutsch (de)" },
  { code: "it", label: "Italian - Italiano (it)" },
  { code: "pt_BR", label: "Portuguese (BR) - pt_BR" },
  { code: "ru", label: "Russian - Русский (ru)" },
  { code: "id", label: "Indonesian - Bahasa Indonesia (id)" },
  { code: "ms", label: "Malay - Bahasa Melayu (ms)" },
  { code: "th", label: "Thai - ไทย (th)" },
  { code: "vi", label: "Vietnamese - Tiếng Việt (vi)" },
  { code: "zh_CN", label: "Chinese (Simplified) - zh_CN" },
  { code: "ja", label: "Japanese - 日本語 (ja)" },
  { code: "ko", label: "Korean - 한국어 (ko)" },
  { code: "tr", label: "Turkish - Türkçe (tr)" },
  { code: "nl", label: "Dutch - Nederlands (nl)" },
  { code: "pl", label: "Polish - Polski (pl)" },
  { code: "uk", label: "Ukrainian - Українська (uk)" },
];

type TemplateBuilderButtonType =
  | "Custom"
  | "Visit website"
  | "Call Phone Number"
  | "Complete flow"
  | "Copy offer code";

interface TemplateBuilderButton {
  id: string;
  type: TemplateBuilderButtonType;
  text: string;
  value?: string;
}

interface ChannelOption {
  id: string;
  label: string;
  displayName?: string;
  phoneNumber?: string;
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
  headerType: "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerVariableCount: number;
  bodyText: string;
  variableCount: number;
  hasDynamicUrlButton: boolean;
  urlButtonIndex: number;
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
  usesChannelContext?: boolean;
  usesWabaContext?: boolean;
  fields: EndpointField[];
}

const ENDPOINTS: ApiEndpointItem[] = [
  {
    id: "send-message",
    group: "Messaging & Media",
    title: "Send WhatsApp Message",
    description:
      "Select a template, enter variable values, enter recipient number, and send.",
    method: "POST",
    pathTemplate: "/api/{version}/{phoneNumberId}/messages",
    supportsAutoTemplate: true,
    usesChannelContext: true,
    usesWabaContext: true,
    fields: [
      {
        key: "to",
        label: "Recipient Number",
        placeholder: "91XXXXXXXXXX",
        location: "body",
      },
      {
        key: "language",
        label: "Language",
        placeholder: "en_US",
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
    usesChannelContext: true,
    usesWabaContext: true,
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
    usesChannelContext: true,
    usesWabaContext: true,
    fields: [],
  },
  {
    id: "create-template",
    group: "Templates & Marketing",
    title: "Create Message Template",
    description:
      "Submit a new message template to Meta WABA with category, language, media, body, footer, and buttons.",
    method: "POST",
    pathTemplate: "/api/v1/meta/templates",
    usesChannelContext: true,
    usesWabaContext: true,
    fields: [
      {
        key: "name",
        label: "Template Name",
        placeholder: "order_update_v1",
        location: "body",
      },
      {
        key: "language",
        label: "Language",
        placeholder: "en_US",
        location: "body",
      },
      {
        key: "category",
        label: "Category",
        placeholder: "UTILITY / MARKETING / AUTHENTICATION",
        location: "body",
      },
      {
        key: "bodyText",
        label: "Body Text",
        placeholder: "Hello {{1}}, welcome to our service!",
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
    usesChannelContext: true,
    usesWabaContext: true,
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
    usesChannelContext: true,
    usesWabaContext: true,
    fields: [],
  },
  {
    id: "clevertap",
    group: "Templates & Marketing",
    title: "CleverTap Template Send",
    description: "Send WhatsApp template via CleverTap endpoint.",
    method: "POST",
    pathTemplate: "/api/v1/meta/clevertap",
    supportsAutoTemplate: true,
    usesChannelContext: true,
    usesWabaContext: true,
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
        label: "Language",
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
    supportsAutoTemplate: true,
    usesChannelContext: true,
    usesWabaContext: true,
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
        label: "Language",
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
    supportsAutoTemplate: true,
    usesChannelContext: true,
    usesWabaContext: true,
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
        label: "Language",
        placeholder: "en_US",
        location: "body",
      },
    ],
  },
  {
    id: "wallet-balance",
    group: "Account & Webhooks",
    title: "Get Wallet Balance",
    description:
      "Fetch authenticated user name, user ID, and wallet balance (INR) for the active Bearer token.",
    method: "GET",
    pathTemplate: "/api/v1/user/balance",
    usesChannelContext: false,
    usesWabaContext: false,
    fields: [],
  },
  {
    id: "webhook-test",
    group: "Account & Webhooks",
    title: "Webhook",
    description: "Send a webhook payload to /api/v1/meta/webhook.",
    method: "POST",
    pathTemplate: "/api/v1/meta/webhook",
    usesChannelContext: true,
    usesWabaContext: true,
    fields: [],
  },
];

function normalizePublicUrl(raw: string): string {
  const val = (raw || "").trim();
  if (!val) return "";
  if (/^https?:\/\//i.test(val)) return val;
  if (val.startsWith("/")) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://waba.fortius.in.net";
    return `${origin}${val}`;
  }
  return val;
}

function extractErrorMessage(
  payload: unknown,
  fallbackStatus?: number | null
): string {
  if (!payload) {
    return fallbackStatus
      ? `Request failed with HTTP ${fallbackStatus}`
      : "Request failed";
  }
  if (typeof payload === "string") {
    return payload.trim() || "Request failed";
  }
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === "string" && obj.error.trim()) {
      return obj.error.trim();
    }
    if (obj.error && typeof obj.error === "object") {
      const nestedErr = obj.error as Record<string, unknown>;
      if (typeof nestedErr.message === "string" && nestedErr.message.trim()) {
        return nestedErr.message.trim();
      }
    }
    if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (dataObj.error && typeof dataObj.error === "object") {
        const metaErr = dataObj.error as Record<string, unknown>;
        if (typeof metaErr.message === "string" && metaErr.message.trim()) {
          return metaErr.message.trim();
        }
      }
    }
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim();
    }
  }
  return fallbackStatus
    ? `Request failed with HTTP ${fallbackStatus}`
    : "Request failed";
}

function buildTemplatePayload(
  tpl: TemplateOption,
  toValue: string,
  languageCode: string,
  headerValue: string,
  bodyVarValues: string[],
  buttonUrlSuffix: string
) {
  const components: Array<Record<string, unknown>> = [];

  if (tpl.headerVariableCount > 0) {
    const normalizedHeader = normalizePublicUrl(headerValue);
    if (tpl.headerType === "IMAGE") {
      components.push({
        type: "header",
        parameters: [
          {
            type: "image",
            image: { link: normalizedHeader || "{{header_image_url}}" },
          },
        ],
      });
    } else if (tpl.headerType === "VIDEO") {
      components.push({
        type: "header",
        parameters: [
          {
            type: "video",
            video: { link: normalizedHeader || "{{header_video_url}}" },
          },
        ],
      });
    } else if (tpl.headerType === "DOCUMENT") {
      components.push({
        type: "header",
        parameters: [
          {
            type: "document",
            document: { link: normalizedHeader || "{{header_document_url}}" },
          },
        ],
      });
    } else if (tpl.headerType === "TEXT") {
      components.push({
        type: "header",
        parameters: [
          {
            type: "text",
            text: headerValue.trim() || "{{1}}",
          },
        ],
      });
    }
  }

  if (tpl.variableCount > 0) {
    const parameters = Array.from({ length: tpl.variableCount }, (_, idx) => {
      const typed = (bodyVarValues[idx] ?? "").trim();
      return {
        type: "text",
        text: typed.length > 0 ? typed : `{{${idx + 1}}}`,
      };
    });

    components.push({
      type: "body",
      parameters,
    });
  }

  if (tpl.hasDynamicUrlButton) {
    components.push({
      type: "button",
      sub_type: "url",
      index: String(tpl.urlButtonIndex),
      parameters: [
        {
          type: "text",
          text: buttonUrlSuffix.trim() || "{{1}}",
        },
      ],
    });
  }

  const templateObj: Record<string, unknown> = {
    name: tpl.name,
    language: {
      code: languageCode || tpl.language || "en_US",
    },
  };

  if (components.length > 0) {
    templateObj.components = components;
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    ...(toValue ? { to: toValue } : {}),
    type: "template",
    template: templateObj,
  };
}

function mapButtonTypeToApi(type: TemplateBuilderButtonType): string {
  if (type === "Visit website") return "URL";
  if (type === "Call Phone Number") return "PHONE_NUMBER";
  if (type === "Copy offer code") return "COPY_CODE";
  if (type === "Complete flow") return "FLOW";
  return "QUICK_REPLY";
}

function buildMetaComponentsPreview(params: {
  headerType: string;
  headerText: string;
  mediaUrl: string;
  bodyText: string;
  footerText: string;
  variableSamples: Record<string, string>;
  buttons: TemplateBuilderButton[];
}) {
  const components: Array<Record<string, unknown>> = [];

  if (params.headerType === "TEXT" && params.headerText.trim()) {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: params.headerText.trim(),
    });
  } else if (
    params.headerType === "IMAGE" ||
    params.headerType === "VIDEO" ||
    params.headerType === "DOCUMENT"
  ) {
    const comp: Record<string, unknown> = {
      type: "HEADER",
      format: params.headerType,
    };
    if (params.mediaUrl.trim()) {
      comp.example = { header_handle: [normalizePublicUrl(params.mediaUrl)] };
    }
    components.push(comp);
  } else if (params.headerType === "LOCATION") {
    components.push({
      type: "HEADER",
      format: "LOCATION",
    });
  }

  const bodyComp: Record<string, unknown> = {
    type: "BODY",
    text: params.bodyText.trim(),
  };
  const bodyVars = params.bodyText.match(/\{\{(\d+)\}\}/g);
  if (bodyVars && bodyVars.length > 0) {
    bodyComp.example = {
      body_text: [
        bodyVars.map((m, i) => {
          const num = m.replace(/[{}]/g, "");
          return (params.variableSamples[num] || "").trim() || `Sample${i + 1}`;
        }),
      ],
    };
  }
  components.push(bodyComp);

  if (params.footerText.trim()) {
    components.push({
      type: "FOOTER",
      text: params.footerText.trim(),
    });
  }

  if (params.buttons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: params.buttons
        .filter((b) => b.text.trim())
        .map((b) => {
          const apiType = mapButtonTypeToApi(b.type);
          if (apiType === "URL") {
            return {
              type: "URL",
              text: b.text.trim(),
              url: (b.value || "").trim() || "https://example.com/{{1}}",
            };
          }
          if (apiType === "PHONE_NUMBER") {
            return {
              type: "PHONE_NUMBER",
              text: b.text.trim(),
              phone_number: (b.value || "").trim() || "+919876543210",
            };
          }
          if (apiType === "COPY_CODE") {
            return {
              type: "COPY_CODE",
              text: b.text.trim(),
              example: [(b.value || "").trim() || "OFFER20"],
            };
          }
          return {
            type: "QUICK_REPLY",
            text: b.text.trim(),
          };
        }),
    });
  }

  return components;
}

export default function ApiDocsPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);

  const [graphVersion, setGraphVersion] = useState("v21.0");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [walletBalance, setWalletBalance] = useState<string | number | null>(
    null
  );

  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [selectedWabaId, setSelectedWabaId] = useState("");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  const [headerVarValue, setHeaderVarValue] = useState("");
  const [templateVarValues, setTemplateVarValues] = useState<string[]>([]);
  const [buttonVarValue, setButtonVarValue] = useState("");

  const [tplSubType, setTplSubType] = useState("Default");
  const [allowCategoryChange, setAllowCategoryChange] = useState(false);
  const [tplMediaType, setTplMediaType] = useState<
    "None" | "Image" | "Video" | "Document" | "Location"
  >("None");
  const [tplHeaderText, setTplHeaderText] = useState("");
  const [tplMediaUrl, setTplMediaUrl] = useState("");
  const [tplMediaFile, setTplMediaFile] = useState<File | null>(null);
  const [tplMediaPreviewUrl, setTplMediaPreviewUrl] = useState("");
  const [tplFooterText, setTplFooterText] = useState("");
  const [tplVariableSamples, setTplVariableSamples] = useState<
    Record<string, string>
  >({ "1": "Animesh" });
  const [tplButtons, setTplButtons] = useState<TemplateBuilderButton[]>([]);
  const [showTplButtonMenu, setShowTplButtonMenu] = useState(false);

  const bodyFieldRef = useRef<HTMLInputElement | null>(null);

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
    statusText: string;
    isOk: boolean;
    errorSummary: string | null;
    durationMs: number | null;
    data: unknown;
  } | null>(null);

  const selectedEndpoint =
    ENDPOINTS.find((ep) => ep.id === selectedId) || ENDPOINTS[0];

  const isWalletEndpoint = selectedEndpoint.id === "wallet-balance";

  const currentValues = formValues[selectedEndpoint.id] || {};
  const activeCategory = (
    currentValues.category || "UTILITY"
  ).toUpperCase() as "UTILITY" | "MARKETING" | "AUTHENTICATION";

  const activeBodyText =
    currentValues.bodyText !== undefined
      ? currentValues.bodyText
      : "Hello {{1}}, welcome to our service!";

  useEffect(() => {
    const matches = activeBodyText.match(/\{\{(\d+)\}\}/g);
    if (matches) {
      setTplVariableSamples((prev) => {
        const next: Record<string, string> = {};
        matches.forEach((m) => {
          const num = m.replace(/[{}]/g, "");
          next[num] = prev[num] || `Sample ${num}`;
        });
        return next;
      });
    } else {
      setTplVariableSamples({});
    }
  }, [activeBodyText]);

  const loadAccountContext = useCallback(
    async (tokenToUse: string, overrideWabaId?: string) => {
      if (!tokenToUse.trim()) return;
      setLoadingContext(true);
      setContextNotice(null);

      try {
        const query = overrideWabaId
          ? `?wabaId=${encodeURIComponent(overrideWabaId)}`
          : "";
        const res = await fetch(`/api/v1/user/context${query}`, {
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

        const detectedName =
          json.userName ||
          json.name ||
          json.user?.name ||
          json.user?.userName ||
          "";
        if (detectedName) {
          setUserName(String(detectedName));
        }
        if (json.userId || json.user?.id) {
          setUserId(String(json.userId || json.user?.id));
        }

        const fetchedChannels: ChannelOption[] = Array.isArray(json.channels)
          ? json.channels
          : [];
        const fetchedTemplates: TemplateOption[] = Array.isArray(json.templates)
          ? json.templates
          : [];

        setChannels(fetchedChannels);
        setTemplates(fetchedTemplates);

        const detectedVersion =
          typeof json.graphVersion === "string" && json.graphVersion.trim()
            ? json.graphVersion.trim()
            : typeof json.apiVersion === "string" && json.apiVersion.trim()
            ? json.apiVersion.trim()
            : "v21.0";
        setGraphVersion(detectedVersion);

        const defaultPhone =
          json.defaultPhoneNumberId || fetchedChannels[0]?.phoneNumberId || "";
        const defaultWaba =
          overrideWabaId ||
          json.defaultWabaId ||
          fetchedChannels[0]?.wabaId ||
          "";

        setSelectedPhoneId(defaultPhone);
        setSelectedWabaId(defaultWaba);

        if (fetchedTemplates.length > 0) {
          const firstTpl = fetchedTemplates[0];
          setSelectedTemplateName(firstTpl.name);
          setHeaderVarValue("");
          setButtonVarValue("");
          setTemplateVarValues(Array(firstTpl.variableCount).fill(""));
          setFormValues((prev) => ({
            ...prev,
            "send-message": {
              ...(prev["send-message"] || {}),
              language:
                firstTpl.language || prev["send-message"]?.language || "en_US",
            },
          }));
        } else {
          setSelectedTemplateName("");
          setHeaderVarValue("");
          setButtonVarValue("");
          setTemplateVarValues([]);
        }

        if (json.templateFetchError) {
          setContextNotice(String(json.templateFetchError));
        }
      } catch {
        setContextNotice("Network error while loading account context.");
      } finally {
        setLoadingContext(false);
      }
    },
    []
  );

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

  const computedHeaderType = useMemo(() => {
    if (
      tplMediaType === "Image" ||
      tplMediaType === "Video" ||
      tplMediaType === "Document"
    ) {
      return tplMediaType.toUpperCase();
    }
    if (tplMediaType === "Location") {
      return "LOCATION";
    }
    if (tplHeaderText && tplHeaderText.trim() !== "") {
      return "TEXT";
    }
    return "NONE";
  }, [tplMediaType, tplHeaderText]);

  const generatedPayload = useMemo(() => {
    if (selectedEndpoint.method === "GET") return null;

    if (selectedEndpoint.id === "webhook-test") {
      return {
        object: "whatsapp_business_account",
        entry: [
          {
            id: selectedWabaId || "waba_id",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    phone_number_id: selectedPhoneId || "phone_number_id",
                  },
                },
              },
            ],
          },
        ],
      };
    }

    if (selectedEndpoint.id === "send-message") {
      const toVal = (currentValues.to || "").trim();
      const langVal = (
        currentValues.language ||
        activeTemplateObj?.language ||
        "en_US"
      ).trim();
      if (activeTemplateObj) {
        return buildTemplatePayload(
          activeTemplateObj,
          toVal,
          langVal,
          headerVarValue,
          templateVarValues,
          buttonVarValue
        );
      }
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        ...(toVal ? { to: toVal } : {}),
        type: "template",
        template: {
          name: selectedTemplateName || "",
          language: {
            code: langVal,
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
      (selectedEndpoint.id === "upload-media" ||
        selectedEndpoint.id === "create-template" ||
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
        const rawVal =
          f.key === "mediaType"
            ? (currentValues[f.key] ?? "image").trim() || "image"
            : f.key === "category"
            ? (currentValues[f.key] ?? "UTILITY").trim() || "UTILITY"
            : f.key === "language"
            ? (currentValues[f.key] ?? "en_US").trim() || "en_US"
            : f.key === "bodyText" && selectedEndpoint.id === "create-template"
            ? (currentValues[f.key] ?? activeBodyText).trim()
            : (currentValues[f.key] ?? "").trim();
        if (rawVal !== "") {
          payload[f.key] =
            f.key === "mediaUrl" ? normalizePublicUrl(rawVal) : rawVal;
        }
      }
    }

    if (selectedEndpoint.id === "create-template") {
      const normalizedUrl = normalizePublicUrl(tplMediaUrl);
      payload.category = activeCategory;
      payload.language = (currentValues.language || "en_US").trim() || "en_US";
      payload.subType = tplSubType;
      payload.allowCategoryChange = allowCategoryChange;
      payload.headerType = computedHeaderType;
      payload.headerText =
        computedHeaderType === "TEXT" ? tplHeaderText.trim() : "";
      if (normalizedUrl) {
        payload.mediaUrl = normalizedUrl;
      }
      if (tplMediaFile) {
        payload.mediaFileName = tplMediaFile.name;
      }
      payload.footerText = tplFooterText.trim();
      payload.variableSamples = Object.values(tplVariableSamples);
      payload.buttons = tplButtons.map((b) => ({
        type: mapButtonTypeToApi(b.type),
        text: b.text,
        value: b.value || "",
      }));
      payload.components = buildMetaComponentsPreview({
        headerType: computedHeaderType,
        headerText: tplHeaderText,
        mediaUrl: normalizedUrl,
        bodyText: activeBodyText,
        footerText: tplFooterText,
        variableSamples: tplVariableSamples,
        buttons: tplButtons,
      });
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
    headerVarValue,
    templateVarValues,
    buttonVarValue,
    selectedPhoneId,
    selectedWabaId,
    selectedTemplateName,
    activeBodyText,
    activeCategory,
    tplSubType,
    allowCategoryChange,
    computedHeaderType,
    tplHeaderText,
    tplMediaUrl,
    tplMediaFile,
    tplFooterText,
    tplVariableSamples,
    tplButtons,
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
        : "https://waba.fortius.in.net";
    const fullUrl = `${origin}${resolvedPath}`;
    const authPart = activeToken
      ? ` \\\n  -H "Authorization: Bearer ${activeToken}"`
      : ` \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`;
    const phoneHdr =
      !isWalletEndpoint && selectedPhoneId
        ? ` \\\n  -H "x-phone-number-id: ${selectedPhoneId}"`
        : "";
    const wabaHdr =
      !isWalletEndpoint && selectedWabaId
        ? ` \\\n  -H "x-waba-id: ${selectedWabaId}"`
        : "";

    if (selectedEndpoint.method === "GET") {
      return `curl -X GET "${fullUrl}"${authPart}${phoneHdr}${wabaHdr}`;
    }

    return `curl -X POST "${fullUrl}"${authPart}${phoneHdr}${wabaHdr} \\\n  -H "Content-Type: application/json" \\\n  -d '${rawJsonText}'`;
  }, [
    resolvedPath,
    activeToken,
    isWalletEndpoint,
    selectedPhoneId,
    selectedWabaId,
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

  function handleAddBodyVariable() {
    const matches = activeBodyText.match(/\{\{(\d+)\}\}/g);
    const nextNum = matches ? matches.length + 1 : 1;
    const nextText = `${activeBodyText} {{${nextNum}}}`.trim();
    handleFieldChange("bodyText", nextText);
    setTimeout(() => bodyFieldRef.current?.focus(), 0);
  }

  function handleTplMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / (1024 * 1024);
    if (tplMediaType === "Image" && sizeMB > 5) {
      alert("Image size exceeds 5MB limit.");
      e.target.value = "";
      return;
    }
    if (tplMediaType === "Video" && sizeMB > 16) {
      alert("Video size exceeds 16MB limit.");
      e.target.value = "";
      return;
    }
    if (tplMediaType === "Document" && sizeMB > 100) {
      alert("Document size exceeds 100MB limit.");
      e.target.value = "";
      return;
    }

    setJsonEditedManually(false);
    setTplMediaFile(file);
    setTplMediaPreviewUrl(URL.createObjectURL(file));
  }

  function handleAddTplButton(type: TemplateBuilderButtonType) {
    if (tplButtons.length >= 10) {
      alert("Maximum 10 buttons allowed.");
      return;
    }
    setJsonEditedManually(false);
    setTplButtons((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        type,
        text:
          type === "Custom"
            ? "Quick Reply"
            : type === "Visit website"
            ? "Visit Website"
            : type,
        value: "",
      },
    ]);
    setShowTplButtonMenu(false);
  }

  function handleRemoveTplButton(id: string) {
    setJsonEditedManually(false);
    setTplButtons((prev) => prev.filter((b) => b.id !== id));
  }

  function handleVariableInputChange(index: number, value: string) {
    setJsonEditedManually(false);
    setTemplateVarValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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
      setHeaderVarValue("");
      setButtonVarValue("");
      setTemplateVarValues(Array(tpl.variableCount).fill(""));
      setFormValues((prev) => ({
        ...prev,
        [selectedEndpoint.id]: {
          ...(prev[selectedEndpoint.id] || {}),
          templateName: tpl.name,
          language:
            tpl.language || prev[selectedEndpoint.id]?.language || "en_US",
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
      if (!isWalletEndpoint && selectedPhoneId) {
        headers["x-phone-number-id"] = selectedPhoneId;
      }
      if (!isWalletEndpoint && selectedWabaId) {
        headers["x-waba-id"] = selectedWabaId;
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

      if (isWalletEndpoint && typeof parsed === "object" && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        const fetchedUserName =
          obj.userName ||
          obj.name ||
          (obj.user && typeof obj.user === "object"
            ? (obj.user as Record<string, unknown>).name ||
              (obj.user as Record<string, unknown>).userName
            : "");
        if (fetchedUserName) {
          setUserName(String(fetchedUserName));
        }
        if (obj.userId) {
          setUserId(String(obj.userId));
        }
        if (obj.walletBalance !== undefined && obj.walletBalance !== null) {
          setWalletBalance(obj.walletBalance as string | number);
        }
      }

      const payloadSuccess =
        typeof parsed === "object" &&
        parsed !== null &&
        "success" in parsed &&
        (parsed as { success?: unknown }).success === false
          ? false
          : res.ok;

      const labelText = res.statusText
        ? `${res.status} ${res.statusText}`
        : `HTTP ${res.status}`;

      setResponseBox({
        status: res.status,
        statusText: labelText,
        isOk: payloadSuccess,
        errorSummary: payloadSuccess
          ? null
          : extractErrorMessage(parsed, res.status),
        durationMs: Math.round(performance.now() - started),
        data: parsed,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid JSON payload or network error";
      setResponseBox({
        status: null,
        statusText: "Request Error",
        isOk: false,
        errorSummary: msg,
        durationMs: Math.round(performance.now() - started),
        data: {
          success: false,
          error: msg,
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

  const hasAnyTemplateInputs =
    selectedEndpoint.supportsAutoTemplate &&
    activeTemplateObj &&
    (activeTemplateObj.headerVariableCount > 0 ||
      activeTemplateObj.variableCount > 0 ||
      activeTemplateObj.hasDynamicUrlButton);

  const showContextBar =
    !isWalletEndpoint &&
    Boolean(
      selectedEndpoint.usesChannelContext || selectedEndpoint.usesWabaContext
    ) &&
    (channels.length > 0 ||
      (templates.length > 0 &&
        (selectedEndpoint.supportsAutoTemplate ||
          selectedEndpoint.id === "clevertap" ||
          selectedEndpoint.id === "moengage" ||
          selectedEndpoint.id === "webengage")) ||
      Boolean(selectedPhoneId) ||
      Boolean(selectedWabaId));

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

            {isWalletEndpoint && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    User Name
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-slate-900">
                    {userName || "Fetch via Send Request"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    User ID
                  </div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-slate-800">
                    {userId || "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Wallet Balance
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-emerald-700">
                    {walletBalance !== null ? `₹ ${walletBalance} INR` : "—"}
                  </div>
                </div>
              </div>
            )}

            {showContextBar && (
              <div className="mt-4 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedEndpoint.usesChannelContext && channels.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Auto-Detected WABA / Number
                      </label>
                      <select
                        value={selectedPhoneId}
                        onChange={(e) => {
                          const phone = e.target.value;
                          setSelectedPhoneId(phone);
                          const ch = channels.find(
                            (c) => c.phoneNumberId === phone
                          );
                          const nextWaba = ch?.wabaId || selectedWabaId;
                          if (ch?.wabaId) setSelectedWabaId(ch.wabaId);
                          setJsonEditedManually(false);
                          if (activeToken && nextWaba) {
                            loadAccountContext(activeToken, nextWaba);
                          }
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
                            <option
                              key={`${tpl.id}-${tpl.name}`}
                              value={tpl.name}
                            >
                              {`${tpl.name} (${tpl.language}) — [${
                                tpl.category || "GENERAL"
                              }]`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-2.5 text-xs text-slate-600">
                  <span className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                    Version: {graphVersion}
                  </span>
                  {selectedEndpoint.usesWabaContext && selectedWabaId && (
                    <span className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                      WABA ID: {selectedWabaId}
                    </span>
                  )}
                  {selectedEndpoint.usesChannelContext && selectedPhoneId && (
                    <span className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                      Phone ID: {selectedPhoneId}
                    </span>
                  )}
                </div>

                {activeTemplateObj &&
                  (selectedEndpoint.supportsAutoTemplate ||
                    selectedEndpoint.id === "clevertap" ||
                    selectedEndpoint.id === "moengage" ||
                    selectedEndpoint.id === "webengage") && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-2.5 text-xs">
                      <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-semibold uppercase text-indigo-800">
                        Category: {activeTemplateObj.category || "N/A"}
                      </span>
                      {activeTemplateObj.status && (
                        <span
                          className={`rounded-md px-2 py-0.5 font-semibold uppercase ${
                            activeTemplateObj.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {activeTemplateObj.status}
                        </span>
                      )}
                      <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-medium text-slate-700">
                        Lang: {activeTemplateObj.language}
                      </span>
                      {activeTemplateObj.bodyText && (
                        <span className="w-full text-slate-600 sm:w-auto sm:truncate">
                          Body: {activeTemplateObj.bodyText}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            )}

            {hasAnyTemplateInputs && activeTemplateObj && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Template Parameters
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Auto-updates JSON payload below
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeTemplateObj.headerVariableCount > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        {activeTemplateObj.headerType === "TEXT"
                          ? "Header Variable {{1}}"
                          : `Header ${activeTemplateObj.headerType} URL`}
                      </label>
                      <input
                        type="text"
                        value={headerVarValue}
                        onChange={(e) => {
                          setJsonEditedManually(false);
                          setHeaderVarValue(e.target.value);
                        }}
                        placeholder={
                          activeTemplateObj.headerType === "TEXT"
                            ? "Enter header variable value"
                            : `Enter public ${activeTemplateObj.headerType.toLowerCase()} URL`
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}

                  {Array.from(
                    { length: activeTemplateObj.variableCount },
                    (_, idx) => (
                      <div key={`body-var-${idx}`}>
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {`Body Variable {{${idx + 1}}}`}
                        </label>
                        <input
                          type="text"
                          value={templateVarValues[idx] ?? ""}
                          onChange={(e) =>
                            handleVariableInputChange(idx, e.target.value)
                          }
                          placeholder={`Enter value for {{${idx + 1}}}`}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )
                  )}

                  {activeTemplateObj.hasDynamicUrlButton && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Button Dynamic URL Parameter {"{{1}}"}
                      </label>
                      <input
                        type="text"
                        value={buttonVarValue}
                        onChange={(e) => {
                          setJsonEditedManually(false);
                          setButtonVarValue(e.target.value);
                        }}
                        placeholder="Enter dynamic URL suffix/parameter"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedEndpoint.fields.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedEndpoint.fields.map((field) => (
                  <div key={field.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        {field.label}
                      </label>
                      {field.key === "bodyText" &&
                        selectedEndpoint.id === "create-template" && (
                          <button
                            type="button"
                            onClick={handleAddBodyVariable}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            + Add Variable
                          </button>
                        )}
                    </div>

                    {field.key === "mediaType" ? (
                      <select
                        value={currentValues[field.key] ?? "image"}
                        onChange={(e) =>
                          handleFieldChange(field.key, e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="image">image</option>
                        <option value="video">video</option>
                        <option value="document">document</option>
                      </select>
                    ) : field.key === "category" ? (
                      <select
                        value={activeCategory}
                        onChange={(e) =>
                          handleFieldChange("category", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="UTILITY">UTILITY</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                      </select>
                    ) : field.key === "language" ? (
                      <select
                        value={
                          currentValues[field.key] ??
                          activeTemplateObj?.language ??
                          "en_US"
                        }
                        onChange={(e) =>
                          handleFieldChange(field.key, e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {META_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        ref={field.key === "bodyText" ? bodyFieldRef : undefined}
                        type="text"
                        value={
                          field.key === "bodyText" &&
                          selectedEndpoint.id === "create-template"
                            ? currentValues[field.key] ?? activeBodyText
                            : currentValues[field.key] ?? ""
                        }
                        onChange={(e) =>
                          handleFieldChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedEndpoint.id === "create-template" && (
              <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Template Media, Footer & Buttons
                    </h3>
                    <p className="text-xs text-slate-500">
                      Header: {computedHeaderType}
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowCategoryChange}
                      onChange={(e) => {
                        setJsonEditedManually(false);
                        setAllowCategoryChange(e.target.checked);
                      }}
                      className="rounded accent-indigo-600"
                    />
                    <span>Allow Category Change</span>
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Sub-Type
                  </label>
                  <select
                    value={tplSubType}
                    onChange={(e) => {
                      setJsonEditedManually(false);
                      setTplSubType(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Default">Default</option>
                    <option value="Catalogue">Catalogue</option>
                    <option value="Flows">Flows</option>
                    <option value="Limited Time Offer (LTO)">
                      Limited Time Offer (LTO)
                    </option>
                    <option value="Carousel">Carousel</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Media Header
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {(
                        [
                          "None",
                          "Image",
                          "Video",
                          "Document",
                          "Location",
                        ] as const
                      ).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setJsonEditedManually(false);
                            setTplMediaType(m);
                            if (m === "None") {
                              setTplMediaFile(null);
                              setTplMediaPreviewUrl("");
                              setTplMediaUrl("");
                            } else {
                              setTplHeaderText("");
                            }
                          }}
                          className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                            tplMediaType === m
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tplMediaType === "None" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Header Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={tplHeaderText}
                        onChange={(e) => {
                          setJsonEditedManually(false);
                          setTplHeaderText(e.target.value);
                        }}
                        placeholder="Optional header text..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </div>
                  )}

                  {(tplMediaType === "Image" ||
                    tplMediaType === "Video" ||
                    tplMediaType === "Document") && (
                    <div className="space-y-2.5 rounded-lg border border-dashed border-indigo-300 bg-white p-3.5">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-xs font-semibold text-slate-800">
                            {tplMediaType} Media File / URL
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tplMediaType === "Image" &&
                              "JPG, JPEG, PNG • Max 5 MB"}
                            {tplMediaType === "Video" && "MP4, 3GP • Max 16 MB"}
                            {tplMediaType === "Document" && "PDF • Max 100 MB"}
                          </div>
                        </div>

                        <label className="inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                          <span>Choose {tplMediaType} File</span>
                          <input
                            type="file"
                            className="hidden"
                            accept={
                              tplMediaType === "Image"
                                ? ".jpg,.jpeg,.png,image/jpeg,image/png"
                                : tplMediaType === "Video"
                                ? ".mp4,.3gp,video/mp4,video/3gpp"
                                : ".pdf,application/pdf"
                            }
                            onChange={handleTplMediaFileChange}
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        value={tplMediaUrl}
                        onChange={(e) => {
                          setJsonEditedManually(false);
                          setTplMediaUrl(e.target.value);
                        }}
                        placeholder="Media URL (https://...)"
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                      />

                      {tplMediaFile && (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                          <span className="truncate font-medium">
                            {tplMediaFile.name} (
                            {(tplMediaFile.size / (1024 * 1024)).toFixed(2)}{" "}
                            MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setJsonEditedManually(false);
                              setTplMediaFile(null);
                              setTplMediaPreviewUrl("");
                            }}
                            className="ml-2 font-semibold text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {tplMediaType === "Image" && tplMediaPreviewUrl && (
                        <img
                          src={tplMediaPreviewUrl}
                          alt="Selected media preview"
                          className="h-28 w-auto rounded-lg border border-slate-200 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>

                {Object.keys(tplVariableSamples).length > 0 && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-700">
                      Variable Sample Values
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {Object.keys(tplVariableSamples).map((varKey) => (
                        <div
                          key={varKey}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                        >
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {`{{${varKey}}}`}
                          </span>
                          <input
                            type="text"
                            value={tplVariableSamples[varKey]}
                            onChange={(e) => {
                              setJsonEditedManually(false);
                              setTplVariableSamples((prev) => ({
                                ...prev,
                                [varKey]: e.target.value,
                              }));
                            }}
                            placeholder={`Sample for {{${varKey}}}`}
                            className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Footer Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={tplFooterText}
                    onChange={(e) => {
                      setJsonEditedManually(false);
                      setTplFooterText(e.target.value);
                    }}
                    placeholder="e.g. Reply STOP to unsubscribe"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>

                <div className="relative space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Interactive Buttons (Optional)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTplButtonMenu((prev) => !prev)}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        + Add Button
                      </button>

                      {showTplButtonMenu && (
                        <div className="absolute right-0 z-30 mt-1.5 w-52 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          {(
                            [
                              "Custom",
                              "Visit website",
                              "Call Phone Number",
                              "Complete flow",
                              "Copy offer code",
                            ] as TemplateBuilderButtonType[]
                          ).map((btnType) => (
                            <button
                              key={btnType}
                              type="button"
                              onClick={() => handleAddTplButton(btnType)}
                              className="block w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50"
                            >
                              {btnType}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {tplButtons.length > 0 && (
                    <div className="space-y-2">
                      {tplButtons.map((btn, idx) => (
                        <div
                          key={btn.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                        >
                          <span className="w-28 text-xs font-semibold text-slate-600">
                            {btn.type}
                          </span>
                          <input
                            type="text"
                            value={btn.text}
                            onChange={(e) => {
                              setJsonEditedManually(false);
                              const next = [...tplButtons];
                              next[idx].text = e.target.value;
                              setTplButtons(next);
                            }}
                            placeholder="Button text"
                            className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                          />
                          {(btn.type === "Visit website" ||
                            btn.type === "Call Phone Number" ||
                            btn.type === "Copy offer code" ||
                            btn.type === "Complete flow") && (
                            <input
                              type="text"
                              value={btn.value || ""}
                              onChange={(e) => {
                                setJsonEditedManually(false);
                                const next = [...tplButtons];
                                next[idx].value = e.target.value;
                                setTplButtons(next);
                              }}
                              placeholder={
                                btn.type === "Visit website"
                                  ? "https://example.com"
                                  : btn.type === "Call Phone Number"
                                  ? "+919876543210"
                                  : btn.type === "Copy offer code"
                                  ? "OFFER20"
                                  : "Flow ID / URL"
                              }
                              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTplButton(btn.id)}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      responseBox.isOk
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {responseBox.statusText}
                  </span>
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
              <div className="space-y-3">
                {!responseBox.isOk && responseBox.errorSummary && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800">
                    Error: {responseBox.errorSummary}
                  </div>
                )}
                <pre
                  className={`max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed ${
                    responseBox.isOk ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  <code>{JSON.stringify(responseBox.data, null, 2)}</code>
                </pre>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}