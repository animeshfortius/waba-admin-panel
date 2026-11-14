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
      return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
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
                const rawStatus = statusObj.status?.toUpperCase();
                const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : new Date();

                if (!messageId && !recipientId) continue;

                let status = rawStatus;
                if (rawStatus === "DELIVERED") status = "DELIVERED";
                if (rawStatus === "READ") status = "READ";
                if (rawStatus === "FAILED") status = "FAILED";

                try {
                  const cleanRecip = recipientId ? recipientId.replace(/\D/g, "").slice(-10) : "";

                  if (cleanRecip) {
                    let updateData: any = { status };
                    if (messageId) updateData.messageId = messageId;
                    if (status === "DELIVERED") updateData.deliveredAt = timestamp;
                    if (status === "READ") {
                      updateData.deliveredAt = timestamp;
                      updateData.readAt = timestamp;
                      updateData.status = "READ";
                    }
                    if (status === "FAILED" && statusObj.errors?.[0]) {
                      updateData.errorDetails = statusObj.errors[0].message;
                    }

                    // 🟢 MASS UPDATE: Update ALL campaign rows for this phone number at once
                    const updateResult = await prisma.campaignLog.updateMany({
                      where: {
                        recipient: { contains: cleanRecip },
                        status: { not: "READ" }
                      },
                      data: updateData,
                    });

                    console.log(`🔥 MASS UPDATED -> Phone: ${cleanRecip} | Count: ${updateResult.count} rows to ${status}`);

                    if (updateResult.count === 0) {
                      await prisma.campaignLog.create({
                        data: {
                          userId: "admin",
                          campaignName: "Direct_Chat_Campaign",
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
                      console.log(`🚀 FALLBACK CREATED -> Recipient: ${recipientId} | Status: ${status}`);
                    }
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