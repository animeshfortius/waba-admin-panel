import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

function normalizeAgentId(rawId: string | number) {
  const str = String(rawId).trim();
  return isNaN(Number(str)) ? str : Number(str);
}

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    if (!(prisma as any).agent) {
      return NextResponse.json({ success: true, agents: [] });
    }

    const { searchParams } = new URL(request.url);
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
        return NextResponse.json({ success: true, agents: [] });
      }
      whereClause.userId = requestedUserId;
    }

    const agents = await (prisma as any).agent.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const formattedAgents = agents.map((ag: any) => {
      let parsedChannels: string[] = [];
      if (ag.assignedChannels) {
        try {
          parsedChannels = JSON.parse(ag.assignedChannels);
        } catch {
          parsedChannels = String(ag.assignedChannels)
            .split(",")
            .filter(Boolean);
        }
      }

      let parsedChatConfig: Record<string, any> = {};
      if (ag.chatConfig) {
        try {
          parsedChatConfig =
            typeof ag.chatConfig === "string"
              ? JSON.parse(ag.chatConfig)
              : ag.chatConfig;
        } catch {
          parsedChatConfig = {};
        }
      }

      const { password: _hiddenPassword, ...safeAgent } = ag;

      return {
        ...safeAgent,
        assignedChannelsList: parsedChannels,
        parsedChatConfig,
      };
    });

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error: any) {
    if (
      error?.digest === "DYNAMIC_SERVER_USAGE" ||
      error?.message?.includes("bail out of prerendering")
    ) {
      throw error;
    }
    console.error("Fetch agents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body?.name) {
      return NextResponse.json(
        { success: false, error: "Agent Name is required" },
        { status: 400 }
      );
    }

    const targetUserId =
      body.userId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(body.userId))
        ? body.userId
        : tenant.userId;

    const channelsJson = Array.isArray(body.assignedChannels)
      ? JSON.stringify(body.assignedChannels)
      : typeof body.assignedChannels === "string"
      ? body.assignedChannels
      : "[]";

    const chatConfigJson =
      body.chatConfig && typeof body.chatConfig === "object"
        ? JSON.stringify(body.chatConfig)
        : typeof body.chatConfig === "string"
        ? body.chatConfig
        : "{}";

    let newAgent;
    try {
      newAgent = await (prisma as any).agent.create({
        data: {
          userId: targetUserId,
          name: String(body.name).trim(),
          email: body.email || `${targetUserId}@fortius.in`,
          phone: body.phone || "",
          password: body.password || "agent123",
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          allChannelAccess: body.allChannelAccess ?? true,
          assignedChannels: channelsJson,
          chatConfig: chatConfigJson,
          sendTemplate: body.sendTemplate ?? false,
          sendCampaign: body.sendCampaign ?? false,
          liveChat: body.liveChat ?? true,
          role: "AGENT",
          status: "ACTIVE",
        },
      });
    } catch (prismaErr: any) {
      if (
        prismaErr.message?.includes("assignedChannels") ||
        prismaErr.message?.includes("chatConfig")
      ) {
        newAgent = await (prisma as any).agent.create({
          data: {
            userId: targetUserId,
            name: String(body.name).trim(),
            email: body.email || `${targetUserId}@fortius.in`,
            phone: body.phone || "",
            password: body.password || "agent123",
            expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
            allChannelAccess: body.allChannelAccess ?? true,
            sendTemplate: body.sendTemplate ?? false,
            sendCampaign: body.sendCampaign ?? false,
            liveChat: body.liveChat ?? true,
            role: "AGENT",
            status: "ACTIVE",
          },
        });
      } else {
        throw prismaErr;
      }
    }

    const { password: _hiddenPassword, ...safeNewAgent } = newAgent;

    return NextResponse.json({ success: true, agent: safeNewAgent });
  } catch (error: any) {
    console.error("Create agent error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create agent" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { agentId, id, userId: _ignoredUserId, ...updates } = body;
    const targetId = agentId || id;

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const normalizedId = normalizeAgentId(targetId);

    const existing = await (prisma as any).agent.findFirst({
      where: {
        id: normalizedId,
        ...ownerWhere,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    if (updates.expiryDate) {
      updates.expiryDate = new Date(updates.expiryDate);
    }

    if (Array.isArray(updates.assignedChannels)) {
      updates.assignedChannels = JSON.stringify(updates.assignedChannels);
    }

    if (updates.chatConfig && typeof updates.chatConfig === "object") {
      updates.chatConfig = JSON.stringify(updates.chatConfig);
    }

    delete updates.assignedChannelsList;
    delete updates.parsedChatConfig;

    let updatedAgent;
    try {
      updatedAgent = await (prisma as any).agent.update({
        where: { id: existing.id },
        data: updates,
      });
    } catch (prismaErr: any) {
      if (
        prismaErr.message?.includes("assignedChannels") ||
        prismaErr.message?.includes("chatConfig")
      ) {
        const { assignedChannels, chatConfig, ...safeUpdates } = updates;
        updatedAgent = await (prisma as any).agent.update({
          where: { id: existing.id },
          data: safeUpdates,
        });
      } else {
        throw prismaErr;
      }
    }

    const { password: _hiddenPassword, ...safeUpdatedAgent } = updatedAgent;

    return NextResponse.json({ success: true, agent: safeUpdatedAgent });
  } catch (error: any) {
    console.error("Update agent error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Agent ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const normalizedId = normalizeAgentId(id);

    const existing = await (prisma as any).agent.findFirst({
      where: {
        id: normalizedId,
        ...ownerWhere,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    await (prisma as any).agent.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete agent error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete agent" },
      { status: 500 }
    );
  }
}