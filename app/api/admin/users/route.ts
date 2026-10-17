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
    const { name, email, password, role, phone, expiryDate } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
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
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        phone: phone || "",
        expiryDate: expiryDate || null,git add .
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Agar bcrypt use ho raha hai, nahi toh plain/hashed password

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ success: false, message: "User ID and new password are required." }, { status: 400 });
    }

    // Password ko secure hash karna (optional agar plain text save karna ho toh seedha password daal sakte hain)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Database me user ka password update karna
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully in database!" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}