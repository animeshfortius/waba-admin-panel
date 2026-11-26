import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);

    // Fetch agent strictly within authenticated tenant scope
    const agent = await (prisma as any).agent.findFirst({
      where: {
        id: agentId,
        ...ownerWhere,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Parse permitted channels
    let permittedPhones: string[] = [];
    if (agent.assignedChannels) {
      try {
        permittedPhones = JSON.parse(agent.assignedChannels);
      } catch {
        permittedPhones = String(agent.assignedChannels)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Scope WABA accounts to agent's owner (if present) or tenant ownerWhere
    const wabaScopeWhere = agent.userId ? { userId: agent.userId } : ownerWhere;
    const scopedWabas = await prisma.wabaAccount.findMany({
      where: wabaScopeWhere,
    });

    const agentWabas =
      permittedPhones.length > 0 && !agent.allChannelAccess
        ? scopedWabas.filter(
            (w) =>
              permittedPhones.includes(w.displayPhone || "") ||
              permittedPhones.includes(w.phoneNumberId || "") ||
              permittedPhones.includes(w.wabaId || "")
          )
        : scopedWabas;

    // Fetch LIVE status, Quality Rating & Messaging Tier directly from Meta Graph API v21.0
    const liveMetaChannels = await Promise.all(
      agentWabas.map(async (waba) => {
        let liveQuality = waba.qualityRating || "GREEN";
        let liveTier = waba.messagingLimit || "TIER_1K";
        let verifiedName = waba.displayName || "WABA Business";
        let metaConnected = false;

        if (waba.accessToken && waba.phoneNumberId) {
          try {
            const cleanPhoneId = waba.phoneNumberId
              .replace("PHONE_", "")
              .trim();
            const metaRes = await fetch(
              `https://graph.facebook.com/v21.0/${cleanPhoneId}?fields=verified_name,quality_rating,messaging_limit_tier,code_verification_status&access_token=${waba.accessToken}`,
              { cache: "no-store" }
            );
            const metaData = await metaRes.json();
            if (!metaData.error) {
              metaConnected = true;
              liveQuality = metaData.quality_rating || liveQuality;
              liveTier = metaData.messaging_limit_tier || liveTier;
              verifiedName = metaData.verified_name || verifiedName;
            }
          } catch {
            console.error(
              "Meta live fetch fallback for:",
              waba.displayPhone
            );
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

    // Fetch Campaign Logs strictly scoped to tenant/owner and permitted channels
    const targetIdentifiers = Array.from(
      new Set(
        agentWabas
          .flatMap((w) => [
            w.displayPhone,
            w.phoneNumberId,
            w.wabaId,
            w.phoneNumberId?.replace("PHONE_", ""),
          ])
          .filter(Boolean)
      )
    ) as string[];

    const logWhere: any = {
      ...wabaScopeWhere,
    };

    if (permittedPhones.length > 0 && !agent.allChannelAccess) {
      if (targetIdentifiers.length > 0) {
        logWhere.channel = { in: targetIdentifiers };
      } else {
        logWhere.channel = { in: permittedPhones };
      }
    }

    const logs = await prisma.campaignLog.findMany({
      where: logWhere,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const totalSent = logs.length;
    const delivered = logs.filter((l) =>
      ["DELIVERED", "READ"].includes(l.status?.toUpperCase() || "")
    ).length;
    const read = logs.filter(
      (l) => l.status?.toUpperCase() === "READ"
    ).length;
    const failed = logs.filter(
      (l) => l.status?.toUpperCase() === "FAILED"
    ).length;
    const totalSpend = logs.reduce((acc, l) => acc + (l.cost || 0), 0);

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
      if (["DELIVERED", "READ"].includes(log.status?.toUpperCase() || "")) {
        c.delivered += 1;
      }
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
        deliveryRate:
          totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
        readRate: totalSent > 0 ? Math.round((read / totalSent) * 100) : 0,
        totalSpend: totalSpend.toFixed(2),
      },
      recentCampaigns,
    });
  } catch (error: any) {
    if (
      error?.digest === "DYNAMIC_SERVER_USAGE" ||
      error?.message?.includes("bail out of prerendering")
    ) {
      throw error;
    }
    console.error("Agent Campaigns API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Meta campaigns",
      },
      { status: 500 }
    );
  }
}