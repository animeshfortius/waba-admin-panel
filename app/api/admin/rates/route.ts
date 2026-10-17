import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch selected user rates from Neon PostgreSQL
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { perMsgRate: true },
    });

    return NextResponse.json({
      success: true,
      perMsgRate: user?.perMsgRate || 0.8046,
    });
  } catch (error: any) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Save selected user rates to Neon PostgreSQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, perMsgRate } = body;

    if (!userId || perMsgRate === undefined) {
      return NextResponse.json(
        { success: false, message: "User ID and rate required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        perMsgRate: parseFloat(perMsgRate),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rates updated and saved successfully in database!",
      perMsgRate: updatedUser.perMsgRate,
    });
  } catch (error: any) {
    console.error("Error updating rates:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}