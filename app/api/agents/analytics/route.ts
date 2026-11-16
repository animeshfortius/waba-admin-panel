import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 });
    }

    const agent = await (prisma as any).agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // Match sessions assigned to this agent's userId or name
    const agentIdentifiers = [agent.userId, agent.name, agent.email].filter(Boolean);

    const sessions = await prisma.chatSession.findMany({
      where: {
        assignedTo: { in: agentIdentifiers },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const totalChats = sessions.length;
    const resolvedChats = sessions.filter((s) => s.status === "RESOLVED").length;
    const openChats = sessions.filter((s) => s.status === "OPEN").length;

    // Count actual Meta WABA messages sent by this agent & their delivery/read statuses
    let totalMessagesSent = 0;
    let deliveredOrReadCount = 0;
    let totalResponseSeconds = 0;
    let responseSamples = 0;

    for (const session of sessions) {
      let lastCustomerMsgTime: number | null = null;

      for (const msg of session.messages) {
        if (msg.senderType === "CUSTOMER") {
          lastCustomerMsgTime = new Date(msg.createdAt).getTime();
        } else if (msg.senderType === "AGENT") {
          totalMessagesSent++;
          if (msg.status === "DELIVERED" || msg.status === "READ") {
            deliveredOrReadCount++;
          }
          // Calculate actual first/subsequent response time from customer message to agent reply
          if (lastCustomerMsgTime) {
            const diffSec = Math.max(1, Math.floor((new Date(msg.createdAt).getTime() - lastCustomerMsgTime) / 1000));
            totalResponseSeconds += diffSec;
            responseSamples++;
            lastCustomerMsgTime = null;
          }
        }
      }
    }

    // Format Average Response Time
    let avgResponseTime = "0s";
    if (responseSamples > 0) {
      const avgSec = Math.round(totalResponseSeconds / responseSamples);
      if (avgSec < 60) {
        avgResponseTime = `${avgSec}s`;
      } else {
        const mins = Math.floor(avgSec / 60);
        const secs = avgSec % 60;
        avgResponseTime = `${mins}m ${secs}s`;
      }
    }

    // Meta Delivery & Read Success Rate (%)
    const metaDeliveryRate =
      totalMessagesSent > 0
        ? `${Math.round((deliveredOrReadCount / totalMessagesSent) * 100)}%`
        : totalChats > 0
        ? "100%"
        : "0%";

    return NextResponse.json({
      success: true,
      analytics: {
        totalChats,
        resolvedChats,
        openChats,
        totalMessagesSent,
        avgResponseTime,
        metaDeliveryRate,
      },
    });
  } catch (error: any) {
    console.error("Agent analytics fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch agent analytics" },
      { status: 500 }
    );
  }
}