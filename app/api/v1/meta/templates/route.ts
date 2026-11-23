import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
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
    const metaToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN;
    const wabaId = auth.context.wabaId || process.env.META_WABA_ID;

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
      )}/message_templates`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        data: metaData,
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
            : "Failed to fetch Meta templates",
      },
      { status: 500 }
    );
  }
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
    const body = await request.json();
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

    const name = String(body?.name || "").trim();
    const language = String(body?.language || "en_US").trim();
    const category = String(body?.category || "UTILITY").trim();
    const bodyText = String(body?.bodyText || "").trim();

    if (!name || !bodyText) {
      return NextResponse.json(
        {
          success: false,
          error: "Template 'name' and 'bodyText' are required",
        },
        { status: 400 }
      );
    }

    const metaPayload = Array.isArray(body?.components)
      ? {
          name,
          language,
          category,
          components: body.components,
        }
      : {
          name,
          language,
          category,
          components: [
            {
              type: "BODY",
              text: bodyText,
            },
          ],
        };

    const graphVersion = "v21.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        wabaId
      )}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        data: metaData,
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
            : "Failed to create Meta template",
      },
      { status: 500 }
    );
  }
}