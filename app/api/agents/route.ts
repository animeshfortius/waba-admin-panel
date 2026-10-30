import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const agents = await (prisma as any).agent.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAgent = await (prisma as any).agent.create({
      data: {
        userId: body.userId || "default_user",
        name: body.name,
        email: body.email,
        role: body.role || "AGENT",
        status: "ACTIVE",
      },
    });
    return NextResponse.json(newAgent);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).agent.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}