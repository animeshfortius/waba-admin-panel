import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "7DAYS";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const channelId = searchParams.get("channelId")?.trim() || "";
    const requestedUserId = searchParams.get("userId")?.trim() || "";

    const ownerWhere = getOwnerWhere(tenant);
    const scopedWhere: any = { ...ownerWhere };

    if (
      requestedUserId &&
      requestedUserId !== "ALL" &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null"
    ) {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(requestedUserId)
      ) {
        return NextResponse.json(
          { success: false, error: "Access denied for requested user" },
          { status: 403 }
        );
      }
      scopedWhere.userId = requestedUserId;
    }

    // 1. Fetch ONLY scoped WABA accounts for this user/reseller hierarchy
    const allAccounts = await prisma.wabaAccount.findMany({
      where: scopedWhere,
      orderBy: { createdAt: "asc" },
    });

    const isAllChannels = channelId === "ALL";
    let targetAccount: any = null;

    if (!isAllChannels && allAccounts.length > 0) {
      if (channelId) {
        targetAccount = allAccounts.find(
          (acc: any) =>
            acc.id === channelId ||
            acc.phoneNumberId === channelId ||
            acc.wabaId === channelId ||
            acc.displayPhone === channelId
        );
      }

      if (!targetAccount) {
        targetAccount =
          allAccounts.find((acc: any) => acc.isDefault) || allAccounts[0];
      }
    }

    const activeChannelId =
      allAccounts.length === 0
        ? ""
        : isAllChannels
        ? "ALL"
        : targetAccount?.phoneNumberId || targetAccount?.id || "";
    const activeDisplayPhone = targetAccount?.displayPhone || "";
    const activeWabaId = targetAccount?.wabaId || "";

    // 2. Live Meta Graph API v21.0 Account Health & Quality Sync
    let liveQuality =
      allAccounts.length === 0
        ? "N/A"
        : isAllChannels
        ? "GREEN"
        : targetAccount?.qualityRating || "N/A";
    let liveLimit =
      allAccounts.length === 0
        ? "No WABA Connected"
        : isAllChannels
        ? `All ${allAccounts.length} WABA Channels`
        : targetAccount?.messagingLimit || "1,000 / 24 hrs";
    let liveVerifiedName =
      allAccounts.length === 0
        ? "No WABA Onboarded Yet"
        : isAllChannels
        ? "All Onboarded WABA Accounts"
        : targetAccount?.displayName ||
          targetAccount?.displayPhone ||
          "WhatsApp Business";

    if (
      !isAllChannels &&
      targetAccount?.phoneNumberId &&
      targetAccount?.accessToken &&
      !String(targetAccount.accessToken).startsWith("mock_token")
    ) {
      const cleanPhoneId = String(targetAccount.phoneNumberId)
        .replace("PHONE_", "")
        .trim();
      try {
        const phoneRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${cleanPhoneId}?fields=quality_rating,verified_name,messaging_limit_tier&access_token=${encodeURIComponent(
            String(targetAccount.accessToken).trim()
          )}`,
          { cache: "no-store" }
        );
        const phoneJson = await phoneRes.json();
        if (phoneJson && !phoneJson.error) {
          if (phoneJson.quality_rating) liveQuality = phoneJson.quality_rating;
          if (phoneJson.verified_name) liveVerifiedName = phoneJson.verified_name;
          if (phoneJson.messaging_limit_tier) {
            const tierMap: Record<string, string> = {
              TIER_1K: "1,000 / 24 hrs",
              TIER_10K: "10,000 / 24 hrs",
              TIER_100K: "100,000 / 24 hrs",
              TIER_UNLIMITED: "Unlimited / 24 hrs",
            };
            liveLimit =
              tierMap[phoneJson.messaging_limit_tier] ||
              phoneJson.messaging_limit_tier;
          }
        }
      } catch (metaErr) {
        console.error("Meta Phone Health sync error:", metaErr);
      }
    }

    let qualityRating = "N/A";
    if (!liveQuality || liveQuality === "N/A" || liveQuality === "UNKNOWN") {
      qualityRating = "N/A";
    } else if (
      liveQuality.toUpperCase().includes("HIGH") ||
      liveQuality.toUpperCase().includes("GREEN")
    ) {
      qualityRating = "GREEN";
    } else if (
      liveQuality.toUpperCase().includes("MED") ||
      liveQuality.toUpperCase().includes("YELLOW")
    ) {
      qualityRating = "YELLOW";
    } else if (
      liveQuality.toUpperCase().includes("LOW") ||
      liveQuality.toUpperCase().includes("RED")
    ) {
      qualityRating = "RED";
    } else {
      qualityRating = liveQuality;
    }

    // 3. Date Range Calculation
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (startDateParam && endDateParam) {
      const parsedStart = new Date(startDateParam);
      const parsedEnd = new Date(endDateParam);
      if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
        startDate = parsedStart;
        startDate.setHours(0, 0, 0, 0);
        endDate = parsedEnd;
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (filter === "TODAY") {
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "7DAYS") {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "30DAYS") {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate = new Date(0);
    }

    const dateQuery =
      filter === "ALL" && !startDateParam
        ? {}
        : { createdAt: { gte: startDate, lte: endDate } };

    // 4. Scoped Templates & Campaign Logs
    const allTemplates = await prisma.whatsAppTemplate.findMany({
      where: scopedWhere,
      select: { name: true, category: true },
    });
    const templateCategoryMap: Record<string, string> = {};
    allTemplates.forEach((t) => {
      templateCategoryMap[t.name] = (t.category || "UTILITY").toUpperCase();
    });

    const campaignChannelIdentifiers = Array.from(
      new Set(
        [
          activeDisplayPhone,
          activeWabaId,
          activeChannelId,
          targetAccount?.id,
        ].filter(Boolean)
      )
    );

    const campaignWhere: any = {
      ...scopedWhere,
      ...dateQuery,
      ...(!isAllChannels && campaignChannelIdentifiers.length > 0
        ? { channel: { in: campaignChannelIdentifiers } }
        : {}),
    };

    const campaignLogs =
      allAccounts.length === 0 && !tenant.isSuperAdmin
        ? []
        : await prisma.campaignLog.findMany({
            where: campaignWhere,
            orderBy: { createdAt: "desc" },
          });

    const chatSessionFilter: any = {
      ...scopedWhere,
      ...(!isAllChannels && campaignChannelIdentifiers.length > 0
        ? { channel: { in: campaignChannelIdentifiers } }
        : {}),
    };

    const chatMessages =
      allAccounts.length === 0 && !tenant.isSuperAdmin
        ? []
        : await prisma.chatMessage.findMany({
            where: {
              senderType: "AGENT",
              ...dateQuery,
              chatSession: chatSessionFilter,
            },
            include: { chatSession: true },
            orderBy: { createdAt: "desc" },
            take: 250,
          });

    // 5. Aggregate Metrics
    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalUnread = 0;
    let totalFailed = 0;
    let marketingTotal = 0;
    let marketingDelivered = 0;
    let utilityTotal = 0;
    let utilityDelivered = 0;
    let authTotal = 0;
    let authDelivered = 0;

    campaignLogs.forEach((log) => {
      const st = (log.status || "").toUpperCase();
      const cat = templateCategoryMap[log.templateName] || "UTILITY";

      if (st === "FAILED") {
        totalFailed++;
      } else {
        totalSent++;
        if (st === "READ") {
          totalDelivered++;
          totalRead++;
        } else if (st === "DELIVERED") {
          totalDelivered++;
          totalUnread++;
        }
      }

      if (cat === "MARKETING") {
        if (st !== "FAILED") marketingTotal++;
        if (st === "DELIVERED" || st === "READ") marketingDelivered++;
      } else if (cat === "AUTHENTICATION") {
        if (st !== "FAILED") authTotal++;
        if (st === "DELIVERED" || st === "READ") authDelivered++;
      } else {
        if (st !== "FAILED") utilityTotal++;
        if (st === "DELIVERED" || st === "READ") utilityDelivered++;
      }
    });

    chatMessages.forEach((m: any) => {
      const st = (m.status || "").toUpperCase();
      if (st === "FAILED") {
        totalFailed++;
      } else {
        totalSent++;
        if (st === "READ") {
          totalDelivered++;
          totalRead++;
        } else if (st === "DELIVERED") {
          totalDelivered++;
          totalUnread++;
        }
      }
      if (m.messageType === "template") {
        marketingTotal++;
        if (st === "DELIVERED" || st === "READ") marketingDelivered++;
      } else {
        utilityTotal++;
        if (st === "DELIVERED" || st === "READ") utilityDelivered++;
      }
    });

    // 6. Date-wise Graph Trends
    const trendData = [];
    if (startDateParam && endDateParam && startDate.getTime() > 0) {
      const cursor = new Date(startDate);
      cursor.setHours(0, 0, 0, 0);
      const lastDay = new Date(endDate);
      lastDay.setHours(0, 0, 0, 0);

      let safetyCounter = 0;
      while (cursor.getTime() <= lastDay.getTime() && safetyCounter < 90) {
        const dStart = new Date(cursor);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(cursor);
        dEnd.setHours(23, 59, 59, 999);

        const dayLabel = dStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const dayCampLogs = campaignLogs.filter((l) => {
          const t = new Date(l.createdAt).getTime();
          return t >= dStart.getTime() && t <= dEnd.getTime();
        });

        const dayChatMsgs = chatMessages.filter((m: any) => {
          const t = new Date(m.createdAt).getTime();
          return t >= dStart.getTime() && t <= dEnd.getTime();
        });

        trendData.push({
          day: dayLabel,
          sent:
            dayCampLogs.filter((l) => l.status?.toUpperCase() !== "FAILED")
              .length +
            dayChatMsgs.filter((m: any) => m.status?.toUpperCase() !== "FAILED")
              .length,
          del:
            dayCampLogs.filter((l) =>
              ["DELIVERED", "READ"].includes(l.status?.toUpperCase())
            ).length +
            dayChatMsgs.filter((m: any) =>
              ["DELIVERED", "READ"].includes(m.status?.toUpperCase())
            ).length,
          read:
            dayCampLogs.filter((l) => l.status?.toUpperCase() === "READ")
              .length +
            dayChatMsgs.filter((m: any) => m.status?.toUpperCase() === "READ")
              .length,
        });

        cursor.setDate(cursor.getDate() + 1);
        safetyCounter++;
      }
    } else {
      const daysCount = filter === "TODAY" ? 1 : filter === "30DAYS" ? 30 : 7;
      for (let i = daysCount - 1; i >= 0; i--) {
        const dStart = new Date();
        dStart.setDate(now.getDate() - i);
        dStart.setHours(0, 0, 0, 0);

        const dEnd = new Date(dStart);
        dEnd.setHours(23, 59, 59, 999);

        const dayLabel = dStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const dayCampLogs = campaignLogs.filter((l) => {
          const t = new Date(l.createdAt).getTime();
          return t >= dStart.getTime() && t <= dEnd.getTime();
        });

        const dayChatMsgs = chatMessages.filter((m: any) => {
          const t = new Date(m.createdAt).getTime();
          return t >= dStart.getTime() && t <= dEnd.getTime();
        });

        const daySent =
          dayCampLogs.filter((l) => l.status?.toUpperCase() !== "FAILED")
            .length +
          dayChatMsgs.filter((m: any) => m.status?.toUpperCase() !== "FAILED")
            .length;

        const dayDelivered =
          dayCampLogs.filter((l) =>
            ["DELIVERED", "READ"].includes(l.status?.toUpperCase())
          ).length +
          dayChatMsgs.filter((m: any) =>
            ["DELIVERED", "READ"].includes(m.status?.toUpperCase())
          ).length;

        const dayRead =
          dayCampLogs.filter((l) => l.status?.toUpperCase() === "READ").length +
          dayChatMsgs.filter((m: any) => m.status?.toUpperCase() === "READ")
            .length;

        trendData.push({
          day: dayLabel,
          sent: daySent,
          del: dayDelivered,
          read: dayRead,
        });
      }
    }

    // 7. Hourly Peak Activity & Top Templates
    const hoursMap: Record<string, number> = {
      "09 AM": 0,
      "11 AM": 0,
      "01 PM": 0,
      "03 PM": 0,
      "05 PM": 0,
      "07 PM": 0,
      "09 PM": 0,
    };
    const templateCounts: Record<string, { sent: number; read: number }> = {};

    campaignLogs.forEach((l) => {
      const hr = new Date(l.createdAt).getHours();
      if (hr < 10) hoursMap["09 AM"]++;
      else if (hr < 12) hoursMap["11 AM"]++;
      else if (hr < 14) hoursMap["01 PM"]++;
      else if (hr < 16) hoursMap["03 PM"]++;
      else if (hr < 18) hoursMap["05 PM"]++;
      else if (hr < 20) hoursMap["07 PM"]++;
      else hoursMap["09 PM"]++;

      const tName = l.templateName || "Campaign Template";
      if (!templateCounts[tName]) templateCounts[tName] = { sent: 0, read: 0 };
      if (l.status?.toUpperCase() !== "FAILED") templateCounts[tName].sent++;
      if (l.status?.toUpperCase() === "READ") templateCounts[tName].read++;
    });

    const hourlyActivity = Object.entries(hoursMap).map(([hour, count]) => ({
      hour,
      count,
    }));

    const topTemplates = Object.entries(templateCounts)
      .map(([name, val]) => ({
        name,
        sent: val.sent,
        readRate: val.sent > 0 ? Math.round((val.read / val.sent) * 100) : 0,
      }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 3);

    // 8. Live Webhook Audit Logs
    const recentWebhooks = campaignLogs.slice(0, 6).map((l) => ({
      id: l.id,
      phone: l.recipient || "Customer",
      status: l.status || "SENT",
      type: l.templateName || "template",
      time: new Date(l.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    // Format ONLY scoped accounts (add "ALL" only if > 1 WABA)
    const formattedAccounts =
      allAccounts.length === 0
        ? []
        : [
            ...(allAccounts.length > 1
              ? [
                  {
                    id: "ALL",
                    phoneNumberId: "ALL",
                    displayPhone: "All Accounts",
                    displayName: `Combined (${allAccounts.length} WABAs)`,
                    qualityRating: "GREEN",
                    messagingLimit: "All Channels",
                    isDefault: false,
                  },
                ]
              : []),
            ...allAccounts.map((acc: any) => ({
              id: acc.id,
              phoneNumberId: acc.phoneNumberId,
              displayPhone: acc.displayPhone,
              displayName: acc.displayName,
              qualityRating: acc.qualityRating,
              messagingLimit: acc.messagingLimit,
              isDefault: acc.isDefault || false,
            })),
          ];

    return NextResponse.json(
      {
        success: true,
        selectedChannelId: activeChannelId,
        accounts: formattedAccounts,
        stats: {
          totalSent,
          totalDelivered,
          totalRead,
          totalUnread,
          totalFailed,
          marketingTotal,
          marketingDelivered,
          utilityTotal,
          utilityDelivered,
          authTotal,
          authDelivered,
          qualityRating,
          messagingLimit: liveLimit,
          verifiedName: liveVerifiedName,
          trendData,
          hourlyActivity,
          topTemplates,
          recentWebhooks,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}