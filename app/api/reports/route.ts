import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
    headers();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "admin";
    const statusFilter = searchParams.get("status");
    const dateRange = searchParams.get("dateRange") || "All";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let wabaAccounts = await prisma.wabaAccount.findMany({
      select: { wabaId: true, displayPhone: true, displayName: true, userId: true },
    });

    // Build dynamic Prisma where clause EXCLUDING Direct Chats
    const whereClause: any = {
      campaignName: {
        not: "Direct_Chat_Campaign",
      },
    };

    if (statusFilter && statusFilter !== "All" && statusFilter !== "All Status") {
      whereClause.status = statusFilter;
    }

    // Date Range filter logic implementation including Custom Dates
    if (dateRange === "Today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfDay };
    } else if (dateRange === "Yesterday") {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date();
      endOfYesterday.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfYesterday, lt: endOfYesterday };
    } else if (dateRange === "Last 7 Days") {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      whereClause.createdAt = { gte: last7Days };
    } else if (dateRange === "Last 30 Days") {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      whereClause.createdAt = { gte: last30Days };
    } else if (dateRange === "Custom" && startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    }

    const messageLogs = await prisma.campaignLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (messageLogs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          userId,
          campaigns: [],
          deliveries: [],
          schedules: [],
          apis: [],
          wabaAccounts,
          stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, scheduled: 0 },
        },
        {
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
        }
      );
    }

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
        cost: typeof log.cost === "number" ? log.cost.toFixed(3) : log.cost,
        errorDetails: log.errorDetails || "N/A",
        createdAt: log.createdAt,
      };
    });

    const scheduledLogs = messageLogs.filter(
      (log) => String(log.status || "").toUpperCase() === "SCHEDULED"
    );

    const scheduleMap: { [key: string]: any } = {};
    scheduledLogs.forEach((log) => {
      const key = `${log.campaignName}__${log.channel}`;
      if (!scheduleMap[key]) {
        scheduleMap[key] = {
          id: log.id,
          campaignInfo: log.campaignName,
          templateName: log.templateName,
          channel: log.channel,
          status: log.status,
          totalCount: 0,
          cost: 0,
          scheduledAt: log.sentAt ? formatIST(log.sentAt) : formatIST(log.createdAt),
          date: log.sentAt ? formatIST(log.sentAt) : formatIST(log.createdAt),
          errorDetails: log.errorDetails || "N/A",
          createdAt: log.createdAt,
        };
      }
      scheduleMap[key].totalCount += 1;
      scheduleMap[key].cost += Number(log.cost || 0);
    });

    const scheduleReports = Object.values(scheduleMap).map((s) => ({
      ...s,
      cost: s.cost.toFixed(3),
    }));

    const apiLogs = messageLogs.filter((log) =>
      String(log.campaignName || "").startsWith("API_")
    );

    const apiReports = apiLogs.map((log) => ({
      id: log.id,
      campaignInfo: log.campaignName,
      templateName: log.templateName,
      channel: log.channel,
      number: log.recipient,
      status: log.status,
      messageId: log.messageId || "N/A",
      cost: typeof log.cost === "number" ? log.cost.toFixed(3) : log.cost,
      errorDetails: log.errorDetails || "N/A",
      date: formatIST(log.sentAt || log.createdAt),
      createdAt: log.createdAt,
    }));

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
          status: String(log.status || "").toUpperCase() === "SCHEDULED" ? "SCHEDULED" : "COMPLETED",
          error: log.errorDetails,
          createdAt: log.createdAt,
        };
      }
      campaignMap[log.campaignName].totalCount += 1;
      campaignMap[log.campaignName].cost += Number(log.cost || 0);
    });

    const campaignReports = Object.values(campaignMap).map((c) => ({
      ...c,
      cost: c.cost.toFixed(3),
    }));

    return NextResponse.json(
      {
        success: true,
        userId,
        campaigns: campaignReports,
        deliveries: deliveryLogs,
        schedules: scheduleReports,
        apis: apiReports,
        wabaAccounts,
        stats: {
          total: messageLogs.length,
          sent: messageLogs.filter((l) => l.status?.toUpperCase() === "SENT").length,
          delivered: messageLogs.filter((l) => l.status?.toUpperCase() === "DELIVERED").length,
          read: messageLogs.filter((l) => l.status?.toUpperCase() === "READ").length,
          failed: messageLogs.filter((l) => l.status?.toUpperCase() === "FAILED").length,
          scheduled: scheduledLogs.length,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
      }
    );
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        campaigns: [],
        deliveries: [],
        schedules: [],
        apis: [],
        wabaAccounts: [],
      },
      { status: 500 }
    );
  }
}