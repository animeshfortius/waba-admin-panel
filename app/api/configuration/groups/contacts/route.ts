import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

function normalizeGroupPhoneNumber(rawNumber: unknown): string {
  let cleaned = String(rawNumber ?? "").replace(/\D/g, "").trim();
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

// Get numbers in a specific group (scoped to tenant's ContactGroup)
export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId")?.trim();
    if (!groupId) return NextResponse.json([]);

    const ownerWhere = getOwnerWhere(tenant);
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, ...ownerWhere },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    const groupContacts = await prisma.groupContact.findMany({
      where: { groupId: group.id },
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

// Add single or multiple numbers to a group (scoped to tenant's ContactGroup)
export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const groupId = String(body?.groupId || "").trim();
    const { number, name, contacts } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const group = await prisma.contactGroup.findFirst({
      where: { id: groupId, ...ownerWhere },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    // Bulk import support if `contacts` array is sent
    if (Array.isArray(contacts) && contacts.length > 0) {
      const rowsToInsert = contacts
        .map((item: any) => ({
          groupId: group.id,
          number: normalizeGroupPhoneNumber(item?.number ?? item),
          name: String(item?.name || "Member").trim() || "Member",
        }))
        .filter((r: { number: string }) => r.number.length > 0);

      if (rowsToInsert.length === 0) {
        return NextResponse.json(
          { error: "No valid numbers found to import" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.groupContact.createMany({
          data: rowsToInsert,
        });

        await tx.contactGroup.update({
          where: { id: group.id },
          data: { totalContacts: { increment: rowsToInsert.length } },
        });
      });

      return NextResponse.json({
        success: true,
        addedCount: rowsToInsert.length,
      });
    }

    // Single member add
    const cleanNumber = normalizeGroupPhoneNumber(number);
    if (!cleanNumber) {
      return NextResponse.json(
        { error: "groupId and valid number are required" },
        { status: 400 }
      );
    }

    const cleanName = String(name || "Member").trim() || "Member";

    const newContact = await prisma.$transaction(async (tx) => {
      const created = await tx.groupContact.create({
        data: {
          groupId: group.id,
          number: cleanNumber,
          name: cleanName,
        },
      });

      await tx.contactGroup.update({
        where: { id: group.id },
        data: { totalContacts: { increment: 1 } },
      });

      return created;
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

// Remove a number from a group (scoped to tenant's ContactGroup)
export async function DELETE(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const groupId = searchParams.get("groupId")?.trim();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const ownerWhere = getOwnerWhere(tenant);
    const member = await prisma.groupContact.findUnique({
      where: { id },
    });

    const targetGroupId = member?.groupId || groupId;
    if (!member || !targetGroupId) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const allowedGroup = await prisma.contactGroup.findFirst({
      where: { id: targetGroupId, ...ownerWhere },
    });

    if (!allowedGroup) {
      return NextResponse.json(
        { error: "Access denied for this group" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupContact.delete({
        where: { id: member.id },
      });

      const currentTotal = Number(allowedGroup.totalContacts ?? 0);
      await tx.contactGroup.update({
        where: { id: allowedGroup.id },
        data: {
          totalContacts:
            currentTotal > 0 ? { decrement: 1 } : 0,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting group contact:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}