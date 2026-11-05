import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, wabaId, phoneNumberId, displayPhone, name, website, accessToken } = body;

    // Strict validation: Agar frontend se real IDs nahi aayi toh error do
    if (!wabaId || !phoneNumberId) {
      console.error("Missing Meta IDs in payload:", body);
      return NextResponse.json(
        { error: "Meta se real WABA ID / Phone ID receive nahi hui. Please try again." },
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

    // Save/Update Real Data in Database securely
    const newAccount = await prisma.wabaAccount.upsert({
      where: { wabaId: wabaId },
      update: {
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || code || "",
        displayName: name || "WhatsApp Business",
        website: website || "",
        status: "ACTIVE",
      },
      create: {
        userId: defaultUser.id,
        wabaId: wabaId,
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || code || "",
        displayName: name || "WhatsApp Business",
        website: website || "",
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}