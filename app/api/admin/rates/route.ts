import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// User rates fetch karne ke liye (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { perMsgRate: true },
    });

    return NextResponse.json({
      success: true,
      perMsgRate: user?.perMsgRate || 0.80,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// User rates update karne ke liye (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, perMsgRate } = body;

    if (!userId || perMsgRate === undefined) {
      return NextResponse.json(
        { success: false, message: "User ID and perMsgRate are required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { perMsgRate: parseFloat(perMsgRate) },
    });

    return NextResponse.json({
      success: true,
      message: "Rates updated successfully!",
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}