import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const templates = await (prisma as any).template.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTemplate = await (prisma as any).template.create({
      data: {
        userId: body.userId || "default_user",
        name: body.name,
        language: body.language || "en",
        category: body.category || "MARKETING",
        content: body.content,
        status: "APPROVED"
      },
    });
    return NextResponse.json(newTemplate);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).template.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}