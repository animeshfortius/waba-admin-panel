import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatLimitClean(tier: string | undefined | null): string {
  if (!tier || tier === "TIER_NOT_FOUND" || tier === "UNASSIGNED") return "250 / 24 hrs";

  const cleanTier = String(tier).toUpperCase().trim();

  const tierMap: Record<string, string> = {
    "TIER_250": "250 / 24 hrs",
    "250": "250 / 24 hrs",
    "TIER_1K": "1,000 / 24 hrs",
    "1000": "1,000 / 24 hrs",
    "TIER_2K": "2,000 / 24 hrs",
    "TIER_2000": "2,000 / 24 hrs",
    "2000": "2,000 / 24 hrs",
    "TIER_10K": "10,000 / 24 hrs",
    "10000": "10,000 / 24 hrs",
    "TIER_100K": "100,000 / 24 hrs",
    "100000": "100,000 / 24 hrs",
    "UNLIMITED": "Unlimited / 24 hrs"
  };

  if (tierMap[cleanTier]) {
    return tierMap[cleanTier];
  }

  if (cleanTier.includes("2K") || cleanTier.includes("2000")) return "2,000 / 24 hrs";
  if (cleanTier.includes("10K") || cleanTier.includes("10000")) return "10,000 / 24 hrs";
  if (cleanTier.includes("100K") || cleanTier.includes("100000")) return "100,000 / 24 hrs";
  if (cleanTier.includes("1K") || cleanTier.includes("1000")) return "1,000 / 24 hrs";
  if (cleanTier.includes("250")) return "250 / 24 hrs";

  return cleanTier + " / 24 hrs";
}

function formatQualityClean(rating: string | undefined | null): string {
  if (!rating) return "High";
  const cleanRating = String(rating).toUpperCase().trim();

  const ratingMap: Record<string, string> = {
    "GREEN": "High",
    "YELLOW": "Medium",
    "RED": "Low",
    "UNKNOWN": "High"
  };

  return ratingMap[cleanRating] || rating;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const accounts = await prisma.wabaAccount.findMany({
      where: userId ? { userId } : {},
      orderBy: { id: "desc" }
    });

    const updatedAccounts = [];

    for (const acc of accounts) {
      let currentLimit = acc.messagingLimit;
      let currentRating = acc.qualityRating;

      const cleanWabaId = acc.wabaId ? acc.wabaId.replace("WABA_", "").trim() : "";
      const cleanPhoneId = acc.phoneNumberId ? acc.phoneNumberId.replace("PHONE_", "").trim() : "";

      // 🔍 Meta se live data fetch karne ki core logic (Phone Number ID & WABA ID priority wise)
      if (acc.accessToken) {
        try {
          // 1. Pehle Phone Number ID se limit aur quality rating dono fetch karo
          if (cleanPhoneId) {
            const phoneRes = await fetch(
              `https://graph.facebook.com/v26.0/${cleanPhoneId}?fields=messaging_limit_tier,quality_rating`,
              { headers: { Authorization: `Bearer ${acc.accessToken}` } }
            );
            const phoneData = await phoneRes.json();
            
            if (phoneData) {
              if (phoneData.messaging_limit_tier && phoneData.messaging_limit_tier !== "TIER_NOT_FOUND") {
                currentLimit = phoneData.messaging_limit_tier;
              }
              if (phoneData.quality_rating) {
                currentRating = phoneData.quality_rating;
              }
            }
          }

          // 2. Agar limit abhi bhi na mile ya TIER_NOT_FOUND ho, toh WABA ID se try karo
          if ((!currentLimit || currentLimit === "TIER_NOT_FOUND" || currentLimit === "UNASSIGNED") && cleanWabaId) {
            const wabaRes = await fetch(
              `https://graph.facebook.com/v26.0/${cleanWabaId}?fields=messaging_limit_tier`,
              { headers: { Authorization: `Bearer ${acc.accessToken}` } }
            );
            const wabaData = await wabaRes.json();
            
            if (wabaData && wabaData.messaging_limit_tier && wabaData.messaging_limit_tier !== "TIER_NOT_FOUND") {
              currentLimit = wabaData.messaging_limit_tier;
            }
          }
        } catch (err) {
          console.error("Meta live fetch error:", err);
        }
      }

      const formattedLimit = formatLimitClean(currentLimit);
      const formattedRating = formatQualityClean(currentRating);

      // Database mein clean values update kar do
      if (currentLimit !== acc.messagingLimit || currentRating !== acc.qualityRating) {
        await prisma.wabaAccount.update({
          where: { id: acc.id },
          data: {
            messagingLimit: currentLimit || "UNASSIGNED",
            qualityRating: currentRating || "UNKNOWN",
          },
        }).catch(() => {});
      }

      updatedAccounts.push({
        ...acc,
        messagingLimit: formattedLimit,
        qualityRating: formattedRating,
        wabaId: cleanWabaId,
        phoneNumberId: cleanPhoneId,
      });
    }

    return NextResponse.json(updatedAccounts);
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
        messagingLimit: "UNASSIGNED",
        qualityRating: "UNKNOWN"
      },
    });
    return NextResponse.json(newChannel);
  } catch (error) {
    console.error("Create Channel Error:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}