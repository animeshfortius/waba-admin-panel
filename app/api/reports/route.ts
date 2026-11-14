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
        campaigns: [],
        deliveries: [],
        wabaAccounts,
        stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
      });
    }

    // Map delivery logs
    const deliveryLogs = messageLogs.map((log) => {
      const sentStr = formatIST(log.sentAt);
      const deliveredStr = log.deliveredAt ? formatIST(log.deliveredAt) : "Pending";
      const readStr = log.readAt ? formatIST(log.readAt) : "N/A";

      return {
        id: log.id,
        date: sentStr,
        campaignName: log.campaignName,
        channel: log.channel,
        number: log.recipient,
        status: log.status,
        messageId: log.messageId || "N/A",
        acknowledgement: `Sent On: ${sentStr} | Delivery On: ${deliveredStr} | Read On: ${readStr}`,
        interfaceType: "Web",
        templateType: "Utility",
        templateName: log.templateName,
        bodyText: `Campaign: ${log.campaignName}`,
        cost: typeof log.cost === 'number' ? log.cost.toFixed(3) : log.cost,
        errorDetails: log.errorDetails || "N/A"
      };
    });

    // Map campaign reports
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
      campaignMap[log.campaignName].cost += Number(log.cost || 0);
    });

    const campaignReports = Object.values(campaignMap).map(c => ({
      ...c,
      cost: c.cost.toFixed(3)
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignReports,
      deliveries: deliveryLogs,
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
    return NextResponse.json({ success: false, error: error.message, campaigns: [], deliveries: [], wabaAccounts: [] }, { status: 500 });
  }
}