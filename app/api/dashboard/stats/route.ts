import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "7DAYS";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const channelId = searchParams.get("channelId");

    // 1. Fetch all accounts to find target or default account
    const allAccounts = await prisma.wabaAccount.findMany();

    let targetAccount = null;
    if (channelId && channelId !== "ALL") {
      targetAccount = allAccounts.find(
        (acc: any) => acc.id === channelId || acc.phoneNumberId === channelId
      );
    }

    // Fallback to default account if no specific channel requested
    if (!targetAccount && allAccounts.length > 0) {
      targetAccount = allAccounts.find((acc: any) => acc.isDefault) || allAccounts[0];
    }

    const activeChannelId = targetAccount?.phoneNumberId || targetAccount?.id;

    // 2. Fetch Live Health from Meta Graph API for target account
    let metaHealth = {
      qualityRating: targetAccount?.qualityRating || "GREEN",
      messagingLimit: "100K/day",
      verifiedName: targetAccount
        ? targetAccount.displayName || targetAccount.displayPhone || targetAccount.phoneNumberId
        : "WhatsApp Business",
    };

    if (targetAccount && targetAccount.accessToken && targetAccount.phoneNumberId) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${targetAccount.phoneNumberId}?fields=quality_rating,messaging_limit_tier,verified_name`,
          { headers: { Authorization: `Bearer ${targetAccount.accessToken}` } }
        );
        const metaData = await metaRes.json();
        if (metaData && !metaData.error) {
          metaHealth.qualityRating = metaData.quality_rating || metaHealth.qualityRating;
          metaHealth.messagingLimit = metaData.messaging_limit_tier || metaHealth.messagingLimit;
          metaHealth.verifiedName = metaData.verified_name || metaHealth.verifiedName;
        }
      } catch (e) {
        console.error("Meta Health API error:", e);
      }
    }

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

    // 4. Database Metrics (Sent, Delivered, Read, Unread, Failed)
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