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
      // Return challenge as plain text with 200 OK
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
    console.log("🔥 Incoming Meta Webhook Payload:", JSON.stringify(body, null, 2));

    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const value = change.value;
            if (value.statuses) {
              for (const statusObj of value.statuses) {
                const messageId = statusObj.id;
                const status = statusObj.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED
                const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1000) : new Date();

                console.log(`📌 Processing status update: Message ID ${messageId} -> ${status}`);

                if (!messageId) continue;

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

                const updateResult = await prisma.campaignLog.updateMany({
                  where: { messageId },
                  data: updateData,
                });

                console.log(`✅ DB Update Result for Message ID ${messageId}:`, updateResult);
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