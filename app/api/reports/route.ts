import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

function formatIST(dateInput: Date | string | null) {
  if (!dateInput) return "N/A";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "N/A";
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

function parseMetaError(rawError: unknown, status?: string | null) {
  const isFailed = String(status || "").toUpperCase() === "FAILED";
  if (!isFailed && !rawError) {
    return { errorCode: "", errorReason: "", errorDisplay: "N/A" };
  }

  let parsedObj: any = null;
  let rawStr = "";

  if (typeof rawError === "string") {
    rawStr = rawError.trim();
    if (rawStr.startsWith("{") || rawStr.startsWith("[")) {
      try {
        parsedObj = JSON.parse(rawStr);
      } catch {
        parsedObj = null;
      }
    }
  } else if (typeof rawError === "object" && rawError !== null) {
    parsedObj = rawError;
    try {
      rawStr = JSON.stringify(rawError);
    } catch {
      rawStr = "";
    }
  }

  const metaErr = parsedObj?.error || parsedObj || null;
  let code =
    metaErr?.code ||
    metaErr?.error_code ||
    parsedObj?.errorCode ||
    "";

  let reason =
    metaErr?.message ||
    metaErr?.error_data?.details ||
    metaErr?.title ||
    parsedObj?.errorReason ||
    rawStr ||
    "";

  if (!code && rawStr) {
    const codeMatch = rawStr.match(/\b(13\d{3}|10\d{2}|200|368|80007)\b/);
    if (codeMatch) {
      code = codeMatch[1];
    }
  }

  const cleanCode = String(code || "").trim();
  const cleanReason =
    String(reason || "").trim() || (isFailed ? "Meta delivery failed" : "N/A");

  const errorDisplay =
    cleanCode && !cleanReason.includes(cleanCode)
      ? `[Error ${cleanCode}] ${cleanReason}`
      : cleanReason;

  return {
    errorCode: cleanCode,
    errorReason: cleanReason,
    errorDisplay,
  };
}

function classifyLog(log: any) {
  const campaignName = String(log.campaignName || "");
  const statusUpper = String(log.status || "").toUpperCase();
  const templateUpper = String(log.templateName || "").toUpperCase();
  const errStr = String(log.errorDetails || "").toUpperCase();
  const rawObj = log as any;

  const isApi =
    Boolean(rawObj.isApi) ||
    String(rawObj.source || rawObj.channelType || "").toUpperCase() === "API" ||
    campaignName.toUpperCase().startsWith("API_");

  const isScheduled =
    Boolean(rawObj.isScheduled) ||
    Boolean(rawObj.scheduledAt) ||
    String(rawObj.deliveryType || rawObj.mode || "").toUpperCase() === "SCHEDULED" ||
    statusUpper === "SCHEDULED" ||
    campaignName.toUpperCase().startsWith("SCHED_");

  const isFallback =
    Boolean(rawObj.isFallback) ||
    String(rawObj.category || rawObj.messageType || rawObj.type || "").toUpperCase() === "FALLBACK" ||
    campaignName.toUpperCase().includes("FALLBACK") ||
    errStr.includes("FALLBACK");

  const isService =
    !isFallback &&
    (String(rawObj.category || rawObj.messageType || rawObj.type || "").toUpperCase() === "SERVICE" ||
      String(rawObj.messageType || rawObj.type || "").toUpperCase() === "INBOUND" ||
      campaignName.toUpperCase().includes("SERVICE") ||
      templateUpper.includes("SERVICE"));

  return { isApi, isScheduled, isFallback, isService };
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

    const wabaAccounts = await prisma.wabaAccount.findMany({
      select: { wabaId: true, displayPhone: true, displayName: true, userId: true },
    });

    const whereClause: any = {
      campaignName: {
        not: "Direct_Chat_Campaign",
      },
    };

    if (statusFilter && statusFilter !== "All" && statusFilter !== "All Status") {
      whereClause.status = statusFilter;
    }

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

    const mapDetailedRow = (
      log: any,
      interfaceType = "Web",
      templateType = "Utility"
    ) => {
      const sentStr = formatIST(log.sentAt || log.createdAt);
      const deliveredStr = log.deliveredAt ? formatIST(log.deliveredAt) : "Pending";
      const readStr = log.readAt ? formatIST(log.readAt) : "N/A";
      const errInfo = parseMetaError(log.errorDetails, log.status);
      const isFailed = String(log.status || "").toUpperCase() === "FAILED";

      const ackBase = `Sent On: ${sentStr} | Delivery On: ${deliveredStr} | Read On: ${readStr}`;
      const acknowledgement = isFailed
        ? `${ackBase} | Failed: ${errInfo.errorDisplay}`
        : ackBase;

      return {
        id: log.id,
        date: sentStr,
        campaignName: log.campaignName,
        campaignInfo: log.campaignName,
        channel: log.channel,
        number: log.recipient,
        status: log.status,
        messageId: log.messageId || "N/A",
        acknowledgement,
        interfaceType,
        templateType,
        templateName: log.templateName,
        bodyText: `Campaign: ${log.campaignName}`,
        cost:
          typeof log.cost === "number"
            ? log.cost.toFixed(3)
            : String(log.cost ?? "0.000"),
        errorCode: errInfo.errorCode,
        errorReason: errInfo.errorReason,
        errorDetails: errInfo.errorDisplay,
        createdAt: log.createdAt,
      };
    };

    const normalDeliveryRaw: any[] = [];
    const scheduledRaw: any[] = [];
    const apiRaw: any[] = [];
    const serviceRaw: any[] = [];
    const fallbackRaw: any[] = [];
    const campaignRaw: any[] = [];

    for (const log of messageLogs) {
      const cls = classifyLog(log);

      if (cls.isFallback) {
        fallbackRaw.push(log);
      } else if (cls.isService) {
        serviceRaw.push(log);
      }

      if (cls.isApi) {
        apiRaw.push(log);
      }

      if (cls.isScheduled) {
        scheduledRaw.push(log);
      }

      if (!cls.isScheduled && !cls.isApi && !cls.isService && !cls.isFallback) {
        normalDeliveryRaw.push(log);
      }

      if (!cls.isApi && !cls.isService && !cls.isFallback) {
        campaignRaw.push(log);
      }
    }

    const deliveryLogs = normalDeliveryRaw.map((l) =>
      mapDetailedRow(l, "Web", "Utility")
    );
    const scheduleDeliveries = scheduledRaw.map((l) =>
      mapDetailedRow(l, "Scheduler", "Utility")
    );
    const apiLogs = apiRaw.map((l) => mapDetailedRow(l, "API", "Utility"));
    const serviceLogs = serviceRaw.map((l) =>
      mapDetailedRow(l, "Meta Service (24h)", "Service")
    );
    const fallbackLogs = fallbackRaw.map((l) =>
      mapDetailedRow(l, "Fallback", "Fallback")
    );

    const scheduleMap: Record<string, any> = {};
    scheduledRaw.forEach((log) => {
      const key = `${log.campaignName}__${log.channel}`;
      const errInfo = parseMetaError(log.errorDetails, log.status);
      if (!scheduleMap[key]) {
        const scheduleTimeStr = log.sentAt
          ? formatIST(log.sentAt)
          : formatIST(log.createdAt);
        scheduleMap[key] = {
          id: log.id,
          campaignInfo: log.campaignName,
          templateName: log.templateName,
          channel: log.channel,
          status: log.status,
          totalCount: 0,
          cost: 0,
          scheduledAt: scheduleTimeStr,
          date: scheduleTimeStr,
          errorCode: errInfo.errorCode,
          errorReason: errInfo.errorReason,
          errorDetails: errInfo.errorDisplay,
          createdAt: log.sentAt || log.createdAt,
        };
      }
      scheduleMap[key].totalCount += 1;
      scheduleMap[key].cost += Number(log.cost || 0);
    });

    const scheduleReports = Object.values(scheduleMap).map((s) => ({
      ...s,
      cost: Number(s.cost || 0).toFixed(3),
    }));

    const campaignMap: Record<string, any> = {};
    campaignRaw.forEach((log) => {
      const errInfo = parseMetaError(log.errorDetails, log.status);
      if (!campaignMap[log.campaignName]) {
        campaignMap[log.campaignName] = {
          id: log.id,
          date: formatIST(log.createdAt),
          campaignInfo: log.campaignName,
          templateInfo: log.templateName,
          channel: log.channel,
          cost: 0,
          totalCount: 0,
          status:
            String(log.status || "").toUpperCase() === "SCHEDULED"
              ? "SCHEDULED"
              : "COMPLETED",
          errorCode: errInfo.errorCode,
          errorReason: errInfo.errorReason,
          error: errInfo.errorDisplay,
          createdAt: log.createdAt,
        };
      }
      campaignMap[log.campaignName].totalCount += 1;
      campaignMap[log.campaignName].cost += Number(log.cost || 0);
    });

    const campaignReports = Object.values(campaignMap).map((c) => ({
      ...c,
      cost: Number(c.cost || 0).toFixed(3),
    }));

    const buildStats = (rows: any[]) => ({
      total: rows.length,
      sent: rows.filter((l) =>
        ["SENT", "DELIVERED", "READ"].includes(
          String(l.status || "").toUpperCase()
        )
      ).length,
      delivered: rows.filter((l) =>
        ["DELIVERED", "READ"].includes(String(l.status || "").toUpperCase())
      ).length,
      read: rows.filter((l) => String(l.status || "").toUpperCase() === "READ")
        .length,
      failed: rows.filter(
        (l) => String(l.status || "").toUpperCase() === "FAILED"
      ).length,
      scheduled: rows.filter(
        (l) => String(l.status || "").toUpperCase() === "SCHEDULED"
      ).length,
    });

    return NextResponse.json(
      {
        success: true,
        userId,
        campaigns: campaignReports,
        deliveries: deliveryLogs,
        schedules: scheduleReports,
        scheduleDeliveries,
        apis: apiLogs,
        services: serviceLogs,
        fallbacks: fallbackLogs,
        wabaAccounts,
        stats: buildStats(normalDeliveryRaw),
        tabStats: {
          delivery: buildStats(normalDeliveryRaw),
          campaign: buildStats(campaignRaw),
          schedule: buildStats(scheduledRaw),
          api: buildStats(apiRaw),
          service: buildStats(serviceRaw),
          fallback: buildStats(fallbackRaw),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
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
        scheduleDeliveries: [],
        apis: [],
        services: [],
        fallbacks: [],
        wabaAccounts: [],
      },
      { status: 500 }
    );
  }
}