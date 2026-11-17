import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// GET: Profile fetch karne aur apiKey auto-generate karne ke liye
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    // Agar ID se user na mile, toh database ka pehla user utha lo
    if (!user) {
      user = await prisma.user.findFirst();
    }

    // Agar database bilkul khali ho, toh default admin user bana do
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Admin",
          email: "info@fortiusinfocom.com",
          password: "default_password",
          phone: "8052058888",
          role: "SUPER_ADMIN",
        },
      });
    }

    // Agar apiKey na ho toh generate karke save kar do
    if (!user.apiKey) {
      const generatedKey = "ft_live_" + crypto.randomBytes(24).toString("hex");
      user = await prisma.user.update({
        where: { id: user.id },
        data: { apiKey: generatedKey },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

// POST & PUT: Profile update karne ke liye (Fail-safe logic)
export async function POST(request: Request) {
  return handleProfileUpdate(request);
}

export async function PUT(request: Request) {
  return handleProfileUpdate(request);
}

async function handleProfileUpdate(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, phone, image } = body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    // Agar ID na mile toh database ka pehla user target karo
    if (!user) {
      user = await prisma.user.findFirst();
    }

    let updatedUser;
    if (user) {
      // User mil gaya toh update kar do
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(image !== undefined && { image }), // 👈 Yahan image safely save ho jayegi
        },
      });
    } else {
      // Agar ek bhi user na ho toh naya create kar do
      updatedUser = await prisma.user.create({
        data: {
          name: name || "Admin",
          email: "info@fortiusinfocom.com",
          password: "default_password",
          phone: phone || "8052058888",
          image: image || "",
          role: "SUPER_ADMIN",
        },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
  }
}