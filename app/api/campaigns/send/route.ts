import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      campaignName,
      wabaId,
      numbers,
      templateName,
      language,
      variables,
      headerMediaUrl,
      isScheduled,
      scheduleDate,
      userId,
    } = body;

    if (!wabaId || !numbers || numbers.length === 0 || !templateName) {
      return NextResponse.json(
        { success: false, error: "Missing required campaign fields (WABA, Numbers, or Template)." },
        { status: 400 }
      );
    }

    const wabaAccount = await prisma.wabaAccount.findFirst({
      where: { wabaId },
    });

    if (!wabaAccount || !wabaAccount.accessToken || !wabaAccount.phoneNumberId) {
      return NextResponse.json(
        { success: false, error: "WABA Phone Number ID or Access Token not found in database." },
        { status: 404 }
      );
    }

    const ownerUserId = userId || wabaAccount.userId || "admin";

    if (isScheduled && scheduleDate) {
      return NextResponse.json({
        success: true,
        scheduled: true,
        message: `Campaign "${campaignName}" scheduled for ${scheduleDate} (${numbers.length} recipients).`,
      });
    }

    const cleanPhoneId = wabaAccount.phoneNumberId.replace("PHONE_", "").trim();
    const accessToken = wabaAccount.accessToken.trim();
    const channelNumber = wabaAccount.displayPhone || wabaId;

    const cleanVariables = Array.isArray(variables) ? variables.filter((v) => v !== undefined && v !== null) : [];

    const dbTemplate = await prisma.whatsAppTemplate.findFirst({
      where: { name: templateName, wabaId },
    });

    let sentCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const rawNumber of numbers) {
      let formattedNumber = String(rawNumber).replace(/\D/g, "");
      if (formattedNumber.length === 10) {
        formattedNumber = `91${formattedNumber}`;
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: language || "en_US" },
        },
      };

      let messageStatus = "SENT";
      let metaMessageId: string | null = null;
      let errorMsg = "N/A";
      const now = new Date();

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${cleanPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const metaData = await metaRes.json();

        if (metaRes.ok && metaData.messages?.[0]?.id) {
          sentCount++;
          messageStatus = "SENT";
          metaMessageId = String(metaData.messages[0].id).trim();
        } else {
          failedCount++;
          messageStatus = "FAILED";
          errorMsg = metaData.error?.message || "Unknown Meta API Error";
          errors.push({ number: formattedNumber, error: errorMsg });
        }
      } catch (err: any) {
        failedCount++;
        messageStatus = "FAILED";
        errorMsg = err.message || "Network request failed";
        errors.push({ number: formattedNumber, error: errorMsg });
      }

      // 🟢 Save to Database with explicit debug logs
      try {
        const savedLog = await prisma.campaignLog.create({
          data: {
            userId: ownerUserId,
            campaignName: campaignName || `Campaign_${templateName}`,
            templateName: templateName,
            channel: channelNumber,
            recipient: formattedNumber, // Storing clean numbers like "919495863045"
            status: messageStatus,
            messageId: metaMessageId,
            cost: dbTemplate?.category === "MARKETING" ? 0.804 : 0.155,
            errorDetails: errorMsg,
            sentAt: now,
            deliveredAt: null,
            readAt: null,
          },
        });
        console.log(`💾 SUCCESS SAVING LOG -> ID: ${savedLog.id} | Recipient: ${formattedNumber} | Wamid: ${metaMessageId}`);
      } catch (logErr: any) {
        console.error(`❌ DB SAVE FAILED for ${formattedNumber}:`, logErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      errors,
      message: `Sent: ${sentCount} | Failed: ${failedCount}`,
    });
  } catch (error: any) {
    console.error("Campaign Send API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}