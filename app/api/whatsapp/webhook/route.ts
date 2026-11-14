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

                  // 1️⃣ Try finding existing log by WAMID (Message ID)
                  let matchMsg = null;
                  if (messageId) {
                    matchMsg = await prisma.campaignLog.findFirst({
                      where: { messageId: messageId }
                    });
                  }

                  // 2️⃣ If WAMID not found, match by recipient number (picks the latest log for this number)
                  if (!matchMsg && cleanRecip) {
                    matchMsg = await prisma.campaignLog.findFirst({
                      where: {
                        recipient: { contains: cleanRecip }
                      },
                      orderBy: { sentAt: "desc" }
                    });
                  }

                  if (matchMsg) {
                    // Update existing log & bind wamid if it was missing or N/A
                    let updateData: any = { status };
                    if (messageId && (!matchMsg.messageId || matchMsg.messageId === "N/A")) {
                      updateData.messageId = messageId;
                    }
                    if (status === "DELIVERED") updateData.deliveredAt = timestamp;
                    if (status === "READ") {
                      if (!matchMsg.deliveredAt) updateData.deliveredAt = timestamp;
                      updateData.readAt = timestamp;
                      updateData.status = "READ";
                    }
                    if (status === "FAILED" && statusObj.errors?.[0]) {
                      updateData.errorDetails = statusObj.errors[0].message;
                    }

                    await prisma.campaignLog.update({
                      where: { id: matchMsg.id },
                      data: updateData,
                    });
                    console.log(`✅ WEBHOOK UPDATED -> ID: ${matchMsg.id} to ${status} (Matched Recipient/WAMID)`);
                  } else {
                    // 3️⃣ Fallback only if no record exists at all
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