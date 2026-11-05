import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, website, name, wabaId, phoneNumberId, displayPhone, accessToken } = body;

    // STRICT VALIDATION: Koi bhi dummy fallback nahi! Meta se real ID aana mandatory hai.
    if (!wabaId || !phoneNumberId) {
      console.error("Meta Session Missing Payload:", body);
      return NextResponse.json(
        { error: "Meta WhatsApp session details (WABA ID / Phone ID) nahi mili. Kripya popup dobara khol kar number select karein." },
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

    // Check karein ki kya yeh WABA ID pehle se registered hai
    const existingAccount = await prisma.wabaAccount.findUnique({
      where: { wabaId: wabaId },
    });

    if (existingAccount) {
      // Agar pehle se hai toh update kar do real data ke sath
      const updatedAccount = await prisma.wabaAccount.update({
        where: { wabaId: wabaId },
        data: {
          phoneNumberId: phoneNumberId,
          displayPhone: displayPhone || existingAccount.displayPhone,
          accessToken: accessToken || code || existingAccount.accessToken,
          displayName: name || existingAccount.displayName,
          website: website || existingAccount.website,
          status: "ACTIVE",
        },
      });
      return NextResponse.json({ success: true, data: updatedAccount });
    }

    // Naya real account create karo (No Dummy Values)
    const newAccount = await prisma.wabaAccount.create({
      data: {
        userId: defaultUser.id,
        wabaId: wabaId,
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || code || "",
        status: "ACTIVE",
        displayName: name || "WhatsApp Business",
        website: website || "",
      },
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}