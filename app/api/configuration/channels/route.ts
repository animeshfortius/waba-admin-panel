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
          if (token && !token.startsWith("mock_token") && acc.wabaId) {
            
            // Query WABA phone_numbers edge to get messaging limits and quality ratings for all numbers under this WABA
            const res = await fetch(
              `https://graph.facebook.com/v18.0/${acc.wabaId}/phone_numbers?fields=id,messaging_limit_tier,quality_rating`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            
            if (data && data.data && Array.isArray(data.data)) {
              // Find the specific phone number matching this account's phoneNumberId
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