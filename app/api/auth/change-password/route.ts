import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant-auth";

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { userId, currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Sari fields bharni zaroori hain!" },
        { status: 400 }
      );
    }

    const targetUserId = userId ? String(userId).trim() : tenant.userId;

    const isAllowedTarget =
      targetUserId === tenant.userId ||
      Boolean(tenant.isSuperAdmin) ||
      Boolean(tenant.allowedUserIds?.includes(targetUserId));

    if (!isAllowedTarget) {
      return NextResponse.json(
        { error: "Access denied for this user account" },
        { status: 403 }
      );
    }

    // User ko database mein dhoondhein
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User nahi mila!" }, { status: 404 });
    }

    // Current password match check karein
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password galat hai!" },
        { status: 400 }
      );
    }

    // Naye password ko hash karein
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Database mein password update karein
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password successfully update ho gaya hai!",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Kuch galat ho gaya, dobara try karein." },
      { status: 500 }
    );
  }
}