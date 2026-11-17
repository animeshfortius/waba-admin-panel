import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET: Fetch all media records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    const media = await prisma.mediaLibrary.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    console.error("GET Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload media file to Server local folder with 30-day expiration
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = (formData.get("userId") as string) || "admin_user";
    const wabaNumber = (formData.get("wabaNumber") as string) || "All";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + file.name.replace(/\s+/g, "_");
    
    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;
    const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";

    // Set expiration to 30 days from now according to Meta policy
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Save record to database
    const newMedia = await prisma.mediaLibrary.create({
      data: {
        mediaName: file.name,
        fileType,
        url: fileUrl,
        wabaNumber,
        userId,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, media: newMedia });
  } catch (error: any) {
    console.error("POST Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove media record by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Media ID required" }, { status: 400 });
    }

    await prisma.mediaLibrary.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Media deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}