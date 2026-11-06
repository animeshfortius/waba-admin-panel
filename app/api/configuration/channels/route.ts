import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const accounts = await prisma.wabaAccount.findMany({
      orderBy: { id: "desc" }
    });

    const updatedAccounts = [];

    for (const acc of accounts) {
      let currentLimit = acc.messagingLimit;
      let currentRating = acc.qualityRating;

      const cleanWabaId = acc.wabaId ? acc.wabaId.replace("WABA_", "").trim() : "";
      const cleanPhoneId = acc.phoneNumberId ? acc.phoneNumberId.replace("PHONE_", "").trim() : "";

      // Hamesha Meta se live Messaging Limit fetch karo taaki increase hone par auto-update ho jaye
      if (acc.accessToken && cleanWabaId) {
        try {
          const limitRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanWabaId}?fields=messaging_limit_tier`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const limitData = await limitRes.json();
          if (limitData.messaging_limit_tier) {
            currentLimit = limitData.messaging_limit_tier;
          }
        } catch (err) {
          console.error("Auto fetch limit error in GET:", err);
        }
      }

      // Format tier nicely for display
      let formattedLimit = currentLimit;
      if (currentLimit === "TIER_2K" || currentLimit === "2000") {
        formattedLimit = "2000 (TIER_2K)";
      } else if (currentLimit === "TIER_1K" || currentLimit === "1000") {
        formattedLimit = "1000 (TIER_1K)";
      } else if (currentLimit === "TIER_10K" || currentLimit === "10000") {
        formattedLimit = "10000 (TIER_10K)";
      } else if (currentLimit === "TIER_100K" || currentLimit === "100000") {
        formattedLimit = "100000 (TIER_10K)";
      }

      // Hamesha Meta se live Quality Rating fetch karo
      if (acc.accessToken && cleanPhoneId) {
        try {
          const ratingRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanPhoneId}?fields=quality_rating`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const ratingData = await ratingRes.json();
          if (ratingData.quality_rating) {
            currentRating = ratingData.quality_rating;
          }
        } catch (err) {
          console.error("Auto fetch rating error in GET:", err);
        }
      }

      // Agar Meta se aayi limit database wali se alag hai, toh turant DB update kar do
      if (currentLimit !== acc.messagingLimit || currentRating !== acc.qualityRating) {
        await prisma.wabaAccount.update({
          where: { id: acc.id },
          data: {
            messagingLimit: currentLimit,
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