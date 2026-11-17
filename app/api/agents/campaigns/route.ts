import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Parse permitted channels
    let permittedPhones: string[] = [];
    if (agent.assignedChannels) {
      try {
        permittedPhones = JSON.parse(agent.assignedChannels);
      } catch {
        permittedPhones = agent.assignedChannels.split(",").filter(Boolean);
      }
    }

    // Fetch WABA accounts from DB
    const allWabas = await prisma.wabaAccount.findMany();
    const agentWabas =
      permittedPhones.length > 0 && !agent.allChannelAccess
        ? allWabas.filter(
            (w) =>
              permittedPhones.includes(w.displayPhone) ||
              permittedPhones.includes(w.phoneNumberId) ||
              permittedPhones.includes(w.wabaId)
          )
        : allWabas;

    // Fetch LIVE status, Quality Rating & Messaging Tier directly from Meta Graph API v21.0
    const liveMetaChannels = await Promise.all(
      agentWabas.map(async (waba) => {
        let liveQuality = waba.qualityRating || "GREEN";
        let liveTier = waba.messagingLimit || "TIER_1K";
        let verifiedName = waba.displayName || "WABA Business";
        let metaConnected = false;

        if (waba.accessToken && waba.phoneNumberId) {
          try {
            const metaRes = await fetch(
              `https://graph.facebook.com/v21.0/${waba.phoneNumberId}?fields=verified_name,quality_rating,messaging_limit_tier,code_verification_status&access_token=${waba.accessToken}`,
              { cache: "no-store" }
            );
            const metaData = await metaRes.json();
            if (!metaData.error) {
              metaConnected = true;
              liveQuality = metaData.quality_rating || liveQuality;
              liveTier = metaData.messaging_limit_tier || liveTier;
              verifiedName = metaData.verified_name || verifiedName;
            }
          } catch (e) {
            console.error("Meta live fetch fallback for:", waba.displayPhone);
          }
        }

        return {
          id: waba.id,
          wabaId: waba.wabaId,
          phoneNumberId: waba.phoneNumberId,
          displayPhone: waba.displayPhone,
          verifiedName,
          qualityRating: liveQuality,
          messagingLimit: liveTier,
          metaConnected,
        };
      })
    );

    // Fetch Campaign Logs matching the agent's permitted channels
    const targetNumbers = agentWabas.map((w) => w.displayPhone);
    const logs = await prisma.campaignLog.findMany({
      where:
        targetNumbers.length > 0
          ? { channel: { in: targetNumbers } }
          : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Aggregate Campaign Metrics
    const totalSent = logs.length;
    const delivered = logs.filter((l) => ["DELIVERED", "READ"].includes(l.status?.toUpperCase())).length;
    const read = logs.filter((l) => l.status?.toUpperCase() === "READ").length;
    const failed = logs.filter((l) => l.status?.toUpperCase() === "FAILED").length;
    const totalSpend = logs.reduce((acc, l) => acc + (l.cost || 0), 0);

    // Group logs by campaignName for recent campaign breakdown
    const campaignMap: Record<string, any> = {};
    logs.forEach((log) => {
      if (!campaignMap[log.campaignName]) {
        campaignMap[log.campaignName] = {
          campaignName: log.campaignName,
          templateName: log.templateName,
          channel: log.channel,
          sentAt: log.sentAt,
          total: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          cost: 0,
        };
      }
      const c = campaignMap[log.campaignName];
      c.total += 1;
      if (["DELIVERED", "READ"].includes(log.status?.toUpperCase())) c.delivered += 1;
      if (log.status?.toUpperCase() === "READ") c.read += 1;
      if (log.status?.toUpperCase() === "FAILED") c.failed += 1;
      c.cost += log.cost || 0;
    });

    const recentCampaigns = Object.values(campaignMap).slice(0, 6);

    return NextResponse.json({
      success: true,
      metaChannels: liveMetaChannels,
      summary: {
        totalSent,
        delivered,
        read,
        failed,
        deliveryRate: totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
        readRate: totalSent > 0 ? Math.round((read / totalSent) * 100) : 0,
        totalSpend: totalSpend.toFixed(2),
      },
      recentCampaigns,
    });
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("bail out of prerendering")) {
      throw error;
    }
    console.error("Agent Campaigns API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch Meta campaigns" }, { status: 500 });
  }
}
