import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { authenticateApiRequest } from "@/lib/api-auth";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
};

function resolveMetaUploadType(mediaTypeInput: string, detectedMime: string): string {
  const cleanInput = (mediaTypeInput || "").trim().toLowerCase();
  if (cleanInput.includes("/")) {
    return cleanInput;
  }
  if (detectedMime && detectedMime !== "application/octet-stream") {
    return detectedMime.split(";")[0].trim();
  }
  if (cleanInput === "image") return "image/jpeg";
  if (cleanInput === "video") return "video/mp4";
  if (cleanInput === "document") return "application/pdf";
  return detectedMime || "application/octet-stream";
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const mediaUrl = String(body?.mediaUrl || "").trim();
    const mediaType = String(body?.mediaType || "image").trim();
    const targetPhoneId = String(
      body?.phoneNumberId ||
        auth.context.phoneNumberId ||
        process.env.META_PHONE_NUMBER_ID ||
        ""
    ).trim();

    const metaToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN;

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    if (!targetPhoneId) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumberId is required",
        },
        { status: 400 }
      );
    }

    if (!mediaUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "mediaUrl is required",
        },
        { status: 400 }
      );
    }

    // Agar relative URL (/api/uploads/...) diya ho toh origin ke saath resolve karo
    const resolvedUrl = mediaUrl.startsWith("/")
      ? `${request.nextUrl.origin}${mediaUrl}`
      : mediaUrl;

    const fileRes = await fetch(resolvedUrl);
    if (!fileRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Unable to fetch media file from URL (status ${fileRes.status})`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const contentType =
      fileRes.headers.get("content-type") || "application/octet-stream";

    const urlPathname = new URL(resolvedUrl).pathname;
    const rawName = path.basename(urlPathname) || "upload";
    const extFromMime = MIME_TO_EXT[contentType.split(";")[0].toLowerCase()];
    const fileName = path.extname(rawName)
      ? rawName
      : `${rawName}.${extFromMime || "bin"}`;

    const metaUploadType = resolveMetaUploadType(mediaType, contentType);

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", metaUploadType);
    formData.append(
      "file",
      new Blob([arrayBuffer], { type: contentType }),
      fileName
    );

    const graphVersion = "v23.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        targetPhoneId
      )}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
        },
        body: formData,
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        data: metaData,
      },
      { status: metaResponse.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload WhatsApp media",
      },
      { status: 500 }
    );
  }
}