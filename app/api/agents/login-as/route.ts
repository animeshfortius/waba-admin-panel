import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID required" }, { status: 400 });
    }

    if (!(prisma as any).agent) {
      return NextResponse.json({ success: false, error: "Agent model not initialized" }, { status: 500 });
    }

    // Safely check using findFirst or handle both string/number IDs to prevent type crash
    const agent = await (prisma as any).agent.findFirst({
      where: {
        OR: [
          { id: agentId },
          { id: String(agentId) },
          ...(!isNaN(Number(agentId)) ? [{ id: Number(agentId) }] : [])
        ]
      },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found in database" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully logged in as ${agent.name}`,
      agent,
    });
  } catch (error: any) {
    console.error("Login as agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to login as agent" }, { status: 500 });
  }
}