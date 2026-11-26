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

function resolveMetaUploadType(
  mediaTypeInput: string,
  detectedMime: string
): string {
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
    const body = await request.json().catch(() => ({}));
    const mediaUrl = String(body?.mediaUrl || "").trim();
    const mediaType = String(body?.mediaType || "image").trim();
    const targetPhoneId = String(
      body?.phoneNumberId ||
        auth.context.phoneNumberId ||
        process.env.META_PHONE_NUMBER_ID ||
        ""
    ).trim();

    const metaToken = String(
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN || ""
    ).trim();

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

    const isRelative = mediaUrl.startsWith("/");
    const resolvedUrl = isRelative
      ? `${request.nextUrl.origin}${mediaUrl}`
      : mediaUrl;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(resolvedUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid mediaUrl format",
        },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only HTTP/HTTPS mediaUrl is supported",
        },
        { status: 400 }
      );
    }

    const forwardHeaders: Record<string, string> = {};
    if (isRelative) {
      const cookieHeader = request.headers.get("cookie");
      const authHeader = request.headers.get("authorization");
      if (cookieHeader) forwardHeaders.cookie = cookieHeader;
      if (authHeader) forwardHeaders.authorization = authHeader;
    }

    const fileRes = await fetch(parsedUrl.toString(), {
      headers: forwardHeaders,
      cache: "no-store",
    });

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
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Fetched media file is empty",
        },
        { status: 400 }
      );
    }

    const contentType =
      fileRes.headers.get("content-type") || "application/octet-stream";

    const urlPathname = parsedUrl.pathname;
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
        cache: "no-store",
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