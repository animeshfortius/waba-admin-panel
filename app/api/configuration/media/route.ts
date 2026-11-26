import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");

function resolveSafeUploadPath(storedUrl: string | null | undefined): string | null {
  if (!storedUrl) return null;
  const filename = path.basename(String(storedUrl).trim());
  if (!filename || filename === "." || filename === "..") return null;
  const resolved = path.resolve(UPLOAD_ROOT, filename);
  if (!resolved.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return resolved;
}

// GET: Fetch scoped media records
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

    const media = await prisma.mediaLibrary.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    console.error("GET Media Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Upload media file to server local folder with 30-day expiration
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
    const wabaNumber = String(formData.get("wabaNumber") || "All").trim() || "All";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
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

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${uniqueSuffix}-${safeName}`;

    await mkdir(UPLOAD_ROOT, { recursive: true });

    const filepath = path.resolve(UPLOAD_ROOT, filename);
    if (!filepath.startsWith(UPLOAD_ROOT + path.sep)) {
      return NextResponse.json(
        { success: false, error: "Invalid file path" },
        { status: 400 }
      );
    }

    await writeFile(filepath, buffer);

    const fileUrl = `/api/uploads/${filename}`;
    const mimeType = String(file.type || "").toLowerCase();
    const fileType = mimeType.startsWith("image/")
      ? "image"
      : mimeType.startsWith("video/")
      ? "video"
      : "document";

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newMedia = await prisma.mediaLibrary.create({
      data: {
        mediaName: safeName,
        fileType,
        url: fileUrl,
        wabaNumber,
        userId: targetUserId,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, media: newMedia });
  } catch (error: any) {
    console.error("POST Media Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove media record by ID (scoped to tenant)
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

    const localPath = resolveSafeUploadPath(existing.url);
    if (localPath) {
      await unlink(localPath).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE Media Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}