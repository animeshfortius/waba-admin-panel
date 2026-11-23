import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { logApiActivity } from "@/lib/api-logger";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ version: string; phoneNumberId: string }> }
) {
  const startTime = Date.now();
  const { version, phoneNumberId } = await context.params;
  const endpointPath = `/api/${version}/${phoneNumberId}/messages`;

  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    logApiActivity({
      endpoint: endpointPath,
      method: "POST",
      statusCode: auth.status,
      success: false,
      durationMs: Date.now() - startTime,
      errorMessage: auth.error,
    });

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

    if (!metaToken) {
      const errorMsg = "Meta access token not configured for this channel/user";
      logApiActivity({
        endpoint: endpointPath,
        method: "POST",
        userId: auth.context.userId,
        statusCode: 400,
        success: false,
        durationMs: Date.now() - startTime,
        errorMessage: errorMsg,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const graphVersion = version.startsWith("v") ? version : "v21.0";
    const targetPhoneId =
      phoneNumberId ||
      auth.context.phoneNumberId ||
      process.env.META_PHONE_NUMBER_ID;

    if (!targetPhoneId) {
      const errorMsg = "phoneNumberId is required";
      logApiActivity({
        endpoint: endpointPath,
        method: "POST",
        userId: auth.context.userId,
        statusCode: 400,
        success: false,
        durationMs: Date.now() - startTime,
        errorMessage: errorMsg,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const metaResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
        targetPhoneId
      )}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const metaData = await metaResponse.json().catch(() => ({}));

    const isSent = Boolean(metaResponse.ok && metaData?.messages?.[0]?.id);
    const metaMessageId = metaData?.messages?.[0]?.id
      ? String(metaData.messages[0].id).trim()
      : null;
    const errorMsg = metaResponse.ok
      ? "N/A"
      : metaData?.error?.message || "Meta Graph API error";

    // Save API message entry to CampaignLog for reporting
    try {
      const recipientNumber = String(body?.to || "").replace(/\D/g, "") || "N/A";
      const templateName =
        body?.template?.name || body?.type || "API_Message";
      const now = new Date();

      await prisma.campaignLog.create({
        data: {
          userId: auth.context.userId || "admin",
          campaignName: "API_Console",
          templateName,
          channel: String(targetPhoneId),
          recipient: recipientNumber,
          status: isSent ? "SENT" : "FAILED",
          messageId: metaMessageId,
          cost: 0,
          errorDetails: errorMsg,
          sentAt: now,
          deliveredAt: null,
          readAt: null,
        },
      });
    } catch (dbErr) {
      console.error("Failed to save API message to campaignLog:", dbErr);
    }

    logApiActivity({
      endpoint: endpointPath,
      method: "POST",
      userId: auth.context.userId,
      statusCode: metaResponse.status,
      success: metaResponse.ok,
      durationMs: Date.now() - startTime,
      errorMessage: metaResponse.ok ? undefined : errorMsg,
    });

    return NextResponse.json(
      {
        success: metaResponse.ok,
        metaStatus: metaResponse.status,
        data: metaData,
      },
      { status: metaResponse.status }
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to send WhatsApp message";

    logApiActivity({
      endpoint: endpointPath,
      method: "POST",
      userId: auth.context.userId,
      statusCode: 500,
      success: false,
      durationMs: Date.now() - startTime,
      errorMessage: errorMsg,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}