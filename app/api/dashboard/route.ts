import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Aap yahan database se real stats fetch kar sakte hain ya mock data bhej sakte hain
    const stats = {
      totalSent: 0,
      totalDelivered: 0,
      deliveredAndRead: 0,
      failed: 0,
      marketingTotal: 0,
      marketingDelivered: 0,
      utilityTotal: 0,
      utilityDelivered: 0,
      authTotal: 0,
      authDelivered: 0,
    };
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}