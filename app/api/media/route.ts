import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

// GET: Fetch scoped media & auto-delete expired ones
export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId")?.trim() || "";

    await prisma.mediaLibrary
      .deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
      .catch(() => {});

    const ownerWhere = getOwnerWhere(tenant);
    const whereClause: any = { ...ownerWhere };

    if (
      requestedUserId &&
      requestedUserId !== "ALL" &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null"
    ) {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(requestedUserId)
      ) {
        return NextResponse.json({ success: true, media: [] });
      }
      whereClause.userId = requestedUserId;
    }

    const mediaList = await prisma.mediaLibrary.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media: mediaList });
  } catch (error: any) {
    console.error("GET Media Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST: Upload media with proper MIME detection for Base64 storage
export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedUserId = String(formData.get("userId") || "").trim();
    const wabaNumber =
      String(formData.get("wabaNumber") || "All").trim() || "All";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const targetUserId =
      requestedUserId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedUserId))
        ? requestedUserId
        : tenant.userId;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let mime = String(file.type || "").trim();
    const lowerName = String(file.name || "upload").toLowerCase();

    if (!mime || mime === "application/octet-stream") {
      if (lowerName.endsWith(".pdf")) mime = "application/pdf";
      else if (lowerName.match(/\.(jpg|jpeg)$/i)) mime = "image/jpeg";
      else if (lowerName.match(/\.(png|webp|gif)$/i)) mime = "image/png";
      else if (lowerName.match(/\.(mp4|mov)$/i)) mime = "video/mp4";
      else mime = "application/octet-stream";
    }

    const base64 = buffer.toString("base64");
    const fileUrl = `data:${mime};base64,${base64}`;

    let fileType = "image";
    if (mime.includes("video") || lowerName.match(/\.(mp4|mov)$/i)) {
      fileType = "video";
    } else if (
      mime.includes("pdf") ||
      lowerName.match(/\.(pdf|doc|docx|xls|xlsx|csv)$/i)
    ) {
      fileType = "document";
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const savedMedia = await prisma.mediaLibrary.create({
      data: {
        userId: targetUserId,
        mediaName: file.name,
        url: fileUrl,
        wabaNumber,
        fileType,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, media: savedMedia });
  } catch (error: any) {
    console.error("Upload Media API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove media file (scoped to tenant)
export async function DELETE(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Media ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.mediaLibrary.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Media not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.mediaLibrary.delete({ where: { id: existing.id } });
    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete media" },
      { status: 500 }
    );
  }
}