import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v21.0";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agentFilter = searchParams.get("agentId") || "ALL";
    const userId = searchParams.get("userId");
    const syncMeta = searchParams.get("syncMeta") === "true";

    // 1. Fetch WABA Accounts & Access Tokens from DB
    const wabaAccounts = await (prisma as any).wabaAccount
      ?.findMany({
        where: userId ? { userId } : {},
      })
      .catch(() => []);

    // 2. Fetch Live Meta Analytics (Graph API v21.0)
    let metaAnalyticsSummary = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalCost: 0,
    };

    if (wabaAccounts && wabaAccounts.length > 0) {
      const startUnix = startDate
        ? Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000)
        : Math.floor((Date.now() - 7 * 86400 * 1000) / 1000);
      const endUnix = endDate
        ? Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      for (const acc of wabaAccounts) {
        if (!acc.wabaId || !acc.accessToken) continue;

        try {
          const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${acc.wabaId}?fields=analytics.start(${startUnix}).end(${endUnix}).granularity(DAILY)&access_token=${acc.accessToken}`;
          const metaRes = await fetch(metaUrl, { cache: "no-store" });
          const metaJson = await metaRes.json();

          if (metaJson?.analytics?.data_points) {
            for (const dp of metaJson.analytics.data_points) {
              metaAnalyticsSummary.totalSent += Number(dp.sent || 0);
              metaAnalyticsSummary.totalDelivered += Number(dp.delivered || 0);
              metaAnalyticsSummary.totalCost += Number(dp.cost || 0);
            }
          }

          if (syncMeta) {
            const tplUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${acc.wabaId}/message_templates?limit=100&access_token=${acc.accessToken}`;
            const tplRes = await fetch(tplUrl, { cache: "no-store" });
            const tplData = await tplRes.json();
            if (Array.isArray(tplData?.data)) {
              for (const metaTpl of tplData.data) {
                await (prisma as any).template
                  ?.updateMany({
                    where: { wabaId: acc.wabaId, name: metaTpl.name },
                    data: { status: metaTpl.status, category: metaTpl.category },
                  })
                  .catch(() => null);
              }
            }
          }
        } catch (metaErr) {
          console.error(`Meta Graph API fetch error for WABA ${acc.wabaId}:`, metaErr);
        }
      }
    }

    // 3. Build Date & Agent Filter for Campaign Logs
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }
    if (agentFilter && agentFilter !== "ALL") {
      whereClause.OR = [
        { agentId: agentFilter },
        { createdBy: agentFilter },
        { userName: agentFilter },
      ];
    }

    const dbCampaigns = await (prisma as any).campaign
      ?.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []);

    const formattedCampaigns = (dbCampaigns || []).map((c: any) => {
      const matchedWaba = wabaAccounts?.find(
        (w: any) =>
          w.wabaId === c.wabaId ||
          w.phoneNumberId === c.wabaId ||
          w.displayPhone === c.wabaNumber
      );

      const channelDisplay = matchedWaba
        ? `${matchedWaba.displayPhone} (${matchedWaba.displayName || "WABA"})`
        : c.wabaNumber || c.wabaId || "WABA";

      return {
        id: c.id,
        createdAt: c.createdAt,
        userName: c.createdBy || c.agentName || c.userName || "agent",
        campaignName: c.name || c.campaignName || "Broadcast",
        templateName: c.templateName || "N/A",
        wabaNumber: channelDisplay,
        scheduledAt: c.scheduledAt || null,
        cost: Number(c.cost || 0).toFixed(2),
        totalCount: Number(c.totalCount || c.recipientsCount || 0),
        deliveredCount: Number(c.deliveredCount || 0),
        failedCount: Number(c.failedCount || 0),
        error: c.errorMessage || "None",
        status: c.status || "COMPLETED",
      };
    });

    return NextResponse.json({
      success: true,
      metaAnalytics: metaAnalyticsSummary,
      campaigns: formattedCampaigns,
    });
  } catch (error: any) {
    console.error("GET /api/agents/admin-campaigns error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
