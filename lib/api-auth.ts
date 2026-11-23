import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedApiContext {
  userId: string;
  token: string;
  walletBalance: number;
  phoneNumberId?: string;
  wabaId?: string;
  metaAccessToken?: string;
}

type PrismaLikeRecord = Record<string, unknown>;

function pickFirstString(
  records: Array<PrismaLikeRecord | null | undefined>,
  keys: string[],
  fallback?: string
): string | undefined {
  for (const rec of records) {
    if (!rec) continue;
    for (const key of keys) {
      const val = rec[key];
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
    }
  }
  return fallback && fallback.trim().length > 0 ? fallback.trim() : undefined;
}

async function findChannelsSafe(
  userId?: string,
  phoneNumberId?: string
): Promise<PrismaLikeRecord[]> {
  const client = prisma as unknown as {
    channel?: {
      findMany: (args?: unknown) => Promise<PrismaLikeRecord[]>;
    };
  };

  if (!client.channel?.findMany) {
    return [];
  }

  try {
    if (phoneNumberId) {
      const byPhone = await client.channel.findMany({
        where: { phoneNumberId },
      });
      if (Array.isArray(byPhone) && byPhone.length > 0) return byPhone;
    }
    if (userId) {
      const byUser = await client.channel.findMany({
        where: { userId },
      });
      if (Array.isArray(byUser) && byUser.length > 0) return byUser;
    }
    const all = await client.channel.findMany({});
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

export async function authenticateApiRequest(
  request: NextRequest
): Promise<
  | { ok: true; context: AuthenticatedApiContext }
  | { ok: false; status: number; error: string }
> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing or invalid Authorization Bearer token",
    };
  }

  const requestedPhoneId =
    request.headers.get("x-phone-number-id")?.trim() || undefined;

  const envFallbackToken =
    process.env.META_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.WABA_ACCESS_TOKEN;

  const envFallbackPhoneId =
    process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  const envFallbackWabaId =
    process.env.META_WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (process.env.PANEL_API_TEST_TOKEN && token === process.env.PANEL_API_TEST_TOKEN) {
    const channels = await findChannelsSafe(undefined, requestedPhoneId);
    const primaryChannel = channels[0] || null;

    return {
      ok: true,
      context: {
        userId:
          typeof primaryChannel?.userId === "string"
            ? primaryChannel.userId
            : "admin_user",
        token,
        walletBalance: 1000,
        phoneNumberId: pickFirstString(
          [primaryChannel],
          ["phoneNumberId", "phone_number_id"],
          requestedPhoneId || envFallbackPhoneId
        ),
        wabaId: pickFirstString(
          [primaryChannel],
          ["wabaId", "waba_id", "businessAccountId"],
          envFallbackWabaId
        ),
        metaAccessToken: pickFirstString(
          [primaryChannel],
          ["accessToken", "metaAccessToken", "token", "apiToken"],
          envFallbackToken
        ),
      },
    };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ apiKey: token }, { id: token }],
      },
    });

    if (!user) {
      return {
        ok: false,
        status: 401,
        error: "Invalid API token",
      };
    }

    const userRecord = user as unknown as PrismaLikeRecord;
    const channels = await findChannelsSafe(user.id, requestedPhoneId);
    const matchedChannel = channels[0] || null;

    const rawBalance =
      typeof userRecord.walletBalance === "number"
        ? userRecord.walletBalance
        : typeof userRecord.balance === "number"
        ? userRecord.balance
        : typeof userRecord.credits === "number"
        ? userRecord.credits
        : 0;

    const phoneNumberId = pickFirstString(
      [matchedChannel, userRecord],
      ["phoneNumberId", "phone_number_id"],
      requestedPhoneId || envFallbackPhoneId
    );

    const wabaId = pickFirstString(
      [matchedChannel, userRecord],
      ["wabaId", "waba_id", "businessAccountId"],
      envFallbackWabaId
    );

    const metaAccessToken = pickFirstString(
      [matchedChannel, userRecord],
      [
        "accessToken",
        "metaAccessToken",
        "whatsappToken",
        "wabaToken",
        "token",
      ],
      envFallbackToken
    );

    return {
      ok: true,
      context: {
        userId: user.id,
        token,
        walletBalance: rawBalance,
        phoneNumberId,
        wabaId,
        metaAccessToken,
      },
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Unable to verify API token against database",
    };
  }
}