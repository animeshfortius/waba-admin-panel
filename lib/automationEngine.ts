import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/metaAutomation";

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function interpolateTemplate(template: string, vars: Record<string, any>): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, keyPath) => {
    const parts = keyPath.split(".");
    let cur: any = vars;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) {
        cur = cur[part];
      } else {
        return "";
      }
    }
    return cur === undefined || cur === null ? "" : String(cur);
  });
}

function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), obj);
}

function extractOptions(nodeConfig: any): any[] {
  if (Array.isArray(nodeConfig)) return nodeConfig;
  if (Array.isArray(nodeConfig?.options)) return nodeConfig.options;
  if (Array.isArray(nodeConfig?.buttons)) return nodeConfig.buttons;
  if (Array.isArray(nodeConfig?.rows)) return nodeConfig.rows;
  return [];
}

function buildPayloadFromNode(
  node: any,
  nodeConfig: any,
  botFallbackText: string,
  vars: Record<string, any>
): Record<string, any> {
  const msgType = String(node.messageType || "SEND_A_MESSAGE").toUpperCase();
  const optionsList = extractOptions(nodeConfig);
  const rawBody =
    node.bodyText ||
    nodeConfig?.bodyText ||
    botFallbackText ||
    "Thanks for showing interest with us! How can we help you?";
  const bodyText = interpolateTemplate(rawBody, vars);
  const headerText = node.headerText ? interpolateTemplate(node.headerText, vars) : undefined;
  const footerText = node.footerText ? interpolateTemplate(node.footerText, vars) : undefined;

  if (
    (msgType === "QUESTION_BUTTON_MESSAGE" ||
      msgType === "ACTION_BUTTON" ||
      msgType === "BUTTONS") &&
    optionsList.length > 0
  ) {
    return {
      type: "interactive",
      interactive: {
        type: "button",
        ...(headerText ? { header: { type: "text", text: headerText } } : {}),
        body: { text: bodyText },
        ...(footerText ? { footer: { text: footerText } } : {}),
        action: {
          buttons: optionsList.slice(0, 3).map((opt: any, idx: number) => ({
            type: "reply",
            reply: {
              id: String(opt.id || opt.key || `btn_${idx + 1}`),
              title: interpolateTemplate(
                String(opt.label || opt.title || `Option ${idx + 1}`),
                vars
              ).slice(0, 20),
            },
          })),
        },
      },
    };
  }

  if (
    (msgType === "MULTI_LIST" ||
      msgType === "DYNAMIC_LIST" ||
      msgType === "LIST") &&
    optionsList.length > 0
  ) {
    return {
      type: "interactive",
      interactive: {
        type: "list",
        ...(headerText ? { header: { type: "text", text: headerText } } : {}),
        body: { text: bodyText },
        ...(footerText ? { footer: { text: footerText } } : {}),
        action: {
          button: String(nodeConfig?.menuLabel || "View Options").slice(0, 20),
          sections: [
            {
              title: String(nodeConfig?.sectionTitle || "Select Option").slice(0, 24),
              rows: optionsList.slice(0, 10).map((opt: any, idx: number) => ({
                id: String(opt.id || opt.key || `opt_${idx + 1}`),
                title: interpolateTemplate(
                  String(opt.label || opt.title || `Option ${idx + 1}`),
                  vars
                ).slice(0, 24),
                description: opt.description
                  ? interpolateTemplate(String(opt.description), vars).slice(0, 72)
                  : undefined,
              })),
            },
          ],
        },
      },
    };
  }

  if ((msgType === "SEND_FLOW_MESSAGE" || msgType === "FLOW") && (node.flowId || nodeConfig?.flowId)) {
    const targetFlowId = node.flowId || nodeConfig?.flowId;
    return {
      type: "interactive",
      interactive: {
        type: "flow",
        ...(headerText ? { header: { type: "text", text: headerText } } : {}),
        body: { text: bodyText },
        ...(footerText ? { footer: { text: footerText } } : {}),
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: `flow_${Date.now()}`,
            flow_id: targetFlowId,
            flow_cta: String(nodeConfig?.buttonText || "Open Flow").slice(0, 20),
            flow_action: "navigate",
          },
        },
      },
    };
  }

  if (msgType === "LOCATION_REQUEST") {
    return {
      type: "interactive",
      interactive: {
        type: "location_request_message",
        body: { text: bodyText },
        action: { name: "send_location" },
      },
    };
  }

  if (msgType === "WHATSAPP_TEMPLATE" && nodeConfig?.templateName) {
    return {
      type: "template",
      template: {
        name: nodeConfig.templateName,
        language: { code: nodeConfig.languageCode || "en_US" },
      },
    };
  }

  return {
    type: "text",
    text: { body: bodyText },
  };
}

