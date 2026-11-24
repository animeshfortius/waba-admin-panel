import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get numbers in a specific group
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) return NextResponse.json([]);

    const groupContacts = await prisma.groupContact.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(groupContacts);
  } catch (error: any) {
    console.error("Error fetching group contacts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group contacts" },
      { status: 500 }
    );
  }
}

// Add single or multiple numbers to a group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, number, name, contacts } = body;

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    // Bulk import support if `contacts` array is sent
    if (Array.isArray(contacts) && contacts.length > 0) {
      const rowsToInsert = contacts
        .map((item: any) => ({
          groupId,
          number: String(item?.number ?? item ?? "").trim(),
          name: String(item?.name || "Member").trim() || "Member",
        }))
        .filter((r: { number: string }) => r.number.length > 0);

      if (rowsToInsert.length === 0) {
        return NextResponse.json(
          { error: "No valid numbers found to import" },
          { status: 400 }
        );
      }

      await prisma.groupContact.createMany({
        data: rowsToInsert,
      });

      await prisma.contactGroup.update({
        where: { id: groupId },
        data: { totalContacts: { increment: rowsToInsert.length } },
      });

      return NextResponse.json({
        success: true,
        addedCount: rowsToInsert.length,
      });
    }

    // Single member add
    if (!number || !String(number).trim()) {
      return NextResponse.json(
        { error: "groupId and number are required" },
        { status: 400 }
      );
    }

    const newContact = await prisma.groupContact.create({
      data: {
        groupId,
        number: String(number).trim(),
        name: String(name || "Member").trim() || "Member",
      },
    });

    await prisma.contactGroup.update({
      where: { id: groupId },
      data: { totalContacts: { increment: 1 } },
    });

    return NextResponse.json(newContact);
  } catch (error: any) {
    console.error("Error adding group contact:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add member" },
      { status: 500 }
    );
  }
}

// Remove a number from a group
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const groupId = searchParams.get("groupId");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.groupContact.delete({
      where: { id },
    });

    if (groupId) {
      try {
        await prisma.contactGroup.update({
          where: { id: groupId },
          data: { totalContacts: { decrement: 1 } },
        });
      } catch {
        // Ignore decrement error if group was modified
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting group contact:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}