import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get exact IST (Indian Standard Time) format
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "admin";
    const tab = searchParams.get("tab") || "campaign";

    let wabaAccounts = await prisma.wabaAccount.findMany({
      select: { wabaId: true, displayPhone: true, displayName: true, userId: true }
    });

    const whereClause = (userId === "admin" || userId === "emergency_admin_id") ? {} : { userId };

    const messageLogs = await prisma.campaignLog.findMany({
      where: whereClause,
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

    // Map logs with accurate IST Date & Time
    const deliveryLogs = messageLogs.map((log) => {
      const sentStr = formatIST(log.sentAt);
      const deliveredStr = log.deliveredAt ? formatIST(log.deliveredAt) : "Pending";
      const readStr = log.readAt ? formatIST(log.readAt) : "N/A";

      return {
        id: log.id,
        date: sentStr,
        channel: log.channel,
        number: log.recipient,
        status: log.status,
        messageId: log.messageId || "N/A",
        acknowledgement: `Sent On: ${sentStr} | Delivery On: ${deliveredStr} | Read On: ${readStr}`,
        interfaceType: "Web",
        templateType: "Utility",
        templateName: log.templateName,
        bodyText: `Campaign: ${log.campaignName}`,
        cost: log.cost.toFixed(3),
        errorDetails: log.errorDetails || "N/A"
      };
    });

    const campaignMap: { [key: string]: any } = {};
    messageLogs.forEach((log) => {
      if (!campaignMap[log.campaignName]) {
        campaignMap[log.campaignName] = {
          id: log.id,
          date: formatIST(log.createdAt),
          campaignInfo: log.campaignName,
          templateInfo: log.templateName,
          channel: log.channel,
          cost: 0,
          totalCount: 0,
          status: "COMPLETED",
          error: log.errorDetails
        };
      }
      campaignMap[log.campaignName].totalCount += 1;
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