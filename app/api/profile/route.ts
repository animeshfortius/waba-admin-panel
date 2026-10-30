import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    let user = await (prisma as any).user.findUnique({
      where: { id: userId },
    });

    // Agar user ke paas API key nahi hai, toh automatic generate karke save kar do
    if (user && !user.apiKey) {
      const generatedKey = "waba_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = await (prisma as any).user.update({
        where: { id: userId },
        data: { apiKey: generatedKey }
      });
    }

    return NextResponse.json(user || { error: "User not found" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, mobile, address, city, state, pinCode } = body;

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId || "default_user" },
      data: {
        name,
        mobile,
        address,
        city,
        state,
        pinCode,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}