import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/metaAutomation";

async function generateAiReply(params: {
  provider: string;
  model: string;
  apiKey?: string | null;
  systemPrompt?: string | null;
  userMessage: string;
}) {
  const key =
    params.apiKey ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "";

  if (!key) {
    return "AI Chatbot is enabled. Please configure an API key in Chatbot Builder.";
  }

  const systemInstruction =
    params.systemPrompt ||
    "You are a helpful WhatsApp business assistant. Keep responses clear, polite, and concise.";

  if (String(params.provider).toUpperCase() === "GEMINI") {
    const modelName = params.model || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemInstruction}\n\nCustomer: ${params.userMessage}` }],
            },
          ],
        }),
      }
    );
    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response right now."
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: params.userMessage },
      ],
    }),
  });
  const data = await res.json();
  return (
    data?.choices?.[0]?.message?.content ||
    "Sorry, I could not generate a response right now."
  );
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function processAutomationWebhook(params: {
  phoneNumberId: string;
  customerPhone: string;
  incomingText: string;
  accessToken: string;
}) {
  const bots = await prisma.chatbotConfig.findMany({
    where: { isActive: true },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  if (bots.length === 0) return null;

  const cleanMsg = (params.incomingText || "").trim().toLowerCase();

  const session = await prisma.automationSessionState.findUnique({
    where: {
      phoneNumberId_customerPhone: {
        phoneNumberId: params.phoneNumberId,
        customerPhone: params.customerPhone,
      },
    },
  });

  const matchedBot =
    bots.find((b) => b.id === session?.chatbotId) ||
    bots.find((b) => {
      if (b.triggerType === "ALL_MESSAGES" || b.triggerType === "WELCOME") {
        return true;
      }
      const kws = (b.keywords || "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      return kws.some((k) => cleanMsg.includes(k));
    }) ||
    bots[0];

  if (!matchedBot) return null;

  if (matchedBot.mode === "AI_CHATBOT") {
    const replyText = await generateAiReply({
      provider: matchedBot.aiProvider,
      model: matchedBot.aiModel,
      apiKey: matchedBot.aiApiKey,
      systemPrompt: matchedBot.aiSystemPrompt,
      userMessage: params.incomingText,
    });

    await sendWhatsAppMessage({
      phoneNumberId: params.phoneNumberId,
      accessToken: params.accessToken,
      to: params.customerPhone,
      payload: {
        type: "text",
        text: { body: replyText },
      },
    });

    return { handledBy: "AI_CHATBOT", botId: matchedBot.id };
  }

  const nodes = matchedBot.nodes || [];
  if (nodes.length === 0) return null;

  let currentNode =
    nodes.find((n) => n.nodeKey === session?.currentNodeKey) || nodes[0];

  if (session?.currentNodeKey) {
    const prevConfig = safeParseJson<any>(currentNode.optionsJson, {});
    const prevOpts = Array.isArray(prevConfig)
      ? prevConfig
      : Array.isArray(prevConfig?.options)
      ? prevConfig.options
      : [];

    const matchedOpt = prevOpts.find(
      (opt: any) =>
        String(opt.label || "").toLowerCase() === cleanMsg ||
        String(opt.title || "").toLowerCase() === cleanMsg ||
        String(opt.id || "").toLowerCase() === cleanMsg ||
        String(opt.key || "").toLowerCase() === cleanMsg
    );

    if (matchedOpt?.nextNodeKey) {
      const next = nodes.find((n) => n.nodeKey === matchedOpt.nextNodeKey);
      if (next) currentNode = next;
    } else if (prevConfig?.nextNodeKey) {
      const next = nodes.find((n) => n.nodeKey === prevConfig.nextNodeKey);
      if (next) currentNode = next;
    }
  }

  const nodeConfig = safeParseJson<any>(currentNode.optionsJson, {});
  const optionsList = Array.isArray(nodeConfig)
    ? nodeConfig
    : Array.isArray(nodeConfig?.options)
    ? nodeConfig.options
    : [];

  const msgType = String(currentNode.messageType || "TEXT").toUpperCase();

  if (msgType === "DELAY") {
    const delaySec = Math.min(Math.max(Number(nodeConfig?.delaySeconds || 2), 0), 10);
    if (delaySec > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
    }
  }

  if ((msgType === "WEBHOOK" || msgType === "WEBHOOK_CONFIG") && nodeConfig?.webhookUrl) {
    try {
      await fetch(nodeConfig.webhookUrl, {
        method: nodeConfig.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(nodeConfig.headers || {}),
        },
        ...(nodeConfig.method !== "GET"
          ? {
              body: JSON.stringify({
                customerPhone: params.customerPhone,
                message: params.incomingText,
                nodeKey: currentNode.nodeKey,
              }),
            }
          : {}),
      });
    } catch (err) {
      console.error("Chatbot webhook node error:", err);
    }
  }

  let msgPayload: Record<string, any> = {
    type: "text",
    text: {
      body:
        currentNode.bodyText ||
        matchedBot.fallbackText ||
        "Thanks for your message!",
    },
  };

  if (
    (msgType === "BUTTONS" ||
      msgType === "QUESTION_BUTTON_MESSAGE" ||
      msgType === "ACTION_BUTTON") &&
    optionsList.length > 0
  ) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "button",
        ...(currentNode.headerText
          ? { header: { type: "text", text: currentNode.headerText } }
          : {}),
        body: { text: currentNode.bodyText || "Please choose an option:" },
        ...(currentNode.footerText
          ? { footer: { text: currentNode.footerText } }
          : {}),
        action: {
          buttons: optionsList.slice(0, 3).map((opt: any, idx: number) => ({
            type: "reply",
            reply: {
              id: opt.id || opt.key || `btn_${idx + 1}`,
              title: String(opt.label || opt.title || `Option ${idx + 1}`).slice(0, 20),
            },
          })),
        },
      },
    };
  } else if (
    (msgType === "LIST" ||
      msgType === "MULTI_LIST" ||
      msgType === "DYNAMIC_LIST") &&
    optionsList.length > 0
  ) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "list",
        ...(currentNode.headerText
          ? { header: { type: "text", text: currentNode.headerText } }
          : {}),
        body: { text: currentNode.bodyText || "Select from list:" },
        ...(currentNode.footerText
          ? { footer: { text: currentNode.footerText } }
          : {}),
        action: {
          button: nodeConfig?.menuLabel || "Select Option",
          sections: [
            {
              title: nodeConfig?.sectionTitle || "Menu",
              rows: optionsList.slice(0, 10).map((opt: any, idx: number) => ({
                id: opt.id || opt.key || `row_${idx + 1}`,
                title: String(opt.label || opt.title || `Option ${idx + 1}`).slice(0, 24),
                description: opt.description ? String(opt.description).slice(0, 72) : undefined,
              })),
            },
          ],
        },
      },
    };
  } else if ((msgType === "FLOW" || msgType === "SEND_FLOW_MESSAGE") && currentNode.flowId) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "flow",
        ...(currentNode.headerText
          ? { header: { type: "text", text: currentNode.headerText } }
          : {}),
        body: { text: currentNode.bodyText || "Please fill out the form:" },
        ...(currentNode.footerText
          ? { footer: { text: currentNode.footerText } }
          : {}),
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: `flow_${Date.now()}`,
            flow_id: currentNode.flowId,
            flow_cta: nodeConfig?.buttonText || "Open Flow",
            flow_action: "navigate",
            ...(nodeConfig?.screenId
              ? { flow_action_payload: { screen: nodeConfig.screenId } }
              : {}),
          },
        },
      },
    };
  }

  await sendWhatsAppMessage({
    phoneNumberId: params.phoneNumberId,
    accessToken: params.accessToken,
    to: params.customerPhone,
    payload: msgPayload,
  });

  const nextNodeKey =
    optionsList[0]?.nextNodeKey || nodeConfig?.nextNodeKey || currentNode.nodeKey;

  await prisma.automationSessionState.upsert({
    where: {
      phoneNumberId_customerPhone: {
        phoneNumberId: params.phoneNumberId,
        customerPhone: params.customerPhone,
      },
    },
    update: {
      chatbotId: matchedBot.id,
      currentNodeKey: nextNodeKey,
    },
    create: {
      phoneNumberId: params.phoneNumberId,
      customerPhone: params.customerPhone,
      chatbotId: matchedBot.id,
      currentNodeKey: nextNodeKey,
    },
  });

  return {
    handledBy: "CHAT_FLOW",
    botId: matchedBot.id,
    nodeKey: currentNode.nodeKey,
  };
}