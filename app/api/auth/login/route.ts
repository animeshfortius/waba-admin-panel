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
    let assignedRole = "USER";

    // 🚀 EMERGENCY BACKDOOR / ADMIN CHECK
    if (username.toLowerCase() === "admin" && password === "Admin@123") {
      assignedRole = "SUPER_ADMIN";
      authUser = await prisma.user.findFirst({
        where: { OR: [{ username: "admin" }, { email: "admin@admin.com" }] },
      });

      if (!authUser) {
        authUser = {
          id: "emergency-admin-id",
          username: "admin",
          email: "admin@admin.com",
          role: "SUPER_ADMIN",
        };
      } else {
        authUser.role = "SUPER_ADMIN"; // Forcefully override to SUPER_ADMIN
      }
    } else {
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
      assignedRole = user.role;
    }

    // JWT Token with correct role
    const token = jwt.sign(
      { userId: authUser.id, role: assignedRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email,
        role: assignedRole, // Guaranteed SUPER_ADMIN for admin
      },
    });

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