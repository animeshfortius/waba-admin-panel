import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

function formatIST(dateInput: Date | string | null) {
  if (!dateInput) return "N/A";
  const date = new Date(dateInput);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export async function GET(req: Request) {
  try {
    await headers();

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session", campaigns: [] },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const agentFilter = searchParams.get("agentId") || "ALL";
    const syncMeta = searchParams.get("syncMeta") === "true";

    const ownerWhere = getOwnerWhere(tenant);

    // 1. Fetch WABA Accounts strictly within authenticated tenant scope
    const wabaAccounts = await prisma.wabaAccount.findMany({
      where: ownerWhere,
    });

    // 2. Fetch Live Meta Analytics & Sync Templates (Graph API v21.0) for scoped WABAs only
    let metaAnalyticsSummary = {
      totalSent: 0,
      totalDelivered: 0,
      totalCost: 0,
    };

    if (wabaAccounts.length > 0) {
      const startUnix = startDateParam
        ? Math.floor(new Date(`${startDateParam}T00:00:00Z`).getTime() / 1000)
        : Math.floor((Date.now() - 7 * 86400 * 1000) / 1000);
      const endUnix = endDateParam
        ? Math.floor(new Date(`${endDateParam}T23:59:59Z`).getTime() / 1000)
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

          if (syncMeta && acc.userId) {
            const tplUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${acc.wabaId}/message_templates?limit=100&access_token=${acc.accessToken}`;
            const tplRes = await fetch(tplUrl, { cache: "no-store" });
            const tplData = await tplRes.json();
            if (Array.isArray(tplData?.data)) {
              for (const metaTpl of tplData.data) {
                await (prisma as any).template
                  ?.updateMany({
                    where: { name: metaTpl.name, userId: acc.userId },
                    data: {
                      status: metaTpl.status,
                      category: metaTpl.category,
                    },
                  })
                  .catch(() => null);
              }
            }
          }
        } catch (metaErr) {
          console.error(
            `Meta Graph API fetch error for WABA ${acc.wabaId}:`,
            metaErr
          );
        }
      }
    }

    // 3. Build Tenant + Date Where Clause on campaignLog
    const whereClause: any = {
      ...ownerWhere,
      campaignName: {
        not: "Direct_Chat_Campaign",
      },
    };

    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    }

    if (agentFilter && agentFilter !== "ALL") {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(agentFilter)
      ) {
        return NextResponse.json(
          {
            success: true,
            metaAnalytics: metaAnalyticsSummary,
            campaigns: [],
            wabaAccounts: wabaAccounts.map((w) => ({
              id: w.id,
              wabaId: w.wabaId,
              phoneNumberId: w.phoneNumberId,
              displayPhone: w.displayPhone,
              displayName: w.displayName,
              userId: w.userId,
            })),
          },
          {
            headers: {
              "Cache-Control":
                "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      }
      whereClause.userId = agentFilter;
    }

    const messageLogs = await prisma.campaignLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // 4. Filter by Agent (if selected) & Group by Campaign Name
    const filteredLogs = messageLogs.filter((log: any) => {
      if (!agentFilter || agentFilter === "ALL") return true;
      return (
        log.agentId === agentFilter ||
        log.userId === agentFilter ||
        log.createdBy === agentFilter ||
        log.userName === agentFilter
      );
    });

    const campaignMap: { [key: string]: any } = {};

    filteredLogs.forEach((log: any) => {
      const key = log.campaignName || "Broadcast";
      if (!campaignMap[key]) {
        const matchedWaba = wabaAccounts.find(
          (w) =>
            w.displayPhone === log.channel ||
            w.wabaId === log.channel ||
            (w.displayPhone ? log.channel?.includes(w.displayPhone) : false)
        );

        const channelDisplay = matchedWaba
          ? `${matchedWaba.displayName || "WABA"} (${matchedWaba.displayPhone})`
          : log.channel || "WABA";

        campaignMap[key] = {
          id: log.id,
          date: formatIST(log.createdAt),
          createdAt: log.createdAt,
          userName:
            log.userName || log.createdBy || log.agentId || log.userId || "agent",
          campaignName: log.campaignName,
          templateName: log.templateName || "N/A",
          wabaNumber: channelDisplay,
          scheduledAt: log.scheduledAt || null,
          cost: 0,
          totalCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          error:
            log.errorDetails && log.errorDetails !== "N/A"
              ? log.errorDetails
              : "None",
          status: "COMPLETED",
        };
      }

      campaignMap[key].totalCount += 1;
      campaignMap[key].cost += Number(log.cost || 0);

      const st = (log.status || "").toUpperCase();
      if (st === "DELIVERED" || st === "READ") {
        campaignMap[key].deliveredCount += 1;
      } else if (st === "FAILED") {
        campaignMap[key].failedCount += 1;
        if (log.errorDetails && log.errorDetails !== "N/A") {
          campaignMap[key].error = log.errorDetails;
        }
      }
    });

    const formattedCampaigns = Object.values(campaignMap).map((c: any) => ({
      ...c,
      cost: c.cost.toFixed(3),
      status:
        c.failedCount === c.totalCount && c.totalCount > 0
          ? "FAILED"
          : c.deliveredCount > 0
          ? "DELIVERED"
          : "COMPLETED",
    }));

    const safeWabaAccounts = wabaAccounts.map((w) => ({
      id: w.id,
      wabaId: w.wabaId,
      phoneNumberId: w.phoneNumberId,
      displayPhone: w.displayPhone,
      displayName: w.displayName,
      userId: w.userId,
    }));

    return NextResponse.json(
      {
        success: true,
        metaAnalytics: metaAnalyticsSummary,
        campaigns: formattedCampaigns,
        wabaAccounts: safeWabaAccounts,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/agents/admin-campaigns error:", error);
    return NextResponse.json(
      { success: false, error: error.message, campaigns: [] },
      { status: 500 }
    );
  }
}