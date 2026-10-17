import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: User ke saare WhatsApp rates fetch karne ke liye
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
        perMsgRate: true, // Marketing rate
        utilityRate: true,
        serviceRate: true,
        authRate: true,
      } as any,
    });

    return NextResponse.json({
      success: true,
      rates: {
        utility: (user as any)?.utilityRate ?? 0.1550,
        service: (user as any)?.serviceRate ?? 0.1550,
        authentication: (user as any)?.authRate ?? 0.1550,
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

// 2. POST: Chaaron rates ko Neon PostgreSQL Database me save karne ke liye
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

    const updatedData: any = {
      perMsgRate: parseFloat(rates.marketing),
    };

    if (rates.utility !== undefined) updatedData.utilityRate = parseFloat(rates.utility);
    if (rates.service !== undefined) updatedData.serviceRate = parseFloat(rates.service);
    if (rates.authentication !== undefined) updatedData.authRate = parseFloat(rates.authentication);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    return NextResponse.json({
      success: true,
      message: "All WhatsApp rates updated successfully in database!",
      rates: {
        utility: (updatedUser as any)?.utilityRate ?? rates.utility,
        service: (updatedUser as any)?.serviceRate ?? rates.service,
        authentication: (updatedUser as any)?.authRate ?? rates.authentication,
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