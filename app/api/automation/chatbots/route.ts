import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const ownerWhere = getOwnerWhere(tenant);
    const whereClause: any = { ...ownerWhere };

    if (
      requestedUserId &&
      requestedUserId !== "ALL" &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null"
    ) {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(requestedUserId)
      ) {
        return NextResponse.json({ success: true, chatbots: [] });
      }
      whereClause.userId = requestedUserId;
    }

    const chatbots = await prisma.chatbotConfig.findMany({
      where: whereClause,
      include: { nodes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, chatbots });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id,
      userId,
      wabaAccountId,
      phoneNumberId,
      channelNumber,
      name,
      mode = "CHAT_FLOW",
      triggerType = "KEYWORD",
      keywords = "",
      isActive = true,
      isPublished = false,
      aiProvider = "OPENAI",
      aiModel = "gpt-4o-mini",
      aiApiKey = "",
      aiSystemPrompt = "",
      fallbackText = "Thanks for reaching out! Our team will assist you shortly.",
      canvasJson = null,
      nodes = [],
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: "Chatbot name is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);

    const formattedNodes = Array.isArray(nodes)
      ? nodes.map((n: any, idx: number) => ({
          nodeKey: n.nodeKey || `node_${idx + 1}`,
          title: n.title || `Step ${idx + 1}`,
          messageType: n.messageType || "SEND_MESSAGE",
          bodyText: n.bodyText || "",
          headerText: n.headerText || null,
          footerText: n.footerText || null,
          optionsJson:
            typeof n.optionsJson === "string"
              ? n.optionsJson
              : JSON.stringify(n.config || n.options || {}),
          flowId: n.flowId || null,
          posX: typeof n.posX === "number" ? n.posX : 340 + idx * 280,
          posY: typeof n.posY === "number" ? n.posY : 120 + (idx % 3) * 140,
          parentKey: n.parentKey || null,
          sortOrder: idx,
        }))
      : [];

    let saved;
    if (id) {
      const existing = await prisma.chatbotConfig.findFirst({
        where: { id, ...ownerWhere },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Chatbot not found or access denied" },
          { status: 404 }
        );
      }

      await prisma.chatbotNode.deleteMany({ where: { chatbotId: existing.id } });
      saved = await prisma.chatbotConfig.update({
        where: { id: existing.id },
        data: {
          wabaAccountId: wabaAccountId || null,
          phoneNumberId: phoneNumberId || null,
          channelNumber: channelNumber || null,
          name: String(name).trim(),
          mode,
          triggerType,
          keywords,
          isActive: Boolean(isActive),
          isPublished: Boolean(isPublished),
          aiProvider,
          aiModel,
          aiApiKey,
          aiSystemPrompt,
          fallbackText,
          canvasJson: canvasJson
            ? typeof canvasJson === "string"
              ? canvasJson
              : JSON.stringify(canvasJson)
            : null,
          nodes: { create: formattedNodes },
        },
        include: { nodes: { orderBy: { sortOrder: "asc" } } },
      });
    } else {
      const targetUserId =
        userId &&
        (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(userId))
          ? userId
          : tenant.userId;

      saved = await prisma.chatbotConfig.create({
        data: {
          userId: targetUserId,
          wabaAccountId: wabaAccountId || null,
          phoneNumberId: phoneNumberId || null,
          channelNumber: channelNumber || null,
          name: String(name).trim(),
          mode,
          triggerType,
          keywords,
          isActive: Boolean(isActive),
          isPublished: Boolean(isPublished),
          aiProvider,
          aiModel,
          aiApiKey,
          aiSystemPrompt,
          fallbackText,
          canvasJson: canvasJson
            ? typeof canvasJson === "string"
              ? canvasJson
              : JSON.stringify(canvasJson)
            : null,
          nodes: { create: formattedNodes },
        },
        include: { nodes: { orderBy: { sortOrder: "asc" } } },
      });
    }

    return NextResponse.json({ success: true, chatbot: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Chatbot id is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.chatbotConfig.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.chatbotConfig.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}