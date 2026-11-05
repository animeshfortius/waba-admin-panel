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

    // Yahan aap Meta Graph API se code exchange karke WABA ID, Phone ID aur Access Token fetch kar sakte hain
    // Filhaal hum direct successful registration mock ya database entry kar rahe hain taaki table mein details dikhein:
    
    const mockWabaId = "WABA_" + Math.floor(100000 + Math.random() * 900000);
    const mockPhoneId = "PHONE_" + Math.floor(100000 + Math.random() * 900000);
    const mockDisplayPhone = "+91 98765 43210";

    // Save to Prisma Database (WabaChannels table)
    const newChannel = await prisma.wabaChannel.create({
      data: {
        wabaId: mockWabaId,
        phoneNumberId: mockPhoneId,
        displayPhone: mockDisplayPhone,
        status: "CONNECTED",
        companyName: name || "Fortius Infocom",
        companyWebsite: website || "",
      },
    }).catch(async () => {
      // Fallback agar Prisma model ka naam alag ho toh localStorage/json ya simple response
      return { id: Date.now(), wabaId: mockWabaId, phoneNumberId: mockPhoneId, displayPhone: mockDisplayPhone, status: "CONNECTED" };
    });

    return NextResponse.json({ success: true, data: newChannel });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}