import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

function normalizeBlacklistNumber(rawNumber: unknown): string {
  let cleaned = String(rawNumber ?? "").replace(/\D/g, "").trim();
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

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
    const blacklist = await prisma.blacklistNumber.findMany({
      where: ownerWhere,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blacklist);
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

    if (Array.isArray(body)) {
      let count = 0;
      for (const item of body) {
        const cleanNum = normalizeBlacklistNumber(item?.number);
        if (!cleanNum) continue;

        const requestedItemUserId = item?.userId;
        const itemOwnerId =
          requestedItemUserId &&
          (tenant.isSuperAdmin ||
            tenant.allowedUserIds?.includes(requestedItemUserId))
            ? requestedItemUserId
            : tenant.userId;

        const existing = await prisma.blacklistNumber.findFirst({
          where: { number: cleanNum, userId: itemOwnerId },
        });

        if (!existing) {
          await prisma.blacklistNumber.create({
            data: { number: cleanNum, userId: itemOwnerId },
          });
          count++;
        }
      }
      return NextResponse.json({ success: true, count });
    }

    const targetUserId =
      body?.userId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(body.userId))
        ? body.userId
        : tenant.userId;

    const cleanNumber = normalizeBlacklistNumber(body?.number);
    if (!cleanNumber) {
      return NextResponse.json(
        { success: false, error: "Valid number is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.blacklistNumber.findFirst({
      where: { number: cleanNumber, userId: targetUserId },
    });

    const blocked =
      existing ||
      (await prisma.blacklistNumber.create({
        data: { number: cleanNumber, userId: targetUserId },
      }));

    return NextResponse.json({ success: true, blocked });
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
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.blacklistNumber.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Record not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.blacklistNumber.delete({ where: { id: existing.id } });

    return NextResponse.json({
      success: true,
      message: "Number unblocked successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}