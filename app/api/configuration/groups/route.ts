import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const groups = await prisma.contactGroup.findMany({
      orderBy: { id: "desc" }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGroup = await prisma.contactGroup.create({
      data: {
        userId: body.userId || "default_user",
        groupName: body.groupName,
        totalContacts: body.totalContacts || 0,
      },
    });
    return NextResponse.json(newGroup);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, groupName } = body;
    const updatedGroup = await prisma.contactGroup.update({
      where: { id: parseInt(id) },
      data: { groupName },
    });
    return NextResponse.json(updatedGroup);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.contactGroup.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}