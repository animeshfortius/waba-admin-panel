import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-auth";

const META_GRAPH_VERSION = "v21.0";

export async function POST(req: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedUserId = body?.userId ? String(body.userId).trim() : "";

    const targetUserId =
      requestedUserId &&
      requestedUserId !== "undefined" &&
      requestedUserId !== "null" &&
      (tenant.isSuperAdmin || tenant.allowedUserIds?.includes(requestedUserId))
        ? requestedUserId
        : String(tenant.userId || "").trim();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch scoped user's WABA accounts
    const wabaAccounts = await prisma.wabaAccount.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
    });

    if (wabaAccounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No WABA accounts found for sync" },
        { status: 404 }
      );
    }

    let syncedCount = 0;
    const errors: { wabaId: string; error: string }[] = [];

    for (const acc of wabaAccounts) {
      const token = String(acc.accessToken || "").trim();
      const cleanWabaId = String(acc.wabaId || "")
        .replace(/^WABA_/i, "")
        .trim();

      if (!cleanWabaId || !token || token.startsWith("mock_token")) {
        errors.push({
          wabaId: acc.wabaId,
          error: "Missing valid Meta access token or WABA ID",
        });
        continue;
      }

      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
            cleanWabaId
          )}/insights?metric=messages_sent,messages_delivered,messages_read&period=lifetime`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const metaData = await metaRes.json().catch(() => ({}));

        if (!metaRes.ok || metaData?.error) {
          errors.push({
            wabaId: acc.wabaId,
            error: metaData?.error?.message || "Meta insights API error",
          });
          continue;
        }

        syncedCount++;
      } catch (metaErr: any) {
        console.error(`Meta sync error for WABA ${acc.wabaId}:`, metaErr);
        errors.push({
          wabaId: acc.wabaId,
          error: metaErr?.message || "Network error during Meta sync",
        });
      }
    }

    return NextResponse.json({
      success: syncedCount > 0 || errors.length === 0,
      syncedCount,
      errors,
      message: `Successfully synced live reports from Meta for ${syncedCount} accounts!`,
    });
  } catch (error: any) {
    console.error("Report Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to sync reports" },
      { status: 500 }
    );
  }
}