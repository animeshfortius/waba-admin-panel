import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "admin";

    const isAdmin =
      userId === "admin" ||
      userId === "emergency-admin-id" ||
      userId === "emergency_admin_id";

    const sessions = await prisma.chatSession.findMany({
      where: isAdmin ? {} : { userId },
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, isBotActive, status, assignedTo } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(typeof isBotActive === "boolean" && { isBotActive }),
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}