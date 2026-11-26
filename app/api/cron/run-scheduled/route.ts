import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

function extractScheduledMeta(errorDetails: string | null) {
  if (!errorDetails) return { variables: [] as string[], headerMediaUrl: "" };
  const marker = " | META_VARS:";
  const idx = errorDetails.indexOf(marker);
  if (idx === -1) return { variables: [] as string[], headerMediaUrl: "" };
  try {
    const parsed = JSON.parse(errorDetails.slice(idx + marker.length));
    return {
      variables: Array.isArray(parsed.variables)
        ? parsed.variables.map(String)
        : [],
      headerMediaUrl: parsed.headerMediaUrl
        ? String(parsed.headerMediaUrl)
        : "",
    };
  } catch {
    return { variables: [] as string[], headerMediaUrl: "" };
  }
}

function buildTemplateComponents(
  tpl: any,
  savedVars: string[],
  savedMediaUrl: string
) {
  const components: any[] = [];

  const headerType = String(tpl?.headerType || "NONE").toUpperCase();
  if (
    headerType === "IMAGE" ||
    headerType === "VIDEO" ||
    headerType === "DOCUMENT"
  ) {
    const mediaKey =
      headerType === "VIDEO"
        ? "video"
        : headerType === "DOCUMENT"
        ? "document"
        : "image";
    let mediaVal = savedMediaUrl || tpl?.headerMediaUrl || "";
    if (!mediaVal) {
      mediaVal =
        headerType === "VIDEO"
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          : headerType === "DOCUMENT"
          ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
          : "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
    }
    const isMetaId = /^\d+$/.test(String(mediaVal).trim());
    components.push({
      type: "header",
      parameters: [
        {
          type: mediaKey,
          [mediaKey]: isMetaId
            ? { id: String(mediaVal).trim() }
            : { link: String(mediaVal).trim() },
        },
      ],
    });
  }

  const rawBodyText = String(
    tpl?.bodyText ||
      tpl?.body ||
      tpl?.components?.find?.(
        (c: any) => String(c?.type || "").toUpperCase() === "BODY"
      )?.text ||
      ""
  );
  const matches = rawBodyText.match(/\{\{\d+\}\}/g) || [];
  const expectedVarCount = Math.max(matches.length, savedVars.length);

  if (expectedVarCount > 0) {
    const bodyParams = Array.from({ length: expectedVarCount }, (_, i) => ({
      type: "text",
      text: String(savedVars[i] ?? `Value${i + 1}`).trim() || " - ",
    }));
    components.push({
      type: "body",
      parameters: bodyParams,
    });
  }

  return components;
}

function hasValidCronSecret(request: Request): boolean {
  const cronSecret = String(process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return false;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  const customHeader = String(
    request.headers.get("x-cron-secret") || ""
  ).trim();
  return (
    authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret
  );
}

async function authorizeRunner(request: Request) {
  if (hasValidCronSecret(request)) {
    return { allowedAllTenants: true, logWhere: {} as any, accountWhere: {} as any };
  }

  const tenant = await getTenantContext();
  if (!tenant) {
    return null;
  }

  const ownerWhere = getOwnerWhere(tenant);
  return {
    allowedAllTenants: Boolean(tenant.isSuperAdmin),
    logWhere: ownerWhere,
    accountWhere: ownerWhere,
  };
}

async function processDueScheduledLogs(auth: {
  allowedAllTenants: boolean;
  logWhere: any;
  accountWhere: any;
}) {
  const now = new Date();
  const dueLogs = await prisma.campaignLog.findMany({
    where: {
      ...auth.logWhere,
      status: "SCHEDULED",
      sentAt: { lte: now },
    },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  if (dueLogs.length === 0) {
    return {
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      message: "No due scheduled messages to send.",
    };
  }

  const wabaAccounts = await prisma.wabaAccount.findMany({
    where: auth.accountWhere,
  });

  let sent = 0;
  let failed = 0;
  const failures: { id: string; recipient: string; reason: string }[] = [];

  for (const log of dueLogs) {
    const cleanChannel = String(log.channel || "")
      .replace(/^\+/, "")
      .trim();

    const scopedAccounts = wabaAccounts.filter((acc) =>
      log.userId ? acc.userId === log.userId : true
    );

    const account = scopedAccounts.find((acc) => {
      const accPhone = String(acc.displayPhone || "")
        .replace(/^\+/, "")
        .trim();
      const accPhoneId = String(acc.phoneNumberId || "")
        .replace("PHONE_", "")
        .trim();
      const accWabaId = String(acc.wabaId || "").trim();
      return (
        accPhone === cleanChannel ||
        accWabaId === cleanChannel ||
        accPhoneId === cleanChannel ||
        acc.phoneNumberId === cleanChannel
      );
    });

    const token = String(account?.accessToken || "").trim();
    const phoneId = String(account?.phoneNumberId || "")
      .replace("PHONE_", "")
      .trim();

    if (!token || !phoneId) {
      const reason = `Missing WABA phoneId (${phoneId || "none"}) or accessToken for channel ${log.channel}`;
      failed++;
      failures.push({ id: log.id, recipient: log.recipient, reason });
      await prisma.campaignLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorDetails: reason,
        },
      });
      continue;
    }

    const templateOwnerWhere = log.userId ? { userId: log.userId } : auth.accountWhere;

    const tpl =
      (await prisma.whatsAppTemplate.findFirst({
        where: {
          name: log.templateName,
          ...templateOwnerWhere,
          ...(account?.wabaId ? { wabaId: account.wabaId } : {}),
        },
      })) ||
      (await prisma.whatsAppTemplate.findFirst({
        where: {
          name: log.templateName,
          ...templateOwnerWhere,
        },
      }));

    const { variables: savedVars, headerMediaUrl: savedMediaUrl } =
      extractScheduledMeta(log.errorDetails);
    const templateComponents = buildTemplateComponents(
      tpl,
      savedVars,
      savedMediaUrl
    );

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: log.recipient,
      type: "template",
      template: {
        name: log.templateName,
        language: { code: tpl?.language || "en_US" },
        ...(templateComponents.length > 0
          ? { components: templateComponents }
          : {}),
      },
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok && data.messages?.[0]?.id) {
        sent++;
        await prisma.campaignLog.update({
          where: { id: log.id },
          data: {
            status: "SENT",
            messageId: String(data.messages[0].id).trim(),
            sentAt: new Date(),
            errorDetails: "N/A",
          },
        });
      } else {
        const reason =
          data.error?.message || "Meta API error during scheduled run";
        failed++;
        failures.push({ id: log.id, recipient: log.recipient, reason });
        await prisma.campaignLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            errorDetails: reason,
          },
        });
      }
    } catch (err: any) {
      const reason = err.message || "Network error during scheduled run";
      failed++;
      failures.push({ id: log.id, recipient: log.recipient, reason });
      await prisma.campaignLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorDetails: reason,
        },
      });
    }
  }

  return {
    success: true,
    processed: dueLogs.length,
    sent,
    failed,
    failures,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeRunner(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const result = await processDueScheduledLogs(auth);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run scheduled campaigns",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRunner(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const result = await processDueScheduledLogs(auth);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run scheduled campaigns",
      },
      { status: 500 }
    );
  }
}