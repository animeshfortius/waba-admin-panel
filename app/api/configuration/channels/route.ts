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
          if (token && !token.startsWith("mock_token")) {
            
            // 1. Fetch Messaging Limit from WABA ID (Correct Meta Endpoint)
            if (acc.wabaId) {
              const limitRes = await fetch(
                `https://graph.facebook.com/v18.0/${acc.wabaId}?fields=messaging_limit_tier`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const limitData = await limitRes.json();
              if (limitData.messaging_limit_tier) {
                messagingLimit = limitData.messaging_limit_tier;
              }
            }

            // 2. Fetch Quality Rating from Phone Number ID (Correct Meta Endpoint)
            if (acc.phoneNumberId) {
              const ratingRes = await fetch(
                `https://graph.facebook.com/v18.0/${acc.phoneNumberId}?fields=quality_rating`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const ratingData = await ratingRes.json();
              if (ratingData.quality_rating) {
                qualityRating = ratingData.quality_rating;
              }
            }

            // Database mein live stats persist karo
            if (messagingLimit !== acc.messagingLimit || qualityRating !== acc.qualityRating) {
              await prisma.wabaAccount.update({
                where: { id: acc.id },
                data: { messagingLimit, qualityRating }
              }).catch(() => {});
            }
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