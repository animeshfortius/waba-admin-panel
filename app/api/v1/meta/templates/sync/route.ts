import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";

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
    const metaToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN;
    const wabaId = String(
      body?.wabaId || auth.context.wabaId || process.env.META_WABA_ID || ""
    ).trim();

    if (!metaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Meta access token not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    if (!wabaId) {
      return NextResponse.json(
        {
          success: false,
          error: "WABA ID not configured for this channel/user",
        },
        { status: 400 }
      );
    }

    const graphVersion = "v21.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        wabaId
      )}/message_templates?limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
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