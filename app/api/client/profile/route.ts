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

// PUT: Profile update karne ke liye (frontend PUT request bhej raha hai)
export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

// Common function profile aur image update logic ke liye
async function handleProfileUpdate(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, phone, image } = body;
    const targetUserId = userId || body.id || "default_user";

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(image !== undefined && { image }), // 👈 Yahan profile picture Base64/URL format mein save ho jayegi
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
  }
}