import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const rules = await (prisma as any).automationRule.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newRule = await (prisma as any).automationRule.create({
      data: {
        userId: body.userId || "default_user",
        keyword: body.keyword,
        replyMessage: body.replyMessage,
        status: "ACTIVE",
      },
    });
    return NextResponse.json(newRule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save automation rule" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).automationRule.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete automation rule" }, { status: 500 });
  }
}