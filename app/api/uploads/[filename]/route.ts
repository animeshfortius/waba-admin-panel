import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { filename } = await context.params;
    const rawName = String(filename || "").trim();
    const safeName = path.basename(rawName);

    if (!safeName || safeName !== rawName || safeName === "." || safeName === "..") {
      return NextResponse.json(
        { success: false, error: "Invalid file name" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const ownedRecord = await prisma.mediaLibrary.findFirst({
      where: {
        ...ownerWhere,
        OR: [
          { mediaName: safeName },
          { url: { endsWith: `/uploads/${safeName}` } },
          { url: { endsWith: `/${safeName}` } },
        ],
      },
      select: { id: true },
    });

    if (!ownedRecord) {
      return NextResponse.json(
        { success: false, error: "File not found or access denied" },
        { status: 404 }
      );
    }

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.resolve(uploadsDir, safeName);

    if (!filePath.startsWith(uploadsDir + path.sep)) {
      return NextResponse.json(
        { success: false, error: "Invalid file path" },
        { status: 400 }
      );
    }

    const fileBuffer = await readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "File not found on server" },
      { status: 404 }
    );
  }
}