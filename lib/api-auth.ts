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

const TOKEN_KEYS = [
  "accessToken",
  "access_token",
  "metaAccessToken",
  "meta_access_token",
  "whatsappAccessToken",
  "whatsapp_access_token",
  "whatsappToken",
  "wabaAccessToken",
  "waba_access_token",
  "wabaToken",
  "graphToken",
  "graph_token",
  "bearerToken",
  "token",
];

const PHONE_ID_KEYS = [
  "phoneNumberId",
  "phone_number_id",
  "whatsappPhoneNumberId",
  "phoneId",
];

const WABA_ID_KEYS = [
  "wabaId",
  "waba_id",
  "businessAccountId",
  "business_account_id",
  "whatsappBusinessAccountId",
];

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

async function findRecordsFromModel(
  modelName: string,
  userId?: string
): Promise<PrismaLikeRecord[]> {
  const client = prisma as unknown as Record<
    string,
    { findMany?: (args?: unknown) => Promise<PrismaLikeRecord[]> } | undefined
  >;

  const model = client[modelName];
  if (!model?.findMany) {
    return [];
  }

  try {
    if (userId) {
      const byUser = await model.findMany({ where: { userId } });
      if (Array.isArray(byUser) && byUser.length > 0) {
        return byUser;
      }
    }
    const allRows = await model.findMany();
    return Array.isArray(allRows) ? allRows : [];
  } catch {
    return [];
  }
}

async function collectRelatedRecords(userId?: string): Promise<PrismaLikeRecord[]> {
  const modelNames = [
    "channel",
    "whatsappChannel",
    "wabaAccount",
    "wabaConfig",
    "whatsAppAccount",
    "metaConfig",
    "apiConfig",
    "setting",
    "settings",
    "config",
    "systemConfig",
  ];

  const collected: PrismaLikeRecord[] = [];
  for (const name of modelNames) {
    const rows = await findRecordsFromModel(name, userId);
    if (rows.length > 0) {
      collected.push(...rows);
    }
  }
  return collected;
}

function getEnvFallbackToken(): string | undefined {
  const candidates = [
    process.env.META_ACCESS_TOKEN,
    process.env.WHATSAPP_ACCESS_TOKEN,
    process.env.WABA_ACCESS_TOKEN,
    process.env.META_SYSTEM_USER_TOKEN,
    process.env.GRAPH_API_TOKEN,
    process.env.FACEBOOK_ACCESS_TOKEN,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return undefined;
}

function getEnvFallbackPhoneId(): string | undefined {
  const candidates = [
    process.env.META_PHONE_NUMBER_ID,
    process.env.WHATSAPP_PHONE_NUMBER_ID,
    process.env.WABA_PHONE_NUMBER_ID,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return undefined;
}

function getEnvFallbackWabaId(): string | undefined {
  const candidates = [
    process.env.META_WABA_ID,
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    process.env.WABA_ID,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return undefined;
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

  const envToken = getEnvFallbackToken();
  const envPhoneId = getEnvFallbackPhoneId();
  const envWabaId = getEnvFallbackWabaId();

  if (
    process.env.PANEL_API_TEST_TOKEN &&
    token === process.env.PANEL_API_TEST_TOKEN
  ) {
    const related = await collectRelatedRecords();
    const matched =
      (requestedPhoneId
        ? related.find(
            (r) => pickFirstString([r], PHONE_ID_KEYS) === requestedPhoneId
          )
        : undefined) || related[0];

    return {
      ok: true,
      context: {
        userId:
          typeof matched?.userId === "string" ? matched.userId : "admin_user",
        token,
        walletBalance: 1000,
        phoneNumberId: pickFirstString(
          [matched, ...related],
          PHONE_ID_KEYS,
          requestedPhoneId || envPhoneId
        ),
        wabaId: pickFirstString(
          [matched, ...related],
          WABA_ID_KEYS,
          envWabaId
        ),
        metaAccessToken: pickFirstString(
          [matched, ...related],
          TOKEN_KEYS,
          envToken
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
    const relatedForUser = await collectRelatedRecords(user.id);
    const matched =
      (requestedPhoneId
        ? relatedForUser.find(
            (r) => pickFirstString([r], PHONE_ID_KEYS) === requestedPhoneId
          )
        : undefined) || relatedForUser[0];

    const rawBalance =
      typeof userRecord.walletBalance === "number"
        ? userRecord.walletBalance
        : typeof userRecord.balance === "number"
        ? userRecord.balance
        : typeof userRecord.credits === "number"
        ? userRecord.credits
        : 0;

    const phoneNumberId = pickFirstString(
      [matched, userRecord, ...relatedForUser],
      PHONE_ID_KEYS,
      requestedPhoneId || envPhoneId
    );

    const wabaId = pickFirstString(
      [matched, userRecord, ...relatedForUser],
      WABA_ID_KEYS,
      envWabaId
    );

    const metaAccessToken = pickFirstString(
      [matched, userRecord, ...relatedForUser],
      TOKEN_KEYS,
      envToken
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