export async function processAutomationWebhook(params: {
  phoneNumberId: string;
  customerPhone: string;
  incomingText: string;
  accessToken: string;
}) {
  const cleanChannelDigits = (params.phoneNumberId || "").replace(/\D/g, "").slice(-10);

  const bots = await prisma.chatbotConfig.findMany({
    where: {
      isActive: true,
      ...(cleanChannelDigits
        ? {
            OR: [
              { phoneNumberId: params.phoneNumberId },
              { channelNumber: { contains: cleanChannelDigits } },
              { channelNumber: null },
            ],
          }
        : {}),
    },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  if (bots.length === 0) return null;

  const rawText = (params.incomingText || "").trim();
  const cleanMsg = rawText.toLowerCase();

  const session = await prisma.automationSessionState.findUnique({
    where: {
      phoneNumberId_customerPhone: {
        phoneNumberId: params.phoneNumberId,
        customerPhone: params.customerPhone,
      },
    },
  });

  const keywordMatchedBot = bots.find((b) => {
    if (b.triggerType === "ALL_MESSAGES" || b.triggerType === "WELCOME") return true;
    const kws = (b.keywords || "")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    return kws.some((k) => cleanMsg === k || cleanMsg.includes(k));
  });

  const matchedBot =
    keywordMatchedBot ||
    bots.find((b) => b.id === session?.chatbotId) ||
    bots[0];

  if (!matchedBot) return null;

  const baseVars: Record<string, any> = {
    ...safeParseJson<Record<string, any>>(session?.variablesJson, {}),
    customerPhone: params.customerPhone,
    lastInput: rawText,
  };

  if (matchedBot.mode === "AI_CHATBOT") {
    const key =
      matchedBot.aiApiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    let replyText = "Thanks for messaging us! How can we assist you today?";
    const systemInstruction = interpolateTemplate(
      matchedBot.aiSystemPrompt ||
        "You are a helpful WhatsApp business assistant. Keep responses clear, polite, and concise.",
      baseVars
    );

    if (key) {
      if (String(matchedBot.aiProvider).toUpperCase() === "GEMINI") {
        const modelName = matchedBot.aiModel || "gemini-2.0-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: `${systemInstruction}\n\nCustomer: ${rawText}` }] },
              ],
            }),
          }
        );
        const data = await res.json();
        replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || replyText;
      } else {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: matchedBot.aiModel || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: rawText },
            ],
          }),
        });
        const data = await res.json();
        replyText = data?.choices?.[0]?.message?.content || replyText;
      }
    }

    await sendWhatsAppMessage({
      phoneNumberId: params.phoneNumberId,
      accessToken: params.accessToken,
      to: params.customerPhone,
      payload: { type: "text", text: { body: replyText } },
    });

    return { handledBy: "AI_CHATBOT", botId: matchedBot.id };
  }

  const nodes = matchedBot.nodes || [];
  if (nodes.length === 0) return null;

  let currentNode =
    !keywordMatchedBot && session?.chatbotId === matchedBot.id && session?.currentNodeKey
      ? nodes.find((n) => n.nodeKey === session.currentNodeKey) || nodes[0]
      : nodes[0];

  let matchedOption: any = null;

  if (!keywordMatchedBot && session?.chatbotId === matchedBot.id && session?.currentNodeKey) {
    const prevNode = nodes.find((n) => n.nodeKey === session.currentNodeKey);
    if (prevNode) {
      const prevCfg = safeParseJson<any>(prevNode.optionsJson, {});
      const prevOpts = extractOptions(prevCfg);

      matchedOption = prevOpts.find(
        (opt: any) =>
          String(opt.id || "").toLowerCase() === cleanMsg ||
          String(opt.key || "").toLowerCase() === cleanMsg ||
          String(opt.label || "").toLowerCase() === cleanMsg ||
          String(opt.title || "").toLowerCase() === cleanMsg ||
          (opt.keyword && cleanMsg.includes(String(opt.keyword).toLowerCase()))
      );

      if (matchedOption?.nextNodeKey) {
        const next = nodes.find((n) => n.nodeKey === matchedOption.nextNodeKey);
        if (next) currentNode = next;
      } else if (prevCfg?.nextNodeKey) {
        const next = nodes.find((n) => n.nodeKey === prevCfg.nextNodeKey);
        if (next) currentNode = next;
      } else {
        const childMatch = nodes.find(
          (n) =>
            n.parentKey === prevNode.nodeKey &&
            (String(n.title || "").toLowerCase() === cleanMsg ||
              String(n.nodeKey || "").toLowerCase() === cleanMsg)
        );
        if (childMatch) currentNode = childMatch;
      }
    }
  }

  const nodeConfig = safeParseJson<any>(currentNode.optionsJson, {});
  const msgType = String(currentNode.messageType || "SEND_A_MESSAGE").toUpperCase();
  let updatedVars: Record<string, any> = {
    ...baseVars,
    ...(matchedOption ? { lastOption: matchedOption.label || matchedOption.title || matchedOption.id } : {}),
    ...(nodeConfig?.saveVar ? { [nodeConfig.saveVar]: rawText } : {}),
  };

  let apiSuccess = true;

  if (msgType === "DELAY") {
    const delaySec = Math.min(Math.max(Number(nodeConfig?.delaySeconds || 2), 0), 10);
    if (delaySec > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
    }
  }

  if ((msgType === "WEBHOOK_CONFIG" || msgType === "WEBHOOK") && nodeConfig?.webhookUrl) {
    try {
      const resolvedUrl = interpolateTemplate(String(nodeConfig.webhookUrl), updatedVars);
      const method = String(nodeConfig.method || "POST").toUpperCase();

      const customHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (nodeConfig.headersJson) {
        const parsedHeaders = safeParseJson<Record<string, string>>(
          typeof nodeConfig.headersJson === "string"
            ? nodeConfig.headersJson
            : JSON.stringify(nodeConfig.headersJson),
          {}
        );
        for (const [hk, hv] of Object.entries(parsedHeaders)) {
          customHeaders[hk] = interpolateTemplate(String(hv), updatedVars);
        }
      }
      if (nodeConfig.apiKey && nodeConfig.apiHeaderName) {
        customHeaders[String(nodeConfig.apiHeaderName)] = interpolateTemplate(
          String(nodeConfig.apiKey),
          updatedVars
        );
      }

      const defaultPayloadObj = {
        customerPhone: params.customerPhone,
        message: rawText,
        nodeKey: currentNode.nodeKey,
        selectedOption: matchedOption?.label || matchedOption?.title || null,
        variables: updatedVars,
      };

      const bodyStr =
        method === "GET"
          ? undefined
          : nodeConfig.bodyTemplate
          ? interpolateTemplate(String(nodeConfig.bodyTemplate), updatedVars)
          : JSON.stringify(defaultPayloadObj);

      const apiRes = await fetch(resolvedUrl, {
        method,
        headers: customHeaders,
        ...(bodyStr ? { body: bodyStr } : {}),
      });

      apiSuccess = apiRes.ok;
      const rawApiText = await apiRes.text();
      let parsedApiData: any = rawApiText;
      try {
        parsedApiData = JSON.parse(rawApiText);
      } catch {
        // Keep plain text response if not JSON
      }

      updatedVars.api = parsedApiData;
      updatedVars.api_status = apiRes.status;

      if (nodeConfig.responseVar) {
        const extractedVal =
          typeof parsedApiData === "object" && nodeConfig.responsePath
            ? getByPath(parsedApiData, String(nodeConfig.responsePath))
            : parsedApiData;
        updatedVars[String(nodeConfig.responseVar)] =
          typeof extractedVal === "object" ? JSON.stringify(extractedVal) : extractedVal;
      }
    } catch (err) {
      apiSuccess = false;
      console.error("Chatbot webhook/API node error:", err);
    }
  }

  const payload = buildPayloadFromNode(
    currentNode,
    nodeConfig,
    matchedBot.fallbackText || "",
    updatedVars
  );
  await sendWhatsAppMessage({
    phoneNumberId: params.phoneNumberId,
    accessToken: params.accessToken,
    to: params.customerPhone,
    payload,
  });

  const optionsList = extractOptions(nodeConfig);
  const branchFromApi =
    msgType === "WEBHOOK_CONFIG" || msgType === "WEBHOOK"
      ? apiSuccess
        ? nodeConfig?.nextNodeKey
        : nodeConfig?.errorNextNodeKey || nodeConfig?.nextNodeKey
      : nodeConfig?.nextNodeKey;

  const autoNextKey =
    optionsList.length === 0
      ? branchFromApi ||
        nodes.find((n) => n.parentKey === currentNode.nodeKey)?.nodeKey ||
        currentNode.nodeKey
      : currentNode.nodeKey;

  await prisma.automationSessionState.upsert({
    where: {
      phoneNumberId_customerPhone: {
        phoneNumberId: params.phoneNumberId,
        customerPhone: params.customerPhone,
      },
    },
    update: {
      chatbotId: matchedBot.id,
      currentNodeKey: autoNextKey,
      variablesJson: JSON.stringify(updatedVars),
    },
    create: {
      phoneNumberId: params.phoneNumberId,
      customerPhone: params.customerPhone,
      chatbotId: matchedBot.id,
      currentNodeKey: autoNextKey,
      variablesJson: JSON.stringify(updatedVars),
    },
  });

  return {
    handledBy: "CHAT_FLOW",
    botId: matchedBot.id,
    nodeKey: currentNode.nodeKey,
  };
}