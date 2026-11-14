import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. Meta Webhook Verification (GET)
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

// 2. Handle Incoming WhatsApp Statuses & Messages (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const value = change.value;

            // Handle statuses (sent, delivered, read, failed)
            if (value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id?.trim();
                const recipientId = statusObj.recipient_id?.trim();
                const status = statusObj.status?.toUpperCase(); // SENT, DELIDERED, READ, FAILED
                const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : new Date();

                if (!messageId && !recipientId) continue;

                let updateData: any = { status };

                if (status === "DELIVERED") {
                  updateData.deliveredAt = timestamp;
                } else if (status === "READ") {
                  updateData.readAt = timestamp;
                  updateData.status = "READ";
                } else if (status === "FAILED") {
                  if (statusObj.errors && statusObj.errors[0]) {
                    updateData.errorDetails = statusObj.errors[0].message || "Failed";
                  }
                }

                if (messageId) {
                  updateData.messageId = messageId;
                }

                try {
                  let updated = false;

                  // 1. Try updating by exact messageId first
                  if (messageId) {
                    const matchByMsgId = await prisma.campaignLog.findFirst({
                      where: { messageId: messageId }
                    });

                    if (matchByMsgId) {
                      await prisma.campaignLog.update({
                        where: { id: matchByMsgId.id },
                        data: updateData,
                      });
                      updated = true;
                    }
                  }

                  // 2. Fallback: If not found by messageId, find by recipient phone number
                  if (!updated && recipientId) {
                    const matchByRecipient = await prisma.campaignLog.findFirst({
                      where: {
                        OR: [
                          { recipient: recipientId },
                          { recipient: `+${recipientId}` }
                        ],
                        status: { not: "READ" } // Don't overwrite already read messages if possible
                      },
                      orderBy: { sentAt: "desc" }
                    });

                    if (matchByRecipient) {
                      await prisma.campaignLog.update({
                        where: { id: matchByRecipient.id },
                        data: updateData,
                      });
                      updated = true;
                    }
                  }

                  if (updated) {
                    console.log(`✅ Successfully Updated Status to [${status}] for ID/Recipient: ${messageId || recipientId}`);
                  } else {
                    console.log(`ℹ️ Skipped: No matching log found for messageId [${messageId}] / recipient [${recipientId}]`);
                  }
                } catch (dbErr: any) {
                  console.error(`❌ DB Update Error for [${messageId}]:`, dbErr.message);
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