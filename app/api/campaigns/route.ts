import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function GET() {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const ownerWhere = getOwnerWhere(tenant);
    const campaigns = await (prisma as any).campaign.findMany({
      where: ownerWhere,
      orderBy: { id: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

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
    const campaignName = String(body?.name || "").trim();
    const templateName = String(body?.templateName || "").trim();

    if (!campaignName || !templateName) {
      return NextResponse.json(
        { error: "Campaign name and template name are required" },
        { status: 400 }
      );
    }

    const isScheduled = Boolean(body.isScheduled && body.scheduleDate);
    let parsedScheduleDate: Date | null = null;
    if (body.scheduleDate) {
      parsedScheduleDate = new Date(body.scheduleDate);
      if (Number.isNaN(parsedScheduleDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduleDate format" },
          { status: 400 }
        );
      }
    }

    const targetUserId =
      body.userId &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(body.userId))
        ? body.userId
        : tenant.userId;

    const newCampaign = await (prisma as any).campaign.create({
      data: {
        userId: targetUserId,
        name: campaignName,
        templateName,
        groupName: body.groupName ? String(body.groupName).trim() : null,
        status: isScheduled ? "SCHEDULED" : body.status || "COMPLETED",
        scheduledAt: parsedScheduleDate,
        sentCount: Number(body.sentCount) || 0,
      },
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}

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
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existing = await (prisma as any).campaign.findFirst({
      where: { id, ...ownerWhere },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found or access denied" },
        { status: 404 }
      );
    }

    await (prisma as any).campaign.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/campaigns error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete campaign" },
      { status: 500 }
    );
  }
}