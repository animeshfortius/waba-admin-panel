import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Aapka prisma client path
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, walletBalance } = body;

    // Check karein agar user pehle se exist karta hai
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
    }

    // Password hash karein
    const hashedPassword = await bcrypt.hash(password, 10);

    // Database me user create karein
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        walletBalance: parseFloat(walletBalance) || 0,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}