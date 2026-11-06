import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const accounts = await prisma.wabaAccount.findMany({
      orderBy: { id: "desc" }
    });

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
    
    if (!body.wabaId || !body.phoneNumberId || !body.accessToken) {
      return NextResponse.json({ error: "Missing required Meta credentials" }, { status: 400 });
    }

    const cleanWabaId = body.wabaId.replace("WABA_", "").trim();
    const cleanPhoneId = body.phoneNumberId.replace("PHONE_", "").trim();

    const newChannel = await prisma.wabaAccount.upsert({
      where: { wabaId: cleanWabaId },
      update: {
        phoneNumberId: cleanPhoneId,
        displayPhone: body.displayPhone || "",
        accessToken: body.accessToken,
        status: body.status || "ACTIVE",
      },
      create: {
        userId: body.userId || "default_user",
        wabaId: cleanWabaId,
        phoneNumberId: cleanPhoneId,
        displayPhone: body.displayPhone || "",
        accessToken: body.accessToken,
        status: body.status || "ACTIVE",
        messagingLimit: "TIER_NOT_FOUND",
        qualityRating: "UNKNOWN"
      },
    });

    return NextResponse.json(newChannel);
  } catch (error) {
    console.error("Create/Upsert Channel Error:", error);
    return NextResponse.json({ error: "Failed to save channel" }, { status: 500 });
  }
}