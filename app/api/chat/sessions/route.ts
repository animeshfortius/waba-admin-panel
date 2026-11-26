import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function GET(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

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
        return NextResponse.json({ success: true, sessions: [] });
      }
      whereClause.userId = requestedUserId;
    }

    const sessions = await prisma.chatSession.findMany({
      where: whereClause,
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const sessionId = String(body?.sessionId || "").trim();
    const { isBotActive, status, assignedTo } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        ...ownerWhere,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.chatSession.update({
      where: { id: existing.id },
      data: {
        ...(typeof isBotActive === "boolean" && { isBotActive }),
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}