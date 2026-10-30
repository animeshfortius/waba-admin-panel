import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const campaigns = await (prisma as any).campaign.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCampaign = await (prisma as any).campaign.create({
      data: {
        userId: body.userId || "default_user",
        name: body.name,
        templateName: body.templateName,
        groupName: body.groupName,
        status: "COMPLETED",
        sentCount: body.sentCount || 0,
      },
    });
    return NextResponse.json(newCampaign);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).campaign.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}