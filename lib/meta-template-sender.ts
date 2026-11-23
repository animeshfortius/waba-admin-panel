import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function handlePlatformTemplateSend(
  request: NextRequest,
  platformName: "clevertap" | "moengage" | "webengage"
) {
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
    const phoneNumberId = String(
      body?.phoneNumberId ||
        body?.phone_number_id ||
        auth.context.phoneNumberId ||
        process.env.META_PHONE_NUMBER_ID ||
        ""
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

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumberId is required",
        },
        { status: 400 }
      );
    }

    const rawTo = String(
      body?.to || body?.mobile || body?.phone || body?.userId || ""
    ).trim();
    const to = rawTo.replace(/^\+/, "");

    const templateName = String(
      body?.templateName || body?.template_name || body?.name || ""
    ).trim();
    const languageCode = String(
      body?.language || body?.languageCode || body?.lang || "en_US"
    ).trim();

    const rawVariables = Array.isArray(body?.variables)
      ? body.variables
      : Array.isArray(body?.params)
      ? body.params
      : [];

    if (!to || !templateName) {
      return NextResponse.json(
        {
          success: false,
          error: "'to' (91 + 10 digits) and 'templateName' are required",
        },
        { status: 400 }
      );
    }

    const parameters = rawVariables.map((val: unknown) => ({
      type: "text",
      text: String(val ?? ""),
    }));

    const components =
      parameters.length > 0
        ? [
            {
              type: "body",
              parameters,
            },
          ]
        : undefined;

    const metaPayload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        ...(components ? { components } : {}),
      },
    };

    const graphVersion = "v21.0";
    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        phoneNumberId
      )}/messages`,
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
        platform: platformName,
        metaStatus: metaResponse.status,
        data: metaData,
      },
      { status: metaResponse.status }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        platform: platformName,
        error:
          error instanceof Error
            ? error.message
            : `Failed to process ${platformName} WhatsApp API request`,
      },
      { status: 500 }
    );
  }
}