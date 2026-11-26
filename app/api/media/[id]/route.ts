import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const mediaId = String(params?.id || "").trim();

    if (!mediaId) {
      return NextResponse.json(
        { error: "Media ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);

    // Match mediaId against ChatMessage.mediaUrl (direct ID or /api/media/<id> path)
    const candidateMessages = await prisma.chatMessage.findMany({
      where: {
        mediaUrl: {
          contains: mediaId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const matchedMessage = candidateMessages.find((msg) => {
      const urlVal = String(msg.mediaUrl || "").trim();
      return (
        urlVal === mediaId ||
        urlVal.endsWith(`/${mediaId}`) ||
        urlVal.includes(`/${mediaId}?`)
      );
    });

    if (!matchedMessage) {
      return NextResponse.json(
        { error: "Media not found or access denied" },
        { status: 404 }
      );
    }

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: matchedMessage.chatSessionId,
        ...ownerWhere,
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: "Media not found or access denied" },
        { status: 404 }
      );
    }

    const scopedAccounts = await prisma.wabaAccount.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
    });

    const sessionChannel = String(chatSession.channel || "").trim();

    const matchedAccount =
      scopedAccounts.find((acc: any) => {
        const cleanPhoneId = String(acc.phoneNumberId || "")
          .replace("PHONE_", "")
          .trim();
        return (
          acc.id === sessionChannel ||
          acc.phoneNumberId === sessionChannel ||
          cleanPhoneId === sessionChannel ||
          acc.wabaId === sessionChannel ||
          acc.displayPhone === sessionChannel
        );
      }) ||
      scopedAccounts.find((acc: any) => Boolean(acc.accessToken));

    const accessToken = String(matchedAccount?.accessToken || "").trim();
    if (!accessToken) {
      return NextResponse.json(
        { error: "WABA access token not found for this tenant" },
        { status: 404 }
      );
    }

    // 1. Fetch media metadata & temporary URL from Meta Graph API
    const metaRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
        mediaId
      )}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );
    const metaData = await metaRes.json();

    if (!metaRes.ok || !metaData?.url) {
      return NextResponse.json(
        {
          error:
            metaData?.error?.message || "Failed to get media URL from Meta",
        },
        { status: 400 }
      );
    }

    // 2. Fetch actual binary data from Meta CDN using token
    const fileRes = await fetch(String(metaData.url), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!fileRes.ok) {
      return NextResponse.json(
        { error: "Failed to download media binary from Meta" },
        { status: 502 }
      );
    }

    const buffer = await fileRes.arrayBuffer();
    const contentType =
      fileRes.headers.get("content-type") ||
      metaData?.mime_type ||
      "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to proxy media" },
      { status: 500 }
    );
  }
}