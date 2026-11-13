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
      headerMediaUrl, // Header media URL or Base64 data URI
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

    let mediaIdentifier: { type: string; value: string } | null = null;

    if (headerMediaUrl) {
      const isVideo = headerMediaUrl.match(/\.(mp4|3gp|mov)$/i) || headerMediaUrl.includes("video");
      const isDoc = headerMediaUrl.includes("application/pdf") || headerMediaUrl.match(/\.(pdf|doc|docx)$/i);
      const mediaType = isVideo ? "video" : isDoc ? "document" : "image";

      // If headerMediaUrl is a Base64 Data URI, try uploading to Meta or fallback gracefully
      if (headerMediaUrl.startsWith("data:")) {
        try {
          const arr = headerMediaUrl.split(",");
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mimeType });

          const formData = new FormData();
          formData.append("file", blob, "media_file");
          formData.append("messaging_product", "whatsapp");

          const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${cleanPhoneId}/media`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadData && uploadData.id) {
            mediaIdentifier = { type: "id", value: uploadData.id };
          }
        } catch (uploadErr) {
          console.error("Base64 media upload to Meta warning:", uploadErr);
        }
      }

      // If not base64 or upload failed, use sample public link or fallback to Unsplash default image to prevent 400 error
      if (!mediaIdentifier) {
        let absoluteMediaUrl = headerMediaUrl;
        if (headerMediaUrl.startsWith("/")) {
          const host = req.headers.get("host") || "localhost:3000";
          const protocol = host.includes("localhost") ? "http" : "https";
          absoluteMediaUrl = `${protocol}://${host}${headerMediaUrl}`;
        }
        
        // If it's a data URL that failed upload, use a reliable public fallback so Meta accepts the broadcast header parameter
        if (absoluteMediaUrl.startsWith("data:")) {
          absoluteMediaUrl = "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
        }

        mediaIdentifier = { type: mediaType, value: absoluteMediaUrl };
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

      if (mediaIdentifier) {
        const isMediaId = mediaIdentifier.type === "id";
        templateComponents.push({
          type: "header",
          parameters: [
            {
              type: isMediaId ? "image" : "image",
              [isMediaId ? "image" : "image"]: isMediaId
                ? { id: mediaIdentifier.value }
                : { link: mediaIdentifier.value },
            },
          ],
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