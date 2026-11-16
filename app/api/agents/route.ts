import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const agents = await (prisma as any).agent.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error("Fetch agents error:", error);
    return NextResponse.json({ success: false, agents: [], error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.email) {
      return NextResponse.json({ success: false, error: "Name and Email are required" }, { status: 400 });
    }

    const newAgent = await (prisma as any).agent.create({
      data: {
        userId: body.userId || "default_user",
        name: body.name,
        email: body.email,
        phone: body.phone || "",
        password: body.password || "",
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        allChannelAccess: body.allChannelAccess ?? true,
        sendTemplate: body.sendTemplate ?? false,
        sendCampaign: body.sendCampaign ?? false,
        liveChat: body.liveChat ?? true,
        role: "AGENT",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error("Create agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create agent" }, { status: 500 });
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
  } catch (error) {
    console.error("Delete agent error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete agent" }, { status: 500 });
  }
}