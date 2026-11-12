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
      variables, // body variables
      headerMediaUrl, // Header media URL if template has image/video/doc header
      isScheduled,
      scheduleDate,
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

    if (isScheduled && scheduleDate) {
      return NextResponse.json({
        success: true,
        scheduled: true,
        message: `Campaign "${campaignName}" scheduled for ${scheduleDate} (${numbers.length} recipients).`,
      });
    }

    const cleanPhoneId = wabaAccount.phoneNumberId.replace("PHONE_", "").trim();
    const accessToken = wabaAccount.accessToken.trim();

    const cleanVariables = Array.isArray(variables) ? variables.filter((v) => v !== undefined && v !== null) : [];

    // Normalize headerMediaUrl to a valid absolute URI if it's a relative path
    let absoluteMediaUrl = headerMediaUrl;
    if (headerMediaUrl && headerMediaUrl.startsWith("/")) {
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      absoluteMediaUrl = `${protocol}://${host}${headerMediaUrl}`;
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

      // If header media is provided (Image/Video/Document template)
      if (absoluteMediaUrl && absoluteMediaUrl.startsWith("http")) {
        const isVideo = absoluteMediaUrl.match(/\.(mp4|3gp|mov)$/i);
        const isDoc = absoluteMediaUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i);
        const mediaType = isVideo ? "video" : isDoc ? "document" : "image";

        templateComponents.push({
          type: "header",
          parameters: [
            {
              type: mediaType,
              [mediaType]: {
                link: absoluteMediaUrl,
              },
            },
          ],
        });
      }

      // Body parameters
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
        } else {
          failedCount++;
          errors.push({
            number: formattedNumber,
            error: metaData.error?.message || "Unknown Meta API Error",
          });
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          number: formattedNumber,
          error: err.message || "Network request failed",
        });
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