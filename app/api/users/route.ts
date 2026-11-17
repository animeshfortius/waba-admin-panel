import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs"; // Agar bcrypt use hota hai toh password secure karne ke liye

const prisma = new PrismaClient();

// GET: Sabhi users ki list fetch karne ke liye
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Naya user create karne aur automatic API key generate karne ke liye
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Automatic Secure Unique Live API Key Generate karein (ft_live_...)
    const generatedApiKey = "ft_live_" + crypto.randomBytes(24).toString("hex");

    // 2. Password ko secure hash karna (agar plain password nahi chahiye)
    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : body.password;

    // 3. Database mein user create karte waqt apiKey pass kar dein
    const newUser = await prisma.user.create({
      data: {
        username: body.username || null,
        name: body.name || body.username || "Fortius User",
        email: body.email,
        password: hashedPassword,
        phone: body.phone || null,
        role: body.role || "USER",
        expiryDate: body.expiryDate ? String(body.expiryDate) : null, // Schema ke mutabiq String? handle kiya
        apiKey: generatedApiKey, // 👈 Account bante hi automatic real API key assign ho gayi!
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create user" }, { status: 500 });
  }
}