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

            // 1️⃣ HANDLE INCOMING MESSAGES FOR LIVE AGENT CHAT MODULE
            if (value.messages) {
              for (const msgObj of value.messages) {
                const customerPhone = msgObj.from?.trim();
                const messageId = msgObj.id?.trim();
                const timestamp = msgObj.timestamp ? new Date(Number(msgObj.timestamp) * 1000) : new Date();
                
                // Extract text body or media caption
                const messageText = msgObj.text?.body || msgObj.button?.text || msgObj.interactive?.button_reply?.title || "[Media / Interactive Message]";

                if (customerPhone) {
                  try {
                    const cleanChannelDigits = channelNumber.replace(/\D/g, "").slice(-10);

                    // Find or create chat session for live inbox
                    let session = await prisma.chatSession.findFirst({
                      where: { 
                        customerPhone, 
                        channel: { contains: cleanChannelDigits } 
                      },
                    });

                    if (!session) {
                      session = await prisma.chatSession.create({
                        data: {
                          userId: "admin",
                          customerPhone,
                          customerName: value.contacts?.[0]?.profile?.name || null,
                          channel: channelNumber,
                          status: "OPEN",
                          isBotActive: false, // Default bot inactive for live agent handling
                          lastMessage: messageText,
                          lastMessageAt: timestamp,
                        },
                      });
                    } else {
                      session = await prisma.chatSession.update({
                        where: { id: session.id },
                        data: {
                          customerName: value.contacts?.[0]?.profile?.name || session.customerName,
                          lastMessage: messageText,
                          lastMessageAt: timestamp,
                          status: "OPEN", // Re-open chat on new customer message
                        },
                      });
                    }

                    // Save incoming customer message
                    await prisma.chatMessage.create({
                      data: {
                        chatSessionId: session.id,
                        senderType: "CUSTOMER",
                        messageBody: messageText,
                        messageType: msgObj.type || "text",
                        status: "DELIVERED",
                        wabaMessageId: messageId || null,
                        createdAt: timestamp,
                      },
                    });

                    console.log(`💬 LIVE CHAT INBOUND -> From: ${customerPhone} | Msg: ${messageText}`);
                  } catch (chatErr: any) {
                    console.error(`❌ Live Chat Webhook Error:`, chatErr.message);
                  }
                }
              }
            }

            // 2️⃣ HANDLE MESSAGE STATUS UPDATES (SENT, DELIVERED, READ, FAILED)
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
                  const cleanWebhook = recipientId ? recipientId.replace(/\D/g, "").slice(-10) : "";
                  let matchedLogs: any[] = [];

                  // Step 1: Match by exact wamid (messageId)
                  if (messageId) {
                    const byWamid = await prisma.campaignLog.findMany({
                      where: { messageId: messageId }
                    });
                    if (byWamid.length > 0) {
                      matchedLogs = byWamid;
                    }
                  }

                  // Step 2: Match by last 10 digits in recent unread logs
                  if (matchedLogs.length === 0 && cleanWebhook.length >= 10) {
                    const recentLogs = await prisma.campaignLog.findMany({
                      where: { status: { not: "READ" } },
                      orderBy: { createdAt: "desc" },
                      take: 300
                    });

                    matchedLogs = recentLogs.filter(log => {
                      const cleanDb = log.recipient ? log.recipient.replace(/\D/g, "").slice(-10) : "";
                      return cleanDb === cleanWebhook;
                    });
                  }

                  if (matchedLogs.length > 0) {
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

                    const logIds = matchedLogs.map(l => l.id);
                    await prisma.campaignLog.updateMany({
                      where: { id: { in: logIds } },
                      data: updateData,
                    });

                    console.log(`🔥 STATUS UPDATE -> Phone: ${cleanWebhook} | Updated ${logIds.length} rows to ${status}`);
                  } else {
                    // Step 3: Fallback creation if log not found
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
                } catch (dbErr: any) {
                  console.error(`❌ Webhook Status DB Error:`, dbErr.message);
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