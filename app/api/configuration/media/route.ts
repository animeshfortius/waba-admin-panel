import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// POST: Upload media file as Base64 (Render cloud safe)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = (formData.get("userId") as string) || "admin_user";
    const wabaNumber = (formData.get("wabaNumber") as string) || "All";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer and then to base64 data url
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Flag = `data:${file.type};base64,`;
    const base64String = base64Flag + buffer.toString("base64");

    const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";

    // Set expiresAt to 30 days from now as required by schema
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Save directly to database
    const newMedia = await prisma.mediaLibrary.create({
      data: {
        mediaName: file.name,
        fileType,
        url: base64String,
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