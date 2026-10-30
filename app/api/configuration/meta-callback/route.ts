import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, userId, companyName } = body;

    // 1. Exchange code for access token from Meta Graph API (Standard Flow)
    // Yahan aap apna Meta App ID aur App Secret use kar sakte hain
    const appId = process.env.NEXT_PUBLIC_META_APP_ID || "your_app_id";
    const appSecret = process.env.META_APP_SECRET || "your_app_secret";

    // Mock exchange for safety if credentials are not set yet, or live fetch:
    // const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`);
    
    // 2. Save directly to Prisma WabaAccount model linked to User
    const newChannel = await prisma.wabaAccount.create({
      data: {
        userId: userId || "default_user",
        wabaId: "WABA_" + Math.floor(100000 + Math.random() * 900000),
        phoneNumberId: "PHONE_ID_" + Math.floor(100000 + Math.random() * 900000),
        displayPhone: "1555" + Math.floor(1000000 + Math.random() * 9000000),
        accessToken: "EAAB_mock_token_" + Date.now(),
        status: "ACTIVE"
      },
    });

    return NextResponse.json({ success: true, channel: newChannel });
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect Meta channel" }, { status: 500 });
  }
}