import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const blacklist = await (prisma as any).blacklistNumber.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(blacklist);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newItem = await (prisma as any).blacklistNumber.create({
      data: {
        userId: body.userId || "default_user",
        number: body.number,
      },
    });
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to block number" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).blacklistNumber.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove from blacklist" }, { status: 500 });
  }
}