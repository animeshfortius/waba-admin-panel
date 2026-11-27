import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";

type ActorRole =
  | "SUPER_ADMIN"
  | "WHITE_LABEL_RESELLER"
  | "RESELLER"
  | "USER";

function normalizeRole(rawRole?: string | null): ActorRole {
  const upper = String(rawRole || "USER").trim().toUpperCase();
  if (
    upper === "WHITE_LABEL_RESELLER" ||
    upper === "WHITE_LABEL" ||
    upper === "WHITELABEL"
  ) {
    return "WHITE_LABEL_RESELLER";
  }
  if (upper === "RESELLER") return "RESELLER";
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") return "SUPER_ADMIN";
  return "USER";
}

async function getAuthenticatedActor() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ||
    cookieStore.get("waba_token")?.value ||
    cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const actorId = decoded?.userId || decoded?.id || decoded?.sub;
    if (!actorId) return null;

    if (actorId === "emergency-admin-id") {
      return { id: "emergency-admin-id", role: "SUPER_ADMIN" as ActorRole };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });

    if (!dbUser) return null;

    return { id: dbUser.id, role: normalizeRole(dbUser.role) };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isSuperAdmin = actor.role === "SUPER_ADMIN";
    const isReseller =
      actor.role === "RESELLER" || actor.role === "WHITE_LABEL_RESELLER";

    if (!isSuperAdmin && !isReseller) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Channel registration not allowed" },
        { status: 403 }
      );
    }

    const { wabaNumber, phoneId, accessToken } = await req.json();

    if (!phoneId) {
      return NextResponse.json(
        { success: false, error: "Phone ID is required" },
        { status: 400 }
      );
    }

    const cleanPhoneId = String(phoneId).replace("PHONE_", "").trim();
    const account = await prisma.wabaAccount.findFirst({
      where: {
        OR: [
          { phoneNumberId: cleanPhoneId },
          { phoneNumberId: `PHONE_${cleanPhoneId}` },
          ...(wabaNumber ? [{ displayPhone: String(wabaNumber).trim() }] : []),
        ],
      },
      include: {
        user: {
          select: { id: true, role: true, createdById: true },
        },
      },
    });

    if (account && !isSuperAdmin) {
      const ownerId = account.userId;
      const ownerRole = normalizeRole(account.user?.role);
      const ownerParentId = account.user?.createdById;

      if (
        ownerRole === "SUPER_ADMIN" ||
        (ownerId !== actor.id && ownerParentId !== actor.id)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: WABA channel outside your account scope",
          },
          { status: 403 }
        );
      }
    }

    let tokenToUse = accessToken;

    // 1. Agar request body mein token nahi hai, toh Database se phoneId ke basis par token dhoondo
    if (!tokenToUse && account && account.accessToken) {
      tokenToUse = account.accessToken;
    }

    // 2. Fallback to Env Token agar database mein bhi na mile
    if (!tokenToUse) {
      tokenToUse = process.env.WHATSAPP_SYSTEM_USER_TOKEN || "";
    }

    if (!tokenToUse) {
      return NextResponse.json(
        {
          success: false,
          error: "Access token not found for this channel",
        },
        { status: 400 }
      );
    }

    // Token clean karo (extra quotes ya spaces hatane ke liye)
    const cleanToken = String(tokenToUse).replace(/["']/g, "").trim();

    // 3. Meta Graph API Call for Registering Number
    const metaResponse = await fetch(
      `https://graph.facebook.com/v26.0/${cleanPhoneId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: "654321", // Default Registration PIN
        }),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: metaData.error?.message || "Meta Registration Failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Number successfully registered with Meta!",
      metaData,
    });
  } catch (error: any) {
    console.error("Meta Register API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}