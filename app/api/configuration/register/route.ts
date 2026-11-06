import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { code, wabaId, phoneNumberId, displayPhone, name, website, accessToken } = body;

    const appId = process.env.NEXT_PUBLIC_META_APP_ID || "1405995811146008";
    const appSecret = process.env.META_APP_SECRET || "";
    const authKey = "aEBsEkOowJHzSfcDzAibzrFidlvLZwkePITKmRahDXdEkHhSWRLTCVQsqElOWWLU";

    // 1. Token Exchange & Auto Fetch IDs
    if (code) {
      try {
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;

          if (!wabaId) {
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
          }

          if (!wabaId) {
            const meUrl = `https://graph.facebook.com/v18.0/me/whatsapp_business_accounts?access_token=${accessToken}`;
            const meRes = await fetch(meUrl);
            const meData = await meRes.json();
            if (meData.data && meData.data.length > 0) {
              wabaId = meData.data[0].id;
              name = meData.data[0].name || name;
            }
          }

          if (wabaId && !phoneNumberId) {
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
        console.error("Auto fetch error:", err);
      }
    }

    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Meta se real WABA ID / Phone ID automatic fetch nahi ho payi. Please try again." },
        { status: 400 }
      );
    }

    // 2. AUTOMATED APIS: Phone Registration & Smartping Credit Line Attach
    if (phoneNumberId && accessToken) {
      try {
        // A. Register Phone Number with Meta
        const registerUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/register`;
        const regRes = await fetch(registerUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            pin: "123456"
          })
        });
        const regData = await regRes.json();
        console.log("Phone registration response:", regData);

        // B. Attach Credit Line via Smartping Endpoint (Safe Text/JSON Handling)
        const cleanPhone = displayPhone ? displayPhone.replace(/[^0-9]/g, "") : phoneNumberId;
        const smartpingUrl = `https://wabalens.smartping.io/MetaAPI/metapp/api/v1/wabas/attach?wabaId=${wabaId}&wabaNumber=${cleanPhone}`;
        
        console.log("Hitting Smartping attach URL:", smartpingUrl);

        const creditRes = await fetch(smartpingUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authKey}`,
            "Content-Type": "application/json"
          }
        });

        const responseText = await creditRes.text();
        console.log("Smartping raw response status:", creditRes.status);
        console.log("Smartping raw response body:", responseText);

      } catch (apiErr) {
        console.error("Automated API execution error:", apiErr);
      }
    }

    // 3. Save to Database
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