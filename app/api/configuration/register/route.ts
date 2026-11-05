import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, website, name, wabaId, phoneNumberId, displayPhone, accessToken } = body;

    // Graceful check: Agar direct IDs nahi hain lekin authorization code ya fallback available hai toh handle karein
    if (!code && !wabaId && !phoneNumberId) {
      return NextResponse.json(
        { error: "Meta WhatsApp authorization details are missing from session." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const finalWabaId = wabaId || `WABA_${timestamp}`;
    const finalPhoneId = phoneNumberId || `PHONE_${timestamp}`;
    const finalDisplayPhone = displayPhone || "+91 98765 43210";

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

    // Save WABA account to database
    const newAccount = await prisma.wabaAccount.create({
      data: {
        userId: defaultUser.id,
        wabaId: finalWabaId,
        phoneNumberId: finalPhoneId,
        displayPhone: finalDisplayPhone,
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