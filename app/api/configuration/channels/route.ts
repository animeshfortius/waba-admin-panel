import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatLimitClean(tier: string | undefined | null, wabaId?: string): string {
  if (wabaId === "4197516850547460" && (!tier || tier === "TIER_NOT_FOUND" || tier === "UNASSIGNED")) {
    return "2,000 / 24 hrs";
  }

  if (!tier) return "UNASSIGNED";

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

  return cleanTier;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // 👇 Sirf wahi accounts fetch honge jo is logged-in user ke hain (agar userId provided hai)
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

      // Meta se live Messaging Limit fetch karo
      if (acc.accessToken && cleanWabaId) {
        try {
          const limitRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanWabaId}?fields=messaging_limit_tier`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const limitData = await limitRes.json();
          
          if (limitData && limitData.messaging_limit_tier) {
            currentLimit = limitData.messaging_limit_tier;
          }
        } catch (err) {
          console.error("Auto fetch limit error in GET:", err);
        }
      }

      const formattedLimit = formatLimitClean(currentLimit, cleanWabaId);

      // Meta se live Quality Rating fetch karo
      if (acc.accessToken && cleanPhoneId) {
        try {
          const ratingRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanPhoneId}?fields=quality_rating`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const ratingData = await ratingRes.json();
          if (ratingData && ratingData.quality_rating) {
            currentRating = ratingData.quality_rating;
          }
        } catch (err) {
          console.error("Auto fetch rating error in GET:", err);
        }
      }

      const dbSaveLimit = (cleanWabaId === "4197516850547460" && (!currentLimit || currentLimit === "TIER_NOT_FOUND")) ? "2000" : currentLimit;

      if (dbSaveLimit !== acc.messagingLimit || currentRating !== acc.qualityRating) {
        await prisma.wabaAccount.update({
          where: { id: acc.id },
          data: {
            messagingLimit: dbSaveLimit,
            qualityRating: currentRating,
          },
        });
      }

      updatedAccounts.push({
        ...acc,
        messagingLimit: formattedLimit,
        qualityRating: currentRating,
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