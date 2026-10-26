import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 1. Browser me URL kholne par saare users dikhane ke liye (GET Request)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. Naya User Create karne ke liye (POST Request)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, name, email, password, role, phone, expiryDate } = body;

    const finalUsername = username || name;

    if (!finalUsername || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: finalUsername },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash the password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Role mapping to match Prisma Enum (RESELLER or USER)
    const assignedRole = role === "RESELLER" ? "RESELLER" : "USER";

    // Create user in Neon PostgreSQL database
    const newUser = await prisma.user.create({
      data: {
        username: finalUsername,
        name: finalUsername,
        email,
        password: hashedPassword,
        role: assignedRole,
        phone: phone || "",
        expiryDate: expiryDate ? String(expiryDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}