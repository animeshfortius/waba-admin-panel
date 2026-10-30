import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get numbers in a specific group
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json([]);

    const groupContacts = await (prisma as any).groupContact.findMany({
      where: { groupId },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(groupContacts);
  } catch (error) {
    return NextResponse.json([]);
  }
}

// Add a number to a group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, number, name } = body;

    const newContact = await (prisma as any).groupContact.create({
      data: {
        groupId,
        number,
        name: name || "Member",
      },
    });

    // Update total contacts count in group
    await (prisma as any).contactGroup.update({
      where: { id: groupId },
      data: { totalContacts: { increment: 1 } },
    });

    return NextResponse.json(newContact);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// Remove a number from a group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const groupId = searchParams.get("groupId");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await (prisma as any).groupContact.delete({
      where: { id },
    });

    if (groupId) {
      await (prisma as any).contactGroup.update({
        where: { id: groupId },
        data: { totalContacts: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}