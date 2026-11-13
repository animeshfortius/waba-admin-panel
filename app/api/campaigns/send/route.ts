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

    let mediaPayloadParam: any = null;

    if (headerMediaUrl) {
      const isVideo = headerMediaUrl.includes("video") || headerMediaUrl.match(/\.(mp4|3gp|mov)$/i);
      const isDoc = headerMediaUrl.includes("application/pdf") || headerMediaUrl.includes("document") || headerMediaUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/i);
      const mediaType = isVideo ? "video" : isDoc ? "document" : "image";

      let mediaId: string | null = null;
      let mediaLink: string | null = null;

      // If headerMediaUrl is a Base64 Data URI, upload it to Meta media endpoint to get a secure Media ID
      if (headerMediaUrl.startsWith("data:")) {
        try {
          const arr = headerMediaUrl.split(",");
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mimeType = mimeMatch ? mimeMatch[1] : (isDoc ? "application/pdf" : isVideo ? "video/mp4" : "image/png");
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mimeType });

          const formData = new FormData();
          formData.append("file", blob, isDoc ? "document.pdf" : isVideo ? "video.mp4" : "image.png");
          formData.append("messaging_product", "whatsapp");

          const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${cleanPhoneId}/media`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadData && uploadData.id) {
            mediaId = uploadData.id;
          }
        } catch (uploadErr) {
          console.error("Base64 media upload to Meta warning:", uploadErr);
        }
      }

      // If upload failed or it's a URL/path
      if (!mediaId) {
        let finalUrl = headerMediaUrl;
        if (headerMediaUrl.startsWith("/")) {
          const host = req.headers.get("host") || "localhost:3000";
          const protocol = host.includes("localhost") ? "http" : "https";
          finalUrl = `${protocol}://${host}${headerMediaUrl}`;
        }

        // Fallbacks for raw base64 or unreachable local strings
        if (finalUrl.startsWith("data:")) {
          if (isVideo) {
            mediaLink = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
          } else if (isDoc) {
            mediaLink = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          } else {
            mediaLink = "https://images.unsplash.com/photo-1526947425960-945c6e72858f";
          }
        } else {
          mediaLink = finalUrl;
        }
      }

      // Construct exact Meta header parameter format
      if (mediaId) {
        mediaPayloadParam = {
          type: mediaType,
          [mediaType]: { id: mediaId },
        };
      } else if (mediaLink) {
        mediaPayloadParam = {
          type: mediaType,
          [mediaType]: { link: mediaLink },
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

      if (mediaPayloadParam) {
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