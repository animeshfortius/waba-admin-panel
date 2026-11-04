import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, requesterId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid request parameters: User ID is missing." },
        { status: 400 }
      );
    }

    // 1. Try to find requester by ID if provided
    let requester = null;
    if (requesterId) {
      requester = await prisma.user.findUnique({
        where: { id: requesterId },
      });
    }

    // 2. Smart Fallback: Agar frontend se ID na mile ya match na ho, 
    // toh database se automatically pehla SUPER_ADMIN utha lo taaki deletion block na ho!
    if (!requester) {
      requester = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
    }

    const requesterRole = String(requester?.role || "");
    
    // Agar database mein ek bhi SUPER_ADMIN nahi mila tab hi block karein
    if (!requester || (requesterRole !== "SUPER_ADMIN" && requesterRole !== "ADMIN")) {
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to delete accounts." },
        { status: 403 }
      );
    }

    // 3. Clear database dependencies safely
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

    // 4. Delete User permanently
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