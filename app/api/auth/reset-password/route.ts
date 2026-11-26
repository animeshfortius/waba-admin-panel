import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant-auth";

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, message: "Unauthorized session" },
        { status: 401 }
      );
    }

    const { username, newPassword } = await req.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and new password are required",
        },
        { status: 400 }
      );
    }

    const trimmedUser = String(username).trim();
    const trimmedPass = String(newPassword).trim();

    if (trimmedPass.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmedUser, mode: "insensitive" } },
          { email: { equals: trimmedUser, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found with this username!" },
        { status: 404 }
      );
    }

    const isAllowedTarget =
      user.id === tenant.userId ||
      Boolean(tenant.isSuperAdmin) ||
      Boolean(tenant.allowedUserIds?.includes(user.id));

    if (!isAllowedTarget) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied: cannot reset password outside your scope",
        },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(trimmedPass, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    const normalizedRole = String(updatedUser.role || "USER")
      .trim()
      .toUpperCase();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now login.",
      user: {
        id: updatedUser.id,
        role: normalizedRole,
      },
      redirectUrl: normalizedRole === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}