import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const accounts = await prisma.wabaAccount.findMany({
      orderBy: { id: "desc" }
    });

    // Clean IDs and tokens right from backend before sending to frontend
    const sanitizedAccounts = accounts.map(acc => ({
      ...acc,
      wabaId: acc.wabaId ? acc.wabaId.replace("WABA_", "").trim() : "",
      phoneNumberId: acc.phoneNumberId ? acc.phoneNumberId.replace("PHONE_", "").trim() : "",
    }));

    return NextResponse.json(sanitizedAccounts);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate that required fields are actually provided from Meta Webhook/Embedded Signup
    if (!body.wabaId || !body.phoneNumberId || !body.accessToken) {
      return NextResponse.json({ error: "Missing required Meta credentials" }, { status: 400 });
    }

    const newChannel = await prisma.wabaAccount.create({
      data: {
        userId: body.userId || "default_user",
        wabaId: body.wabaId.replace("WABA_", "").trim(),
        phoneNumberId: body.phoneNumberId.replace("PHONE_", "").trim(),
        displayPhone: body.displayPhone || "",
        accessToken: body.accessToken,
        status: body.status || "ACTIVE",
        messagingLimit: "TIER_NOT_FOUND",
        qualityRating: "UNKNOWN"
      },
    });
    return NextResponse.json(newChannel);
  } catch (error) {
    console.error("Create Channel Error:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}