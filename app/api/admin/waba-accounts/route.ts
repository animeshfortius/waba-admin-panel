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

export async function GET(request: Request) {
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
        { success: false, error: "Forbidden: WABA accounts access restricted" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId && !isSuperAdmin) {
      const targetUser = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: { id: true, role: true, createdById: true },
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: "Target user not found" },
          { status: 404 }
        );
      }

      if (
        normalizeRole(targetUser.role) === "SUPER_ADMIN" ||
        (targetUser.id !== actor.id && targetUser.createdById !== actor.id)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: User outside your account scope",
          },
          { status: 403 }
        );
      }
    }

    const query: any = isSuperAdmin
      ? userId
        ? { userId }
        : {}
      : userId
      ? {
          AND: [
            { userId },
            {
              user: {
                role: { not: "SUPER_ADMIN" },
                OR: [{ id: actor.id }, { createdById: actor.id }],
              },
            },
          ],
        }
      : {
          user: {
            role: { not: "SUPER_ADMIN" },
            OR: [{ id: actor.id }, { createdById: actor.id }],
          },
        };

    const accounts = await prisma.wabaAccount.findMany({
      where: query,
      include: {
        user: {
          select: { id: true, role: true, createdById: true },
        },
      },
      orderBy: { id: "desc" },
    });

    const safeAccounts = isSuperAdmin
      ? accounts
      : accounts.filter((acc: any) => {
          const ownerRole = normalizeRole(acc.user?.role);
          return (
            ownerRole !== "SUPER_ADMIN" &&
            (acc.userId === actor.id || acc.user?.createdById === actor.id)
          );
        });

    const updatedChannels = [];

    for (const acc of safeAccounts) {
      let currentLimit = acc.messagingLimit;
      let currentRating = acc.qualityRating;

      const cleanWabaId = acc.wabaId
        ? acc.wabaId.replace("WABA_", "").trim()
        : "";
      const cleanPhoneId = acc.phoneNumberId
        ? acc.phoneNumberId.replace("PHONE_", "").trim()
        : "";

      // Live fetch limit from Meta
      if (acc.accessToken && cleanWabaId) {
        try {
          const limitRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanWabaId}?fields=messaging_limit_tier`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const limitData = await limitRes.json();
          if (limitData && limitData.messaging_limit_tier) {
            currentLimit = limitData.messaging_limit_tier;
          }
        } catch (err) {
          console.error("Meta fetch limit error:", err);
        }
      }

      // Live fetch rating from Meta
      if (acc.accessToken && cleanPhoneId) {
        try {
          const ratingRes = await fetch(
            `https://graph.facebook.com/v26.0/${cleanPhoneId}?fields=quality_rating`,
            { headers: { Authorization: `Bearer ${acc.accessToken}` } }
          );
          const ratingData = await ratingRes.json();
          if (ratingData && ratingData.quality_rating) {
            currentRating = ratingData.quality_rating;
          }
        } catch (err) {
          console.error("Meta fetch rating error:", err);
        }
      }

      updatedChannels.push({
        id: acc.id,
        wabaNumber: acc.displayPhone || acc.phoneNumberId,
        phoneId: cleanPhoneId,
        wabaId: cleanWabaId,
        displayName: acc.displayPhone
          ? `WhatsApp ${acc.displayPhone}`
          : "Verified Account",
        configureDate: acc.createdAt
          ? new Date(acc.createdAt).toLocaleString()
          : "N/A",
        webhookUrl: "NA",
        tps: 50,
        messagingLimit: currentLimit,
        qualityRating: currentRating,
      });
    }

    return NextResponse.json({ success: true, channels: updatedChannels });
  } catch (error: any) {
    console.error("Admin waba-accounts API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch admin WABA accounts",
      },
      { status: 500 }
    );
  }
}