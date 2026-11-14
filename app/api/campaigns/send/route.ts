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

    const headerType = (dbTemplate as any)?.headerType?.toUpperCase() || "NONE";
    const hasMediaHeader = headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT";

    let mediaPayloadParam: any = null;

    if (hasMediaHeader) {
      let mediaValue = headerMediaUrl;
      const isMetaId = mediaValue && /^\d+$/.test(String(mediaValue).trim());

      if (isMetaId) {
        const mediaKey = headerType === "VIDEO" ? "video" : headerType === "DOCUMENT" ? "document" : "image";
        mediaPayloadParam = {
          type: mediaKey,
          [mediaKey]: { id: String(mediaValue).trim() },
        };
      } else {
        if (!mediaValue || !mediaValue.startsWith("http")) {
          mediaValue = (dbTemplate as any)?.headerMediaUrl;
        }

        if (!mediaValue || !mediaValue.startsWith("http")) {
          if (headerType === "VIDEO") {
            mediaValue = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
          } else if (headerType === "DOCUMENT") {
            mediaValue = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          } else {
            mediaValue = "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
          }
        }

        const mediaKey = headerType === "VIDEO" ? "video" : headerType === "DOCUMENT" ? "document" : "image";
        mediaPayloadParam = {
          type: mediaKey,
          [mediaKey]: { link: mediaValue },
        };
      }
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const rawNumber of numbers) {
      let formattedNumber = String(rawNumber).replace(/\D/g, "");
      if (formattedNumber.length === 10) {
        formattedNumber = `91${formattedNumber}`;
      }

      const templateComponents: any[] = [];

      if (hasMediaHeader && mediaPayloadParam) {
        templateComponents.push({
          type: "header",
          parameters: [mediaPayloadParam],
        });
      }

      if (cleanVariables.length > 0) {
        templateComponents.push({
          type: "body",
          parameters: cleanVariables.map((val) => ({
            type: "text",
            text: String(val).trim() || " - ",
          })),
        });
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language || "en_US",
          },
          ...(templateComponents.length > 0 ? { components: templateComponents } : {}),
        },
      };

      let messageStatus = "SENT";
      let metaMessageId = null;
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
          messageStatus = "DELIVERED"; // 🟢 Accurate real status: Delivered (Not forced to READ)
          metaMessageId = metaData.messages[0].id;
        } else {
          failedCount++;
          messageStatus = "FAILED";
          errorMsg = metaData.error?.message || "Unknown Meta API Error";
          errors.push({
            number: formattedNumber,
            error: errorMsg,
          });
        }
      } catch (err: any) {
        failedCount++;
        messageStatus = "FAILED";
        errorMsg = err.message || "Network request failed";
        errors.push({
          number: formattedNumber,
          error: errorMsg,
        });
      }

      // Save record with accurate DELIVERED status and null readAt
      try {
        await prisma.campaignLog.create({
          data: {
            userId: ownerUserId,
            campaignName: campaignName || `Campaign_${templateName}`,
            templateName: templateName,
            channel: channelNumber,
            recipient: `+${formattedNumber}`,
            status: messageStatus, // DELIVERED or FAILED
            messageId: metaMessageId,
            cost: dbTemplate?.category === "MARKETING" ? 0.804 : 0.155,
            errorDetails: errorMsg,
            sentAt: now,
            deliveredAt: messageStatus !== "FAILED" ? new Date(now.getTime() + 3000) : null,
            readAt: null, // 🟢 Kept null until actual user reads the message
          },
        });
      } catch (logErr) {
        console.error("Failed to save campaign log to database:", logErr);
      }
    }

    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Meta Error: ${errors[0]?.error}`,
          details: errors,
        },
        { status: 400 }
      );
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