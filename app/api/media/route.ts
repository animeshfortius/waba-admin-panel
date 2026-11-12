import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Fetch media & auto-delete expired ones
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Clean up expired media older than 30 days
    await prisma.mediaLibrary.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }).catch(() => {});

    const mediaList = await prisma.mediaLibrary.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media: mediaList });
  } catch (error: any) {
    console.error("GET Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload media with 30-day automatic expiration & cloud filesystem fallback
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = (formData.get("userId") as string) || "emergency_admin_id";
    const wabaNumber = (formData.get("wabaNumber") as string) || "All";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let fileUrl = "";
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      fileUrl = `${protocol}://${host}/uploads/${filename}`;
    } catch (fsErr) {
      console.warn("Filesystem write restricted, using base64 data URI fallback:", fsErr);
      const base64 = buffer.toString("base64");
      const mime = file.type || "application/octet-stream";
      fileUrl = `data:${mime};base64,${base64}`;
    }

    let fileType = "image";
    if (file.type.includes("video")) fileType = "video";
    else if (file.type.includes("pdf") || file.name.match(/\.(doc|docx|pdf)$/i)) fileType = "document";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const savedMedia = await prisma.mediaLibrary.create({
      data: {
        userId,
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
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove media file
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Media ID required" }, { status: 400 });
    }

    await prisma.mediaLibrary.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}