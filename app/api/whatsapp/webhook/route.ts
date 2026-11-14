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
                  let targetLog = null;
                  const cleanRecip = recipientId ? recipientId.replace(/\D/g, "").slice(-10) : "";

                  // 1️⃣ STEP 1: Exact wamid (messageId) se match karo
                  if (messageId) {
                    targetLog = await prisma.campaignLog.findFirst({
                      where: { messageId: messageId }
                    });
                  }

                  // 2️⃣ STEP 2: Agar wamid se na mile, toh poore database mein phone number (last 10 digits) se sabse naya SENT/DELIVERED log dhoondho
                  if (!targetLog && cleanRecip) {
                    targetLog = await prisma.campaignLog.findFirst({
                      where: {
                        recipient: { contains: cleanRecip }
                      },
                      orderBy: { createdAt: "desc" }
                    });
                  }

                  if (targetLog) {
                    // 🟢 Asli campaign row mil gayi! Ab isko update karenge, naya row nahi banayenge.
                    let updateData: any = { status };
                    if (messageId && !targetLog.messageId) updateData.messageId = messageId;
                    if (status === "DELIVERED" && !targetLog.deliveredAt) updateData.deliveredAt = timestamp;
                    if (status === "READ") {
                      if (!targetLog.deliveredAt) updateData.deliveredAt = timestamp;
                      updateData.readAt = timestamp;
                      updateData.status = "READ";
                    }
                    if (status === "FAILED" && statusObj.errors?.[0]) {
                      updateData.errorDetails = statusObj.errors[0].message;
                    }

                    await prisma.campaignLog.update({
                      where: { id: targetLog.id },
                      data: updateData,
                    });
                    console.log(`🔥 REAL CAMPAIGN UPDATED -> ID: ${targetLog.id} | Phone: ${cleanRecip} to ${status}`);
                  } else {
                    // 3️⃣ STEP 3: Agar sach mein database mein kahin bhi row nahi hai, tabhi naya create karo
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