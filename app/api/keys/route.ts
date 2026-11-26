import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId")?.trim() || "";

    const ownerWhere = getOwnerWhere(tenant);
    const whereClause: any = { ...ownerWhere };

    if (
      requestedUserId &&
      requestedUserId !== "ALL" &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null"
    ) {
      if (
        !tenant.isSuperAdmin &&
        !tenant.allowedUserIds?.includes(requestedUserId)
      ) {
        return NextResponse.json([]);
      }
      whereClause.userId = requestedUserId;
    }

    const keys = await (prisma as any).apiKey.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error: any) {
    console.error("GET API Keys Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch API keys" },
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

    const body = await request.json().catch(() => ({}));
    const requestedUserId = body?.userId ? String(body.userId).trim() : "";

    const targetOwnerId =
      requestedUserId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedUserId))
        ? requestedUserId
        : tenant.userId;

    const cleanName = String(body?.name || "Default Key").trim() || "Default Key";
    const generatedKey = "waba_" + crypto.randomBytes(24).toString("hex");

    const newKey = await (prisma as any).apiKey.create({
      data: {
        userId: targetOwnerId,
        name: cleanName,
        key: generatedKey,
      },
    });

    return NextResponse.json(newKey);
  } catch (error: any) {
    console.error("POST API Key Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate API key" },
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
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await (prisma as any).apiKey.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "API key not found or access denied" },
        { status: 404 }
      );
    }

    await (prisma as any).apiKey.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE API Key Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete API key" },
      { status: 500 }
    );
  }
}