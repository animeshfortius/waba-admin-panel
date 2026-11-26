import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAutomationWebhook } from "@/lib/automationEngine";
import {
  deductMessageBalance,
  refundMessageBalance,
} from "@/lib/billingDeduction";

function serializeMetaError(firstErr: any) {
  if (!firstErr) return "Message delivery failed by Meta";
  return JSON.stringify({
    code: firstErr.code || "",
    title: firstErr.title || "",
    message: firstErr.message || "",
    details: firstErr.error_data?.details || "",
  });
}

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
            const phoneNumberId = metadata?.phone_number_id || "";
            const channelNumber =
              metadata?.display_phone_number || phoneNumberId || "Unknown";

            // 1. HANDLE INCOMING MESSAGES FOR LIVE AGENT CHAT + AUTOMATION ENGINE
            if (value.messages) {
              for (const msgObj of value.messages) {
                const customerPhone = msgObj.from?.trim();
                const messageId = msgObj.id?.trim();
                const timestamp = msgObj.timestamp
                  ? new Date(Number(msgObj.timestamp) * 1000)
                  : new Date();

                const messageText =
                  msgObj.text?.body ||
                  msgObj.button?.text ||
                  msgObj.interactive?.button_reply?.title ||
                  msgObj.interactive?.button_reply?.id ||
                  msgObj.interactive?.list_reply?.title ||
                  msgObj.interactive?.list_reply?.id ||
                  "[Media / Interactive Message]";

                if (customerPhone) {
                  try {
                    const cleanChannelDigits = channelNumber
                      .replace(/\D/g, "")
                      .slice(-10);

                    const wabaAccount = await prisma.wabaAccount.findFirst({
                      where: {
                        OR: [
                          ...(phoneNumberId ? [{ phoneNumberId }] : []),
                          ...(cleanChannelDigits
                            ? [
                                {
                                  displayPhone: {
                                    contains: cleanChannelDigits,
                                  },
                                },
                              ]
                            : []),
                        ],
                      },
                    });

                    const resolvedOwnerId = wabaAccount?.userId || "admin";

                    let session = await prisma.chatSession.findFirst({
                      where: {
                        customerPhone,
                        channel: { contains: cleanChannelDigits },
                      },
                    });

                    if (!session) {
                      session = await prisma.chatSession.create({
                        data: {
                          userId: resolvedOwnerId,
                          customerPhone,
                          customerName:
                            value.contacts?.[0]?.profile?.name || null,
                          channel: channelNumber,
                          status: "OPEN",
                          isBotActive: true,
                          lastMessage: messageText,
                          lastMessageAt: timestamp,
                        },
                      });
                    } else {
                      session = await prisma.chatSession.update({
                        where: { id: session.id },
                        data: {
                          userId: session.userId || resolvedOwnerId,
                          customerName:
                            value.contacts?.[0]?.profile?.name ||
                            session.customerName,
                          lastMessage: messageText,
                          lastMessageAt: timestamp,
                          status: "OPEN",
                        },
                      });
                    }

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

                    console.log(
                      `LIVE CHAT INBOUND -> From: ${customerPhone} | Msg: ${messageText}`
                    );

                    if (
                      session.isBotActive &&
                      messageText &&
                      messageText !== "[Media / Interactive Message]"
                    ) {
                      const accessToken =
                        wabaAccount?.accessToken ||
                        process.env.WHATSAPP_ACCESS_TOKEN ||
                        process.env.META_ACCESS_TOKEN ||
                        "";

                      if (accessToken) {
                        await processAutomationWebhook({
                          phoneNumberId:
                            wabaAccount?.phoneNumberId || phoneNumberId,
                          customerPhone,
                          incomingText: messageText,
                          accessToken,
                        });
                      }
                    }
                  } catch (chatErr: any) {
                    console.error(
                      `Live Chat / Automation Webhook Error:`,
                      chatErr.message
                    );
                  }
                }
              }
            }

            // 2. HANDLE MESSAGE STATUS UPDATES + BILLING / REFUND
            if (value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id?.trim();
                const recipientId = statusObj.recipient_id?.trim();
                const rawStatus = statusObj.status?.toUpperCase();
                const timestamp = statusObj.timestamp
                  ? new Date(Number(statusObj.timestamp) * 1000)
                  : new Date();

                if (!messageId && !recipientId) continue;

                let status = rawStatus;
                if (rawStatus === "DELIVERED") status = "DELIVERED";
                if (rawStatus === "READ") status = "READ";
                if (rawStatus === "FAILED") status = "FAILED";

                const serializedErr =
                  status === "FAILED"
                    ? serializeMetaError(statusObj.errors?.[0])
                    : "N/A";

                try {
                  const cleanWebhook = recipientId
                    ? recipientId.replace(/\D/g, "").slice(-10)
                    : "";
                  let matchedLogs: any[] = [];

                  if (messageId) {
                    const byWamid = await prisma.campaignLog.findMany({
                      where: { messageId: messageId },
                      orderBy: { createdAt: "desc" },
                    });
                    if (byWamid.length > 0) {
                      matchedLogs = byWamid;
                    }
                  }

                  if (matchedLogs.length === 0 && cleanWebhook.length >= 10) {
                    const recentLogs = await prisma.campaignLog.findMany({
                      where: { status: { not: "READ" } },
                      orderBy: { createdAt: "desc" },
                      take: 300,
                    });

                    const latestPhoneMatch = recentLogs.find((log) => {
                      const cleanDb = log.recipient
                        ? log.recipient.replace(/\D/g, "").slice(-10)
                        : "";
                      return cleanDb === cleanWebhook;
                    });

                    if (latestPhoneMatch) {
                      matchedLogs = [latestPhoneMatch];
                    }
                  }

                  if (matchedLogs.length > 0) {
                    for (const log of matchedLogs) {
                      const prevCost = Number(log.cost || 0);
                      const wasDeliveredBefore = Boolean(log.deliveredAt);
                      let nextCost = prevCost;

                      if (
                        (status === "DELIVERED" || status === "READ") &&
                        !wasDeliveredBefore &&
                        prevCost <= 0 &&
                        log.userId &&
                        log.userId !== "admin"
                      ) {
                        try {
                          const tpl = log.templateName
                            ? await prisma.whatsAppTemplate.findFirst({
                                where: { name: log.templateName },
                                select: { category: true },
                              })
                            : null;

                          const ded = await deductMessageBalance({
                            userId: log.userId,
                            category: tpl?.category || "MARKETING",
                            units: 1,
                            description: `Delivered (${status}) - ${log.campaignName} (${log.recipient})`,
                            referenceId: log.id,
                          });
                          nextCost = ded.cost;
                        } catch (billErr: any) {
                          console.error(
                            `Billing Deduction Error for log ${log.id}:`,
                            billErr.message
                          );
                        }
                      }

                      if (
                        status === "FAILED" &&
                        prevCost > 0 &&
                        log.userId &&
                        log.userId !== "admin"
                      ) {
                        try {
                          await refundMessageBalance({
                            userId: log.userId,
                            amount: prevCost,
                            description: `Failed Delivery Refund - ${log.campaignName} (${log.recipient})`,
                            referenceId: log.id,
                          });
                          nextCost = 0;
                        } catch (refErr: any) {
                          console.error(
                            `Billing Refund Error for log ${log.id}:`,
                            refErr.message
                          );
                        }
                      }

                      const updateData: any = {
                        status,
                        cost: nextCost,
                      };
                      if (messageId) updateData.messageId = messageId;
                      if (status === "DELIVERED")
                        updateData.deliveredAt = timestamp;
                      if (status === "READ") {
                        updateData.deliveredAt = log.deliveredAt || timestamp;
                        updateData.readAt = timestamp;
                        updateData.status = "READ";
                      }
                      if (status === "FAILED") {
                        updateData.errorDetails = serializedErr;
                      }

                      await prisma.campaignLog.update({
                        where: { id: log.id },
                        data: updateData,
                      });
                    }

                    console.log(
                      `STATUS UPDATE -> Phone: ${cleanWebhook} | Updated ${matchedLogs.length} rows to ${status}`
                    );
                  } else {
                    await prisma.campaignLog.create({
                      data: {
                        userId: "admin",
                        campaignName: "Direct_Chat_Campaign",
                        templateName: "Direct_Message",
                        channel: channelNumber,
                        recipient: recipientId || "Unknown",
                        status: status,
                        messageId: messageId || null,
                        cost: 0,
                        sentAt: timestamp,
                        deliveredAt:
                          status === "DELIVERED" || status === "READ"
                            ? timestamp
                            : null,
                        readAt: status === "READ" ? timestamp : null,
                        errorDetails: serializedErr,
                      },
                    });
                    console.log(
                      `FALLBACK CREATED -> Recipient: ${recipientId} | Status: ${status}`
                    );
                  }
                } catch (dbErr: any) {
                  console.error(
                    `Webhook Status DB Error:`,
                    dbErr.message
                  );
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Fatal Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}