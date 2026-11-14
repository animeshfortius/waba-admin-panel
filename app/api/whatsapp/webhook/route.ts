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
            const metadata = value.metadata;
            const channelNumber = metadata?.display_phone_number || metadata?.phone_number_id || "Unknown";

            if (value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id?.trim();
                const recipientId = statusObj.recipient_id?.trim();
                const rawStatus = statusObj.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED
                const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : new Date();

                if (!recipientId && !messageId) continue;

                let status = rawStatus;
                if (rawStatus === "DELIVERED") status = "DELIVERED";
                if (rawStatus === "READ") status = "READ";
                if (rawStatus === "FAILED") status = "FAILED";

                try {
                  const cleanRecip = recipientId ? recipientId.replace(/\D/g, "").slice(-10) : "";

                  let updateCount = 0;

                  // 🟢 1. Update ALL rows matching this WAMID instantly (No duplicates left behind)
                  if (messageId) {
                    const updateRes = await prisma.campaignLog.updateMany({
                      where: { messageId: messageId },
                      data: {
                        status: status,
                        ...(status === "DELIVERED" ? { deliveredAt: timestamp } : {}),
                        ...(status === "READ" ? { deliveredAt: timestamp, readAt: timestamp, status: "READ" } : {}),
                        ...(status === "FAILED" && statusObj.errors?.[0] ? { errorDetails: statusObj.errors[0].message } : {})
                      }
                    });
                    updateCount = updateRes.count;
                  }

                  // 🟢 2. If WAMID didn't match, update by recipient phone number
                  if (updateCount === 0 && cleanRecip) {
                    const fallbackRes = await prisma.campaignLog.updateMany({
                      where: {
                        recipient: { contains: cleanRecip },
                        status: { not: "READ" }
                      },
                      data: {
                        status: status,
                        ...(messageId ? { messageId: messageId } : {}),
                        ...(status === "DELIVERED" ? { deliveredAt: timestamp } : {}),
                        ...(status === "READ" ? { deliveredAt: timestamp, readAt: timestamp, status: "READ" } : {})
                      }
                    });
                    updateCount = fallbackRes.count;
                  }

                  // 🟢 3. If still no record exists, auto-create it
                  if (updateCount === 0) {
                    await prisma.campaignLog.create({
                      data: {
                        userId: "admin",
                        campaignName: "Auto_Webhook_Campaign",
                        templateName: "Direct_Message",
                        channel: channelNumber,
                        recipient: recipientId || "Unknown",
                        status: status,
                        messageId: messageId || null,
                        cost: 0.155,
                        sentAt: timestamp,
                        deliveredAt: status === "DELIVERED" || status === "READ" ? timestamp : null,
                        readAt: status === "READ" ? timestamp : null,
                        errorDetails: status === "FAILED" ? statusObj.errors?.[0]?.message || "Failed" : "N/A"
                      }
                    });
                    console.log(`🚀 WEBHOOK AUTO-CREATED LOG -> Wamid: ${messageId} | Status: ${status}`);
                  } else {
                    console.log(`✅ WEBHOOK UPDATED ALL (${updateCount} rows) -> Wamid: ${messageId} to ${status}`);
                  }

                } catch (dbErr: any) {
                  console.error(`❌ Webhook DB Error:`, dbErr.message);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Webhook Fatal Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}