import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support both username, email, or identifier fields from frontend
    const identifier = body.username || body.email || body.identifier;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/Email and password are required" }, { status: 400 });
    }

    // 1. Check if user exists by username OR email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 3. Create response and set cookies
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    };

    // FIX: Set BOTH "userId" (for middleware & impersonation) and "token" (for compatibility)
    response.cookies.set("userId", user.id, cookieOptions);
    response.cookies.set("token", user.id, cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}