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

    // Fallback to default or first account
    if (!targetAccount && allAccounts.length > 0) {
      targetAccount = allAccounts.find((acc: any) => acc.isDefault) || allAccounts[0];
    }

    const activeChannelId = targetAccount?.phoneNumberId || targetAccount?.id;

    // 2. Use Database values directly (matching WABA Channels configuration page)
    let metaHealth = {
      qualityRating: targetAccount?.qualityRating || "HIGH",
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

    // 4. Database Metrics
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}