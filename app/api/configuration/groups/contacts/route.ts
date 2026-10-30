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
  } catch (error: any) {
    console.error("Error fetching group contacts:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch group contacts" }, { status: 500 });
  }
}

// Add a number to a group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, number, name } = body;

    if (!groupId || !number) {
      return NextResponse.json({ error: "groupId and number are required" }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error("Error adding group contact:", error);
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 });
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
      try {
        await (prisma as any).contactGroup.update({
          where: { id: groupId },
          data: { totalContacts: { decrement: 1 } },
        });
      } catch (e) {
        // Ignore decrement error if group was modified
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting group contact:", error);
    return NextResponse.json({ error: error.message || "Failed to delete member" }, { status: 500 });
  }
}