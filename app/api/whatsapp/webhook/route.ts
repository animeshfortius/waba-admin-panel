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
                  // Webhook wale number ke aakhri 10 digits nikaalo
                  const cleanWebhook = recipientId ? recipientId.replace(/\D/g, "").slice(-10) : "";

                  let matchedLogs: any[] = [];

                  // 1️⃣ STEP 1: Exact wamid (messageId) se match karo
                  if (messageId) {
                    const byWamid = await prisma.campaignLog.findMany({
                      where: { messageId: messageId }
                    });
                    if (byWamid.length > 0) {
                      matchedLogs = byWamid;
                    }
                  }

                  // 2️⃣ STEP 2: JS Normalization Match (DB ke saare unread/sent logs laakar last 10 digits compare karo)
                  if (matchedLogs.length === 0 && cleanWebhook.length >= 10) {
                    const recentLogs = await prisma.campaignLog.findMany({
                      where: { status: { not: "READ" } },
                      orderBy: { createdAt: "desc" },
                      take: 300 // Last 300 active logs check honge
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

                    console.log(`🔥 JS NORMALIZED MATCH -> Phone: ${cleanWebhook} | Updated ${logIds.length} rows to ${status}`);
                  } else {
                    // 3️⃣ STEP 3: Agar sach mein kahin match na ho, tabhi fallback create karo
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