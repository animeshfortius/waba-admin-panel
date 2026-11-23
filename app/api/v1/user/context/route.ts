import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type RecordMap = Record<string, unknown>;

async function collectChannelsForUser(userId: string): Promise<RecordMap[]> {
  const client = prisma as unknown as Record<
    string,
    { findMany?: (args?: unknown) => Promise<RecordMap[]> } | undefined
  >;

  const candidateModels = [
    "channel",
    "whatsappChannel",
    "wabaAccount",
    "wabaConfig",
    "whatsAppAccount",
  ];

  for (const modelName of candidateModels) {
    const model = client[modelName];
    if (model?.findMany) {
      try {
        const rows = await model.findMany({ where: { userId } });
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
        const allRows = await model.findMany();
        if (Array.isArray(allRows) && allRows.length > 0) {
          return allRows;
        }
      } catch {
        // try next model candidate if present
      }
    }
  }

  return [];
}

function extractString(rec: RecordMap | null | undefined, keys: string[]): string {
  if (!rec) return "";
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  return "";
}

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
    const { searchParams } = new URL(request.url);
    const requestedWabaId = (searchParams.get("wabaId") || "").trim();

    const rows = await collectChannelsForUser(auth.context.userId);

    const channels = rows.map((row, index) => {
      const phoneNumberId =
        extractString(row, [
          "phoneNumberId",
          "phone_number_id",
          "phoneId",
        ]) ||
        auth.context.phoneNumberId ||
        process.env.META_PHONE_NUMBER_ID ||
        "";

      const wabaId =
        extractString(row, [
          "wabaId",
          "waba_id",
          "businessAccountId",
          "whatsappBusinessAccountId",
        ]) ||
        auth.context.wabaId ||
        process.env.META_WABA_ID ||
        "";

      const displayName = extractString(row, [
        "displayName",
        "display_name",
        "verifiedName",
        "verified_name",
        "channelName",
        "name",
        "title",
        "label",
      ]);

      const phoneNumber = extractString(row, [
        "displayPhoneNumber",
        "display_phone_number",
        "phoneNumber",
        "phone_number",
        "phone",
        "mobile",
      ]);

      const accessToken =
        extractString(row, [
          "accessToken",
          "access_token",
          "metaAccessToken",
          "whatsappToken",
          "wabaToken",
          "token",
        ]) ||
        auth.context.metaAccessToken ||
        process.env.META_ACCESS_TOKEN ||
        "";

      const primaryTitle =
        displayName && phoneNumber
          ? `${displayName} (${phoneNumber})`
          : displayName || phoneNumber || phoneNumberId || `Channel ${index + 1}`;

      const label = wabaId
        ? `${primaryTitle} — WABA: ${wabaId}`
        : primaryTitle;

      return {
        id: extractString(row, ["id"]) || `channel-${index + 1}`,
        label,
        displayName,
        phoneNumber,
        phoneNumberId,
        wabaId,
        hasToken: Boolean(accessToken),
      };
    });

    if (
      channels.length === 0 &&
      (auth.context.phoneNumberId || auth.context.wabaId)
    ) {
      channels.push({
        id: "default-context",
        label: auth.context.wabaId
          ? `${auth.context.phoneNumberId || "Default"} — WABA: ${auth.context.wabaId}`
          : auth.context.phoneNumberId || "Default Channel",
        displayName: "",
        phoneNumber: "",
        phoneNumberId: auth.context.phoneNumberId || "",
        wabaId: auth.context.wabaId || "",
        hasToken: Boolean(auth.context.metaAccessToken),
      });
    }

    const activeToken =
      auth.context.metaAccessToken || process.env.META_ACCESS_TOKEN || "";

    const activeWabaId =
      requestedWabaId ||
      channels[0]?.wabaId ||
      auth.context.wabaId ||
      process.env.META_WABA_ID ||
      "";

    let templates: Array<{
      id: string;
      name: string;
      language: string;
      status: string;
      category: string;
      bodyText: string;
      variableCount: number;
    }> = [];

    let templateFetchError: string | null = null;

    if (!activeToken) {
      templateFetchError = "Meta access token not found for this channel/user.";
    } else if (!activeWabaId) {
      templateFetchError = "WABA ID not found for this channel/user.";
    } else {
      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(
          activeWabaId
        )}/message_templates?limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const metaJson = await metaRes.json().catch(() => ({}));
      if (metaRes.ok && Array.isArray(metaJson?.data)) {
        templates = metaJson.data.map((tpl: RecordMap) => {
          const components = Array.isArray(tpl.components)
            ? (tpl.components as RecordMap[])
            : [];
          const bodyComp = components.find(
            (c) => String(c.type || "").toUpperCase() === "BODY"
          );
          const bodyText =
            typeof bodyComp?.text === "string" ? bodyComp.text : "";
          const matches = bodyText.match(/\{\{\d+\}\}/g) || [];

          return {
            id: String(tpl.id || tpl.name || ""),
            name: String(tpl.name || ""),
            language: String(tpl.language || "en_US"),
            status: String(tpl.status || ""),
            category: String(tpl.category || ""),
            bodyText,
            variableCount: matches.length,
          };
        });
      } else {
        templateFetchError =
          metaJson?.error?.message ||
          `Meta Graph API returned status ${metaRes.status} while fetching templates.`;
      }
    }

    return NextResponse.json({
      success: true,
      userId: auth.context.userId,
      walletBalance: auth.context.walletBalance,
      defaultVersion: "v21.0",
      defaultPhoneNumberId:
        channels.find((c) => c.wabaId === activeWabaId)?.phoneNumberId ||
        channels[0]?.phoneNumberId ||
        auth.context.phoneNumberId ||
        "",
      defaultWabaId: activeWabaId,
      channels,
      templates,
      templateFetchError,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load user context",
      },
      { status: 500 }
    );
  }
}