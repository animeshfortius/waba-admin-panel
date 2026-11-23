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

async function findFirstChannelSafe(userId?: string): Promise<PrismaLikeRecord | null> {
  const client = prisma as unknown as {
    channel?: {
      findFirst: (args: unknown) => Promise<PrismaLikeRecord | null>;
    };
  };

  if (!client.channel?.findFirst) {
    return null;
  }

  try {
    if (userId) {
      return await client.channel.findFirst({ where: { userId } });
    }
    return await client.channel.findFirst({});
  } catch {
    return null;
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

  const envTestToken = process.env.PANEL_API_TEST_TOKEN;
  if (envTestToken && token === envTestToken) {
    const firstChannel = await findFirstChannelSafe();
    const channelUserId =
      typeof firstChannel?.userId === "string" ? firstChannel.userId : "admin_user";
    const channelPhoneId =
      typeof firstChannel?.phoneNumberId === "string"
        ? firstChannel.phoneNumberId
        : process.env.META_PHONE_NUMBER_ID;
    const channelWabaId =
      typeof firstChannel?.wabaId === "string"
        ? firstChannel.wabaId
        : process.env.META_WABA_ID;
    const channelAccessToken =
      typeof firstChannel?.accessToken === "string"
        ? firstChannel.accessToken
        : process.env.META_ACCESS_TOKEN;

    return {
      ok: true,
      context: {
        userId: channelUserId,
        token,
        walletBalance: 1000,
        phoneNumberId: channelPhoneId,
        wabaId: channelWabaId,
        metaAccessToken: channelAccessToken,
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
    const channel = await findFirstChannelSafe(user.id);

    const rawBalance =
      typeof userRecord.walletBalance === "number"
        ? userRecord.walletBalance
        : typeof userRecord.balance === "number"
        ? userRecord.balance
        : typeof userRecord.credits === "number"
        ? userRecord.credits
        : 0;

    const phoneNumberId =
      typeof channel?.phoneNumberId === "string"
        ? channel.phoneNumberId
        : typeof userRecord.phoneNumberId === "string"
        ? userRecord.phoneNumberId
        : process.env.META_PHONE_NUMBER_ID;

    const wabaId =
      typeof channel?.wabaId === "string"
        ? channel.wabaId
        : typeof userRecord.wabaId === "string"
        ? userRecord.wabaId
        : process.env.META_WABA_ID;

    const metaAccessToken =
      typeof channel?.accessToken === "string"
        ? channel.accessToken
        : typeof userRecord.metaAccessToken === "string"
        ? userRecord.metaAccessToken
        : process.env.META_ACCESS_TOKEN;

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