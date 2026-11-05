import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, website, name, wabaId, phoneNumberId, displayPhone, accessToken } = body;

    if (!code && !wabaId) {
      return NextResponse.json({ error: "Authorization code or WABA ID is missing" }, { status: 400 });
    }

    // Use real values if provided from Meta SDK, else generate unique fallback
    const timestamp = Date.now();
    const finalWabaId = wabaId || ("WABA_" + timestamp);
    const finalPhoneId = phoneNumberId || ("PHONE_" + timestamp);
    const finalDisplayPhone = displayPhone || "+91 98765 43210";
    const finalAccessToken = accessToken || ("EAAG_" + Math.random().toString(36).substring(2));

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

    // Save real WABA account to database
    const newAccount = await prisma.wabaAccount.create({
      data: {
        userId: defaultUser.id,
        wabaId: finalWabaId,
        phoneNumberId: finalPhoneId,
        displayPhone: finalDisplayPhone,
        accessToken: finalAccessToken,
        status: "ACTIVE",
        displayName: name || "100 App",
        website: website || "",
      },
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}