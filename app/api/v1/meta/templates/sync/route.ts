import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const META_GRAPH_VERSION = "v21.0";

function isSuperAdminContext(ctx: unknown): boolean {
  const c = ctx as { isSuperAdmin?: unknown; role?: unknown } | null | undefined;
  return Boolean(c?.isSuperAdmin) || String(c?.role || "").toUpperCase() === "SUPER_ADMIN";
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
      },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedWabaRaw = String(
      body?.wabaId || auth.context.wabaId || ""
    ).trim();
    const cleanRequestedWaba = requestedWabaRaw.replace(/^WABA_/i, "").trim();

    let resolvedWabaId = cleanRequestedWaba;
    let metaToken = String(auth.context.metaAccessToken || "").trim();
    const superAdmin = isSuperAdminContext(auth.context);

    const whereScope: any = superAdmin ? {} : { userId: auth.context.userId };

    const scopedAccounts = await prisma.wabaAccount.findMany({
      where: whereScope,
      orderBy: { createdAt: "asc" },
    });

    if (cleanRequestedWaba) {
      const matched = scopedAccounts.find((acc: any) => {
        const accWaba = String(acc.wabaId || "")
          .replace(/^WABA_/i, "")
          .trim();
        return acc.id === requestedWabaRaw || accWaba === cleanRequestedWaba;
      });

      if (!matched && !superAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "WABA ID does not belong to this API account",
          },
          { status: 403 }
        );
      }

      if (matched) {
        resolvedWabaId = String(matched.wabaId || "")
          .replace(/^WABA_/i, "")
          .trim();
        metaToken = String(matched.accessToken || metaToken).trim();
      }
    } else if (scopedAccounts.length > 0) {
      const defaultAcc =
        scopedAccounts.find((acc: any) => acc.isDefault) || scopedAccounts[0];
      resolvedWabaId = String(defaultAcc.wabaId || "")
        .replace(/^WABA_/i, "")
        .trim();
      metaToken = String(defaultAcc.accessToken || metaToken).trim();
    }

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    if (!resolvedWabaId) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA ID not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(
        resolvedWabaId
      )}/message_templates?limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
        },
        cache: "no-store",
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));
    const templatesList = Array.isArray(metaData?.data) ? metaData.data : [];

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        syncedCount: templatesList.length,
        data: templatesList,
      },
      { status: metaResponse.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync Meta templates",
      },
      { status: 500 }
    );
  }
}