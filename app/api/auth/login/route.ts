import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Check if user exists by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 3. Return user data
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}