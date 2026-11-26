import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, getOwnerWhere } from "@/lib/tenant-auth";

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const channelId = String(body?.id || "").trim();
    const rawWebhookUrl =
      body?.webhookUrl !== undefined ? String(body.webhookUrl).trim() : "";

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: "Channel ID is required" },
        { status: 400 }
      );
    }

    const isCleared = !rawWebhookUrl || rawWebhookUrl.toUpperCase() === "NA";
    if (!isCleared) {
      try {
        const parsed = new URL(rawWebhookUrl);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return NextResponse.json(
            {
              success: false,
              error: "Webhook URL must use http or https protocol",
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid webhook URL format" },
          { status: 400 }
        );
      }
    }

    const ownerWhere = getOwnerWhere(tenant);
    const existingChannel = await prisma.wabaAccount.findFirst({
      where: { id: channelId, ...ownerWhere },
    });

    if (!existingChannel) {
      return NextResponse.json(
        { success: false, error: "Channel not found or access denied" },
        { status: 404 }
      );
    }

    const updatedChannel = await prisma.wabaAccount.update({
      where: { id: existingChannel.id },
      data: {
        webhookUrl: isCleared ? "NA" : rawWebhookUrl,
      },
    });

    const { accessToken: _hiddenToken, ...safeChannel } = updatedChannel as any;

    return NextResponse.json({
      success: true,
      data: {
        ...safeChannel,
        hasAccessToken: Boolean(updatedChannel.accessToken),
      },
    });
  } catch (error: any) {
    console.error("Webhook update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update webhook" },
      { status: 500 }
    );
  }
}