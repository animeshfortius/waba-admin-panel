import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v21.0";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agentFilter = searchParams.get("agentId") || "ALL";
    const syncMeta = searchParams.get("syncMeta") === "true";

    const db = prisma as any;

    // 1. Fetch ALL WABA Accounts across possible Prisma model names
    let wabaAccounts: any[] = [];
    if (db.wabaAccount) {
      wabaAccounts = await db.wabaAccount.findMany().catch(() => []);
    } else if (db.whatsappAccount) {
      wabaAccounts = await db.whatsappAccount.findMany().catch(() => []);
    } else if (db.channel) {
      wabaAccounts = await db.channel.findMany().catch(() => []);
    }

    // 2. Fetch Live Meta Analytics & Template Statuses (Graph API v21.0)
    let metaAnalyticsSummary = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalCost: 0,
    };

    if (wabaAccounts.length > 0) {
      const startUnix = startDate
        ? Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000)
        : Math.floor((Date.now() - 7 * 86400 * 1000) / 1000);
      const endUnix = endDate
        ? Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      for (const acc of wabaAccounts) {
        const wabaId = acc.wabaId || acc.businessAccountId;
        const accessToken = acc.accessToken || acc.token || process.env.META_ACCESS_TOKEN;
        if (!wabaId || !accessToken) continue;

        try {
          // Meta Graph API v21.0 Live Analytics
          const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}?fields=analytics.start(${startUnix}).end(${endUnix}).granularity(DAILY)&access_token=${accessToken}`;
          const metaRes = await fetch(metaUrl, { cache: "no-store" });
          const metaJson = await metaRes.json();

          if (metaJson?.analytics?.data_points) {
            for (const dp of metaJson.analytics.data_points) {
              metaAnalyticsSummary.totalSent += Number(dp.sent || 0);
              metaAnalyticsSummary.totalDelivered += Number(dp.delivered || 0);
              metaAnalyticsSummary.totalCost += Number(dp.cost || 0);
            }
          }

          // Sync latest templates & display name from Meta when syncMeta=true
          if (syncMeta) {
            const tplUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${wabaId}/message_templates?limit=100&access_token=${accessToken}`;
            const tplRes = await fetch(tplUrl, { cache: "no-store" });
            const tplData = await tplRes.json();
            if (Array.isArray(tplData?.data) && db.template) {
              for (const metaTpl of tplData.data) {
                await db.template
                  .updateMany({
                    where: { name: metaTpl.name },
                    data: { status: metaTpl.status, category: metaTpl.category },
                  })
                  .catch(() => null);
              }
            }
          }
        } catch (metaErr) {
          console.error(`Meta Graph API fetch error for WABA ${wabaId}:`, metaErr);
        }
      }
    }

    // 3. Build Date Filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);

    const whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }

    // 4. Fetch Campaigns/Reports from whichever Prisma model exists
    let rawRecords: any[] = [];
    if (db.campaign) {
      rawRecords = await db.campaign
        .findMany({ where: whereClause, orderBy: { createdAt: "desc" } })
        .catch(() => []);
    }
    if (rawRecords.length === 0 && db.broadcast) {
      rawRecords = await db.broadcast
        .findMany({ where: whereClause, orderBy: { createdAt: "desc" } })
        .catch(() => []);
    }
    if (rawRecords.length === 0 && db.report) {
      rawRecords = await db.report
        .findMany({ where: whereClause, orderBy: { createdAt: "desc" } })
        .catch(() => []);
    }
    if (rawRecords.length === 0 && db.campaignLog) {
      rawRecords = await db.campaignLog
        .findMany({ where: whereClause, orderBy: { createdAt: "desc" } })
        .catch(() => []);
    }

    // 5. Filter by Agent (if not ALL) & Format for Frontend Table
    const formattedCampaigns = rawRecords
      .filter((c: any) => {
        if (!agentFilter || agentFilter === "ALL") return true;
        return (
          c.agentId === agentFilter ||
          c.createdBy === agentFilter ||
          c.userName === agentFilter ||
          c.userId === agentFilter
        );
      })
      .map((c: any) => {
        const matchedWaba = wabaAccounts.find(
          (w: any) =>
            w.wabaId === c.wabaId ||
            w.phoneNumberId === c.phoneNumberId ||
            w.phoneNumberId === c.wabaId ||
            w.displayPhone === c.wabaNumber ||
            w.displayPhone === c.channel
        );

        const channelDisplay = matchedWaba
          ? `${matchedWaba.displayName || "WABA"} (${matchedWaba.displayPhone || matchedWaba.phoneNumberId})`
          : c.wabaNumber || c.channel || c.wabaId || "WABA";

        return {
          id: c.id,
          createdAt: c.createdAt,
          userName: c.createdBy || c.agentName || c.userName || "agent",
          campaignName: c.name || c.campaignName || c.title || "Broadcast",
          templateName: c.templateName || c.template || "N/A",
          wabaNumber: channelDisplay,
          scheduledAt: c.scheduledAt || null,
          cost: Number(c.cost || c.totalCost || 0).toFixed(2),
          totalCount: Number(c.totalCount || c.recipientsCount || c.sentCount || 0),
          deliveredCount: Number(c.deliveredCount || 0),
          failedCount: Number(c.failedCount || 0),
          error: c.errorMessage || c.error || "None",
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