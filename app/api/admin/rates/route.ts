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
        utility: user?.utilityRate ?? 0.1150,
        service: user?.serviceRate ?? 0.1150,
        authentication: user?.authRate ?? 0.1150,
        marketing: user?.perMsgRate ?? 0.7850,
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

// 2. POST: Saare 4 rates ko Neon DB me save karna (Updated Standards)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, rates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Support both body.rates object and direct flat properties from frontend modal
    const utility = rates?.utility ?? body.utilityRate ?? 0.1150;
    const service = rates?.service ?? body.serviceRate ?? 0.1150;
    const authentication = rates?.authentication ?? body.authRate ?? 0.1150;
    const marketing = rates?.marketing ?? body.marketingRate ?? 0.7850;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        utilityRate: parseFloat(utility),
        serviceRate: parseFloat(service),
        authRate: parseFloat(authentication),
        perMsgRate: parseFloat(marketing),
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