import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

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
    const channelId = String(body?.id || "").trim();

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);

    // Verify target channel belongs to the logged-in user's allowed scope
    const targetChannel = await prisma.wabaAccount.findFirst({
      where: {
        id: channelId,
        ...ownerWhere,
      },
    });

    if (!targetChannel) {
      return NextResponse.json(
        { success: false, error: "Channel not found or access denied" },
        { status: 404 }
      );
    }

    const updatedChannel = await prisma.$transaction(async (tx) => {
      await tx.wabaAccount.updateMany({
        where: ownerWhere,
        data: { isDefault: false },
      });

      return tx.wabaAccount.update({
        where: { id: targetChannel.id },
        data: { isDefault: true },
      });
    });

    return NextResponse.json({ success: true, data: updatedChannel });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update default channel",
      },
      { status: 500 }
    );
  }
}