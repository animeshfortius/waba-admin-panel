import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, website, name, wabaId, phoneNumberId, displayPhone, accessToken } = body;

    // Strict validation: Meta se WABA ID aur Phone Number ID aana mandatory hai
    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Meta WhatsApp Business Account (WABA ID) or Phone Number ID is missing from session." },
        { status: 400 }
      );
    }

    // Get or create default user
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: name || "Admin User",
          email: "admin@fortius.in",
          password: "password123",
        },
      });
    }

    // Save exact real data from Meta to database (No mock fallbacks)
    const newAccount = await prisma.wabaAccount.create({
      data: {
        userId: defaultUser.id,
        wabaId: wabaId,
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || code || "",
        status: "ACTIVE",
        displayName: name || displayPhone || "WhatsApp Business",
        website: website || "",
      },
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}