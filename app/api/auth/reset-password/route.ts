import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, newPassword } = await req.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Username and new password are required" },
        { status: 400 }
      );
    }

    const trimmedUser = username.trim();
    const trimmedPass = newPassword.trim();

    // Find user by username or email
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

    // Update password in Neon Database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: trimmedPass },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now login.",
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
      redirectUrl: updatedUser.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}