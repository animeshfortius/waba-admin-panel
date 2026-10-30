import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Sabhi users ki list fetch karne ke liye
export async function GET() {
  try {
    const users = await (prisma as any).user.findMany({
      orderBy: { id: "desc" },
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

    // 1. Automatic Unique API Key Generate karein
    const generatedApiKey = "waba_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // 2. Database mein user create karte waqt apiKey pass kar dein
    const newUser = await (prisma as any).user.create({
      data: {
        username: body.username,
        name: body.name || body.username,
        email: body.email,
        password: body.password,
        phone: body.phone,
        role: body.role || "USER",
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        apiKey: generatedApiKey, // 👈 Yahan automatic key assign ho jayegi
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create user" }, { status: 500 });
  }
}