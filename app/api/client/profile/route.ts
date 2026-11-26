import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";
import crypto from "crypto";

function sanitizeUser(user: any) {
  if (!user) return null;
  const { password: _hiddenPassword, ...safeUser } = user;
  return safeUser;
}

function canAccessUser(tenant: any, targetUserId: string) {
  if (!targetUserId) return false;
  return (
    targetUserId === tenant.userId ||
    Boolean(tenant.isSuperAdmin) ||
    Boolean(tenant.allowedUserIds?.includes(targetUserId))
  );
}

// GET: Profile fetch karne aur apiKey auto-generate karne ke liye
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
    const requestedUserId = searchParams.get("userId")?.trim();
    const targetUserId = requestedUserId || tenant.userId;

    if (!canAccessUser(tenant, targetUserId)) {
      return NextResponse.json(
        { success: false, error: "Access denied for this user profile" },
        { status: 403 }
      );
    }

    let user = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!user && targetUserId === "emergency-admin-id") {
      return NextResponse.json({
        success: true,
        user: {
          id: "emergency-admin-id",
          username: "admin",
          name: "Super Admin",
          email: "admin@admin.com",
          phone: "",
          role: "SUPER_ADMIN",
          apiKey: null,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Agar apiKey na ho toh generate karke save kar do
    if (!user.apiKey) {
      const generatedKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
      user = await prisma.user.update({
        where: { id: user.id },
        data: { apiKey: generatedKey },
      });
    }

    return NextResponse.json({ success: true, user: sanitizeUser(user) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST & PUT: Profile update karne ke liye
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

    const body = await request.json();
    const requestedUserId = body?.userId ? String(body.userId).trim() : "";
    const targetUserId = requestedUserId || tenant.userId;

    if (!canAccessUser(tenant, targetUserId)) {
      return NextResponse.json(
        { success: false, error: "Access denied for this user profile" },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { name, phone, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...(name !== undefined && String(name).trim()
          ? { name: String(name).trim() }
          : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}