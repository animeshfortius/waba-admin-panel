import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "admin";

    const chatbots = await prisma.chatbotConfig.findMany({
      where: { userId },
      include: { nodes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, chatbots });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      userId = "admin",
      wabaAccountId,
      phoneNumberId,
      name,
      mode = "CHAT_FLOW",
      triggerType = "KEYWORD",
      keywords = "",
      isActive = true,
      aiProvider = "OPENAI",
      aiModel = "gpt-4o-mini",
      aiApiKey = "",
      aiSystemPrompt = "",
      fallbackText = "Thanks for reaching out! Our team will assist you shortly.",
      nodes = [],
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, error: "Chatbot name is required" }, { status: 400 });
    }

    const formattedNodes = Array.isArray(nodes)
      ? nodes.map((n: any, idx: number) => ({
          nodeKey: n.nodeKey || `node_${idx + 1}`,
          title: n.title || `Step ${idx + 1}`,
          messageType: n.messageType || "TEXT",
          bodyText: n.bodyText || "",
          headerText: n.headerText || null,
          footerText: n.footerText || null,
          optionsJson: typeof n.optionsJson === "string" ? n.optionsJson : JSON.stringify(n.options || []),
          flowId: n.flowId || null,
          sortOrder: idx,
        }))
      : [];

    let saved;
    if (id) {
      await prisma.chatbotNode.deleteMany({ where: { chatbotId: id } });
      saved = await prisma.chatbotConfig.update({
        where: { id },
        data: {
          wabaAccountId: wabaAccountId || null,
          phoneNumberId: phoneNumberId || null,
          name: String(name).trim(),
          mode,
          triggerType,
          keywords,
          isActive: Boolean(isActive),
          aiProvider,
          aiModel,
          aiApiKey,
          aiSystemPrompt,
          fallbackText,
          nodes: { create: formattedNodes },
        },
        include: { nodes: { orderBy: { sortOrder: "asc" } } },
      });
    } else {
      saved = await prisma.chatbotConfig.create({
        data: {
          userId,
          wabaAccountId: wabaAccountId || null,
          phoneNumberId: phoneNumberId || null,
          name: String(name).trim(),
          mode,
          triggerType,
          keywords,
          isActive: Boolean(isActive),
          aiProvider,
          aiModel,
          aiApiKey,
          aiSystemPrompt,
          fallbackText,
          nodes: { create: formattedNodes },
        },
        include: { nodes: { orderBy: { sortOrder: "asc" } } },
      });
    }

    return NextResponse.json({ success: true, chatbot: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Chatbot id is required" }, { status: 400 });
    }
    await prisma.chatbotConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}