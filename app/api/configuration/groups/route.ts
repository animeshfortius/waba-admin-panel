import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch all contact groups
export async function GET() {
  try {
    const groups = await prisma.contactGroup.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create new contact group
export async function POST(request: Request) {
  try {
    const { groupName } = await request.json();
    if (!groupName) {
      return NextResponse.json({ success: false, error: "Group name is required" }, { status: 400 });
    }

    const newGroup = await prisma.contactGroup.create({
      data: { groupName, totalContacts: 0 },
    });

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Edit group name
export async function PUT(request: Request) {
  try {
    const { id, groupName } = await request.json();
    if (!id || !groupName) {
      return NextResponse.json({ success: false, error: "ID and Group Name required" }, { status: 400 });
    }

    const updated = await prisma.contactGroup.update({
      where: { id },
      data: { groupName },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Group ID required" }, { status: 400 });
    }

    await prisma.contactGroup.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}