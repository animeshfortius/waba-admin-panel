import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const groups = await prisma.contactGroup.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const cleanGroupName = String(body?.groupName || "").trim();
    if (!cleanGroupName) {
      return NextResponse.json(
        { success: false, error: "Group name is required" },
        { status: 400 }
      );
    }

    const targetUserId =
      body?.userId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(body.userId))
        ? body.userId
        : tenant.userId;

    const newGroup = await prisma.contactGroup.create({
      data: {
        groupName: cleanGroupName,
        totalContacts: 0,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    const cleanGroupName = String(body?.groupName || "").trim();

    if (!id || !cleanGroupName) {
      return NextResponse.json(
        { success: false, error: "ID and Group Name required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.contactGroup.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.contactGroup.update({
      where: { id: existing.id },
      data: { groupName: cleanGroupName },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Group ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.contactGroup.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Group not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupContact.deleteMany({ where: { groupId: existing.id } });
      await tx.contactGroup.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}