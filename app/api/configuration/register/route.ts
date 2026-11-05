import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, website, name } = body;

    if (!code) {
      return NextResponse.json({ error: "Authorization code is missing" }, { status: 400 });
    }

    // Dummy ya generated details (Aap baad mein Meta Graph API token exchange se real details yahan map kar sakte hain)
    const mockWabaId = "WABA_" + Math.floor(100000 + Math.random() * 900000);
    const mockPhoneId = "PHONE_" + Math.floor(100000 + Math.random() * 900000);
    const mockDisplayPhone = "+91 98765 43210";
    const mockAccessToken = "EAAG_" + Math.random().toString(36).substring(2);

    // Pehle database se koi default user utha lete hain ya check karte hain
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

    // Save directly to WabaAccount table using Prisma
    const newAccount = await prisma.wabaAccount.create({
      data: {
        userId: defaultUser.id,
        wabaId: mockWabaId,
        phoneNumberId: mockPhoneId,
        displayPhone: mockDisplayPhone,
        accessToken: mockAccessToken,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}