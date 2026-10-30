import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const keys = await (prisma as any).apiKey.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const generatedKey = "waba_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newKey = await (prisma as any).apiKey.create({
      data: {
        userId: body.userId || "default_user",
        name: body.name || "Default Key",
        key: generatedKey,
      },
    });
    return NextResponse.json(newKey);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).apiKey.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}