import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Username/Email and password are required" }, { status: 400 });
    }

    if (!(prisma as any).agent) {
      return NextResponse.json({ success: false, error: "Agent system not initialized" }, { status: 500 });
    }

    // Find agent by email or name (username)
    const agent = await (prisma as any).agent.findFirst({
      where: {
        OR: [
          { email: email },
          { name: email }
        ]
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    if (agent.password && agent.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: "Agent login successful",
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        allChannelAccess: agent.allChannelAccess,
        sendTemplate: agent.sendTemplate,
        sendCampaign: agent.sendCampaign,
        liveChat: agent.liveChat,
      },
    });
  } catch (error: any) {
    console.error("Agent login error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
