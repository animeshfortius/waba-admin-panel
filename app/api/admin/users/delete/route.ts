import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, requesterId } = await req.json();

    if (!userId || !requesterId) {
      return NextResponse.json(
        { error: "Invalid request parameters." },
        { status: 400 }
      );
    }

    // 1. Fetch requester details
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });

    // 2. Strict Permission Check: Pure English professional error message
    const requesterRole = String(requester?.role || "");
    if (!requester || (requesterRole !== "SUPER_ADMIN" && requesterRole !== "ADMIN")) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to delete accounts." },
        { status: 403 }
      );
    }

    // 3. Clear database dependencies
    await prisma.walletTransaction.deleteMany({
      where: { userId },
    });

    await prisma.wabaAccount.deleteMany({
      where: { userId },
    });

    await prisma.user.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    });

    // 4. Delete User
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User account has been permanently deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user due to a database constraint error." },
      { status: 500 }
    );
  }
}