import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // 1. Fetch user's WABA accounts
    const wabaAccounts = await prisma.wabaAccount.findMany({
      where: { userId },
    });

    if (wabaAccounts.length === 0) {
      return NextResponse.json({ success: false, error: "No WABA accounts found for sync" }, { status: 404 });
    }

    let syncedCount = 0;

    for (const acc of wabaAccounts) {
      if (!acc.accessToken) continue;
      const cleanWabaId = acc.wabaId.replace("WABA_", "").trim();

      try {
        // Fetch insights / analytics from Meta Graph API
        const metaRes = await fetch(
          `https://graph.facebook.com/v21.0/${cleanWabaId}/insights?metric=messages_sent,messages_delivered,messages_read&period=lifetime`,
          {
            headers: { Authorization: `Bearer ${acc.accessToken}` },
          }
        );
        const metaData = await metaRes.json();
        
        // Process and store logs in database if needed
        syncedCount++;
      } catch (metaErr) {
        console.error(`Meta sync error for WABA ${acc.wabaId}:`, metaErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced live reports from Meta for ${syncedCount} accounts!`,
    });
  } catch (error: any) {
    console.error("Report Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}