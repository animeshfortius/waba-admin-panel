import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mediaId = resolvedParams.id;
    
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 });
    }

    // Get WABA Access Token
    const wabaAccount = await prisma.wabaAccount.findFirst();
    if (!wabaAccount || !wabaAccount.accessToken) {
      return NextResponse.json({ error: "WABA Account not found" }, { status: 404 });
    }

    // 1. Fetch media URL from Meta Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${wabaAccount.accessToken}` },
    });
    const metaData = await metaRes.json();

    if (!metaData.url) {
      return NextResponse.json({ error: "Failed to get media URL from Meta" }, { status: 400 });
    }

    // 2. Fetch actual binary data from Meta CDN using token
    const fileRes = await fetch(metaData.url, {
      headers: { Authorization: `Bearer ${wabaAccount.accessToken}` },
    });

    const buffer = await fileRes.arrayBuffer();
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}