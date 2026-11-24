import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/metaAutomation";

async function generateAiReply(params: {
  provider: string;
  model: string;
  apiKey?: string | null;
  systemPrompt?: string | null;
  userMessage: string;
}) {
  const key = params.apiKey || process.env.OPENAI_API_KEY || "";
  if (!key) {
    return "AI Chatbot is enabled, please configure an API key in Chatbot Builder.";
  }

  const sys =
    params.systemPrompt ||
    "You are a helpful WhatsApp business assistant. Keep responses clear, concise, and polite.";

  if (params.provider === "GEMINI") {
    const modelName = params.model || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${sys}\n\nCustomer: ${params.userMessage}` }] }],
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
        { role: "system", content: sys },
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

  let session = await prisma.chatSessionState.findUnique({
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
      if (b.triggerType === "ALL_MESSAGES" || b.triggerType === "WELCOME") return true;
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

  // CHAT_FLOW mode
  const nodes = matchedBot.nodes || [];
  if (nodes.length === 0) return null;

  let currentNode =
    nodes.find((n) => n.nodeKey === session?.currentNodeKey) || nodes[0];

  if (session?.currentNodeKey) {
    let parsedOpts: any[] = [];
    try {
      parsedOpts = JSON.parse(currentNode.optionsJson || "[]");
    } catch {
      parsedOpts = [];
    }
    const matchedOpt = parsedOpts.find(
      (opt: any) =>
        String(opt.label || "").toLowerCase() === cleanMsg ||
        String(opt.id || "").toLowerCase() === cleanMsg ||
        String(opt.key || "").toLowerCase() === cleanMsg
    );
    if (matchedOpt?.nextNodeKey) {
      const next = nodes.find((n) => n.nodeKey === matchedOpt.nextNodeKey);
      if (next) currentNode = next;
    }
  }

  let parsedOptions: any[] = [];
  try {
    parsedOptions = JSON.parse(currentNode.optionsJson || "[]");
  } catch {
    parsedOptions = [];
  }

  let msgPayload: Record<string, any> = {
    type: "text",
    text: { body: currentNode.bodyText || matchedBot.fallbackText || "Hello!" },
  };

  if (currentNode.messageType === "BUTTONS" && parsedOptions.length > 0) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "button",
        ...(currentNode.headerText ? { header: { type: "text", text: currentNode.headerText } } : {}),
        body: { text: currentNode.bodyText },
        ...(currentNode.footerText ? { footer: { text: currentNode.footerText } } : {}),
        action: {
          buttons: parsedOptions.slice(0, 3).map((opt: any, i: number) => ({
            type: "reply",
            reply: {
              id: opt.id || opt.key || `btn_${i + 1}`,
              title: String(opt.label || opt.title || `Option ${i + 1}`).slice(0, 20),
            },
          })),
        },
      },
    };
  } else if (currentNode.messageType === "LIST" && parsedOptions.length > 0) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "list",
        ...(currentNode.headerText ? { header: { type: "text", text: currentNode.headerText } } : {}),
        body: { text: currentNode.bodyText },
        ...(currentNode.footerText ? { footer: { text: currentNode.footerText } } : {}),
        action: {
          button: "Select Option",
          sections: [
            {
              title: "Menu Options",
              rows: parsedOptions.slice(0, 10).map((opt: any, i: number) => ({
                id: opt.id || opt.key || `row_${i + 1}`,
                title: String(opt.label || opt.title || `Option ${i + 1}`).slice(0, 24),
                description: opt.description ? String(opt.description).slice(0, 72) : undefined,
              })),
            },
          ],
        },
      },
    };
  } else if (currentNode.messageType === "FLOW" && currentNode.flowId) {
    msgPayload = {
      type: "interactive",
      interactive: {
        type: "flow",
        ...(currentNode.headerText ? { header: { type: "text", text: currentNode.headerText } } : {}),
        body: { text: currentNode.bodyText || "Please fill out the form:" },
        ...(currentNode.footerText ? { footer: { text: currentNode.footerText } } : {}),
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: `token_${Date.now()}`,
            flow_id: currentNode.flowId,
            flow_cta: currentNode.footerText || "Open Form",
            flow_action: "navigate",
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

  await prisma.chatSessionState.upsert({
    where: {
      phoneNumberId_customerPhone: {
        phoneNumberId: params.phoneNumberId,
        customerPhone: params.customerPhone,
      },
    },
    update: {
      chatbotId: matchedBot.id,
      currentNodeKey: currentNode.nodeKey,
    },
    create: {
      phoneNumberId: params.phoneNumberId,
      customerPhone: params.customerPhone,
      chatbotId: matchedBot.id,
      currentNodeKey: currentNode.nodeKey,
    },
  });

  return { handledBy: "CHAT_FLOW", botId: matchedBot.id, nodeKey: currentNode.nodeKey };
}