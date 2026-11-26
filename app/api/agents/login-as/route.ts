import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { agentId } = await request.json();

    if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
      return NextResponse.json(
        { success: false, error: "Valid Agent ID is required" },
        { status: 400 }
      );
    }

    const cleanAgentId = agentId.trim();
    const ownerWhere = getOwnerWhere(tenant);

    // Fetch agent strictly within the logged-in tenant's allowed scope
    const agent = await (prisma as any).agent?.findFirst({
      where: {
        id: cleanAgentId,
        ...ownerWhere,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully logged in as ${agent.name}`,
      agent,
    });
  } catch (error: any) {
    console.error("Login as agent error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to login as agent",
      },
      { status: 500 }
    );
  }
}