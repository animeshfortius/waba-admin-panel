import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const media = await prisma.mediaAsset.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newMedia = await prisma.mediaAsset.create({
      data: {
        userId: body.userId || "default_user",
        mediaName: body.mediaName,
        mediaUrl: body.mediaUrl,
        wabaNumber: body.wabaNumber || "15553945963",
      },
    });
    return NextResponse.json(newMedia);
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.mediaAsset.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}