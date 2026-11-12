import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

// GET: Fetch all saved media files for the user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const mediaList = await prisma.mediaLibrary.findMany({
      where: userId ? { userId } : {},
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ success: true, media: mediaList });
  } catch (error: any) {
    console.error("Fetch Media Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Upload new media file
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const wabaNumber = formData.get("wabaNumber") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file locally in public/uploads folder
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure directory exists or write directly
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Generate public URL accessible by Meta and browser
    // Note: Ensure your NEXT_PUBLIC_BASE_URL or production domain matches
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;

    // Save to Database (MediaLibrary model)
    const savedMedia = await prisma.mediaLibrary.create({
      data: {
        userId: userId || "emergency_admin_id",
        mediaName: file.name,
        url: fileUrl,
        wabaNumber: wabaNumber || "All",
      },
    });

    return NextResponse.json({ success: true, media: savedMedia });
  } catch (error: any) {
    console.error("Upload Media API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}