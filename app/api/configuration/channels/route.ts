import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const accounts = await prisma.wabaAccount.findMany({
      orderBy: { id: "desc" }
    });

    const updatedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        let messagingLimit = acc.messagingLimit || "TIER_NOT_FOUND";
        let qualityRating = acc.qualityRating || "UNKNOWN";

        try {
          const token = acc.accessToken;
          console.log(`--- Checking Channel: ${acc.displayPhone} ---`);
          console.log(`WABA ID: ${acc.wabaId}, Phone Number ID: ${acc.phoneNumberId}`);

          if (token && !token.startsWith("mock_token")) {
            
            // Try fetching via WABA phone_numbers edge (Most reliable for multi-number WABAs)
            if (acc.wabaId) {
              const res = await fetch(
                `https://graph.facebook.com/v26.0/${acc.wabaId}/phone_numbers?fields=id,messaging_limit_tier,quality_rating`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              console.log("Meta WABA phone_numbers response:", JSON.stringify(data));

              if (data && data.data && Array.isArray(data.data)) {
                const matchedPhone = data.data.find(
                  (p: any) => p.id === acc.phoneNumberId || p.id === String(acc.phoneNumberId)
                );
                if (matchedPhone) {
                  if (matchedPhone.messaging_limit_tier) {
                    messagingLimit = matchedPhone.messaging_limit_tier;
                  }
                  if (matchedPhone.quality_rating) {
                    qualityRating = matchedPhone.quality_rating;
                  }
                }
              }
            }

            // Fallback: Direct WABA fetch if edge didn't yield limit
            if (messagingLimit === "TIER_NOT_FOUND" && acc.wabaId) {
              const limitRes = await fetch(
                `https://graph.facebook.com/v26.0/${acc.wabaId}?fields=messaging_limit_tier`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const limitData = await limitRes.json();
              console.log("Meta Direct WABA limit response:", JSON.stringify(limitData));
              if (limitData && limitData.messaging_limit_tier) {
                messagingLimit = limitData.messaging_limit_tier;
              }
            }

            // Fallback: Direct Phone Number fetch for quality rating if needed
            if (qualityRating === "UNKNOWN" && acc.phoneNumberId) {
              const ratingRes = await fetch(
                `https://graph.facebook.com/v26.0/${acc.phoneNumberId}?fields=quality_rating`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const ratingData = await ratingRes.json();
              console.log("Meta Direct Phone rating response:", JSON.stringify(ratingData));
              if (ratingData && ratingData.quality_rating) {
                qualityRating = ratingData.quality_rating;
              }
            }

            console.log(`Final Resolved -> Limit: ${messagingLimit}, Rating: ${qualityRating}`);

            // Database mein live stats persist karo
            if (messagingLimit !== acc.messagingLimit || qualityRating !== acc.qualityRating) {
              await prisma.wabaAccount.update({
                where: { id: acc.id },
                data: { messagingLimit, qualityRating }
              }).catch((dbErr) => {
                console.error("DB Update Error:", dbErr);
              });
            }
          } else {
            console.log("Skipped live fetch: Token is missing or mock.");
          }
        } catch (metaErr) {
          console.error("Error fetching live Meta stats for channel:", acc.id, metaErr);
        }

        return {
          ...acc,
          messagingLimit,
          qualityRating,
        };
      })
    );

    return NextResponse.json(updatedAccounts);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newChannel = await prisma.wabaAccount.create({
      data: {
        userId: body.userId || "default_user",
        wabaId: body.wabaId || "28402710282733872",
        phoneNumberId: body.phoneNumberId || "1384456657081014",
        displayPhone: body.displayPhone || "15553945963",
        accessToken: body.accessToken || "mock_token_12345",
        status: body.status || "ACTIVE",
        messagingLimit: "TIER_NOT_FOUND",
        qualityRating: "UNKNOWN"
      },
    });
    return NextResponse.json(newChannel);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}