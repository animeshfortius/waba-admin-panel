import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!(prisma as any).agent) {
      return NextResponse.json({ success: true, agents: [] });
    }

    const agents = await (prisma as any).agent.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const formattedAgents = agents.map((ag: any) => {
      let parsedChannels: string[] = [];
      if (ag.assignedChannels) {
        try {
          parsedChannels = JSON.parse(ag.assignedChannels);
        } catch {
          parsedChannels = ag.assignedChannels.split(",").filter(Boolean);
        }
      }

      let parsedChatConfig: Record<string, any> = {};
      if (ag.chatConfig) {
        try {
          parsedChatConfig =
            typeof ag.chatConfig === "string" ? JSON.parse(ag.chatConfig) : ag.chatConfig;
        } catch {
          parsedChatConfig = {};
        }
      }

      return {
        ...ag,
        assignedChannelsList: parsedChannels,
        parsedChatConfig,
      };
    });

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("bail out of prerendering")) {
      throw error;
    }
    console.error("Fetch agents error:", error);
    return NextResponse.json({ success: true, agents: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.userId) {
      return NextResponse.json({ success: false, error: "Agent Name and User ID are required" }, { status: 400 });
    }

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
          userId: body.userId,
          name: body.name,
          email: body.email || `${body.userId}@fortius.in`,
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
      // Fallback if assignedChannels or chatConfig columns are not yet pushed in live DB
      if (prismaErr.message?.includes("assignedChannels") || prismaErr.message?.includes("chatConfig")) {
        newAgent = await (prisma as any).agent.create({
          data: {
            userId: body.userId,
            name: body.name,
            email: body.email || `${body.userId}@fortius.in`,
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

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error("Create agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create agent" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { agentId, id, ...updates } = body;
    const targetId = agentId || id;

    if (!targetId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 });
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

    const whereClause = { id: isNaN(Number(targetId)) ? targetId : Number(targetId) };

    let updatedAgent;
    try {
      updatedAgent = await (prisma as any).agent.update({
        where: whereClause,
        data: updates,
      });
    } catch (prismaErr: any) {
      // Fallback if assignedChannels or chatConfig columns don't exist in compiled Prisma client yet
      if (prismaErr.message?.includes("assignedChannels") || prismaErr.message?.includes("chatConfig")) {
        const { assignedChannels, chatConfig, ...safeUpdates } = updates;
        updatedAgent = await (prisma as any).agent.update({
          where: whereClause,
          data: safeUpdates,
        });
      } else {
        throw prismaErr;
      }
    }

    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error: any) {
    console.error("Update agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Agent ID required" }, { status: 400 });
    }

    await (prisma as any).agent.delete({
      where: { id: isNaN(Number(id)) ? id : Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete agent" }, { status: 500 });
  }
}
