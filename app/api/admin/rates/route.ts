import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseRateValue(val: unknown, fallback: number): number {
  const num = Number(val);
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Number(num.toFixed(4));
}

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
        id: true,
        perMsgRate: true,
        utilityRate: true,
        serviceRate: true,
        authRate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rates: {
        utility: user.utilityRate ?? 0.115,
        service: user.serviceRate ?? 0.115,
        authentication: user.authRate ?? 0.115,
        marketing: user.perMsgRate ?? 0.785,
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

// 2. POST: Saare 4 rates ko database me save karna
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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const utility = parseRateValue(rates?.utility ?? body.utilityRate, 0.115);
    const service = parseRateValue(rates?.service ?? body.serviceRate, 0.115);
    const authentication = parseRateValue(
      rates?.authentication ?? body.authRate,
      0.115
    );
    const marketing = parseRateValue(
      rates?.marketing ?? body.marketingRate,
      0.785
    );

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        utilityRate: utility,
        serviceRate: service,
        authRate: authentication,
        perMsgRate: marketing,
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