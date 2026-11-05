import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { code, wabaId, phoneNumberId, displayPhone, name, website, accessToken } = body;

    // 1. Agar code aaya hai lekin wabaId/phoneNumberId missing hai, toh Graph API se fetch karo
    if (code && (!wabaId || !phoneNumberId)) {
      try {
        const appId = process.env.NEXT_PUBLIC_META_APP_ID || "YOUR_META_APP_ID";
        const appSecret = process.env.META_APP_SECRET || "";

        // Exchange code for Access Token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;

          // Fetch Debug Token info to get WABA ID & Phone ID
          const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
          const debugRes = await fetch(debugUrl);
          const debugData = await debugRes.json();

          if (debugData.data && debugData.data.granular_scopes) {
            const wabaScope = debugData.data.granular_scopes.find(
              (s: any) => s.scope === "whatsapp_business_management"
            );
            if (wabaScope && wabaScope.target_ids && wabaScope.target_ids.length > 0) {
              wabaId = wabaScope.target_ids[0];
            }
          }

          // Fetch Phone Number details using WABA ID
          if (wabaId) {
            const phoneUrl = `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`;
            const phoneRes = await fetch(phoneUrl);
            const phoneData = await phoneRes.json();

            if (phoneData.data && phoneData.data.length > 0) {
              phoneNumberId = phoneData.data[0].id;
              displayPhone = phoneData.data[0].display_phone_number || displayPhone;
              name = phoneData.data[0].verified_name || name;
            }
          }
        }
      } catch (err) {
        console.error("Meta Graph API fetch failed:", err);
      }
    }

    // 2. Strict Check: Agar exchange ke baad bhi real IDs na milein, toh reject karo
    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Meta se real WABA ID / Phone ID receive nahi hui. Please try again." },
        { status: 400 }
      );
    }

    // 3. Get or create default user
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

    // 4. Save/Update Real Data in Database
    const newAccount = await prisma.wabaAccount.upsert({
      where: { wabaId: wabaId },
      update: {
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || "",
        displayName: name || "WhatsApp Business",
        website: website || "",
        status: "ACTIVE",
      },
      create: {
        userId: defaultUser.id,
        wabaId: wabaId,
        phoneNumberId: phoneNumberId,
        displayPhone: displayPhone || "",
        accessToken: accessToken || "",
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