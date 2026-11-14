import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tab = searchParams.get("tab") || "campaign";

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID missing" }, { status: 400 });
    }

    let wabaAccounts = await prisma.wabaAccount.findMany({
      select: { wabaId: true, displayPhone: true, displayName: true, userId: true }
    });

    if (userId !== "admin" && userId !== "emergency_admin_id") {
      const filtered = wabaAccounts.filter(acc => acc.userId === userId);
      if (filtered.length > 0) wabaAccounts = filtered;
    }

    // 🟢 Fetch real campaign message logs from database
    const messageLogs = await prisma.campaignLog.findMany({
      where: userId === "admin" ? {} : { userId },
      orderBy: { createdAt: "desc" },
    });

    if (messageLogs.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        wabaAccounts,
        stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
      });
    }

    // Map logs for Delivery Report tab
    const deliveryLogs = messageLogs.map((log) => ({
      id: log.id,
      date: new Date(log.sentAt).toLocaleString(),
      channel: log.channel,
      number: log.recipient,
      status: log.status,
      messageId: log.messageId || "N/A",
      acknowledgement: `Sent On: ${new Date(log.sentAt).toLocaleTimeString()} | Delivery On: ${log.deliveredAt ? new Date(log.deliveredAt).toLocaleTimeString() : "Pending"} | Read On: ${log.readAt ? new Date(log.readAt).toLocaleTimeString() : "N/A"}`,
      interfaceType: "Web",
      templateType: "Utility",
      templateName: log.templateName,
      bodyText: `Campaign: ${log.campaignName}`,
      cost: log.cost.toFixed(3),
      errorDetails: log.errorDetails || "N/A"
    }));

    // Group logs by campaign name for Campaign Report tab with accurate total counts
    const campaignMap: { [key: string]: any } = {};
    messageLogs.forEach((log) => {
      if (!campaignMap[log.campaignName]) {
        campaignMap[log.campaignName] = {
          id: log.id,
          date: new Date(log.createdAt).toLocaleString(),
          campaignInfo: log.campaignName,
          templateInfo: log.templateName,
          channel: log.channel,
          cost: 0,
          totalCount: 0,
          status: "COMPLETED",
          error: log.errorDetails
        };
      }
      campaignMap[log.campaignName].totalCount += 1; // 🟢 Accurately counts all numbers in this campaign
      campaignMap[log.campaignName].cost += log.cost;
    });

    const campaignReports = Object.values(campaignMap);

    return NextResponse.json({
      success: true,
      data: tab === "delivery" ? deliveryLogs : campaignReports,
      wabaAccounts,
      stats: {
        total: messageLogs.length,
        sent: messageLogs.filter(l => l.status === "SENT").length,
        delivered: messageLogs.filter(l => l.status === "DELIVERED").length,
        read: messageLogs.filter(l => l.status === "READ").length,
        failed: messageLogs.filter(l => l.status === "FAILED").length,
      }
    });
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ success: false, error: error.message, data: [], wabaAccounts: [] }, { status: 500 });
  }
}