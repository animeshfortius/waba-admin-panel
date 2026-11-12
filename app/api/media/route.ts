import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

// GET: Fetch active media files for user & clean up expired media older than 30 days
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Automatically delete expired media older than 30 days
    await prisma.mediaLibrary.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    const mediaList = await prisma.mediaLibrary.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media: mediaList });
  } catch (error: any) {
    console.error("Fetch Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload media with 30-day automatic expiration
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

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;

    // Determine file type
    let fileType = "image";
    if (file.type.includes("video")) fileType = "video";
    else if (file.type.includes("pdf") || file.name.match(/\.(doc|docx|pdf)$/i)) fileType = "document";

    // Calculate 30 days expiration date from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const savedMedia = await prisma.mediaLibrary.create({
      data: {
        userId,
        mediaName: file.name,
        url: fileUrl,
        wabaNumber,
        fileType,
        expiresAt, // 👈 Required field included here
      },
    });

    return NextResponse.json({ success: true, media: savedMedia });
  } catch (error: any) {
    console.error("Upload Media API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}