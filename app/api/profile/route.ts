import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET: Profile fetch karne aur apiKey auto-generate karne ke liye
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "default_user";

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.apiKey) {
      const generatedKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
      user = await prisma.user.update({
        where: { id: userId },
        data: { apiKey: generatedKey }
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

// POST: Profile update karne ke liye
export async function POST(request: Request) {
  return handleProfileUpdate(request);
}

// PUT: Frontend agar PUT request bhej raha hai toh usko bhi yahin handle karenge
export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

// Common function profile update logic ke liye
async function handleProfileUpdate(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, phone, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId || "default_user" },
      data: {
        name,
        phone,
        image, // 👈 Ab image bhi successfully database mein save ho jayegi!
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
  }
}