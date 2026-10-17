import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: Fetch user's message rate
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

    const currentRate = user?.perMsgRate ?? 0.8046;

    return NextResponse.json({
      success: true,
      rates: {
        utility: currentRate,
        service: currentRate,
        authentication: currentRate,
        marketing: currentRate,
      },
    });
  } catch (error: any) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. POST: Save message rate to database
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, rates } = body;

    if (!userId || !rates) {
      return NextResponse.json(
        { success: false, message: "User ID and rates are required" },
        { status: 400 }
      );
    }

    // Since schema has perMsgRate, we use marketing rate (or any of the rates provided)
    const newRate = parseFloat(rates.marketing || rates.utility || 0.8046);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        perMsgRate: newRate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rates updated successfully in database!",
      rates: {
        utility: updatedUser.perMsgRate,
        service: updatedUser.perMsgRate,
        authentication: updatedUser.perMsgRate,
        marketing: updatedUser.perMsgRate,
      },
    });
  } catch (error: any) {
    console.error("Error updating rates:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}