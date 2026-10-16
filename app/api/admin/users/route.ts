import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, username, email, password, role, createdById, walletBalance, perMsgRate } = await req.json();

    // 1. Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // 3. Create new user with username
    const newUser = await prisma.user.create({
      data: {
        name,
        username, // Yahan username add kar diya gaya hai
        email,
        password,
        role: role as "RESELLER" | "USER",
        createdById,
        walletBalance: walletBalance ? parseFloat(walletBalance) : 0,
        perMsgRate: perMsgRate ? parseFloat(perMsgRate) : 0.80,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}