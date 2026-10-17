import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: User ke sabhi 4 categories ke rates fetch karna
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
      select: {
        perMsgRate: true,
        utilityRate: true,
        serviceRate: true,
        authRate: true,
      },
    });

    return NextResponse.json({
      success: true,
      rates: {
        utility: user?.utilityRate ?? 0.1550,
        service: user?.serviceRate ?? 0.1550,
        authentication: user?.authRate ?? 0.1550,
        marketing: user?.perMsgRate ?? 0.8046,
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

// 2. POST: Saare 4 rates ko alag-alag Neon DB me save karna
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, rates } = body;

    if (!userId || !rates) {
      return NextResponse.json(
        { success: false, message: "User ID and rates object are required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        utilityRate: parseFloat(rates.utility || 0.1550),
        serviceRate: parseFloat(rates.service || 0.1550),
        authRate: parseFloat(rates.authentication || 0.1550),
        perMsgRate: parseFloat(rates.marketing || 0.8046),
      },
    });

    return NextResponse.json({
      success: true,
      message: "All WhatsApp rates updated successfully!",
      rates: {
        utility: updatedUser.utilityRate,
        service: updatedUser.serviceRate,
        authentication: updatedUser.authRate,
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