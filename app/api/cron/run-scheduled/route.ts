import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function processDueScheduledLogs() {
  const now = new Date();
  const dueLogs = await prisma.campaignLog.findMany({
    where: {
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

  const wabaAccounts = await prisma.wabaAccount.findMany();
  let sent = 0;
  let failed = 0;
  const failures: { id: string; recipient: string; reason: string }[] = [];

  for (const log of dueLogs) {
    const cleanChannel = String(log.channel || "").replace(/^\+/, "").trim();

    const account = wabaAccounts.find((acc) => {
      const accPhone = String(acc.displayPhone || "").replace(/^\+/, "").trim();
      const accPhoneId = String(acc.phoneNumberId || "").replace("PHONE_", "").trim();
      const accWabaId = String(acc.wabaId || "").trim();
      return (
        accPhone === cleanChannel ||
        accWabaId === cleanChannel ||
        accPhoneId === cleanChannel ||
        acc.phoneNumberId === cleanChannel
      );
    });

    const token = (account?.accessToken || process.env.META_ACCESS_TOKEN || "").trim();
    const phoneId = (account?.phoneNumberId || "").replace("PHONE_", "").trim();

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

    const tpl = await prisma.whatsAppTemplate.findFirst({
      where: { name: log.templateName },
    });

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: log.recipient,
      type: "template",
      template: {
        name: log.templateName,
        language: { code: tpl?.language || "en_US" },
      },
    };

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

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
        const reason = data.error?.message || "Meta API error during scheduled run";
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

export async function GET() {
  try {
    const result = await processDueScheduledLogs();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run scheduled campaigns" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await processDueScheduledLogs();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run scheduled campaigns" },
      { status: 500 }
    );
  }
}