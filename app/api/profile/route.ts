import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import crypto from "crypto";

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  image: true,
  role: true,
  apiKey: true,
  walletBalance: true,
  createdAt: true,
};

function resolveScopedUserId(tenant: any, requestedUserId?: string): string {
  const cleanRequested = String(requestedUserId || "").trim();
  if (
    cleanRequested &&
    cleanRequested !== "undefined" &&
    cleanRequested !== "null" &&
    (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(cleanRequested))
  ) {
    return cleanRequested;
  }
  return String(tenant.userId || "").trim();
}

// GET: Fetch scoped user profile and ensure apiKey exists
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
    const requestedUserId = searchParams.get("userId") || "";
    const targetUserId = resolveScopedUserId(tenant, requestedUserId);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Scoped user context missing" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: SAFE_USER_SELECT,
    });

    if (!user && tenant.isSuperAdmin) {
      user = await prisma.user.create({
        data: {
          name: "Admin",
          email: "info@fortiusinfocom.com",
          password: crypto.randomBytes(16).toString("hex"),
          phone: "8052058888",
          role: "SUPER_ADMIN",
          apiKey: "ft_live_" + crypto.randomBytes(24).toString("hex"),
        },
        select: SAFE_USER_SELECT,
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.apiKey) {
      const generatedKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
      user = await prisma.user.update({
        where: { id: user.id },
        data: { apiKey: generatedKey },
        select: SAFE_USER_SELECT,
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("GET Profile Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}

// POST & PUT: Update scoped user profile
export async function POST(request: Request) {
  return handleProfileUpdate(request);
}

export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedUserId = body?.userId ? String(body.userId) : "";
    const targetUserId = resolveScopedUserId(tenant, requestedUserId);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Scoped user context missing" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof body?.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body?.phone === "string" && body.phone.trim()) {
      updateData.phone = body.phone.trim();
    }
    if (body?.image !== undefined) {
      updateData.image = String(body.image || "");
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update profile",
      },
      { status: 500 }
    );
  }
}