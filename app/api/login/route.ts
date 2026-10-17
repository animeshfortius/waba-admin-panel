import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const inputUser = username.trim();
    const inputPass = password.trim();

    // 1. Search user by username or email (case-insensitive)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: inputUser, mode: "insensitive" } },
          { email: { equals: inputUser, mode: "insensitive" } },
        ],
      },
    });

    // 2. Fallback: If logging in as 'admin' and not found in DB, check for any SUPER_ADMIN
    if (!user && inputUser.toLowerCase() === "admin") {
      user = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
    }

    // 3. Verify user and password
    if (!user || user.password !== inputPass) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // 4. Successful Login
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      redirectUrl: user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    });

    response.cookies.set("userId", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}