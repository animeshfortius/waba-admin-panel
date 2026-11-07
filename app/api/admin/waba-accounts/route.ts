import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Filter by userId if provided, otherwise fetch all
    const query = userId ? { userId } : {};
    const accounts = await prisma.wabaAccount.findMany({
      where: query,
      orderBy: { id: "desc" },
    });

    const updatedChannels = [];

    for (const acc of accounts) {
      let currentLimit = acc.messagingLimit;
      let currentRating = acc.qualityRating;

      const cleanWabaId = acc.wabaId ? acc.wabaId.replace("WABA_", "").trim() : "";
      const cleanPhoneId = acc.phoneNumberId ? acc.phoneNumberId.replace("PHONE_", "").trim() : "";

      // Live fetch limit from Meta
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
          console.error("Meta fetch limit error:", err);
        }
      }

      // Live fetch rating from Meta
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
          console.error("Meta fetch rating error:", err);
        }
      }

      updatedChannels.push({
        id: acc.id,
        wabaNumber: acc.displayPhone || acc.phoneNumberId,
        phoneId: cleanPhoneId,
        wabaId: cleanWabaId,
        displayName: acc.displayPhone ? `WhatsApp ${acc.displayPhone}` : "Verified Account",
        configureDate: acc.createdAt ? new Date(acc.createdAt).toLocaleString() : "N/A",
        webhookUrl: "NA",
        tps: 50,
        messagingLimit: currentLimit,
        qualityRating: currentRating,
      });
    }

    return NextResponse.json({ success: true, channels: updatedChannels });
  } catch (error) {
    console.error("Admin waba-accounts API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch admin WABA accounts" }, { status: 500 });
  }
}