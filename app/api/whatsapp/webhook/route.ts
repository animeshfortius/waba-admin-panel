import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "fortius_token";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const value = change.value;

            if (value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id?.trim();
                const recipientId = statusObj.recipient_id?.trim(); // e.g. "919495863045"
                const rawStatus = statusObj.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED
                const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : new Date();

                if (!recipientId && !messageId) continue;

                let status = rawStatus;
                if (rawStatus === "DELIVERED") status = "DELIVERED";
                if (rawStatus === "READ") status = "READ";
                if (rawStatus === "FAILED") status = "FAILED";

                try {
                  let updatedLog = null;

                  // 1. Try finding and updating by exact messageId first
                  if (messageId) {
                    updatedLog = await prisma.campaignLog.findFirst({
                      where: { messageId: messageId }
                    });

                    if (updatedLog) {
                      let updateData: any = { status };
                      if (status === "DELIVERED") updateData.deliveredAt = timestamp;
                      if (status === "READ") {
                        if (!updatedLog.deliveredAt) updateData.deliveredAt = timestamp;
                        updateData.readAt = timestamp;
                        updateData.status = "READ";
                      }
                      if (status === "FAILED" && statusObj.errors?.[0]) {
                        updateData.errorDetails = statusObj.errors[0].message;
                      }

                      await prisma.campaignLog.update({
                        where: { id: updatedLog.id },
                        data: updateData,
                      });
                      console.log(`✅ Updated via MessageID [${messageId}] to Status: ${status}`);
                      continue;
                    }
                  }

                  // 2. Fallback: Find latest log by recipient phone number if messageId not found
                  if (recipientId) {
                    const candidateLogs = await prisma.campaignLog.findMany({
                      where: {
                        OR: [
                          { recipient: recipientId },
                          { recipient: `+${recipientId}` }
                        ],
                        status: { not: "READ" }
                      },
                      orderBy: { sentAt: "desc" },
                      take: 1
                    });

                    if (candidateLogs.length > 0) {
                      const logToUpdate = candidateLogs[0];
                      let updateData: any = { status };

                      if (messageId && !logToUpdate.messageId) {
                        updateData.messageId = messageId; // Bind wamid retroactively
                      }
                      if (status === "DELIVERED") updateData.deliveredAt = timestamp;
                      if (status === "READ") {
                        if (!logToUpdate.deliveredAt) updateData.deliveredAt = timestamp;
                        updateData.readAt = timestamp;
                        updateData.status = "READ";
                      }
                      if (status === "FAILED" && statusObj.errors?.[0]) {
                        updateData.errorDetails = statusObj.errors[0].message;
                      }

                      await prisma.campaignLog.update({
                        where: { id: logToUpdate.id },
                        data: updateData,
                      });
                      console.log(`✅ Updated via Recipient Phone [${recipientId}] to Status: ${status}`);
                    } else {
                      console.log(`ℹ️ No pending campaign log found for recipient: ${recipientId}`);
                    }
                  }
                } catch (dbErr: any) {
                  console.error(`❌ Webhook DB Update Error:`, dbErr.message);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}