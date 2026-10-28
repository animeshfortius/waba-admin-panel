import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    let authUser: any = null;

    // 🚀 EMERGENCY BACKDOOR: Admin login check
    if (username.toLowerCase() === "admin" && password === "Admin@123") {
      // Database me check karo agar admin pehle se hai, warna virtual admin object do
      authUser = await prisma.user.findFirst({
        where: { OR: [{ username: "admin" }, { email: "admin@admin.com" }] },
      });

      if (!authUser) {
        // Agar DB me admin nahi hai toh default SUPER_ADMIN maan lo
        authUser = {
          id: "emergency-admin-id",
          username: "admin",
          email: "admin@admin.com",
          role: "SUPER_ADMIN",
        };
      }
    } else {
      // Normal Database Check for users/resellers/admins
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: "insensitive" } },
            { email: { equals: username, mode: "insensitive" } },
          ],
        },
      });

      if (!user || user.password !== password) {
        return NextResponse.json(
          { success: false, message: "Invalid username or password" },
          { status: 401 }
        );
      }
      authUser = user;
    }

    // JWT Token Generate karo jisme role bhi ho
    const token = jwt.sign(
      { userId: authUser.id, role: authUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Response object with user role data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        role: authUser.role,
      },
    });

    // Set both token and userId cookies securely
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("userId", authUser.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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