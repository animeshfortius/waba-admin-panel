import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { code, wabaId, phoneNumberId, displayPhone, name, website, accessToken } = body;

    const appId = process.env.NEXT_PUBLIC_META_APP_ID || "1405995811146008";
    const appSecret = process.env.META_APP_SECRET || "";
    const systemUserToken = process.env.META_SYSTEM_USER_TOKEN || "";

    // Agar code aaya hai, toh token exchange karke automatic real IDs fetch karo
    if (code) {
      try {
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;

          // 1. Debug token se WABA ID nikalne ki koshish karo
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

          // 2. Agar phir bhi wabaId na mile, toh user ke WABA list se fetch karo
          if (!wabaId) {
            const meUrl = `https://graph.facebook.com/v18.0/me/whatsapp_business_accounts?access_token=${accessToken}`;
            const meRes = await fetch(meUrl);
            const meData = await meRes.json();
            if (meData.data && meData.data.length > 0) {
              wabaId = meData.data[0].id;
              name = meData.data[0].name || name;
            }
          }

          // 3. WABA ID milne par Phone Number ID fetch karo
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

    // Final Validation Check
    if (!wabaId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Meta se real WABA ID / Phone ID automatic fetch nahi ho payi. Please try again." },
        { status: 400 }
      );
    }

    // AUTOMATIC POSTMAN STYLE APIS EXECUTION FROM BACKEND:
    if (phoneNumberId && accessToken) {
      try {
        // A. Register WhatsApp Phone Number (Client Token se active karne ke liye)
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
        const regResData = await regRes.json();
        console.log("Phone registration response:", regResData);

        // B. Link Solution Partner Credit Line / Shared Account (META_SYSTEM_USER_TOKEN se)
        if (wabaId && systemUserToken) {
          const creditSharingUrl = `https://graph.facebook.com/v18.0/${wabaId}/shared_whatsapp_business_accounts`;
          const creditRes = await fetch(creditSharingUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${systemUserToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // Solution Partner credit line sharing payload
            })
          });
          const creditResData = await creditRes.json();
          console.log("Credit line sharing response:", creditResData);
        }
      } catch (apiErr) {
        console.error("Automated Meta API execution error:", apiErr);
      }
    }

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