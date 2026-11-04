import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, requesterId } = await req.json();

    if (!userId || !requesterId) {
      return NextResponse.json({ error: "Data adhura hai!" }, { status: 400 });
    }

    // 1. Check karo ki delete request bhejne wala kaun hai
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });

    // 2. Strict Permission Check: Sirf SUPER_ADMIN ya ADMIN hi delete kar sakta hai
    if (!requester || (requester.role !== "SUPER_ADMIN" && requester.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Access Denied: Aapke paas account delete karne ki authority nahi hai!" },
        { status: 403 }
      );
    }

    // 3. Database dependencies clear karo taaki foreign key error na aaye
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

    // 4. Finally User ko delete kar do
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Account successfully permanent delete ho gaya hai!",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "User delete karne mein database error aaya hai." },
      { status: 500 }
    );
  }
}