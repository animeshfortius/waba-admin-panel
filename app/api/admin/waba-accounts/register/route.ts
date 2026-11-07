import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { wabaNumber, phoneId, accessToken } = await req.json();

    if (!phoneId) {
      return NextResponse.json({ success: false, error: "Phone ID is required" }, { status: 400 });
    }

    let tokenToUse = accessToken;

    // 1. Agar request body mein token nahi hai, toh Database se phoneId ke basis par token dhoondo
    if (!tokenToUse) {
      const cleanPhoneId = phoneId.replace("PHONE_", "").trim();
      const account = await prisma.wabaAccount.findFirst({
        where: {
          OR: [
            { phoneNumberId: cleanPhoneId },
            { phoneNumberId: `PHONE_${cleanPhoneId}` }
          ]
        }
      });
      if (account && account.accessToken) {
        tokenToUse = account.accessToken;
      }
    }

    // 2. Fallback to Env Token agar database mein bhi na mile
    if (!tokenToUse) {
      tokenToUse = process.env.WHATSAPP_SYSTEM_USER_TOKEN || "";
    }

    if (!tokenToUse) {
      return NextResponse.json({ success: false, error: "Access token not found for this channel" }, { status: 400 });
    }

    // Token clean karo (extra quotes ya spaces hatane ke liye)
    const cleanToken = String(tokenToUse).replace(/["']/g, "").trim();
    const cleanPhoneId = phoneId.replace("PHONE_", "").trim();

    // 3. Meta Graph API Call for Registering Number (v26.0)
    const metaResponse = await fetch(`https://graph.facebook.com/v26.0/${cleanPhoneId}/register`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cleanToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: "654321", // Default Registration PIN
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      return NextResponse.json({ success: false, error: metaData.error?.message || "Meta Registration Failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Number successfully registered with Meta!", metaData });
  } catch (error: any) {
    console.error("Meta Register API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}