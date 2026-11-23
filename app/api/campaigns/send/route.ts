import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseScheduleDateIST(rawDate: string): Date {
  const trimmed = String(rawDate || "").trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!hasTimezone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    return new Date(`${withSeconds}+05:30`);
  }
  return new Date(trimmed);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      campaignName,
      wabaId,
      phoneNumberId,
      numbers,
      templateName,
      language,
      variables,
      headerMediaUrl,
      isScheduled,
      scheduleDate,
      userId,
    } = body;

    const identifier = String(phoneNumberId || wabaId || "").trim();

    if (!identifier || !numbers || numbers.length === 0 || !templateName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required campaign fields (WABA, Numbers, or Template).",
        },
        { status: 400 }
      );
    }

    // Match WABA Account by wabaId, phoneNumberId, displayPhone, or record id
    const wabaAccount = await prisma.wabaAccount.findFirst({
      where: {
        OR: [
          { wabaId: identifier },
          { phoneNumberId: identifier },
          { phoneNumberId: `PHONE_${identifier}` },
          { displayPhone: identifier },
          { id: identifier },
        ],
      },
    });

    const resolvedToken = (
      wabaAccount?.accessToken ||
      process.env.META_ACCESS_TOKEN ||
      ""
    ).trim();

    if (!wabaAccount || !resolvedToken || !wabaAccount.phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WABA Phone Number ID or Access Token not found in database.",
        },
        { status: 404 }
      );
    }

    const ownerUserId = userId || wabaAccount.userId || "admin";
    const cleanPhoneId = wabaAccount.phoneNumberId
      .replace("PHONE_", "")
      .trim();
    const actualWabaId = wabaAccount.wabaId;
    const channelNumber = wabaAccount.displayPhone || actualWabaId;

    const dbTemplate = await prisma.whatsAppTemplate.findFirst({
      where: {
        name: templateName,
        OR: [{ wabaId: actualWabaId }, { wabaId: identifier }],
      },
    });

    const estimatedCost =
      dbTemplate?.category === "MARKETING" ? 0.804 : 0.155;

    if (isScheduled && scheduleDate) {
      const scheduledAtDate = parseScheduleDateIST(scheduleDate);
      if (Number.isNaN(scheduledAtDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid scheduleDate format." },
          { status: 400 }
        );
      }

      let scheduledCount = 0;

      for (const rawNumber of numbers) {
        let formattedNumber = String(rawNumber).replace(/\D/g, "");
        if (formattedNumber.length === 10) {
          formattedNumber = `91${formattedNumber}`;
        }
        if (!formattedNumber) continue;

        await prisma.campaignLog.create({
          data: {
            userId: ownerUserId,
            campaignName: campaignName || `Campaign_${templateName}`,
            templateName: templateName,
            channel: channelNumber,
            recipient: formattedNumber,
            status: "SCHEDULED",
            messageId: null,
            cost: estimatedCost,
            errorDetails: `Scheduled for ${scheduledAtDate.toISOString()}`,
            sentAt: scheduledAtDate,
            deliveredAt: null,
            readAt: null,
          },
        });
        scheduledCount++;
      }

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledCount,
        scheduledFor: scheduledAtDate.toISOString(),
        message: `Campaign "${campaignName}" scheduled for ${scheduledAtDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} (${scheduledCount} recipients).`,
      });
    }

    const cleanVariables = Array.isArray(variables)
      ? variables.filter((v) => v !== undefined && v !== null)
      : [];

    const headerType =
      (dbTemplate as any)?.headerType?.toUpperCase() || "NONE";
    const hasMediaHeader =
      headerType === "IMAGE" ||
      headerType === "VIDEO" ||
      headerType === "DOCUMENT";

    let mediaPayloadParam: any = null;

    if (hasMediaHeader) {
      let mediaValue = headerMediaUrl;
      const isMetaId = mediaValue && /^\d+$/.test(String(mediaValue).trim());

      if (isMetaId) {
        const mediaKey =
          headerType === "VIDEO"
            ? "video"
            : headerType === "DOCUMENT"
            ? "document"
            : "image";
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
            mediaValue =
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
          } else if (headerType === "DOCUMENT") {
            mediaValue =
              "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          } else {
            mediaValue =
              "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
          }
        }

        const mediaKey =
          headerType === "VIDEO"
            ? "video"
            : headerType === "DOCUMENT"
            ? "document"
            : "image";
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
          ...(templateComponents.length > 0
            ? { components: templateComponents }
            : {}),
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
              Authorization: `Bearer ${resolvedToken}`,
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

      // Save Log to Database
      try {
        const savedLog = await prisma.campaignLog.create({
          data: {
            userId: ownerUserId,
            campaignName: campaignName || `Campaign_${templateName}`,
            templateName: templateName,
            channel: channelNumber,
            recipient: formattedNumber,
            status: messageStatus,
            messageId: metaMessageId,
            cost: estimatedCost,
            errorDetails: errorMsg,
            sentAt: now,
            deliveredAt: null,
            readAt: null,
          },
        });
        console.log(
          `💾 SUCCESS CREATED LOG -> ID: ${savedLog.id} | Recipient: ${formattedNumber} | Wamid: ${metaMessageId}`
        );
      } catch (logErr: any) {
        console.error(
          `❌ DB SAVE FAILED for ${formattedNumber}:`,
          logErr.message
        );
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