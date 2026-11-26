import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Username/Email and password are required",
        },
        { status: 400 }
      );
    }

    if (!(prisma as any).agent) {
      return NextResponse.json(
        { success: false, error: "Agent system not initialized" },
        { status: 500 }
      );
    }

    const cleanIdentifier = String(email).trim();
    const cleanPassword = String(password);

    const agent = await (prisma as any).agent.findFirst({
      where: {
        OR: [{ email: cleanIdentifier }, { name: cleanIdentifier }],
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.status && String(agent.status).toUpperCase() !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Agent account is inactive or suspended" },
        { status: 403 }
      );
    }

    if (agent.expiryDate && new Date(agent.expiryDate).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Agent account has expired" },
        { status: 403 }
      );
    }

    if (agent.password && agent.password !== cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    let parsedChannels: string[] = [];
    if (agent.assignedChannels) {
      try {
        parsedChannels = JSON.parse(agent.assignedChannels);
      } catch {
        parsedChannels = String(agent.assignedChannels)
          .split(",")
          .filter(Boolean);
      }
    }

    let parsedChatConfig: Record<string, any> = {};
    if (agent.chatConfig) {
      try {
        parsedChatConfig =
          typeof agent.chatConfig === "string"
            ? JSON.parse(agent.chatConfig)
            : agent.chatConfig;
      } catch {
        parsedChatConfig = {};
      }
    }

    return NextResponse.json({
      success: true,
      message: "Agent login successful",
      agent: {
        id: agent.id,
        userId: agent.userId,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        role: agent.role || "AGENT",
        allChannelAccess: agent.allChannelAccess,
        assignedChannels: agent.assignedChannels || "[]",
        assignedChannelsList: parsedChannels,
        chatConfig: agent.chatConfig || "{}",
        parsedChatConfig,
        sendTemplate: agent.sendTemplate,
        sendCampaign: agent.sendCampaign,
        liveChat: agent.liveChat,
      },
    });
  } catch (error: any) {
    console.error("Agent login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}