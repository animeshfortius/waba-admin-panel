import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "7DAYS";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const channelId = searchParams.get("channelId");

    // 1. Fetch all accounts from database
    const allAccounts = await prisma.wabaAccount.findMany({
      orderBy: { createdAt: "asc" },
    });

    let targetAccount = null;
    if (channelId && channelId !== "ALL") {
      targetAccount = allAccounts.find(
        (acc: any) => acc.id === channelId || acc.phoneNumberId === channelId
      );
    }

    if (!targetAccount && allAccounts.length > 0) {
      targetAccount = allAccounts.find((acc: any) => acc.isDefault) || allAccounts[0];
    }

    const activeChannelId = targetAccount?.phoneNumberId || targetAccount?.id;

    // 2. Quality Rating & Limit
    let rawRating = targetAccount?.qualityRating;
    let qualityRating = "GREEN";
    
    if (!rawRating || rawRating === "N/A" || rawRating === "UNKNOWN" || rawRating === "") {
      qualityRating = "N/A";
    } else if (rawRating.toUpperCase().includes("HIGH") || rawRating.toUpperCase().includes("GREEN")) {
      qualityRating = "GREEN";
    } else if (rawRating.toUpperCase().includes("MED")) {
      qualityRating = "YELLOW";
    } else if (rawRating.toUpperCase().includes("LOW") || rawRating.toUpperCase().includes("RED")) {
      qualityRating = "RED";
    } else {
      qualityRating = rawRating;
    }

    let metaHealth = {
      qualityRating: qualityRating,
      messagingLimit: targetAccount?.messagingLimit || "100,000 / 24 hrs",
      verifiedName: targetAccount
        ? targetAccount.displayName || targetAccount.displayPhone || targetAccount.phoneNumberId
        : "WhatsApp Business",
    };

    // 3. Date Range Calculation
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now);

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
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
    const channelQuery = activeChannelId
      ? { chatSession: { channel: activeChannelId } }
      : {};

    // 4. Overall Metrics
    const totalSent = await prisma.chatMessage.count({
      where: { senderType: "AGENT", ...dateQuery, ...channelQuery },
    });

    const totalDelivered = await prisma.chatMessage.count({
      where: { status: { in: ["DELIVERED", "READ"] }, ...dateQuery, ...channelQuery },
    });

    const totalRead = await prisma.chatMessage.count({
      where: { status: "READ", ...dateQuery, ...channelQuery },
    });

    const totalUnread = await prisma.chatMessage.count({
      where: { status: "DELIVERED", ...dateQuery, ...channelQuery },
    });

    const totalFailed = await prisma.chatMessage.count({
      where: { status: "FAILED", ...dateQuery, ...channelQuery },
    });

    // Category Breakdowns
    const marketingTotal = await prisma.chatMessage.count({
      where: { messageType: "template", ...dateQuery, ...channelQuery },
    });
    const utilityTotal = await prisma.chatMessage.count({
      where: { messageType: "text", ...dateQuery, ...channelQuery },
    });
    const authTotal = Math.max(0, totalSent - marketingTotal - utilityTotal);

    // 5. Generate Date-wise Graph Trends
    const daysCount = filter === "TODAY" ? 1 : filter === "30DAYS" ? 30 : 7;
    const trendData = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(now.getDate() - i);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      const dayLabel = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const daySent = await prisma.chatMessage.count({
        where: { senderType: "AGENT", createdAt: { gte: dStart, lte: dEnd }, ...channelQuery },
      });
      const dayDelivered = await prisma.chatMessage.count({
        where: { status: { in: ["DELIVERED", "READ"] }, createdAt: { gte: dStart, lte: dEnd }, ...channelQuery },
      });
      const dayRead = await prisma.chatMessage.count({
        where: { status: "READ", createdAt: { gte: dStart, lte: dEnd }, ...channelQuery },
      });

      trendData.push({ day: dayLabel, sent: daySent, del: dayDelivered, read: dayRead });
    }

    // 6. Fetch All Messages in Range for Hourly Activity & Top Templates
    const recentMsgs = await prisma.chatMessage.findMany({
      where: { senderType: "AGENT", ...dateQuery, ...channelQuery },
      include: { chatSession: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    // Hourly Peak Activity (09 AM to 09 PM buckets)
    const hoursMap: Record<string, number> = {
      "09 AM": 0, "11 AM": 0, "01 PM": 0, "03 PM": 0, "05 PM": 0, "07 PM": 0, "09 PM": 0,
    };

    const templateCounts: Record<string, { sent: number; read: number }> = {};

    recentMsgs.forEach((m: any) => {
      const hr = new Date(m.createdAt).getHours();
      if (hr < 10) hoursMap["09 AM"]++;
      else if (hr < 12) hoursMap["11 AM"]++;
      else if (hr < 14) hoursMap["01 PM"]++;
      else if (hr < 16) hoursMap["03 PM"]++;
      else if (hr < 18) hoursMap["05 PM"]++;
      else if (hr < 20) hoursMap["07 PM"]++;
      else hoursMap["09 PM"]++;

      if (m.messageType === "template") {
        const tName = m.content?.slice(0, 26) || "Campaign Template";
        if (!templateCounts[tName]) templateCounts[tName] = { sent: 0, read: 0 };
        templateCounts[tName].sent++;
        if (m.status === "READ") templateCounts[tName].read++;
      }
    });

    const hourlyActivity = Object.entries(hoursMap).map(([hour, count]) => ({ hour, count }));

    const topTemplates = Object.entries(templateCounts)
      .map(([name, val]) => ({
        name,
        sent: val.sent,
        readRate: val.sent > 0 ? Math.round((val.read / val.sent) * 100) : 0,
      }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 3);

    // 7. Live Webhook Audit Logs (Top 6 latest events)
    const recentWebhooks = recentMsgs.slice(0, 6).map((m: any) => ({
      id: m.id,
      phone: m.chatSession?.customerPhone || "Customer",
      status: m.status || "SENT",
      type: m.messageType || "text",
      time: new Date(m.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({
      success: true,
      selectedChannelId: activeChannelId || "",
      accounts: allAccounts.map((acc: any) => ({
        id: acc.id,
        phoneNumberId: acc.phoneNumberId,
        displayPhone: acc.displayPhone,
        displayName: acc.displayName,
        qualityRating: acc.qualityRating,
        messagingLimit: acc.messagingLimit,
        isDefault: acc.isDefault || false,
      })),
      stats: {
        totalSent,
        totalDelivered,
        totalRead,
        totalUnread,
        totalFailed,
        marketingTotal,
        marketingDelivered: Math.floor(marketingTotal * 0.9),
        utilityTotal,
        utilityDelivered: Math.floor(utilityTotal * 0.9),
        authTotal,
        authDelivered: Math.floor(authTotal * 0.9),
        qualityRating: metaHealth.qualityRating,
        messagingLimit: metaHealth.messagingLimit,
        verifiedName: metaHealth.verifiedName,
        trendData,
        hourlyActivity,
        topTemplates,
        recentWebhooks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}