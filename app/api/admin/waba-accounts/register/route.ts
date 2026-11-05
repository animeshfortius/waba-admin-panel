import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { wabaNumber, phoneId, accessToken } = await req.json();

    if (!phoneId) {
      return NextResponse.json({ success: false, error: "Phone ID is required" }, { status: 400 });
    }

    // Meta Graph API Call for Registering Number
    const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/register`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken || process.env.META_SYSTEM_USER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin: "654321", // User/Default PIN
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      return NextResponse.json({ success: false, error: metaData.error?.message || "Meta Registration Failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Number successfully registered with Meta!", metaData });
  } catch (error: any) {
    console.error("Meta Register API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}