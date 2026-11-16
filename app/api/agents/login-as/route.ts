import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID required" }, { status: 400 });
    }

    const agent = await (prisma as any).agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Impersonating agent ${agent.name}`,
      agent,
    });
  } catch (error: any) {
    console.error("Login as agent error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to login as agent" }, { status: 500 });
  }
}